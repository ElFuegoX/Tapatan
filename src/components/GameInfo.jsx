import { PLAYER_HUMAN, PLAYER_AI } from '../game/tapatan.js';

export default function GameInfo({
  gameState,
  aiMode,
  onToggleMode,
  onRestart,
  onDepthChange,
  maxDepth,
  scores,
  thinking,
}) {
  const { currentPlayer, phase, winner, piecesPlaced } = gameState;

  const phaseLabel = {
    placement: 'Placement',
    movement: 'Déplacement',
    finished: 'Terminé',
  };

  const statusMessage = () => {
    if (phase === 'finished') {
      if (winner === PLAYER_HUMAN) return '🎉 Vous avez gagné !';
      if (winner === PLAYER_AI) return '🤖 L\'IA a gagné !';
      return '🤝 Match nul';
    }
    if (thinking) return '🤖 L\'IA réfléchit…';
    if (currentPlayer === PLAYER_HUMAN) {
      if (phase === 'placement') return '📍 Placez une pièce';
      return '👆 Déplacez une pièce';
    }
    return '⏳ Tour de l\'IA…';
  };

  const piecesHuman = piecesPlaced[PLAYER_HUMAN];
  const piecesAI = piecesPlaced[PLAYER_AI];

  return (
    <div className="game-info">
      {/* Title */}
      <div className="game-title-section">
        <h1 className="game-title">
          <span className="title-accent">T</span>apatan
        </h1>
      </div>

      {/* Status */}
      <div className={`status-card ${phase === 'finished' ? (winner === PLAYER_HUMAN ? 'status-win' : 'status-lose') : ''}`}>
        <div className="status-message">{statusMessage()}</div>
        <div className="status-phase">
          Phase : <strong>{phaseLabel[phase]}</strong>
        </div>
        {phase !== 'finished' && (
          <div className="turn-indicator">
            <div className={`turn-dot ${currentPlayer === PLAYER_HUMAN ? 'turn-human' : 'turn-ai'}`}></div>
            <span>{currentPlayer === PLAYER_HUMAN ? 'Votre tour' : 'Tour IA'}</span>
          </div>
        )}
      </div>

      {/* Scores */}
      <div className="scores-card">
        <div className="score-row">
          <div className="score-player">
            <div className="score-icon human-icon">✦</div>
            <span>Vous</span>
          </div>
          <div className="score-value">{scores.human}</div>
        </div>
        <div className="score-divider"></div>
        <div className="score-row">
          <div className="score-player">
            <div className="score-icon ai-icon">◆</div>
            <span>IA</span>
          </div>
          <div className="score-value">{scores.ai}</div>
        </div>
      </div>

      {/* Pieces placed */}
      {phase === 'placement' && (
        <div className="pieces-card">
          <div className="pieces-title">Pièces placées</div>
          <div className="pieces-row">
            <div className="pieces-bar">
              <div className="pieces-dots">
                {[0, 1, 2].map(i => (
                  <div key={`h-${i}`} className={`piece-dot ${i < piecesHuman ? 'dot-human-filled' : 'dot-empty'}`}></div>
                ))}
              </div>
              <span className="pieces-label">Vous : {piecesHuman}/3</span>
            </div>
            <div className="pieces-bar">
              <div className="pieces-dots">
                {[0, 1, 2].map(i => (
                  <div key={`a-${i}`} className={`piece-dot ${i < piecesAI ? 'dot-ai-filled' : 'dot-empty'}`}></div>
                ))}
              </div>
              <span className="pieces-label">IA : {piecesAI}/3</span>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="controls-card">
        <div className="control-group">
          <label className="control-label">Algorithme IA</label>
          <button
            className={`toggle-btn ${aiMode === 'alphabeta' ? 'toggle-active' : ''}`}
            onClick={onToggleMode}
          >
            <span className={`toggle-option ${aiMode === 'minimax' ? 'option-active' : ''}`}>
              Minimax
            </span>
            <span className={`toggle-option ${aiMode === 'alphabeta' ? 'option-active' : ''}`}>
              Alpha-Bêta
            </span>
            <div className={`toggle-slider ${aiMode === 'alphabeta' ? 'slider-right' : 'slider-left'}`}></div>
          </button>
        </div>

        <div className="control-group">
          <label className="control-label">
            Profondeur max : <strong>{maxDepth}</strong>
          </label>
          <div className="depth-controls">
            {[2, 3, 4, 5].map(d => (
              <button
                key={d}
                className={`depth-btn ${d === maxDepth ? 'depth-active' : ''}`}
                onClick={() => onDepthChange(d)}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Restart */}
      <button className="restart-btn" onClick={onRestart}>
        <span className="restart-icon">↻</span>
        Nouvelle partie
      </button>

      {/* Rules */}
      <details className="rules-card">
        <summary className="rules-summary">📖 Règles du jeu</summary>
        <div className="rules-content">
          <p><strong>Phase 1 — Placement :</strong> Chaque joueur place ses 3 pièces à tour de rôle sur les intersections vides.</p>
          <p><strong>Phase 2 — Déplacement :</strong> Les joueurs déplacent une pièce vers une intersection adjacente connectée.</p>
          <p><strong>Objectif :</strong> Aligner vos 3 pièces en ligne (horizontale, verticale ou diagonale).</p>
        </div>
      </details>
    </div>
  );
}
