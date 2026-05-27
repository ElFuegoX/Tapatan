import { useRef, useEffect, useMemo, useState, useCallback } from 'react';

// ---------- Constantes de mise en page de l'arbre ----------

const R = 22; // Rayon des nœuds circulaires
const LEVEL_GAP = 70; // Écartement vertical entre les lignes de l'arbre
const SIBLING_GAP = 28; // Écartement horizontal entre les sous-arbres
const NODE_W = R * 2;
const NODE_H = R * 2;
const X_MARGIN = 160; // Marge gauche pour laisser la place aux étiquettes des niveaux

function layoutTree(root, maxDepthVisible = 4) {
  if (!root) return { nodes: [], edges: [], width: 0, height: 0 };

  const nodes = [];
  const edges = [];

  // Première passe : calcul récursif de la largeur nécessaire pour chaque sous-arbre
  function computeWidth(node, depth) {
    if (depth >= maxDepthVisible || node.children.length === 0) {
      node._width = NODE_W;
      return NODE_W;
    }
    let total = 0;
    for (const child of node.children) {
      total += computeWidth(child, depth + 1);
    }
    total += (node.children.length - 1) * SIBLING_GAP;
    node._width = Math.max(NODE_W, total);
    return node._width;
  }

  computeWidth(root, 0);

  // Deuxième passe : attribution des coordonnées finales (X, Y) aux nœuds et aux liens (edges)
  function assign(node, depth, left) {
    const x = left + node._width / 2 + X_MARGIN;
    const y = depth * (NODE_H + LEVEL_GAP) + R + 40;
    nodes.push({ ...node, _x: x, _y: y, _depth: depth });

    if (depth < maxDepthVisible) {
      let childLeft = left;
      for (const child of node.children) {
        assign(child, depth + 1, childLeft);
        edges.push({
          x1: x,
          y1: y + R,
          x2: childLeft + child._width / 2 + X_MARGIN,
          y2: (depth + 1) * (NODE_H + LEVEL_GAP) + 40,
          pruned: child.pruned,
          depth: depth + 1, // Utilisé pour le retard de l'animation de liaison
        });
        childLeft += child._width + SIBLING_GAP;
      }
    }
  }

  assign(root, 0, 0);

  const maxX = Math.max(...nodes.map(n => n._x + R + 40));
  const maxY = Math.max(...nodes.map(n => n._y + R + 40));

  return { nodes, edges, width: maxX, height: maxY };
}

// ---------- Détermination des couleurs selon les consignes de l'utilisateur ----------

function getNodeStyles(value, pruned, isMaximizing) {
  if (pruned) {
    // Élagué : Rouge Gris (vieux rouge ardoise désaturé)
    return {
      fill: '#8b6c70', 
      stroke: '#9b7c80',
      borderWidth: 1.5,
      textColor: '#f8fafc',
      glow: 'none',
      dashArray: '3 3',
    };
  }

  let color = '#64748b'; // Neutre (Gris ardoise)
  let glowColor = 'rgba(100, 116, 139, 0.3)';

  if (typeof value === 'number') {
    if (value > 0) {
      // Bon pour l'IA : Vert
      color = '#10b981';
      glowColor = 'rgba(16, 185, 129, 0.4)';
    } else if (value < 0) {
      // Mauvais pour l'IA (bon pour le joueur) : Rouge
      color = '#ef4444';
      glowColor = 'rgba(239, 68, 68, 0.4)';
    }
  }

  if (isMaximizing) {
    // Niveau MAX : Nœud plein (fond de couleur vibrante)
    return {
      fill: color,
      stroke: '#ffffff',
      borderWidth: 1,
      textColor: '#ffffff',
      glow: `0 0 10px ${glowColor}`,
      dashArray: 'none',
    };
  } else {
    // Niveau MIN : Nœud contouré (fond blanc, bordure et texte colorés)
    return {
      fill: '#ffffff',
      stroke: color,
      borderWidth: 2.5,
      textColor: '#0f172a',
      glow: `0 0 6px ${glowColor}`,
      dashArray: 'none',
    };
  }
}

// ---------- Rendu graphique du mini plateau Tapatan ----------

