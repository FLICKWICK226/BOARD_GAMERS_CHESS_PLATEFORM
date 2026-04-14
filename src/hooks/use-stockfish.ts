import { useEffect, useRef, useState, useCallback } from 'react';

export interface EngineLevel {
  category: 'beginner' | 'intermediate' | 'expert';
  skill: number;
  depth: number;
}

interface UseStockfishProps {
  level: EngineLevel;
  onBestMove?: (move: string) => void;
  mock?: boolean;
}

export function useStockfish({ level, onBestMove, mock = false }: UseStockfishProps) {
  const workerRef = useRef<Worker | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Ref so the onmessage handler always has the latest callback without causing re-init
  const onBestMoveRef = useRef(onBestMove);
  onBestMoveRef.current = onBestMove;

  const runMockEngine = useCallback((fen: string) => {
    setThinking(true);
    setTimeout(() => {
      console.log('Mock engine finding move for:', fen);
      onBestMoveRef.current?.('e2e4');
      setThinking(false);
    }, 1000);
  }, []);

  useEffect(() => {
    if (mock) {
      setIsReady(true);
      return;
    }

    setIsReady(false);
    setError(null);

    let worker: Worker;
    try {
      // Load Stockfish directly from /public as a classic worker.
      // This avoids the importScripts() failure that occurs when Next.js/webpack
      // bundles the TypeScript worker as an ES module (where importScripts is unavailable).
      worker = new Worker('/stockfish-18-lite-single.js');
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(`Impossible de charger le moteur: ${msg}`);
      return;
    }
    workerRef.current = worker;

    const timeout = setTimeout(() => {
      setIsReady((currentReady) => {
        if (!currentReady) {
          setError(
            "Le moteur Stockfish met trop de temps à s'initialiser (30s+). " +
            "Vérifiez que stockfish-18-lite-single.js et .wasm sont dans /public."
          );
        }
        return currentReady;
      });
    }, 30000);

    worker.onmessage = (e: MessageEvent) => {
      const line: string = typeof e.data === 'string' ? e.data : '';
      if (!line) return;

      // Engine acknowledges UCI protocol or signals it's ready
      if (line === 'uciok' || line === 'readyok') {
        setIsReady(true);
        setError(null);
        clearTimeout(timeout);
      } else if (line.startsWith('bestmove')) {
        const parts = line.split(' ');
        const move = parts[1];
        if (move && move !== '(none)') {
          onBestMoveRef.current?.(move);
        }
        setThinking(false);
      }
    };

    worker.onerror = (e: ErrorEvent) => {
      console.error('[Stockfish] Worker error:', e.message);
      setError(`Erreur moteur: ${e.message}`);
      clearTimeout(timeout);
    };

    // Start UCI handshake — the engine responds with 'uciok' then 'readyok'
    worker.postMessage('uci');
    worker.postMessage(`setoption name Skill Level value ${level.skill}`);
    worker.postMessage('ucinewgame');
    worker.postMessage('isready');

    return () => {
      clearTimeout(timeout);
      worker.terminate();
      workerRef.current = null;
    };
  }, [level.skill, mock]);

  const findBestMove = useCallback((fen: string) => {
    if (mock) {
      runMockEngine(fen);
      return;
    }
    if (!workerRef.current || !isReady) return;
    setThinking(true);
    workerRef.current.postMessage(`position fen ${fen}`);
    workerRef.current.postMessage(`go depth ${level.depth}`);
  }, [isReady, level.depth, mock, runMockEngine]);

  const stop = useCallback(() => {
    if (mock) return;
    workerRef.current?.postMessage('stop');
    setThinking(false);
  }, [mock]);

  return { isReady, thinking, error, findBestMove, stop };
}
