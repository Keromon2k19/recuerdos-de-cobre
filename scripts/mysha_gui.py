"""
Mysha — Pipeline GUI
URL de YouTube → descarga → transcripción (Whisper GPU) → resumen (Gemini) → clipboard

Uso:
    python scripts/mysha_gui.py

Requiere:
    pip install faster-whisper google-generativeai
    yt-dlp.exe en C:/Users/<usuario>/yt-dlp.exe o en PATH
"""

import tkinter as tk
from tkinter import ttk, scrolledtext, messagebox
import threading
import subprocess
import sys
import os
import glob
import re
import time
import tempfile
import shutil

# Agrega los DLLs de NVIDIA al search path. NO pre-carga con ctypes
# (puede crashear el proceso si hay incompatibilidad de versiones).
if sys.platform == "win32":
    site_packages = os.path.join(sys.prefix, "Lib", "site-packages")
    for bin_dir in sorted(glob.glob(os.path.join(site_packages, "nvidia", "*", "bin"))):
        if os.path.isdir(bin_dir):
            try:
                os.add_dll_directory(bin_dir)
            except (OSError, AttributeError):
                pass
            # También agregar a PATH para que DLLs que se cargan implícitamente
            # las encuentren
            os.environ["PATH"] = bin_dir + os.pathsep + os.environ.get("PATH", "")

# ---------------------------------------------------------------------------
# Dependencias opcionales (importadas al correr, para dar mejor error)
# ---------------------------------------------------------------------------

def check_deps():
    missing = []
    try:
        import faster_whisper
    except ImportError:
        missing.append("faster-whisper")
    try:
        import google.generativeai
    except ImportError:
        missing.append("google-generativeai")
    return missing

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
ENV_FILE = os.path.join(PROJECT_DIR, ".env.local")
GEMINI_MODEL = "gemini-2.5-flash"

# Pista de vocabulario propio de la campana. Whisper la usa como contexto
# para reconocer nombres inventados en vez de transcribirlos foneticamente.
WHISPER_INITIAL_PROMPT = (
    "Transcripcion del podcast de rol Mysha, campana Recuerdos de Cobre de "
    "Mates y Mazmorras. Aparecen los personajes Mysha, Selenne, Veltra, "
    "Borok, Annora, Layyra, Lords, Narcissa, Margarita, David Ilcard, en "
    "lugares como la Metropolis de Cobre y Plumas Doradas, junto a "
    "facciones como la Hermandad de Cobre, el Coven Rosa y el Te de Medianoche."
)

YTDLP_CANDIDATES = [
    os.path.join(os.path.expanduser("~"), "yt-dlp.exe"),
    shutil.which("yt-dlp") or "",
    r"C:\tools\yt-dlp.exe",
]

def _find_winget_ffmpeg():
    """Busca ffmpeg en la carpeta de paquetes de WinGet."""
    base = os.path.join(os.path.expanduser("~"), "AppData", "Local",
                        "Microsoft", "WinGet", "Packages")
    if not os.path.isdir(base):
        return ""
    for pkg in os.listdir(base):
        if "Gyan.FFmpeg" in pkg or "ffmpeg" in pkg.lower():
            candidate = os.path.join(base, pkg)
            for root, _, files in os.walk(candidate):
                if "ffmpeg.exe" in files:
                    return os.path.join(root, "ffmpeg.exe")
    return ""

FFMPEG_CANDIDATES = [
    _find_winget_ffmpeg(),
    r"C:\ffmpeg\ffmpeg.exe",
    r"C:\ffmpeg\bin\ffmpeg.exe",
    shutil.which("ffmpeg") or "",
    r"C:\tools\ffmpeg.exe",
    r"C:\Program Files\ffmpeg\bin\ffmpeg.exe",
]

def find_ytdlp():
    for p in YTDLP_CANDIDATES:
        if p and os.path.exists(p):
            return p
    return None

def find_ffmpeg():
    for p in FFMPEG_CANDIDATES:
        if p and os.path.exists(p):
            return p
    return None

def load_gemini_key():
    if not os.path.exists(ENV_FILE):
        return None
    with open(ENV_FILE, encoding="utf-8") as f:
        for line in f:
            m = re.match(r"^GEMINI_API_KEY=(.+)$", line.strip())
            if m:
                return m.group(1).strip()
    return None

