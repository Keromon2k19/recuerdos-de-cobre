// app/importar/page.tsx — Importar / sincronizar playlist de YouTube
import { readPlaylist, listEpisodes, listJobs } from "@/lib/vault";
import SyncPlaylistPanel from "@/components/SyncPlaylistPanel";

async function getInitialData() {
  const vaultPath = process.env.VAULT_PATH?.trim();
  if (!vaultPath) {
    return { cache: null, procesados: [] as number[], jobs: [] };
  }

  const [cache, episodios, jobs] = await Promise.all([
    readPlaylist(vaultPath),
    listEpisodes(vaultPath),
    listJobs(vaultPath),
  ]);
  return {
    cache,
    procesados: episodios.map((e) => e.numero),
    jobs,
  };
}

export default async function ImportarPage() {
  const { cache, procesados, jobs } = await getInitialData();

  return (
    <>
      <div className="page-header">
        <div className="page-eyebrow">Principal</div>
        <h1>Importar Playlist</h1>
        <p>
          Sincronizá la lista de episodios y procesalos automáticamente:
          URL → transcripción → resumen → vault.
        </p>
      </div>

      <SyncPlaylistPanel
        initialCache={cache}
        procesados={procesados}
        initialJobs={jobs}
      />
    </>
  );
}
