"use client";

export type AtlasEntityIndexItem = {
  slug: string;
  name: string;
  eyebrow?: string;
  meta?: string;
  glyph?: string;
};

type Props = {
  label: string;
  items: AtlasEntityIndexItem[];
  selectedSlug: string;
  onSelect: (slug: string) => void;
  className?: string;
};

export default function AtlasEntityIndex({
  label,
  items,
  selectedSlug,
  onSelect,
  className = "",
}: Props) {
  return (
    <aside className={`av2-entity-index ${className}`.trim()}>
      <div className="av2-entity-index-head">
        <span>{label}</span>
        <strong>{items.length}</strong>
      </div>
      <ul className="av2-entity-index-list">
        {items.map((item) => (
          <li key={item.slug}>
            <button
              type="button"
              className="av2-entity-index-item"
              data-active={selectedSlug === item.slug ? "true" : undefined}
              onClick={() => onSelect(item.slug)}
              aria-pressed={selectedSlug === item.slug}
            >
              <span className="av2-entity-index-glyph" aria-hidden="true">
                {item.glyph || item.name.charAt(0)}
              </span>
              <span className="av2-entity-index-copy">
                {item.eyebrow && <small>{item.eyebrow}</small>}
                <strong>{item.name}</strong>
                {item.meta && <span>{item.meta}</span>}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
