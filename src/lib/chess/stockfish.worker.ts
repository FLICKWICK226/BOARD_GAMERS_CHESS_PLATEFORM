/**
 * Stockfish Web Worker
 * This worker loads the Stockfish engine and communicates via UCI.
 */

// We use self.importScripts to load the Stockfish engine from the public folder
// since Next.js serving it statically.

/* eslint-disable no-restricted-globals */
const isBrowser = typeof window === 'undefined';

if (isBrowser) {
  // We need to keep track of the engine instance
  let engine: any = null;

  self.onmessage = (e: MessageEvent) => {
    const message = e.data;

    if (message === 'init') {
      try {
        // @ts-ignore
        self.importScripts('/stockfish-18-lite-single.js');
        
        // @ts-ignore
        if (typeof Stockfish === 'function') {
          // @ts-ignore
          engine = Stockfish();
          
          engine.onmessage = (msg: string) => {
            self.postMessage(msg);
          };

          self.postMessage('ready');
        } else {
          self.postMessage('error: Stockfish not found in imported script');
        }
      } catch (error) {
        self.postMessage(`error: ${error instanceof Error ? error.message : String(error)}`);
      }
      return;
    }

    if (engine && typeof message === 'string') {
      engine.postMessage(message);
    }
  };
}
