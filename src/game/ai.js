/**
 * AI Engine for Tapatan
 * Implements both pure Minimax and Alpha-Beta pruning.
 * Records the decision tree for visualization.
 */

import {
  PLAYER_HUMAN,
  PLAYER_AI,
  EMPTY,
  getValidMoves,
  applyMove,
  checkWinner,
  formatMove,
  WIN_LINES,
} from './tapatan.js';

// ---------- Evaluation ----------

function evaluate(board) {
  const result = checkWinner(board);
  if (result) {
    return result.winner === PLAYER_AI ? 1000 : -1000;
  }
  
  // Heuristic: count partial lines
  let score = 0;
  for (const [a, b, c] of WIN_LINES) {
    const cells = [board[a], board[b], board[c]];
    const aiCount = cells.filter(c => c === PLAYER_AI).length;
    const humanCount = cells.filter(c => c === PLAYER_HUMAN).length;
    
    if (aiCount > 0 && humanCount === 0) {
      score += aiCount === 2 ? 10 : 1;
    } else if (humanCount > 0 && aiCount === 0) {
      score -= humanCount === 2 ? 10 : 1;
    }
  }
  
  // Center control bonus
  if (board[4] === PLAYER_AI) score += 3;
  else if (board[4] === PLAYER_HUMAN) score -= 3;
  
  return score;
}

// ---------- Tree node creation ----------

let nodeIdCounter = 0;

function createTreeNode(state, depth, alpha, beta, move = null, isMaximizing = true) {
  return {
    id: nodeIdCounter++,
    depth,
    alpha,
    beta,
    value: null,
    move,
    isMaximizing,
    pruned: false,
    children: [],
    boardSnapshot: [...state.board],
    player: state.currentPlayer,
    moveLabel: move ? formatMove(move) : 'Racine',
  };
}

// ---------- Pure Minimax ----------

function minimax(state, depth, isMaximizing, maxDepth, treeNode) {
  const result = checkWinner(state.board);
  if (result) {
    const val = result.winner === PLAYER_AI ? (1000 - depth) : (-1000 + depth);
    treeNode.value = val;
    return val;
  }
  if (depth >= maxDepth) {
    const val = evaluate(state.board);
    treeNode.value = val;
    return val;
  }
  
  const moves = getValidMoves(state);
  if (moves.length === 0) {
    const val = evaluate(state.board);
    treeNode.value = val;
    return val;
  }
  
  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      const nextState = applyMove(state, move);
      const childNode = createTreeNode(nextState, depth + 1, -Infinity, Infinity, move, false);
      treeNode.children.push(childNode);
      
      const val = minimax(nextState, depth + 1, false, maxDepth, childNode);
      maxEval = Math.max(maxEval, val);
    }
    treeNode.value = maxEval;
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      const nextState = applyMove(state, move);
      const childNode = createTreeNode(nextState, depth + 1, -Infinity, Infinity, move, true);
      treeNode.children.push(childNode);
      
      const val = minimax(nextState, depth + 1, true, maxDepth, childNode);
      minEval = Math.min(minEval, val);
    }
    treeNode.value = minEval;
    return minEval;
  }
}

// ---------- Alpha-Beta Pruning ----------

function alphaBeta(state, depth, alpha, beta, isMaximizing, maxDepth, treeNode) {
  const result = checkWinner(state.board);
  if (result) {
    const val = result.winner === PLAYER_AI ? (1000 - depth) : (-1000 + depth);
    treeNode.value = val;
    treeNode.alpha = alpha;
    treeNode.beta = beta;
    return val;
  }
  if (depth >= maxDepth) {
    const val = evaluate(state.board);
    treeNode.value = val;
    treeNode.alpha = alpha;
    treeNode.beta = beta;
    return val;
  }
  
  const moves = getValidMoves(state);
  if (moves.length === 0) {
    const val = evaluate(state.board);
    treeNode.value = val;
    treeNode.alpha = alpha;
    treeNode.beta = beta;
    return val;
  }
  
  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      const nextState = applyMove(state, move);
      const childNode = createTreeNode(nextState, depth + 1, alpha, beta, move, false);
      treeNode.children.push(childNode);
      
      const val = alphaBeta(nextState, depth + 1, alpha, beta, false, maxDepth, childNode);
      maxEval = Math.max(maxEval, val);
      alpha = Math.max(alpha, val);
      
      childNode.alpha = alpha;
      childNode.beta = beta;
      
      if (beta <= alpha) {
        // Mark remaining moves as pruned
        const remainingIndex = moves.indexOf(move) + 1;
        for (let i = remainingIndex; i < moves.length; i++) {
          const prunedNode = createTreeNode(
            applyMove(state, moves[i]),
            depth + 1,
            alpha,
            beta,
            moves[i],
            false
          );
          prunedNode.pruned = true;
          prunedNode.value = '✂';
          treeNode.children.push(prunedNode);
        }
        break;
      }
    }
    treeNode.value = maxEval;
    treeNode.alpha = alpha;
    treeNode.beta = beta;
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      const nextState = applyMove(state, move);
      const childNode = createTreeNode(nextState, depth + 1, alpha, beta, move, true);
      treeNode.children.push(childNode);
      
      const val = alphaBeta(nextState, depth + 1, alpha, beta, true, maxDepth, childNode);
      minEval = Math.min(minEval, val);
      beta = Math.min(beta, val);
      
      childNode.alpha = alpha;
      childNode.beta = beta;
      
      if (beta <= alpha) {
        const remainingIndex = moves.indexOf(move) + 1;
        for (let i = remainingIndex; i < moves.length; i++) {
          const prunedNode = createTreeNode(
            applyMove(state, moves[i]),
            depth + 1,
            alpha,
            beta,
            moves[i],
            true
          );
          prunedNode.pruned = true;
          prunedNode.value = '✂';
          treeNode.children.push(prunedNode);
        }
        break;
      }
    }
    treeNode.value = minEval;
    treeNode.alpha = alpha;
    treeNode.beta = beta;
    return minEval;
  }
}

