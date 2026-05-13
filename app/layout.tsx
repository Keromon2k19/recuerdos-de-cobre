import "./globals.css";
import { getVaultStats } from "@/lib/vault";
import Sidebar from "@/components/Sidebar";

export const metadata = {
  title: "Mysha — Grimorio de Lore",
  description: "Base de datos de lore TTRPG para la campaña Mysha. Extracción IA, persistencia Markdown, compatible con Obsidian.",
};

async function getSafeStats(): Promise<Record<string, number>> {
  try {
    const vaultPath = process.env.VAULT_PATH?.trim();
    if (!vaultPath) return {};
    return await getVaultStats(vaultPath);
  } catch {
    return {};
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const stats = await getSafeStats();

  return (
    <html lang="es">
      <body>
        <div className="app-layout">
          <Sidebar stats={stats} />
          <main className="main-content">{children}</main>
        </div>
      </body>
    </html>
  );
}
