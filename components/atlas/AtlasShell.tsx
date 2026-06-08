// components/atlas/AtlasShell.tsx — Wrapper raíz de V2.

export default function AtlasShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="av2">
      <div className="av2-shell">{children}</div>
    </div>
  );
}