# ---------------------------------------------------------------------------
# Pipeline (corre en hilo separado)
# ---------------------------------------------------------------------------

def run_pipeline(url, numero, titulo, log, on_done, on_error):
    """Corre el pipeline completo y llama on_done(resumen) o on_error(msg)."""

    def emit(msg):
        log(msg)

    try:
        # 1. Validar dependencias
        missing = check_deps()
        if missing:
            on_error(f"Faltan dependencias: {', '.join(missing)}\nEjecutá: pip install {' '.join(missing)}")
            return

        from faster_whisper import WhisperModel
        import google.generativeai as genai

        # 2. Validar yt-dlp y ffmpeg
        ytdlp = find_ytdlp()
        if not ytdlp:
            on_error("No se encontró yt-dlp.exe\nDescargalo en github.com/yt-dlp/yt-dlp/releases\nY ponelo en C:/Users/<tu usuario>/yt-dlp.exe")
            return

        ffmpeg = find_ffmpeg()
        if ffmpeg:
            ffmpeg_dir = os.path.dirname(ffmpeg)
            os.environ["PATH"] = ffmpeg_dir + os.pathsep + os.environ.get("PATH", "")
        else:
            on_error("No se encontró ffmpeg.exe\nInstalalo con: winget install Gyan.FFmpeg\nO ponelo en C:/ffmpeg/ffmpeg.exe")
            return

        # 3. Validar Gemini key
        api_key = load_gemini_key()
        if not api_key:
            on_error("No se encontró GEMINI_API_KEY en .env.local")
            return

        # Carpeta permanente de output (audio temporal, transcript y resumen quedan)
        output_dir = os.path.join(PROJECT_DIR, "output")
        os.makedirs(output_dir, exist_ok=True)

        # Base del nombre: ep<num>_<titulo-slug> o timestamp si no hay datos
        if numero:
            base = f"ep{int(numero):02d}"
            if titulo:
                slug = re.sub(r"[^\w\-]+", "-", titulo.lower()).strip("-")[:40]
                base = f"{base}_{slug}"
        else:
            base = time.strftime("transcript_%Y%m%d_%H%M%S")

        tmpdir = tempfile.mkdtemp(prefix="mysha_audio_")
        audio_path = os.path.join(tmpdir, "audio.mp3")
        txt_path = os.path.join(output_dir, f"{base}.transcript.txt")
        summary_path = os.path.join(output_dir, f"{base}.resumen.txt")

        try:
            # ---------------------------------------------------------------
            # PASO 1: Descargar audio
            # ---------------------------------------------------------------
            emit("📥 Descargando audio...")
            cmd = [ytdlp, "-x", "--audio-format", "mp3", "--ffmpeg-location", os.path.dirname(ffmpeg), "-o", audio_path, url]
            result = subprocess.run(cmd, capture_output=True, text=True)
            if result.returncode != 0:
                on_error(f"Error al descargar:\n{result.stderr[-500:]}")
                return
            emit("   ✓ Audio descargado\n")

            # ---------------------------------------------------------------
            # PASO 2: Transcribir con Whisper (GPU con fallback a CPU)
            # ---------------------------------------------------------------
            emit("🎙️  Cargando modelo Whisper large-v3 (modo precisión)...")
            try:
                model = WhisperModel("large-v3", device="cuda", compute_type="float16")
                emit("   ✓ Modelo cargado en GPU")
            except Exception as gpu_err:
                emit(f"   ⚠ GPU no disponible ({gpu_err}). Usando CPU (más lento)...")
                model = WhisperModel("large-v3", device="cpu", compute_type="int8")
                emit("   ✓ Modelo cargado en CPU")
            emit("   Transcribiendo... (la primera vez descarga el modelo, ~1.5GB)\n")

            segments, info = model.transcribe(
                audio_path,
                language="es",
                beam_size=8,                          # más preciso (era 1)
                initial_prompt=WHISPER_INITIAL_PROMPT,
                vad_filter=True,
                vad_parameters=dict(min_silence_duration_ms=500),
                condition_on_previous_text=True,
            )

            lines = []
            for segment in segments:
                line = segment.text.strip()
                if line:
                    lines.append(line)
                    emit(f"   [{segment.start:.0f}s] {line[:70]}{'...' if len(line) > 70 else ''}")

            transcript = "\n".join(lines)
            with open(txt_path, "w", encoding="utf-8") as f:
                f.write(transcript)

            emit(f"\n   ✓ Transcript: {len(lines)} segmentos, {len(transcript):,} caracteres")
            emit(f"   📄 Guardado en: {txt_path}\n")

            # ---------------------------------------------------------------
            # PASO 3: Resumir con Gemini
            # ---------------------------------------------------------------
            emit("✨ Resumiendo con Gemini...")
            genai.configure(api_key=api_key)
            gmodel = genai.GenerativeModel(GEMINI_MODEL)

            ep_header = f"Episodio {numero}" if numero else "Episodio"
            if titulo:
                ep_header += f' — "{titulo}"'

            prompt = f"""Sos el archivista de la campaña TTRPG Mysha. Creá un resumen detallado del transcript del {ep_header}.

Capturá TODO lo relevante para una base de datos de lore:
- Eventos narrativos en orden cronológico
- Personajes presentes y sus acciones o revelaciones
- Lugares visitados o mencionados
- Objetos o artefactos relevantes
- Lore del mundo: historia, magia, facciones, política
- Misterios planteados o resueltos
- Citas memorables
- Decisiones importantes y sus consecuencias

Escribí en español, en prosa fluida, con párrafos temáticos. Sé específico y detallado.

---

TRANSCRIPT:

{transcript}"""

            response = gmodel.generate_content(prompt)
            summary = response.text.strip()

            with open(summary_path, "w", encoding="utf-8") as f:
                f.write(summary)

            emit(f"   ✓ Resumen generado")
            emit(f"   📄 Guardado en: {summary_path}\n")
            emit("=" * 60)

            on_done(summary)

        finally:
            # Solo borra el audio temporal, el transcript y resumen quedan
            shutil.rmtree(tmpdir, ignore_errors=True)

    except Exception as e:
        on_error(str(e))

