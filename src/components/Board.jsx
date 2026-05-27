import { useMemo } from 'react';
import {
  ADJACENCY,
  EMPTY,
  PLAYER_HUMAN,
  PLAYER_AI,
  getValidMoves,
} from '../game/tapatan.js';

// Board layout positions (3x3 grid)
const POSITIONS = [
  { x: 60, y: 60 },   // 0
  { x: 200, y: 60 },  // 1
  { x: 340, y: 60 },  // 2
  { x: 60, y: 200 },  // 3
  { x: 200, y: 200 }, // 4
  { x: 340, y: 200 }, // 5
  { x: 60, y: 340 },  // 6
  { x: 200, y: 340 }, // 7
  { x: 340, y: 340 }, // 8
];

// Lines connecting adjacent positions (deduplicated)
const LINES = [];
const seen = new Set();
for (const [from, neighbors] of Object.entries(ADJACENCY)) {
  for (const to of neighbors) {
    const key = [Math.min(+from, to), Math.max(+from, to)].join('-');
    if (!seen.has(key)) {
      seen.add(key);
      LINES.push([+from, to]);
    }
  }
}

export default function Board({ gameState, onCellClick, disabled }) {
  const { board, currentPlayer, phase, selectedPiece, winLine } = gameState;

  const validMoves = useMemo(() => {
    if (disabled || currentPlayer !== PLAYER_HUMAN || phase === 'finished') return [];
    return getValidMoves(gameState, PLAYER_HUMAN);
  }, [gameState, disabled, currentPlayer, phase]);

  // Which cells are valid targets?
  const validTargets = useMemo(() => {
    const targets = new Set();
    for (const m of validMoves) {
      if (phase === 'placement') {
        targets.add(m.to);
      } else if (selectedPiece !== null && m.from === selectedPiece) {
        targets.add(m.to);
      }
    }
    return targets;
  }, [validMoves, phase, selectedPiece]);

  // Which cells have pieces that can move?
  const movablePieces = useMemo(() => {
    if (phase !== 'movement' || disabled) return new Set();
    const pieces = new Set();
    for (const m of validMoves) {
      pieces.add(m.from);
    }
    return pieces;
  }, [validMoves, phase, disabled]);

  const winSet = useMemo(() => new Set(winLine || []), [winLine]);

  function handleClick(index) {
    if (disabled || phase === 'finished') return;
    if (currentPlayer !== PLAYER_HUMAN) return;

    if (phase === 'placement') {
      if (board[index] === EMPTY) {
        onCellClick({ type: 'place', to: index });
      }
    } else {
      // Movement phase
      if (selectedPiece === null) {
        if (board[index] === PLAYER_HUMAN && movablePieces.has(index)) {
          onCellClick({ type: 'select', index });
        }
      } else {
        if (index === selectedPiece) {
          onCellClick({ type: 'deselect' });
        } else if (validTargets.has(index)) {
          onCellClick({ type: 'move', from: selectedPiece, to: index });
        } else if (board[index] === PLAYER_HUMAN && movablePieces.has(index)) {
          onCellClick({ type: 'select', index });
        }
      }
    }
  }

  function getPieceClass(index) {
    if (board[index] === EMPTY) return '';
    const base = board[index] === PLAYER_HUMAN ? 'piece-human' : 'piece-ai';
    const win = winSet.has(index) ? ' piece-winner' : '';
    const selected = selectedPiece === index ? ' piece-selected' : '';
    const movable = (phase === 'movement' && board[index] === PLAYER_HUMAN && movablePieces.has(index) && !disabled) ? ' piece-movable' : '';
    return `${base}${win}${selected}${movable}`;
  }

  return (
    <div className="board-container">
      <svg viewBox="0 0 400 400" className="board-svg">
        {/* Background pattern */}
        <defs>
          <radialGradient id="boardGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(99, 102, 241, 0.08)" />
            <stop offset="100%" stopColor="rgba(0, 0, 0, 0)" />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="strongGlow">
            <feGaussianBlur stdDeviation="6" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="shadow">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="rgba(0,0,0,0.5)" />
          </filter>
        </defs>

        <rect x="0" y="0" width="400" height="400" fill="url(#boardGlow)" rx="12" />

        {/* Grid lines */}
        {LINES.map(([from, to], i) => {
          const p1 = POSITIONS[from];
          const p2 = POSITIONS[to];
          const isWinLine = winLine && winLine.includes(from) && winLine.includes(to) &&
            Math.abs(winLine.indexOf(from) - winLine.indexOf(to)) <= 1;
          return (
            <line
              key={i}
              x1={p1.x} y1={p1.y}
              x2={p2.x} y2={p2.y}
              className={`board-line${isWinLine ? ' board-line-win' : ''}`}
            />
          );
        })}

        {/* Win line highlight */}
        {winLine && (
          <line
            x1={POSITIONS[winLine[0]].x} y1={POSITIONS[winLine[0]].y}
            x2={POSITIONS[winLine[2]].x} y2={POSITIONS[winLine[2]].y}
            className="win-line-glow"
          />
        )}

        {/* Valid target indicators */}
        {Array.from(validTargets).map(index => (
          <circle
            key={`target-${index}`}
            cx={POSITIONS[index].x}
            cy={POSITIONS[index].y}
            r="16"
            className="valid-target"
          />
        ))}

        {/* Intersection points / cells */}
        {POSITIONS.map((pos, index) => (
          <g key={index} onClick={() => handleClick(index)} style={{ cursor: disabled ? 'default' : 'pointer' }}>
            {/* Clickable area */}
            <circle
              cx={pos.x} cy={pos.y} r="30"
              fill="transparent"
              className="click-area"
            />

            {/* Empty intersection dot */}
            {board[index] === EMPTY && !validTargets.has(index) && (
              <circle
                cx={pos.x} cy={pos.y} r="6"
                className="empty-dot"
              />
            )}

            {/* Pieces */}
            {board[index] !== EMPTY && (
              <g className={getPieceClass(index)} filter="url(#shadow)">
                <circle
                  cx={pos.x} cy={pos.y} r="24"
                  className="piece-circle"
                />
                <text
                  x={pos.x} y={pos.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="piece-label"
                >
                  {board[index] === PLAYER_HUMAN ? '✦' : '◆'}
                </text>
              </g>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}
