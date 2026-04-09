import { useEffect, useRef, useState, useCallback } from 'react';

export type EngineLevel = 'beginner' | 'intermediate' | 'expert';

interface UseStockfishProps {
  level: EngineLevel;
  onBestMove?: (move: string) => void;
  mock?: boolean;
}

const LEVEL_CONFIG = {
  beginner: { skill: 0, depth: 5 },
  intermediate: { skill: 10, depth: 10 },
  expert: { skill: 20, depth: 15 },
};

export function useStockfish({ level, onBestMove, mock = false }: UseStockfishProps) {
  const workerRef = useRef<Worker | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [thinking, setThinking] = useState(false);

  // Mock Engine for "Basic State" testing
  const runMockEngine = useCallback((fen: string) => {
    setThinking(true);
    // Simulate thinking delay
    setTimeout(() => {
      // Very dumb mock: just something to show it works
      // In a real mock, we could use a simple heuristic or random move
      console.log('Mock engine finding move for:', fen);
      onBestMove?.('e2e4'); // Placeholder
      setThinking(false);
    }, 1000);
  }, [onBestMove]);

  useEffect(() => {
    if (mock) {
      setIsReady(true);
      return;
    }

    const worker = new Worker(new URL('../lib/chess/stockfish.worker.ts', import.meta.url));
    workerRef.current = worker;

    worker.onmessage = (e) => {
      const msg = e.data;
      if (typeof msg !== 'string') return;

      if (msg === 'ready') {
        setIsReady(true);
        // Initialize engine settings
        const config = LEVEL_CONFIG[level];
        worker.postMessage('uci');
        worker.postMessage(`setoption name Skill Level value ${config.skill}`);
        worker.postMessage('isready');
      } else if (msg.startsWith('bestmove')) {
        const move = msg.split(' ')[1];
        onBestMove?.(move);
        setThinking(false);
      } else if (msg.includes('error')) {
        console.error('Stockfish Worker Error:', msg);
      }
    };

    worker.postMessage('init');

    return () => {
      worker.terminate();
    };
  }, [level, onBestMove, mock]);

  const findBestMove = useCallback((fen: string) => {
    if (mock) {
      runMockEngine(fen);
      return;
    }

    if (!workerRef.current || !isReady) return;

    setThinking(true);
    const config = LEVEL_CONFIG[level];
    workerRef.current.postMessage(`position fen ${fen}`);
    workerRef.current.postMessage(`go depth ${config.depth}`);
  }, [isReady, level, mock, runMockEngine]);

  const stop = useCallback(() => {
    if (mock) return;
    workerRef.current?.postMessage('stop');
    setThinking(false);
  }, [mock]);

  return {
    isReady,
    thinking,
    findBestMove,
    stop,
  };
}
