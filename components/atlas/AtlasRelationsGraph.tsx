"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export interface GraphNode {
  id: string;
  name: string;
  kind: string; // "personaje" | "lugar" | "faccion" | "objeto" | "misterio" | "worldbuilding" | "minor"
  isCenter?: boolean;
  isPC?: boolean;
  imageSrc?: string;
  href?: string | null;
}

export interface GraphLink {
  source: string;
  target: string;
  type?: string;
  episode?: number;
}

type PhysicsNode = GraphNode & {
  x: number;
  y: number;
  vx: number;
  vy: number;
  fx?: number;
  fy?: number;
};

type Props = {
  nodes: GraphNode[];
  links: GraphLink[];
  centerId: string;
};

export default function AtlasRelationsGraph({ nodes: initialNodes, links, centerId }: Props) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Estados de vista: Pan y Zoom
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [hoveredLink, setHoveredLink] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  // Usamos refs para la simulación física a fin de evitar re-renders en React por cada frame
  const nodesRef = useRef<PhysicsNode[]>([]);
  const linksRef = useRef<GraphLink[]>([]);
  const panRef = useRef(pan);
  const zoomRef = useRef(zoom);

  // Dimensiones del SVG
  const width = 800;
  const height = 550;

  // Gestiones de drag
  const dragRef = useRef<{
    nodeId: string;
    startX: number;
    startY: number;
    hasMoved: boolean;
  } | null>(null);

  const panDragRef = useRef<{
    startX: number;
    startY: number;
    startPanX: number;
    startPanY: number;
  } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Inicializar nodos y links en las refs cuando cambian las props
  useEffect(() => {
    // Distribuir nodos en círculo inicialmente alrededor del centro
    const centerNode = initialNodes.find((n) => n.id === centerId) || initialNodes[0];
    
    nodesRef.current = initialNodes.map((n) => {
      const existing = nodesRef.current.find((prev) => prev.id === n.id);
      if (existing) {
        // Preservar posición de nodos que ya existían
        return {
          ...n,
          x: existing.x,
          y: existing.y,
          vx: existing.vx,
          vy: existing.vy,
          fx: existing.fx,
          fy: existing.fy,
        };
      }

      const isCenter = n.id === centerId;
      let x = width / 2;
      let y = height / 2;
      
      if (!isCenter) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 180 + Math.random() * 60;
        x += Math.cos(angle) * radius;
        y += Math.sin(angle) * radius;
      }

      return {
        ...n,
        x,
        y,
        vx: 0,
        vy: 0,
        fx: isCenter ? width / 2 : undefined,
        fy: isCenter ? height / 2 : undefined,
      };
    });

    linksRef.current = links;
  }, [initialNodes, links, centerId]);

  // Actualizar refs de pan/zoom
  useEffect(() => {
    panRef.current = pan;
  }, [pan]);

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  // Bucle de la simulación física (Engine de Fuerzas)
  useEffect(() => {
    if (!mounted) return;

    let animFrameId: number;
    const gravity = 0.05;
    const charge = -1200; // Fuerza de repulsión
    const linkStrength = 0.08;
    const linkDistance = 140;
    const friction = 0.85;

    const tick = () => {
      const nodes = nodesRef.current;
      const links = linksRef.current;

      if (nodes.length === 0) {
        animFrameId = requestAnimationFrame(tick);
        return;
      }

      // 1. Fuerza de gravedad / centrado
      const cx = width / 2;
      const cy = height / 2;
      for (const node of nodes) {
        if (node.id === centerId) {
          // El central se ancla en el centro
          node.x = cx;
          node.y = cy;
          node.vx = 0;
          node.vy = 0;
          continue;
        }
        node.vx += (cx - node.x) * gravity;
        node.vy += (cy - node.y) * gravity;
      }

      // 2. Fuerza de repulsión (Charge) - Algoritmo N^2 simple
      for (let i = 0; i < nodes.length; i++) {
        const u = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const v = nodes[j];
          const dx = v.x - u.x;
          const dy = v.y - u.y;
          const distSq = dx * dx + dy * dy || 1;
          const dist = Math.sqrt(distSq);
          
          // Repulsión basada en la distancia
          const force = charge / distSq;
          const fx = force * (dx / dist);
          const fy = force * (dy / dist);

          u.vx += fx;
          u.vy += fy;
          v.vx -= fx;
          v.vy -= fy;
        }
      }

      // 3. Fuerza de enlaces (Link attraction)
      for (const link of links) {
        const sourceNode = nodes.find((n) => n.id === link.source);
        const targetNode = nodes.find((n) => n.id === link.target);
        if (!sourceNode || !targetNode) continue;

        const dx = targetNode.x - sourceNode.x;
        const dy = targetNode.y - sourceNode.y;
        const dist = Math.hypot(dx, dy) || 1;
        const force = (dist - linkDistance) * linkStrength;
        const fx = force * (dx / dist);
        const fy = force * (dy / dist);

        if (sourceNode.id !== centerId) {
          sourceNode.vx += fx;
          sourceNode.vy += fy;
        }
        if (targetNode.id !== centerId) {
          targetNode.vx -= fx;
          targetNode.vy -= fy;
        }
      }

      // 4. Actualizar posiciones
      for (const node of nodes) {
        if (node.id === centerId) continue;
        
        if (node.fx !== undefined && node.fy !== undefined) {
          node.x = node.fx;
          node.y = node.fy;
          node.vx = 0;
          node.vy = 0;
        } else {
          node.vx *= friction;
          node.vy *= friction;
          
          // Limitar velocidades extremas
          const speed = Math.hypot(node.vx, node.vy);
          if (speed > 15) {
            node.vx = (node.vx / speed) * 15;
            node.vy = (node.vy / speed) * 15;
          }

          node.x += node.vx;
          node.y += node.vy;

          // Mantener dentro de bordes razonables
          node.x = Math.max(50, Math.min(width - 50, node.x));
          node.y = Math.max(50, Math.min(height - 50, node.y));
        }
      }

      // 5. Renderizar directamente en los elementos SVG mediante manipulación DOM directa para máxima velocidad
      const svg = svgRef.current;
      if (svg) {
        // Actualizar posiciones de líneas de enlace
        links.forEach((link, idx) => {
          const u = nodes.find((n) => n.id === link.source);
          const v = nodes.find((n) => n.id === link.target);
          const lineEl = svg.querySelector(`#link-${idx}`) as SVGLineElement | null;
          const textEl = svg.querySelector(`#link-text-${idx}`) as SVGTextElement | null;
          
          if (lineEl && u && v) {
            lineEl.setAttribute("x1", String(u.x));
            lineEl.setAttribute("y1", String(u.y));
            lineEl.setAttribute("x2", String(v.x));
            lineEl.setAttribute("y2", String(v.y));
          }

          if (textEl && u && v) {
            textEl.setAttribute("x", String((u.x + v.x) / 2));
            textEl.setAttribute("y", String((u.y + v.y) / 2 - 8));
          }
        });

        // Actualizar posiciones de grupos de nodos
        nodes.forEach((node) => {
          const groupEl = svg.querySelector(`#node-${node.id}`) as SVGElement | null;
          if (groupEl) {
            groupEl.setAttribute("transform", `translate(${node.x}, ${node.y})`);
          }
        });
      }

      animFrameId = requestAnimationFrame(tick);
    };

    animFrameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrameId);
  }, [mounted, centerId]);

  // ── Gestiones de Panning (Paneo del Canvas) ──────────────────────────
  const handleSvgPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    // Si se cliquea un nodo, no panear
    if ((e.target as HTMLElement).closest(".graph-node")) return;
    if (e.button !== 0) return; // Solo click izquierdo
    
    e.preventDefault();
    panDragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPanX: panRef.current.x,
      startPanY: panRef.current.y,
    };
    setIsPanning(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleSvgPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (dragRef.current) {
      // Estamos arrastrando un nodo
      const rect = e.currentTarget.getBoundingClientRect();
      // Calcular coord local en base a zoom y pan actuales
      const localX = (e.clientX - rect.left - panRef.current.x) / zoomRef.current;
      const localY = (e.clientY - rect.top - panRef.current.y) / zoomRef.current;

      const node = nodesRef.current.find((n) => n.id === dragRef.current?.nodeId);
      if (node) {
        node.fx = localX;
        node.fy = localY;
        dragRef.current.hasMoved = true;
      }
      return;
    }

    if (!panDragRef.current) return;
    // Estamos paneando el fondo
    const dx = e.clientX - panDragRef.current.startX;
    const dy = e.clientY - panDragRef.current.startY;
    setPan({
      x: panDragRef.current.startPanX + dx,
      y: panDragRef.current.startPanY + dy,
    });
  };

  const handleSvgPointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (dragRef.current) {
      const { nodeId, hasMoved } = dragRef.current;
      const node = nodesRef.current.find((n) => n.id === nodeId);
      if (node) {
        // Desanclar si no es el foco central
        if (node.id !== centerId) {
          node.fx = undefined;
          node.fy = undefined;
        }
      }
      dragRef.current = null;

      // Si no se arrastró, fue un click limpio: navegar
      if (!hasMoved) {
        const clickedNode = initialNodes.find((n) => n.id === nodeId);
        if (clickedNode?.href) {
          router.push(clickedNode.href);
        }
      }
      return;
    }

    if (!panDragRef.current) return;
    panDragRef.current = null;
    setIsPanning(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const zoomFactor = 1.15;
    const nextZoom = e.deltaY < 0 ? zoom * zoomFactor : zoom / zoomFactor;
    const clamped = Math.max(0.4, Math.min(3, nextZoom));
    
    // Enfocar zoom en la posición del puntero
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const dx = mouseX - pan.x;
    const dy = mouseY - pan.y;

    setZoom(clamped);
    setPan({
      x: mouseX - dx * (clamped / zoom),
      y: mouseY - dy * (clamped / zoom),
    });
  };

  // ── Gestiones de Drag de Nodo ────────────────────────────────────────
  const handleNodePointerDown = (nodeId: string, e: React.PointerEvent<SVGElement>) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      nodeId,
      startX: e.clientX,
      startY: e.clientY,
      hasMoved: false,
    };
  };

  const handleNodePointerUp = (nodeId: string, e: React.PointerEvent<SVGElement>) => {
    e.stopPropagation();
    e.currentTarget.releasePointerCapture(e.pointerId);
    if (dragRef.current && dragRef.current.nodeId === nodeId) {
      const { hasMoved } = dragRef.current;
      dragRef.current = null;
      if (!hasMoved) {
        const node = initialNodes.find((n) => n.id === nodeId);
        if (node?.href) {
          router.push(node.href);
        }
      }
    }
  };

  // ── Controles de Grafo ────────────────────────────────────────────────
  const handleZoomIn = () => setZoom((z) => Math.min(3, z * 1.2));
  const handleZoomOut = () => setZoom((z) => Math.max(0.4, z / 1.2));
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    // Relajar velocidades y desanclar no centrales
    nodesRef.current.forEach((n) => {
      n.vx = 0;
      n.vy = 0;
      if (n.id !== centerId) {
        n.fx = undefined;
        n.fy = undefined;
      }
    });
  };

  // Colores de nodos según su tipo (Tokens de atlas.css / Recuerdos de Cobre)
  const getNodeColor = (node: GraphNode) => {
    if (node.id === centerId) return "var(--av2-gold)";
    switch (node.kind) {
      case "personaje":
        return node.isPC ? "var(--av2-copper)" : "var(--av2-copper-dim)";
      case "lugar":
        return "oklch(0.65 0.02 240)"; // plateado/azul
      case "faccion":
        return "var(--av2-brass)"; // latón
      case "objeto":
      case "relic":
        return "var(--av2-amber)";
      case "misterio":
        return "oklch(0.60 0.11 320)"; // violeta / misterioso
      case "worldbuilding":
        return "oklch(0.55 0.08 160)"; // verde jade/moss
      default:
        return "var(--av2-ink-faint)";
    }
  };

  const getHoveredLinkDetail = () => {
    if (hoveredLink === null || !links[hoveredLink]) return null;
    const l = links[hoveredLink];
    const sNode = initialNodes.find((n) => n.id === l.source);
    const tNode = initialNodes.find((n) => n.id === l.target);
    return {
      source: sNode?.name || l.source,
      target: tNode?.name || l.target,
      type: l.type || "Conexión",
      episode: l.episode,
    };
  };

  const hoveredLinkData = getHoveredLinkDetail();

  return (
    <div
      ref={containerRef}
      className="av2-relations-graph-container"
      style={{
        position: "relative",
        background: "var(--av2-bg-raised)",
        borderRadius: "var(--av2-r)",
        border: "1px solid var(--av2-rule-copper)",
        overflow: "hidden",
        width: "100%",
        height: `${height}px`,
        userSelect: "none",
      }}
    >
      {/* Controles Flotantes */}
      <div
        className="av2-graph-controls"
        style={{
          position: "absolute",
          bottom: "12px",
          right: "12px",
          display: "flex",
          gap: "6px",
          zIndex: 10,
        }}
      >
        <button
          type="button"
          onClick={handleZoomIn}
          style={{
            width: "32px",
            height: "32px",
            background: "var(--av2-bg-panel)",
            border: "1px solid var(--av2-rule)",
            color: "var(--av2-ink)",
            borderRadius: "var(--av2-r-sm)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--av2-mono)",
            fontSize: "16px",
          }}
          title="Acercar"
        >
          +
        </button>
        <button
          type="button"
          onClick={handleZoomOut}
          style={{
            width: "32px",
            height: "32px",
            background: "var(--av2-bg-panel)",
            border: "1px solid var(--av2-rule)",
            color: "var(--av2-ink)",
            borderRadius: "var(--av2-r-sm)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--av2-mono)",
            fontSize: "16px",
          }}
          title="Alejar"
        >
          −
        </button>
        <button
          type="button"
          onClick={handleReset}
          style={{
            padding: "0 8px",
            height: "32px",
            background: "var(--av2-bg-panel)",
            border: "1px solid var(--av2-rule)",
            color: "var(--av2-ink-soft)",
            borderRadius: "var(--av2-r-sm)",
            fontFamily: "var(--av2-mono)",
            fontSize: "10px",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
          title="Reajustar vista"
        >
          Reset
        </button>
      </div>

      {/* Leyenda de Nodos */}
      <div
        className="av2-graph-legend"
        style={{
          position: "absolute",
          top: "12px",
          left: "12px",
          background: "oklch(0.12 0.01 58 / 0.85)",
          border: "1px solid var(--av2-rule)",
          borderRadius: "var(--av2-r-sm)",
          padding: "8px 12px",
          display: "flex",
          flexDirection: "column",
          gap: "4px",
          fontSize: "10px",
          fontFamily: "var(--av2-mono)",
          color: "var(--av2-ink-soft)",
          zIndex: 10,
          pointerEvents: "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--av2-gold)", boxShadow: "0 0 6px var(--av2-gold)" }} />
          <span>Foco central</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--av2-copper)", boxShadow: "0 0 6px var(--av2-copper)" }} />
          <span>Personaje Principal (PJ)</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--av2-copper-dim)" }} />
          <span>NPC / Aliado</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "oklch(0.65 0.02 240)" }} />
          <span>Lugar</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--av2-brass)" }} />
          <span>Facción</span>
        </div>
      </div>

      {/* Tooltip de Enlace seleccionado */}
      {hoveredLinkData && (
        <div
          className="av2-graph-tooltip"
          style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            background: "linear-gradient(180deg, var(--av2-bg-panel-up) 0%, var(--av2-bg-panel) 100%)",
            border: "1px solid var(--av2-rule-copper)",
            borderRadius: "var(--av2-r-sm)",
            padding: "10px 14px",
            maxWidth: "280px",
            zIndex: 10,
            fontSize: "11px",
            boxShadow: "var(--av2-shadow-deep)",
            pointerEvents: "none",
          }}
        >
          <div style={{ fontFamily: "var(--av2-mono)", color: "var(--av2-copper)", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px" }}>
            Vínculo narrativo
          </div>
          <div style={{ fontWeight: 600, color: "var(--av2-ink)", fontFamily: "var(--av2-display)", fontSize: "14px", marginBottom: "4px" }}>
            {hoveredLinkData.source} <span style={{ color: "var(--av2-ink-faint)", fontWeight: 400 }}>↔</span> {hoveredLinkData.target}
          </div>
          <div style={{ color: "var(--av2-ink-soft)", lineHeight: "1.4" }}>
            {hoveredLinkData.type}
          </div>
          {hoveredLinkData.episode && (
            <div style={{ marginTop: "6px", fontFamily: "var(--av2-mono)", color: "var(--av2-gold)", fontSize: "9.5px" }}>
              Episodio {hoveredLinkData.episode}
            </div>
          )}
        </div>
      )}

      {/* SVG Canvas */}
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        viewBox={`0 0 ${width} ${height}`}
        onPointerDown={handleSvgPointerDown}
        onPointerMove={handleSvgPointerMove}
        onPointerUp={handleSvgPointerUp}
        onPointerLeave={handleSvgPointerUp}
        onWheel={handleWheel}
        style={{
          cursor: isPanning ? "grabbing" : dragRef.current ? "grabbing" : "grab",
          background: "radial-gradient(circle at center, oklch(0.12 0.01 58) 0%, oklch(0.08 0.01 58) 100%)",
          touchAction: "none",
        }}
      >
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* 1. Dibujar Enlaces */}
          <g className="links-group">
            {links.map((link, idx) => {
              const isHovered = hoveredLink === idx;
              const isFaint = hoveredNode !== null && hoveredNode !== link.source && hoveredNode !== link.target;
              
              return (
                <g key={`link-group-${idx}`}>
                  <line
                    id={`link-${idx}`}
                    stroke={isHovered ? "var(--av2-copper-hi)" : "var(--av2-rule-copper)"}
                    strokeWidth={isHovered ? 2 : 1.2}
                    strokeDasharray={link.episode === undefined ? "4 3" : undefined}
                    opacity={isFaint ? 0.15 : isHovered ? 0.9 : 0.45}
                    style={{ transition: "stroke 0.2s, stroke-width 0.2s, opacity 0.2s" }}
                  />
                  {/* Línea invisible más gruesa para facilitar el hover */}
                  <line
                    x1={0} y1={0} x2={0} y2={0} // Se reposiciona en el frame physics loop
                    id={`link-hover-${idx}`}
                    stroke="transparent"
                    strokeWidth={10}
                    style={{ cursor: "help" }}
                    onPointerOver={() => setHoveredLink(idx)}
                    onPointerOut={() => setHoveredLink(null)}
                  />
                </g>
              );
            })}
          </g>

          {/* 2. Dibujar Nodos */}
          <g className="nodes-group">
            {initialNodes.map((node) => {
              const isCenter = node.id === centerId;
              const isHovered = hoveredNode === node.id;
              const isFaint = hoveredNode !== null && !isHovered && 
                !links.some((l) => (l.source === node.id && l.target === hoveredNode) || (l.target === node.id && l.source === hoveredNode));

              const color = getNodeColor(node);
              const radius = isCenter ? 26 : node.kind === "minor" ? 12 : 20;

              return (
                <g
                  key={node.id}
                  id={`node-${node.id}`}
                  className="graph-node"
                  style={{
                    cursor: node.href ? "pointer" : "grab",
                    opacity: isFaint ? 0.25 : 1,
                    transition: "opacity 0.2s",
                  }}
                  onPointerDown={(e) => handleNodePointerDown(node.id, e)}
                  onPointerUp={(e) => handleNodePointerUp(node.id, e)}
                  onPointerOver={() => setHoveredNode(node.id)}
                  onPointerOut={() => setHoveredNode(null)}
                >
                  {/* Halo brillante en hover o si es el central */}
                  {(isCenter || isHovered) && (
                    <circle
                      r={radius + 8}
                      fill="none"
                      stroke={color}
                      strokeWidth={1.5}
                      opacity={0.35}
                      style={{
                        animation: isCenter ? "av2-pulse 4s infinite ease-in-out" : "none",
                        transformOrigin: "center",
                      }}
                    />
                  )}

                  {/* Círculo base del nodo */}
                  <circle
                    r={radius}
                    fill="var(--av2-bg)"
                    stroke={color}
                    strokeWidth={isCenter ? 3 : isHovered ? 2.5 : 1.5}
                    filter="drop-shadow(0 4px 8px oklch(0 0 0 / 0.4))"
                  />

                  {/* Runa o Glifo de fondo para nodos principales */}
                  {!isCenter && node.kind !== "minor" && (
                    <text
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize="9px"
                      fontFamily="var(--av2-mono)"
                      fill={color}
                      opacity={0.35}
                      pointerEvents="none"
                    >
                      {node.kind.slice(0, 3).toUpperCase()}
                    </text>
                  )}

                  {/* Nodo central: Runa rústica en cobre */}
                  {isCenter && (
                    <circle
                      r={10}
                      fill="none"
                      stroke="var(--av2-copper)"
                      strokeWidth={1.2}
                      pointerEvents="none"
                    />
                  )}

                  {/* Etiqueta del nodo */}
                  <text
                    y={radius + 15}
                    textAnchor="middle"
                    dominantBaseline="hanging"
                    fontSize={isCenter ? "11px" : "9.5px"}
                    fontWeight={isCenter || isHovered ? "600" : "400"}
                    fontFamily={node.kind === "minor" ? "var(--av2-mono)" : "var(--av2-display)"}
                    fill={isCenter ? "var(--av2-gold)" : isHovered ? "var(--av2-copper-hi)" : "var(--av2-ink)"}
                    pointerEvents="none"
                    style={{
                      transition: "fill 0.2s, font-weight 0.2s",
                      letterSpacing: node.kind === "minor" ? "0" : "0.03em",
                      filter: "drop-shadow(0 2px 4px oklch(0 0 0 / 0.8))",
                    }}
                  >
                    {node.name}
                  </text>
                </g>
              );
            })}
          </g>
        </g>
      </svg>

      {/* Estilos Inline para animaciones básicas */}
      <style jsx global>{`
        @keyframes av2-pulse {
          0% { transform: scale(0.96); opacity: 0.2; }
          50% { transform: scale(1.06); opacity: 0.55; }
          100% { transform: scale(0.96); opacity: 0.2; }
        }
      `}</style>
    </div>
  );
}
