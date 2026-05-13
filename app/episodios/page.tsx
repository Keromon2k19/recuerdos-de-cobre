// app/episodios/page.tsx — Lista de todos los episodios procesados
import Link from "next/link";
import { listEpisodes } from "@/lib/vault";

async function getEpisodes() {
  const vaultPath = process.env.VAULT_PATH?.trim();
  if (!vaultPath) return [];
  return listEpisodes(vaultPath);
}

export default async function EpisodiosPage() {
  const episodes = await getEpisodes();

  return (
    <>
      <div className="page-header">
        <h1>📚 Episodios</h1>
        <p>
          {episodes.length > 0
            ? `${episodes.length} episodio${episodes.length !== 1 ? "s" : ""} procesado${episodes.length !== 1 ? "s" : ""}`
            : "Todavía no hay episodios cargados."}
        </p>
      </div>

      {episodes.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon">📜</span>
          <p>Cargá tu primer episodio desde la pantalla principal.</p>
          <Link href="/" className="btn-primary" style={{ marginTop: "1rem", display: "inline-block" }}>
            ⛧ Cargar Episodio
          </Link>
        </div>
      ) : (
        <div className="episode-list">
          {episodes.map((ep) => (
            <Link
              key={ep.numero}
              href={`/episodios/${ep.numero}`}
              className="episode-item"
            >
              <span className="episode-number">{ep.numero}</span>
              <span className="episode-title">
                {ep.titulo || `Episodio ${ep.numero}`}
              </span>
              {ep.procesado && (
                <span className="episode-date">
                  {new Date(ep.procesado).toLocaleDateString("es-AR")}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
