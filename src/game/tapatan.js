/**
 * Tapatan Game Logic
 * 
 * Tapatan is a Filipino board game played on a 3x3 grid.
 * Each player has 3 pieces. 
 * Phase 1: Players take turns placing pieces.
 * Phase 2: Players take turns moving pieces along lines to adjacent positions.
 * Goal: Get 3 pieces in a row (horizontal, vertical, or diagonal).
 */

// Board positions (0-8):
// 0 - 1 - 2
// | \ | / |
// 3 - 4 - 5
// | / | \ |
// 6 - 7 - 8

// Adjacency map: which positions connect to which
export const ADJACENCY = {
  0: [1, 3, 4],
  1: [0, 2, 4],
  2: [1, 4, 5],
  3: [0, 4, 6],
  4: [0, 1, 2, 3, 5, 6, 7, 8],
  5: [2, 4, 8],
  6: [3, 4, 7],
  7: [4, 6, 8],
  8: [4, 5, 7],
};

// Winning lines
export const WIN_LINES = [
  [0, 1, 2], // top row
  [3, 4, 5], // middle row
  [6, 7, 8], // bottom row
  [0, 3, 6], // left col
  [1, 4, 7], // middle col
  [2, 5, 8], // right col
  [0, 4, 8], // diagonal
  [2, 4, 6], // anti-diagonal
];

// Cell states
export const EMPTY = 0;
export const PLAYER_HUMAN = 1;  //  — blue
export const PLAYER_AI = 2;     //  — red/orange

export function createInitialState() {
  return {
    board: Array(9).fill(EMPTY),
    currentPlayer: PLAYER_HUMAN,
    phase: 'placement', // 'placement' | 'movement' | 'finished'
    piecesPlaced: { [PLAYER_HUMAN]: 0, [PLAYER_AI]: 0 },
    winner: null,
    selectedPiece: null, // for movement phase UI
    winLine: null,
  };
}

export function cloneState(state) {
  return {
    board: [...state.board],
    currentPlayer: state.currentPlayer,
    phase: state.phase,
    piecesPlaced: { ...state.piecesPlaced },
    winner: state.winner,
    selectedPiece: state.selectedPiece,
    winLine: state.winLine ? [...state.winLine] : null,
  };
}

export function checkWinner(board) {
  for (const line of WIN_LINES) {
    const [a, b, c] = line;
    if (board[a] !== EMPTY && board[a] === board[b] && board[b] === board[c]) {
      return { winner: board[a], line };
    }
  }
  return null;
}

export function getPhase(piecesPlaced) {
  return (piecesPlaced[PLAYER_HUMAN] >= 3 && piecesPlaced[PLAYER_AI] >= 3)
    ? 'movement'
    : 'placement';
}

/**
 * Get all valid moves for a player in the current state.
 * Returns array of moves:
 *   Placement: { type: 'place', to }
 *   Movement: { type: 'move', from, to }
 */
export function getValidMoves(state, player = state.currentPlayer) {
  const moves = [];
  
  if (state.phase === 'placement') {
    for (let i = 0; i < 9; i++) {
      if (state.board[i] === EMPTY) {
        moves.push({ type: 'place', to: i });
      }
    }
  } else if (state.phase === 'movement') {
    for (let i = 0; i < 9; i++) {
      if (state.board[i] === player) {
        for (const adj of ADJACENCY[i]) {
          if (state.board[adj] === EMPTY) {
            moves.push({ type: 'move', from: i, to: adj });
          }
        }
      }
    }
  }
  
  return moves;
}

/**
 * Apply a move to a state (returns new state, does not mutate).
 */
export function applyMove(state, move) {
  const next = cloneState(state);
  
  if (move.type === 'place') {
    next.board[move.to] = state.currentPlayer;
    next.piecesPlaced[state.currentPlayer]++;
    next.phase = getPhase(next.piecesPlaced);
  } else if (move.type === 'move') {
    next.board[move.to] = next.board[move.from];
    next.board[move.from] = EMPTY;
  }
  
  const result = checkWinner(next.board);
  if (result) {
    next.winner = result.winner;
    next.winLine = result.line;
    next.phase = 'finished';
  } else {
    // Check for stalemate (no moves for opponent)
    const opponent = state.currentPlayer === PLAYER_HUMAN ? PLAYER_AI : PLAYER_HUMAN;
    next.currentPlayer = opponent;
    
    if (next.phase === 'movement') {
      const opponentMoves = getValidMoves(next, opponent);
      if (opponentMoves.length === 0) {
        // Opponent can't move — current player wins
        next.winner = state.currentPlayer;
        next.phase = 'finished';
      }
    }
  }
  
  next.selectedPiece = null;
  return next;
}

/**
 * Format a move for display
 */
export function formatMove(move) {
  const posNames = ['0', '1', '2', '3', '4', '5', '6', '7', '8'];
  if (move.type === 'place') {
    return `Place → ${posNames[move.to]}`;
  }
  return `${posNames[move.from]} → ${posNames[move.to]}`;
}
