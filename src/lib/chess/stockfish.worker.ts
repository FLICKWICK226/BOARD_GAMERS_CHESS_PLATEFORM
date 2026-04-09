/* eslint-disable no-restricted-globals */
const isWorkerContext = typeof self !== 'undefined' && typeof window === 'undefined';

if (isWorkerContext) {
  let engine: any = null;

  self.onmessage = (e: MessageEvent) => {
    const message = e.data;

    if (message === 'init') {
      try {
        console.log('[Stockfish Worker] Initializing...');
        // @ts-ignore
        self.importScripts('/stockfish-18-lite-single.js');
        
        // @ts-ignore
        if (typeof Stockfish === 'function') {
          // @ts-ignore
          const module = Stockfish({
            locateFile: (path: string) => {
              if (path.endsWith('.wasm')) {
                return '/stockfish-18-lite-single.wasm';
              }
              return path;
            }
          });

          // Handle both promise-based and object-based initialization
          if (module && typeof module.then === 'function') {
            module.then((instance: any) => {
              engine = instance;
              engine.onmessage = (msg: string) => self.postMessage(msg);
              self.postMessage('ready');
            }).catch((err: any) => {
              self.postMessage(`error: Module init failed: ${err}`);
            });
          } else {
            engine = module;
            engine.onmessage = (msg: string) => self.postMessage(msg);
            self.postMessage('ready');
          }
        } else {
          self.postMessage('error: Stockfish function not found after importScripts');
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
