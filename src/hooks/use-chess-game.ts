import { useState, useCallback } from 'react';
import { Chess } from 'chess.js';
import { useStockfish, EngineLevel } from './use-stockfish';
import { useSoundEffects } from './use-sound-effects';

interface UseChessGameProps {
  level: EngineLevel;
  onGameOver?: (result: string) => void;
}

export function useChessGame({ level, onGameOver }: UseChessGameProps) {
  const [game, setGame] = useState(new Chess());
  const { playSound } = useSoundEffects();
  
  // Define onBestMove before useStockfish
  const handleBotMove = useCallback((move: string) => {
    setGame((prevGame) => {
      const newGame = new Chess(prevGame.fen());
      try {
        const result = newGame.move(move);
        if (result) {
          playSound(result.captured ? 'capture' : 'move');
          if (newGame.isGameOver()) {
            onGameOver?.(getGameResult(newGame));
          }
        }
      } catch (_e) {
        console.error('Invalid bot move:', move, _e);
      }
      return newGame;
    });
  }, [onGameOver, playSound]);

  const { findBestMove, thinking, isReady, error: engineError } = useStockfish({
    level,
    onBestMove: handleBotMove,
  });

  const makeMove = useCallback((move: string | { from: string; to: string; promotion?: string }) => {
    if (game.isGameOver() || thinking) return false;

    try {
      const newGame = new Chess(game.fen());
      const result = newGame.move(move);
      
      if (result) {
        setGame(newGame);
        playSound(result.captured ? 'capture' : 'move');

        if (newGame.isGameOver()) {
          onGameOver?.(getGameResult(newGame));
        } else {
          // Trigger bot response
          setTimeout(() => {
            findBestMove(newGame.fen());
          }, 300);
        }
        return true;
      }
    } catch {
      return false;
    }
    return false;
  }, [game, findBestMove, thinking, onGameOver, playSound]);

  const resetGame = useCallback(() => {
    const newGame = new Chess();
    setGame(newGame);
    onGameOver?.('');
  }, [onGameOver]);

  const undoMove = useCallback(() => {
    if (thinking) return;
    setGame((prevGame) => {
      const newGame = new Chess(prevGame.fen());
      newGame.undo(); // Undo bot move
      newGame.undo(); // Undo player move
      return newGame;
    });
  }, [thinking]);

  return {
    game,
    fen: game.fen(),
    moveHistory: game.history(),      // SAN strings: ['e4', 'e5', 'Nf3', ...]
    makeMove,
    resetGame,
    undoMove,
    thinking,
    isReady,
    engineError,
    turn: game.turn(),
    isGameOver: game.isGameOver(),
  };
}

function getGameResult(game: Chess): string {
  if (game.isCheckmate()) return `Checkmate! ${game.turn() === 'w' ? 'Black' : 'White'} wins.`;
  if (game.isDraw()) return 'Draw!';
  if (game.isStalemate()) return 'Stalemate!';
  if (game.isThreefoldRepetition()) return 'Draw by repetition!';
  return 'Game over';
}
