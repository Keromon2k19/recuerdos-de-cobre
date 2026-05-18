// components/public/SiteFooter.tsx — Colofón del archivo. No expone panel
// local, jobs ni rutas internas (regla de publicación de GOAL.md).

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <span className="seal">Recuerdos de Cobre</span>
      <span>Antología read-only · campaña de Mates y Mazmorras</span>
      <span style={{ marginLeft: "auto" }}>
        Archivo narrativo · solo lectura
      </span>
    </footer>
  );
}
