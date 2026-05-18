// app/(local)/layout.tsx — Shell del panel local (pipeline). Conserva el
// sistema "rdc" existente: sidebar operativo + globals.css. No es la cara
// pública; acá se procesa, revisa y commitea al vault.
import "../globals.css";
import { getVaultStats } from "@/lib/vault";
import Sidebar from "@/components/Sidebar";
import SearchPalette from "@/components/SearchPalette";

async function getSafeStats(): Promise<Record<string, number>> {
  try {
    const vaultPath = process.env.VAULT_PATH?.trim();
    if (!vaultPath) return {};
    return await getVaultStats(vaultPath);
  } catch {
    return {};
  }
}

export default async function LocalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const stats = await getSafeStats();

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Literata:ital,wght@0,400;0,600;1,400&family=IBM+Plex+Mono:wght@400;500&display=swap"
        rel="stylesheet"
      />
      <div
        className="rdc-shell rdc-paper"
        style={{ "--rdc-body": "18px" } as React.CSSProperties}
      >
        <Sidebar stats={stats} />
        <main className="rdc-main">
          <div className="rdc-ribbon">
            <div className="rdc-bread">
              Panel local <span>·</span> Pipeline de procesamiento
            </div>
            <div className="rdc-spacer" />
          </div>
          <div className="rdc-page-frame">{children}</div>
        </main>
      </div>
      <SearchPalette />
    </>
  );
}
