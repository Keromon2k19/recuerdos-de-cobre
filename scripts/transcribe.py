"""
Transcribe un archivo de audio con faster-whisper (GPU).

Uso:
    python scripts/transcribe.py <archivo.mp3> [idioma]

Ejemplos:
    python scripts/transcribe.py ep01.mp3
    python scripts/transcribe.py ep01.mp3 es

El transcript se guarda como <archivo>.txt en la misma carpeta.
"""

import sys
import os
import glob
import time

# Pre-carga los DLLs de NVIDIA instalados via pip para que ctranslate2 los encuentre
if sys.platform == "win32":
    import ctypes
    site_packages = os.path.join(sys.prefix, "Lib", "site-packages")
    nvidia_bins = sorted(glob.glob(os.path.join(site_packages, "nvidia", "*", "bin")))
    for bin_dir in nvidia_bins:
        if os.path.isdir(bin_dir):
            try:
                os.add_dll_directory(bin_dir)
            except (OSError, AttributeError):
                pass
    _preload_order = [
        "cudart64_12.dll", "cublasLt64_12.dll", "cublas64_12.dll",
        "cudnn_ops64_9.dll", "cudnn_heuristic64_9.dll", "cudnn_graph64_9.dll",
        "cudnn_engines_precompiled64_9.dll", "cudnn_engines_runtime_compiled64_9.dll",
        "cudnn_cnn64_9.dll", "cudnn_adv64_9.dll", "cudnn64_9.dll",
    ]
    for dll_name in _preload_order:
        for bin_dir in nvidia_bins:
            dll_path = os.path.join(bin_dir, dll_name)
            if os.path.exists(dll_path):
                try:
                    ctypes.WinDLL(dll_path)
                except OSError:
                    pass
                break

from faster_whisper import WhisperModel, BatchedInferencePipeline

# IMPORTANTE: el initial_prompt de Whisper tiene un limite duro de ~244 tokens.
# Si lo excedes, el modelo lo trata como "el comienzo del transcript" y puede
# quedar atrapado regenerandolo en loop (alucinacion catastrofica).
#
# Por eso este prompt es minimalista: solo las desambiguaciones criticas que
# Whisper se equivoca sistematicamente. El glosario completo se aplica en las
# capas siguientes (Gemini summary, Claude extraction), donde no hay limite de
# tokens y se puede normalizar mejor.
#
# Fuente de verdad completa: vault-mysha/_glossary.md
INITIAL_PROMPT = (
    "Podcast de rol Mysha en espanol. Protagonista: Mysha (no Milla, no "
    "Misha), con tres personalidades en una sola persona: Mysha, Selenne, "
    "Veltra. Su buho se llama Champi. Otros PJs: Borok, Layra, Narcissa, "
    "David Ilcard, Io Campbell. 'Io' es nombre propio, no el pronombre 'yo'."
)

def main():
    if len(sys.argv) < 2:
        print("Uso: python scripts/transcribe.py <archivo.mp3> [idioma]")
        sys.exit(1)

    audio_path = sys.argv[1]
    language = sys.argv[2] if len(sys.argv) > 2 else "es"

    if not os.path.exists(audio_path):
        print(f"Error: no se encontró '{audio_path}'")
        sys.exit(1)

    output_path = os.path.splitext(audio_path)[0] + ".txt"

    print(f"\n🎙️  Mysha — Transcriptor (faster-whisper large-v3, GPU)")
    print(f"   Audio:   {audio_path}")
    print(f"   Idioma:  {language}")
    print(f"   Output:  {output_path}")
    print(f"\n   Cargando modelo...", flush=True)

    batched = False
    try:
        model = WhisperModel("large-v3", device="cuda", compute_type="float16")
        batched_model = BatchedInferencePipeline(model=model)
        batched = True
        print(f"   Usando GPU (CUDA) — modo batched (paraleliza segmentos en VRAM)", flush=True)
    except Exception:
        print(f"   CUDA no disponible, usando CPU (más lento)...", flush=True)
        model = WhisperModel("large-v3", device="cpu", compute_type="int8")

    print(f"   Transcribiendo...\n", flush=True)
    start = time.time()

    # Parametros comunes (batched y standard comparten casi todo).
    # condition_on_previous_text=False es implicito en batched, lo seteamos
    # explicito solo en el fallback CPU.
    transcribe_kwargs = dict(
        language=language,
        beam_size=10,                         # mas alto = mas preciso
        initial_prompt=INITIAL_PROMPT,        # contexto de nombres propios
        vad_filter=True,                      # filtra silencios (REQUERIDO en batched)
        vad_parameters=dict(min_silence_duration_ms=500),
        temperature=(0.0, 0.2, 0.4),          # determinista, con fallback si detecta alucinacion
        compression_ratio_threshold=2.4,      # rechaza output muy repetitivo (loops)
        log_prob_threshold=-1.0,              # rechaza segmento si confianza promedio baja
        no_speech_threshold=0.6,              # umbral para saltar silencios
    )

    if batched:
        # batch_size=16 paraleliza 16 chunks de habla en la GPU a la vez.
        # Con 12GB VRAM uso ~9-10GB. Speedup esperado: 3-5x.
        segments, info = batched_model.transcribe(audio_path, batch_size=16, **transcribe_kwargs)
    else:
        segments, info = model.transcribe(
            audio_path,
            condition_on_previous_text=False,
            **transcribe_kwargs,
        )

    # Duracion total del audio — para calcular progreso.
    total_dur = float(getattr(info, "duration", 0) or 0)
    print(f"@@PROGRESS@@ 0 {total_dur:.0f}", flush=True)

    last_emit = 0.0
    with open(output_path, "w", encoding="utf-8") as f:
        for segment in segments:
            line = segment.text.strip()
            if line:
                f.write(line + "\n")
                print(f"   [{segment.start:.0f}s] {line[:80]}{'...' if len(line) > 80 else ''}")
            # Emitir progreso cada ~15s de audio procesado (no en cada segmento,
            # para no spamear el filesystem del job).
            if total_dur > 0 and (segment.end - last_emit >= 15):
                last_emit = segment.end
                print(f"@@PROGRESS@@ {segment.end:.0f} {total_dur:.0f}", flush=True)

    if total_dur > 0:
        print(f"@@PROGRESS@@ {total_dur:.0f} {total_dur:.0f}", flush=True)

    elapsed = time.time() - start
    minutes = int(elapsed // 60)
    seconds = int(elapsed % 60)

    print(f"\n✅ Listo en {minutes}m {seconds}s → {output_path}")
    print(f"   Ahora ejecutá: npm run summarize {output_path}")

if __name__ == "__main__":
    main()
