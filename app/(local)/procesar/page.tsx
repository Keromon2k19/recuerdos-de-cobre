import LoadEpisodeForm from "@/components/LoadEpisodeForm";
import { readPlaylist, listEpisodes } from "@/lib/vault";

async function getPlaylistOptions() {
  const vaultPath = process.env.VAULT_PATH?.trim();
  if (!vaultPath) return [];
  const [cache, episodios] = await Promise.all([
    readPlaylist(vaultPath),
    listEpisodes(vaultPath),
  ]);
  if (!cache) return [];
  const procesados = new Set(episodios.map((e) => e.numero));
  return cache.items.map((item) => ({
    numero: item.numero,
    titulo: item.titulo,
    url: item.url,
    publicado_en: item.publicado_en,
    procesado: procesados.has(item.numero),
  }));
}

export default async function Home() {
  const playlistOptions = await getPlaylistOptions();

  return (
    <>
      <div className="page-header">
        <div className="page-eyebrow">Principal</div>
        <h1>Cargar Episodio</h1>
        <p>Pegá el resumen del episodio y cargá la extracción revisada.</p>
      </div>
      <LoadEpisodeForm playlistOptions={playlistOptions} />
    </>
  );
}
