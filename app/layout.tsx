// app/layout.tsx — Root shell mínimo. La identidad visual vive en cada
// route group: (public) = antología read-only, (local) = panel de pipeline.

export const metadata = {
  title: "Recuerdos de Cobre · Antología de campaña",
  description:
    "Antología de la campaña TTRPG Recuerdos de Cobre. Crónicas, personajes, lugares y misterios del archivo.",
};

// Pre-paint para el panel local (tema rdc claro/oscuro). La parte pública
// fija su propia paleta y no depende de data-mode.
const THEME_INIT_SCRIPT = `
(function(){var r=document.documentElement;try{var s=localStorage.getItem('rdc-mode');r.setAttribute('data-mode',s==='light'?'light':'dark');}catch(e){r.setAttribute('data-mode','dark');}})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
