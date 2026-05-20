// Estado de carga compartido para rutas dinamicas (personajes, lugares,
// cronicas). Aparece instantaneamente mientras Next.js compila/SSR-ea el
// destino. En dev mode esto evita la sensacion de "el link no funciono"
// cuando la primera compilacion tarda varios segundos.

type Props = {
  eyebrow: string;
  label: string;
};

export default function AtlasLoading({ eyebrow, label }: Props) {
  return (
    <section className="section atlas-loading">
      <div className="wrap">
        <div className="atlas-loading-card">
          <p className="eyebrow">{eyebrow}</p>
          <p className="atlas-loading-label">
            <span className="atlas-loading-dot" aria-hidden="true" />
            {label}
          </p>
        </div>
      </div>
    </section>
  );
}
