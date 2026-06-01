// app/layout.tsx — Root shell mínimo. La identidad visual vive en cada
// route group: (public) = antología read-only, (local) = panel de pipeline.

export const metadata = {
  title: "Recuerdos de Cobre · Antología de campaña",
  description:
    "Antología de la campaña TTRPG Recuerdos de Cobre. Crónicas, personajes, lugares y misterios del archivo.",
};

// Pre-paint sincrono: setea ambos contratos antes del primer paint para
// evitar FOUC en cualquier surface.
//   data-mode        → tema del panel local (sistema rdc, key 'rdc-mode')
//   data-atlas-mode  → tema del sitio público (sistema atlas, key 'atlas-mode')
// Default en ambos: 'dark'. Cero acoplamiento entre los dos.
const THEME_INIT_SCRIPT = `
(function(){var r=document.documentElement;try{var s=localStorage.getItem('rdc-mode');r.setAttribute('data-mode',s==='light'?'light':'dark');}catch(e){r.setAttribute('data-mode','dark');}try{var a=localStorage.getItem('atlas-mode');r.setAttribute('data-atlas-mode',a==='light'?'light':'dark');}catch(e){r.setAttribute('data-atlas-mode','dark');}})();
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