# ---------------------------------------------------------------------------
# GUI
# ---------------------------------------------------------------------------

class MyshaApp(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("Mysha — Pipeline de Transcripción")
        self.geometry("800x700")
        self.resizable(True, True)
        self.configure(bg="#1a1a2e")
        self._build_ui()

    def _build_ui(self):
        style = ttk.Style(self)
        style.theme_use("clam")
        style.configure("TLabel", background="#1a1a2e", foreground="#d4af37", font=("Segoe UI", 10))
        style.configure("TEntry", fieldbackground="#16213e", foreground="#f0f0f0", font=("Segoe UI", 10))
        style.configure("Run.TButton", background="#8b0000", foreground="#d4af37",
                        font=("Segoe UI", 11, "bold"), padding=8)
        style.configure("Copy.TButton", background="#2d4a22", foreground="#d4af37",
                        font=("Segoe UI", 10), padding=6)
        style.map("Run.TButton", background=[("active", "#a00000")])
        style.map("Copy.TButton", background=[("active", "#3d6a32")])

        pad = {"padx": 12, "pady": 4}

        # Título
        tk.Label(self, text="⚗  Mysha — Transcripción y Resumen",
                 bg="#1a1a2e", fg="#d4af37",
                 font=("Segoe UI", 14, "bold")).pack(pady=(16, 8))

        # Formulario
        form = tk.Frame(self, bg="#1a1a2e")
        form.pack(fill="x", **pad)

        ttk.Label(form, text="URL de YouTube:").grid(row=0, column=0, sticky="w", pady=4)
        self.url_var = tk.StringVar()
        ttk.Entry(form, textvariable=self.url_var, width=70).grid(row=0, column=1, columnspan=2, sticky="ew", padx=(8,0), pady=4)

        ttk.Label(form, text="N° de episodio:").grid(row=1, column=0, sticky="w", pady=4)
        self.num_var = tk.StringVar()
        ttk.Entry(form, textvariable=self.num_var, width=8).grid(row=1, column=1, sticky="w", padx=(8,0), pady=4)

        ttk.Label(form, text="Título (opcional):").grid(row=2, column=0, sticky="w", pady=4)
        self.titulo_var = tk.StringVar()
        ttk.Entry(form, textvariable=self.titulo_var, width=50).grid(row=2, column=1, columnspan=2, sticky="ew", padx=(8,0), pady=4)

        form.columnconfigure(1, weight=1)

        # Botón
        self.run_btn = ttk.Button(self, text="▶  Descargar, Transcribir y Resumir",
                                  style="Run.TButton", command=self._start)
        self.run_btn.pack(pady=12)

        # Log
        tk.Label(self, text="Progreso:", bg="#1a1a2e", fg="#888",
                 font=("Segoe UI", 9)).pack(anchor="w", padx=12)
        self.log_box = scrolledtext.ScrolledText(
            self, height=12, bg="#0d0d1a", fg="#aaaaaa",
            font=("Consolas", 9), state="disabled", wrap="word"
        )
        self.log_box.pack(fill="both", expand=False, padx=12, pady=(0, 8))

        # Resumen
        tk.Label(self, text="Resumen generado (pegalo en la app):",
                 bg="#1a1a2e", fg="#d4af37",
                 font=("Segoe UI", 10, "bold")).pack(anchor="w", padx=12)
        self.result_box = scrolledtext.ScrolledText(
            self, height=14, bg="#16213e", fg="#e8e8e8",
            font=("Segoe UI", 10), wrap="word"
        )
        self.result_box.pack(fill="both", expand=True, padx=12, pady=(0, 8))

        btn_row = tk.Frame(self, bg="#1a1a2e")
        btn_row.pack(pady=(0, 12))
        self.copy_btn = ttk.Button(btn_row, text="📋  Copiar resumen",
                                   style="Copy.TButton", command=self._copy, state="disabled")
        self.copy_btn.pack(side="left", padx=6)
        self.open_folder_btn = ttk.Button(btn_row, text="📂  Abrir carpeta output",
                                          style="Copy.TButton", command=self._open_output_folder)
        self.open_folder_btn.pack(side="left", padx=6)

    def _log(self, msg):
        def _do():
            self.log_box.configure(state="normal")
            self.log_box.insert("end", msg + "\n")
            self.log_box.see("end")
            self.log_box.configure(state="disabled")
        self.after(0, _do)

    def _start(self):
        url = self.url_var.get().strip()
        if not url:
            messagebox.showwarning("Falta URL", "Ingresá la URL del video de YouTube.")
            return

        numero = self.num_var.get().strip()
        titulo = self.titulo_var.get().strip()

        self.run_btn.configure(state="disabled")
        self.copy_btn.configure(state="disabled")
        self.result_box.delete("1.0", "end")
        self.log_box.configure(state="normal")
        self.log_box.delete("1.0", "end")
        self.log_box.configure(state="disabled")

        threading.Thread(
            target=run_pipeline,
            args=(url, numero, titulo, self._log, self._on_done, self._on_error),
            daemon=True
        ).start()

    def _on_done(self, summary):
        def _do():
            self.result_box.delete("1.0", "end")
            self.result_box.insert("1.0", summary)
            self.copy_btn.configure(state="normal")
            self.run_btn.configure(state="normal")
            self._log("\n✅ ¡Pipeline completo! Copiá el resumen y pegalo en la app.")
        self.after(0, _do)

    def _on_error(self, msg):
        def _do():
            self._log(f"\n❌ Error: {msg}")
            self.run_btn.configure(state="normal")
            messagebox.showerror("Error", msg)
        self.after(0, _do)

    def _copy(self):
        text = self.result_box.get("1.0", "end").strip()
        if text:
            self.clipboard_clear()
            self.clipboard_append(text)
            self.copy_btn.configure(text="✓  ¡Copiado!")
            self.after(2000, lambda: self.copy_btn.configure(text="📋  Copiar resumen"))

    def _open_output_folder(self):
        output_dir = os.path.join(PROJECT_DIR, "output")
        os.makedirs(output_dir, exist_ok=True)
        os.startfile(output_dir)


if __name__ == "__main__":
    try:
        app = MyshaApp()
        app.mainloop()
    except Exception:
        import traceback
        err = traceback.format_exc()
        try:
            root = tk.Tk()
            root.withdraw()
            messagebox.showerror("Error al iniciar Mysha", err)
        except Exception:
            input(f"Error:\n{err}\n\nPresioná Enter para salir...")
