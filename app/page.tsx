import LoadEpisodeForm from "@/components/LoadEpisodeForm";

export default function Home() {
  return (
    <>
      <div className="page-header">
        <h1>⛧ Cargar Episodio</h1>
        <p>Pegá el resumen de Gemini y dejá que la IA extraiga el lore.</p>
      </div>
      <LoadEpisodeForm />
    </>
  );
}
