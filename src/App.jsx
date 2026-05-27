import { useState, useCallback, useEffect, useRef } from 'react';
import Board from './components/Board.jsx';
import DecisionTree from './components/DecisionTree.jsx';
import GameInfo from './components/GameInfo.jsx';
import {
  createInitialState,
  applyMove,
  PLAYER_HUMAN,
  PLAYER_AI,
} from './game/tapatan.js';
import { computeAIMove } from './game/ai.js';
import './App.css';

function App() {
  const [gameState, setGameState] = useState(createInitialState());
  const [aiMode, setAiMode] = useState('alphabeta');
  const [maxDepth, setMaxDepth] = useState(4);
  const [tree, setTree] = useState(null);
  const [stats, setStats] = useState(null);
  const [scores, setScores] = useState({ human: 0, ai: 0 });
  const [thinking, setThinking] = useState(false);
  const [moveHistory, setMoveHistory] = useState([]);
  const thinkingTimeout = useRef(null);

  // Resizable layout width (par défaut divisé à moitié-moitié)
  const [leftWidth, setLeftWidth] = useState(window.innerWidth / 2);
  const isResizing = useRef(false);

  const startResize = useCallback((e) => {
    isResizing.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  const resize = useCallback((e) => {
    if (!isResizing.current) return;
    const newWidth = Math.max(320, Math.min(window.innerWidth - 320, e.clientX));
    setLeftWidth(newWidth);
  }, []);

  const stopResize = useCallback(() => {
    if (!isResizing.current) return;
    isResizing.current = false;
    document.body.style.cursor = 'default';
    document.body.style.userSelect = 'auto';
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResize);
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResize);
    };
  }, [resize, stopResize]);

  // AI plays when it's its turn
  useEffect(() => {
    if (gameState.currentPlayer !== PLAYER_AI || gameState.phase === 'finished') return;

    setThinking(true);
    let moveTimeout = null;
    // Small delay for UX — let the board animate first
    thinkingTimeout.current = setTimeout(() => {
      const result = computeAIMove(gameState, aiMode, maxDepth);
      if (result) {
        setTree(result.tree);
        setStats(result.stats);
        setMoveHistory(prev => [...prev, { player: 'AI', move: result.move, value: result.value }]);

        // Another small delay so the tree appears before the move
        moveTimeout = setTimeout(() => {
          const newState = applyMove(gameState, result.move);
          setGameState(newState);
          setThinking(false);

          if (newState.phase === 'finished' && newState.winner === PLAYER_AI) {
            setScores(prev => ({ ...prev, ai: prev.ai + 1 }));
          }
        }, 400);
      }
    }, 300);

    return () => {
      clearTimeout(thinkingTimeout.current);
      if (moveTimeout) clearTimeout(moveTimeout);
    };
  }, [gameState.currentPlayer, gameState.phase, aiMode, maxDepth]);

  const handleCellClick = useCallback((action) => {
    if (gameState.currentPlayer !== PLAYER_HUMAN || gameState.phase === 'finished') return;

    if (action.type === 'select') {
      setGameState(prev => ({ ...prev, selectedPiece: action.index }));
      return;
    }
    if (action.type === 'deselect') {
      setGameState(prev => ({ ...prev, selectedPiece: null }));
      return;
    }

    // place or move
    const newState = applyMove(gameState, action);
    setMoveHistory(prev => [...prev, { player: 'Human', move: action }]);
    setGameState(newState);

    if (newState.phase === 'finished' && newState.winner === PLAYER_HUMAN) {
      setScores(prev => ({ ...prev, human: prev.human + 1 }));
    }
  }, [gameState]);

  const handleRestart = useCallback(() => {
    setGameState(createInitialState());
    setTree(null);
    setStats(null);
    setMoveHistory([]);
    setThinking(false);
    clearTimeout(thinkingTimeout.current);
  }, []);

  const handleToggleMode = useCallback(() => {
    setAiMode(prev => prev === 'minimax' ? 'alphabeta' : 'minimax');
  }, []);

  const handleDepthChange = useCallback((d) => {
    setMaxDepth(d);
  }, []);

  return (
    <div className="app">
      {/* Ambient background */}
      <div className="ambient-bg">
        <div className="ambient-orb orb-1"></div>
        <div className="ambient-orb orb-2"></div>
        <div className="ambient-orb orb-3"></div>
      </div>

      <div className="app-layout" style={{ gridTemplateColumns: `${leftWidth}px 4px 1fr` }}>
        {/* Left column — Game */}
        <div className="column column-left">
          <GameInfo
            gameState={gameState}
            aiMode={aiMode}
            onToggleMode={handleToggleMode}
            onRestart={handleRestart}
            onDepthChange={handleDepthChange}
            maxDepth={maxDepth}
            scores={scores}
            thinking={thinking}
          />
          <Board
            gameState={gameState}
            onCellClick={handleCellClick}
            disabled={thinking || gameState.currentPlayer !== PLAYER_HUMAN}
          />
        </div>

        {/* Resizable Divider */}
        <div className="app-splitter" onMouseDown={startResize}></div>

        {/* Right column — Decision Tree */}
        <div className="column column-right">
          <div className="tree-header">
            <h2 className="tree-title">
              Arbre de décision
            </h2>
            <div className="tree-mode-badge">
              {aiMode === 'alphabeta' ? 'Alpha-Bêta' : 'Minimax pur'}
            </div>
          </div>
          <DecisionTree
            tree={tree}
            stats={stats}
            maxDepthVisible={Math.min(maxDepth, 4)}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