function MiniBoard({ board }) {
  if (!board) return null;
  const size = 56;
  const cell = size / 3;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mini-board-svg">
      <rect width={size} height={size} rx="4" fill="rgba(0,0,0,0.4)" />
      {/* Grille */}
      <line x1={cell} y1="2" x2={cell} y2={size - 2} stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
      <line x1={cell * 2} y1="2" x2={cell * 2} y2={size - 2} stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
      <line x1="2" y1={cell} x2={size - 2} y2={cell} stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
      <line x1="2" y1={cell * 2} x2={size - 2} y2={cell * 2} stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
      {/* Diagonales */}
      <line x1="2" y1="2" x2={size - 2} y2={size - 2} stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
      <line x1={size - 2} y1="2" x2="2" y2={size - 2} stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
      {/* Pièces */}
      {board.map((val, i) => {
        if (val === 0) return null;
        const cx = (i % 3) * cell + cell / 2;
        const cy = Math.floor(i / 3) * cell + cell / 2;
        return (
          <circle
            key={i}
            cx={cx} cy={cy} r={cell / 3.2}
            fill={val === 1 ? 'var(--accent-blue)' : 'var(--accent-orange)'}
            opacity="0.95"
          />
        );
      })}
    </svg>
  );
}

// ---------- Composant principal ----------

