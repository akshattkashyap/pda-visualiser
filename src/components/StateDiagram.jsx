import React, { useMemo } from 'react';

export default function StateDiagram({ pdaDef, activeState, accepted, lastRule }) {
  const layout = useMemo(() => {
    const states = pdaDef.states;

    // ── Build edge map ──
    const edgesMap = {};
    pdaDef.transitions.forEach(t => {
      const key = `${t.from}->${t.to}`;
      if (!edgesMap[key]) {
        edgesMap[key] = { from: t.from, to: t.to, labels: [] };
      }
      const label = `${t.input}, ${t.stackPop} → ${t.stackPush}`;
      edgesMap[key].labels.push({ label, rawRule: t });
    });

    // ── Dynamic radius based on longest state name ──
    const maxNameLen = Math.max(...states.map(s => s.id.length), 2);
    const R = Math.max(28, maxNameLen * 6 + 8);

    // ── Compute max self-loop label count for headroom ──
    let maxSelfLoopLabels = 0;
    Object.values(edgesMap).forEach(e => {
      if (e.from === e.to) maxSelfLoopLabels = Math.max(maxSelfLoopLabels, e.labels.length);
    });

    // ── Spacing & positions ──
    const LINE_HEIGHT = 13;
    const selfLoopTextH = maxSelfLoopLabels * LINE_HEIGHT;
    const topPadding = 20;
    const labelArcGap = 20;   // gap between bottom label and arc peak
    const arcHeight = 40;     // how far arc peak is above node top

    // cy = enough room for: topPad + text block + gap + arc + node radius
    const cy = topPadding + selfLoopTextH + labelArcGap + arcHeight + R + 10;

    const spacingX = Math.max(160, R * 5);
    const startX = R + 80;

    const nodes = states.map((s, i) => ({
      id: s.id,
      x: startX + i * spacingX,
      y: cy,
      isStart: pdaDef.startState === s.id,
      isAccept: pdaDef.acceptStates.includes(s.id),
    }));

    const nodePos = {};
    nodes.forEach(n => { nodePos[n.id] = n; });

    const edges = Object.values(edgesMap).map(e => {
      const from = nodePos[e.from];
      const to = nodePos[e.to];
      if (!from || !to) return null;
      return { ...e, from, to, isSelfLoop: e.from === e.to };
    }).filter(Boolean);

    const svgW = startX + (states.length - 1) * spacingX + R + 80;
    const svgH = cy + R + 60;

    return { nodes, edges, R, LINE_HEIGHT, width: svgW, height: svgH };
  }, [pdaDef]);

  const R = layout.R;
  const LH = layout.LINE_HEIGHT;

  return (
    <div className="w-full h-full overflow-auto bg-black/40 hide-scrollbar flex items-center justify-center">
      <svg width={layout.width} height={layout.height} className="block flex-shrink-0">
        <defs>
          <marker id="ah" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="rgba(148,163,184,0.6)" />
          </marker>
          <marker id="ah-on" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="rgba(245,158,11,0.9)" />
          </marker>
        </defs>

        {/* ── Edges ── */}
        {layout.edges.map((edge, i) => {
          const { from, to, isSelfLoop, labels } = edge;

          const isActive = lastRule && labels.some(l =>
            l.rawRule.from === lastRule.from &&
            l.rawRule.input === lastRule.input &&
            l.rawRule.stackPop === lastRule.stackPop &&
            l.rawRule.to === lastRule.to &&
            l.rawRule.stackPush === lastRule.stackPush
          );

          const color = isActive ? "rgba(245,158,11,0.8)" : "rgba(148,163,184,0.3)";
          const sw = isActive ? 3 : 1.5;
          const marker = isActive ? "url(#ah-on)" : "url(#ah)";
          const textFill = isActive ? "#fcd34d" : "#94a3b8";

          let pathD, lx, ly;

          if (isSelfLoop) {
            const cx = from.x, nodeCy = from.y;

            // Arc: a visible curve above the node
            // Endpoints connect to top-left / top-right of the circle
            const arcEndY = nodeCy - R * 0.85;
            // Control point Y determines arc peak height — 40px above node top
            const cpY = nodeCy - R - 40;

            pathD = `M ${cx - R * 0.55} ${arcEndY}` +
                    ` C ${cx - R * 1.6} ${cpY}, ${cx + R * 1.6} ${cpY}, ${cx + R * 0.55} ${arcEndY}`;

            lx = cx;
            // Bezier peak ≈ midpoint between endpoints and control points
            // For this shape, peak is roughly at cpY + 8
            const arcPeakY = cpY + 8;
            // Bottom label sits 12px above the arc peak
            const labelBottomY = arcPeakY - 12;
            ly = labelBottomY - (labels.length - 1) * LH;
          } else {
            const dx = to.x - from.x;
            const dy = to.y - from.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const px = (dx / dist) * (R + 6);
            const py = (dy / dist) * (R + 6);

            if (to.x < from.x) {
              // Backward arc below nodes
              const h = Math.abs(dx) * 0.4;
              pathD = `M ${from.x - px} ${from.y + R}` +
                      ` Q ${(from.x + to.x) / 2} ${from.y + h + R} ${to.x + px} ${to.y + R}`;
              lx = (from.x + to.x) / 2;
              ly = from.y + h * 0.5 + R + 8;
            } else {
              // Forward straight
              pathD = `M ${from.x + px} ${from.y + py}` +
                      ` L ${to.x - px} ${to.y - py}`;
              lx = (from.x + to.x) / 2;
              // Labels above the line — bottom label 10px above, rest stack upward
              ly = (from.y + to.y) / 2 - 10 - (labels.length - 1) * LH;
            }
          }

          return (
            <g key={i}>
              <path d={pathD} fill="none" stroke={color} strokeWidth={sw} markerEnd={marker} />
              <text
                x={lx} y={ly}
                textAnchor="middle"
                fill={textFill}
                className={`font-mono transition-colors duration-300 ${isActive ? 'font-bold' : ''}`}
                style={{ fontSize: '11px' }}
              >
                {labels.map((l, li) => (
                  <tspan x={lx} dy={li === 0 ? 0 : LH} key={li}>{l.label}</tspan>
                ))}
              </text>
            </g>
          );
        })}

        {/* ── Nodes ── */}
        {layout.nodes.map((node, i) => {
          const cur = node.id === activeState;
          const ok = cur && accepted === true;
          const no = cur && accepted === false;

          const fill = cur
            ? ok ? "rgba(16,185,129,0.15)" : no ? "rgba(244,63,94,0.15)" : "rgba(245,158,11,0.15)"
            : "rgba(15,23,42,0.9)";
          const stroke = cur
            ? ok ? "rgba(16,185,129,0.8)" : no ? "rgba(244,63,94,0.8)" : "rgba(245,158,11,0.8)"
            : "rgba(148,163,184,0.5)";

          return (
            <g key={i} transform={`translate(${node.x},${node.y})`}>
              {/* Start arrow */}
              {node.isStart && (
                <path d={`M -${R + 35} 0 L -${R + 5} 0`}
                  stroke="rgba(148,163,184,0.6)" strokeWidth="2" markerEnd="url(#ah)" />
              )}

              <circle r={R} fill={fill} stroke={stroke}
                strokeWidth={cur ? 3 : 2} className="transition-colors duration-300" />

              {node.isAccept && (
                <circle r={R - 5} fill="none" stroke={stroke}
                  strokeWidth="1.5" className="transition-colors duration-300" />
              )}

              <text textAnchor="middle" dy="5"
                fill={cur ? stroke : "#cbd5e1"}
                className="font-bold transition-colors duration-300"
                style={{ fontSize: R > 34 ? '12px' : '14px' }}
              >
                {node.id}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
