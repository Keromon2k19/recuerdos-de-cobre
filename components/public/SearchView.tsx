"use client";

// components/public/SearchView.tsx — Búsqueda global read-only. Filtra un
// índice slim en el cliente (sin red, sin endpoints internos, sin IA).
// Insensible a acentos; agrupa por tipo.

import { useMemo, useState } from "react";
import Link from "next/link";

export type SearchItem = {
  nombre: string;
  kind: string;
  href: string;
  sub?: string;
};

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

export default function SearchView({ index }: { index: SearchItem[] }) {
  const [q, setQ] = useState("");
  const nq = norm(q.trim());

  const groups = useMemo(() => {
    if (nq.length < 2) return null;
    const hits = index.filter((it) => norm(it.nombre).includes(nq));
    const byKind = new Map<string, SearchItem[]>();
    for (const h of hits.slice(0, 200)) {
      const arr = byKind.get(h.kind) ?? [];
      arr.push(h);
      byKind.set(h.kind, arr);
    }
    return { total: hits.length, byKind: [...byKind.entries()] };
  }, [index, nq]);

  return (
    <>
      <div className="list-tools">
        <input
          type="search"
          className="list-search"
          style={{ maxWidth: 560 }}
          placeholder="Buscar personajes, lugares, crónicas…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Buscar en el archivo"
          autoFocus
        />
        <span className="list-count">
          {groups ? `${groups.total} resultados` : `${index.length} entradas`}
        </span>
      </div>

      {!groups ? (
        <div className="empty">
          <p className="e-title">Escribí para buscar</p>
          <p>
            Mínimo dos letras. La búsqueda recorre todo el archivo público por
            nombre.
          </p>
        </div>
      ) : groups.total === 0 ? (
        <div className="empty">
          <p className="e-title">Sin coincidencias</p>
          <p>No hay nada con ese nombre en el archivo.</p>
        </div>
      ) : (
        <div className="search-groups">
          {groups.byKind.map(([kind, items]) => (
            <div key={kind} className="search-group">
              <p className="label">
                {kind} · {items.length}
              </p>
              <div className="ledger">
                {items.map((it, i) => (
                  <Link key={i} href={it.href} className="ledger-row">
                    <span className="reg" />
                    <h3>{it.nombre}</h3>
                    {it.sub && <span className="date">{it.sub}</span>}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