export default function DecisionTree({ tree, stats, maxDepthVisible = 4 }) {
  const containerRef = useRef(null);
  const [hoveredNodeData, setHoveredNodeData] = useState(null); // Informations pour l'infobulle flottante mobile
  const [scale, setScale] = useState(1); // Facteur de zoom (défilement natif via transform)

  const layout = useMemo(() => {
    if (!tree) return null;
    return layoutTree(tree, maxDepthVisible);
  }, [tree, maxDepthVisible]);

  // Réinitialiser le zoom à 1:1 et faire défiler vers le centre haut
  const centerTreeTop = useCallback(() => {
    setScale(1);
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
      if (layout) {
        // Scroller horizontalement pour centrer la racine
        const leftScroll = (layout.width - containerRef.current.clientWidth) / 2;
        containerRef.current.scrollLeft = Math.max(0, leftScroll);
      }
    }
  }, [layout]);

  // Ajuster automatiquement l'arbre entier dans le conteneur disponible
  const fitTreeToView = useCallback(() => {
    if (!layout || !containerRef.current) return;
    const cw = containerRef.current.clientWidth;
    const ch = containerRef.current.clientHeight;
    const scaleX = (cw - 40) / layout.width;
    const scaleY = (ch - 60) / layout.height;
    const idealScale = Math.max(0.3, Math.min(scaleX, scaleY, 1.1));
    setScale(idealScale);
    containerRef.current.scrollTop = 0;
    containerRef.current.scrollLeft = 0;
  }, [layout]);

  // Force la position à la taille réelle 1:1 à chaque nouveau mouvement pour bien voir la construction progressive
  useEffect(() => {
    if (layout) {
      centerTreeTop();
    }
  }, [layout, centerTreeTop]);

  // Mouvements de souris pour positionner l'infobulle flottante avec décalage de sécurité (sans clignotement)
  const handleNodeMouseEnter = (node, e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    // Décalage de 20 pixels en bas et à droite pour que le curseur ne chevauche JAMAIS l'infobulle
    const x = e.clientX - rect.left + 20;
    const y = e.clientY - rect.top + 20;
    setHoveredNodeData({ node, x, y });
  };

  const handleNodeMouseMove = (node, e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + 20;
    const y = e.clientY - rect.top + 20;
    setHoveredNodeData(prev => prev ? { ...prev, x, y } : null);
  };

  const handleNodeMouseLeave = () => {
    setHoveredNodeData(null);
  };

  if (!tree || !layout) {
    return (
      <div className="tree-container tree-empty">
        <div className="tree-empty-content">
          <p>L'arbre de décision apparaîtra ici</p>
          <p className="tree-empty-sub">après le premier coup de l'IA</p>
        </div>
      </div>
    );
  }

  // Formatage de la valeur imprimée au centre : vide pour élagué (plus de ciseau !)
  const formatValue = (v, pruned) => {
    if (pruned) return ''; // Plus de ciseau au centre du rond élagué !
    if (typeof v === 'number') {
      if (v > 90) return '+∞';
      if (v < -90) return '−∞';
      return v > 0 ? `+${v}` : v.toString();
    }
    return '—';
  };

  const formatAB = (v) => {
    if (v === Infinity || v === undefined) return '+∞';
    if (v === -Infinity) return '−∞';
    return typeof v === 'number' ? v.toString() : '?';
  };

  const levels = Array.from(new Set(layout.nodes.map(n => n._depth))).sort((a, b) => a - b);

  return (
    <div className="tree-panel">
      {/* Barre des statistiques (sans icônes) */}
      <div className="tree-stats">
        <div className="stat-chip stat-explored">
          <span className="stat-label">Explorés</span>
          <span className="stat-value">{stats?.explored ?? 0}</span>
        </div>
        <div className="stat-chip stat-comparison">
          <span className="stat-label">Sans élagage</span>
          <span className="stat-value">{stats?.minimaxWouldExplore ?? 0}</span>
        </div>
        {stats?.pruned > 0 && (
          <div className="stat-chip stat-pruned">
            <span className="stat-label">Élagués</span>
            <span className="stat-value">{stats.pruned}</span>
          </div>
        )}
        {stats && stats.minimaxWouldExplore > 0 && (
          <div className="stat-chip stat-savings">
            <span className="stat-label">Économie</span>
            <span className="stat-value">
              {Math.round((1 - stats.explored / stats.minimaxWouldExplore) * 100)}%
            </span>
          </div>
        )}
      </div>

      {/* Conteneur principal avec défilement natif */}
      <div className="tree-container" ref={containerRef} style={{ position: 'relative', overflow: 'auto' }}>
        
        {/* Wrapper transformable pour le zoom par échelle CSS */}
        <div
          className="tree-canvas-wrapper"
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            width: `${layout.width}px`,
            height: `${layout.height}px`,
            transition: 'transform 0.15s cubic-bezier(0.2, 0.8, 0.2, 1)',
            position: 'relative',
          }}
        >
          <svg
            width={layout.width}
            height={layout.height}
            className="tree-svg"
          >
            {/* Lignes de guidage et étiquettes de profondeur */}
            {levels.map((depth) => {
              const sampleNode = layout.nodes.find(n => n._depth === depth);
              if (!sampleNode) return null;
              const y = sampleNode._y;
              const isMax = depth % 2 === 0;

              return (
                <g key={`level-row-${depth}`}>
                  <line
                    x1={30}
                    y1={y}
                    x2={layout.width}
                    y2={y}
                    stroke="rgba(255, 255, 255, 0.04)"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                  <rect
                    x={10}
                    y={y - 12}
                    width={130}
                    height={24}
                    rx={6}
                    fill="rgba(30, 41, 59, 0.75)"
                    stroke="rgba(255, 255, 255, 0.05)"
                    strokeWidth="0.5"
                  />
                  <text
                    x={20}
                    y={y + 1}
                    alignmentBaseline="middle"
                    className="tree-level-label-text"
                  >
                    {depth === 0 ? 'Racine' : `P${depth}`} : {isMax ? 'MAX (IA)' : 'MIN (Vous)'}
                  </text>
                </g>
              );
            })}

            {/* Tracé des liaisons (Edges) animées en cascade progressive */}
            {layout.edges.map((edge, i) => (
              <line
                key={`e-${i}`}
                x1={edge.x1}
                y1={edge.y1}
                x2={edge.x2}
                y2={edge.y2}
                className={`tree-edge${edge.pruned ? ' tree-edge-pruned' : ''} build-animation-line`}
                style={{
                  animationDelay: `${edge.depth * 150}ms`, // Décalage pour construction progressive
                }}
              />
            ))}

            {/* Tracé des nœuds circulaires animés en cascade progressive */}
            {layout.nodes.map((node) => {
              const styles = getNodeStyles(node.value, node.pruned, node.isMaximizing);
              const isHovered = hoveredNodeData?.node?.id === node.id;

              return (
                <g
                  key={node.id}
                  className={`tree-node${node.pruned ? ' tree-node-pruned' : ''}${isHovered ? ' tree-node-hovered' : ''} build-animation-node`}
                  style={{ 
                    cursor: 'pointer',
                    animationDelay: `${node.depth * 150}ms`, // Décalage pour construction progressive
                  }}
                  onMouseEnter={(e) => handleNodeMouseEnter(node, e)}
                  onMouseMove={(e) => handleNodeMouseMove(node, e)}
                  onMouseLeave={handleNodeMouseLeave}
                >
                  {/* Effet de lueur extérieure */}
                  {styles.glow !== 'none' && (
                    <circle
                      cx={node._x}
                      cy={node._y}
                      r={R + 3}
                      fill="none"
                      stroke={styles.stroke}
                      strokeWidth="1.5"
                      opacity="0.25"
                    />
                  )}

                  {/* Cercle principal du nœud */}
                  <circle
                    cx={node._x}
                    cy={node._y}
                    r={R}
                    fill={styles.fill}
                    stroke={styles.stroke}
                    strokeWidth={styles.borderWidth}
                    strokeDasharray={styles.dashArray}
                    className="tree-node-circle"
                  />

                  {/* Valeur numérique imprimée au centre */}
                  <text
                    x={node._x}
                    y={node._y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="tree-node-value-circle"
                    style={{ fill: styles.textColor }}
                  >
                    {formatValue(node.value, node.pruned)}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* INFOBULLE FLOTTANTE MOBILE (Suit le curseur avec décalage de sécurité) */}
        {hoveredNodeData && hoveredNodeData.node && (
          <div
            className="tree-tooltip-card pointer-events-none"
            style={{
              position: 'absolute',
              left: `${hoveredNodeData.x}px`,
              top: `${hoveredNodeData.y}px`,
              zIndex: 100,
            }}
          >
            <div className="tooltip-header">
              <span className="tooltip-move">{hoveredNodeData.node.moveLabel}</span>
              <span className={`tooltip-player-badge ${hoveredNodeData.node.isMaximizing ? 'max-badge' : 'min-badge'}`}>
                {hoveredNodeData.node.isMaximizing ? 'MAX (IA)' : 'MIN (Vous)'}
              </span>
            </div>
            <div className="tooltip-body">
              <div className="tooltip-stat">
                <span className="label">Valeur :</span>
                <span className="value">
                  {hoveredNodeData.node.pruned ? 'Élagué' : formatValue(hoveredNodeData.node.value, false)}
                </span>
              </div>
              <div className="tooltip-stat">
                <span className="label">Profondeur :</span>
                <span className="value">{hoveredNodeData.node.depth}</span>
              </div>
              {!hoveredNodeData.node.pruned && (
                <div className="tooltip-stat">
                  <span className="label">Limites :</span>
                  <span className="value ab-values">
                    α: {formatAB(hoveredNodeData.node.alpha)} &nbsp;|&nbsp; β: {formatAB(hoveredNodeData.node.beta)}
                  </span>
                </div>
              )}
              {hoveredNodeData.node.pruned && (
                <div className="tooltip-pruned-alert">
                  Branche élaguée (β ≤ α)
                </div>
              )}
              {hoveredNodeData.node.boardSnapshot && (
                <div className="tooltip-board-preview">
                  <span className="label">Plateau :</span>
                  <MiniBoard board={hoveredNodeData.node.boardSnapshot} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Boutons de préréglage du zoom et de recentrage sécurisés */}
        <div className="tree-zoom-controls" onMouseDown={(e) => e.stopPropagation()}>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setScale(prev => Math.min(2.5, prev * 1.2));
            }} 
            title="Zoom +"
          >
            +
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setScale(prev => Math.max(0.2, prev * 0.8));
            }} 
            title="Zoom −"
          >
            −
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              centerTreeTop();
            }} 
            title="Recentrer (Taille réelle 1:1)"
          >
            1:1
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              fitTreeToView();
            }} 
            title="Ajuster à l'écran"
          >
            Ajuster
          </button>
        </div>
      </div>

      {/* Légende mise à jour selon les consignes */}
      <div className="tree-legend">
        <div className="legend-item">
          <span className="legend-ring filled-ring"></span>
          <span>Bon pour l'IA (Vert)</span>
        </div>
        <div className="legend-item">
          <span className="legend-ring outline-ring"></span>
          <span>Mauvais pour l'IA (Rouge)</span>
        </div>
        <div className="legend-item">
          <span className="legend-pruned"></span>
          <span>Élagué (Rouge Gris)</span>
        </div>
      </div>
    </div>
  );
}