// ---------- Count nodes ----------

function countNodes(node) {
  let count = 1;
  for (const child of node.children) {
    count += countNodes(child);
  }
  return count;
}

function countExploredNodes(node) {
  let count = node.pruned ? 0 : 1;
  for (const child of node.children) {
    count += countExploredNodes(child);
  }
  return count;
}

// ---------- Public API ----------

export function computeAIMove(state, mode = 'alphabeta', maxDepth = 4) {
  nodeIdCounter = 0;
  
  const moves = getValidMoves(state, PLAYER_AI);
  if (moves.length === 0) return null;
  
  // Build tree root
  const rootNode = createTreeNode(state, 0, -Infinity, Infinity, null, true);
  
  let bestMove = moves[0];
  let bestValue = -Infinity;
  
  // Also compute pure minimax node count for comparison
  let minimaxNodeCount = 0;
  
  if (mode === 'minimax') {
    // Pure minimax
    for (const move of moves) {
      const nextState = applyMove(state, move);
      const childNode = createTreeNode(nextState, 1, -Infinity, Infinity, move, false);
      rootNode.children.push(childNode);
      
      const val = minimax(nextState, 1, false, maxDepth, childNode);
      if (val > bestValue) {
        bestValue = val;
        bestMove = move;
      }
    }
    rootNode.value = bestValue;
    minimaxNodeCount = countNodes(rootNode);
  } else {
    // Alpha-Beta
    let alpha = -Infinity;
    let beta = Infinity;
    
    for (const move of moves) {
      const nextState = applyMove(state, move);
      const childNode = createTreeNode(nextState, 1, alpha, beta, move, false);
      rootNode.children.push(childNode);
      
      const val = alphaBeta(nextState, 1, alpha, beta, false, maxDepth, childNode);
      
      if (val > bestValue) {
        bestValue = val;
        bestMove = move;
      }
      alpha = Math.max(alpha, val);
      childNode.alpha = alpha;
      childNode.beta = beta;
      
      if (beta <= alpha) {
        // prune remaining root children
        const remainingIndex = moves.indexOf(move) + 1;
        for (let i = remainingIndex; i < moves.length; i++) {
          const prunedNode = createTreeNode(
            applyMove(state, moves[i]),
            1,
            alpha,
            beta,
            moves[i],
            false
          );
          prunedNode.pruned = true;
          prunedNode.value = '✂';
          rootNode.children.push(prunedNode);
        }
        break;
      }
    }
    rootNode.value = bestValue;
    rootNode.alpha = alpha;
    rootNode.beta = beta;
    
    // Compute pure minimax count for comparison
    const minimaxRoot = createTreeNode(state, 0, -Infinity, Infinity, null, true);
    for (const move of moves) {
      const nextState = applyMove(state, move);
      const childNode = createTreeNode(nextState, 1, -Infinity, Infinity, move, false);
      minimaxRoot.children.push(childNode);
      minimax(nextState, 1, false, maxDepth, childNode);
    }
    minimaxNodeCount = countNodes(minimaxRoot);
  }
  
  const exploredCount = countExploredNodes(rootNode);
  const totalCount = countNodes(rootNode);
  
  return {
    move: bestMove,
    value: bestValue,
    tree: rootNode,
    stats: {
      explored: exploredCount,
      total: totalCount,
      minimaxWouldExplore: minimaxNodeCount,
      pruned: totalCount - exploredCount,
    },
  };
}
