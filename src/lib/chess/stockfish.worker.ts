/* eslint-disable no-restricted-globals */
const isWorkerContext = typeof self !== 'undefined' && typeof window === 'undefined';

if (isWorkerContext) {
  let engine: any = null;

  self.onmessage = (e: MessageEvent) => {
    const message = e.data;

    if (message === 'init') {
      try {
        const origin = self.location.origin;
        console.log('[Stockfish Worker] Initializing with origin:', origin);
        
        // Use full URL for importScripts to avoid path resolution issues
        const scriptUrl = `${origin}/stockfish-18-lite-single.js`;
        console.log('[Stockfish Worker] Importing scripts from:', scriptUrl);
        
        // @ts-ignore
        self.importScripts(scriptUrl);
        
        // @ts-ignore
        if (typeof Stockfish === 'function') {
          console.log('[Stockfish Worker] Stockfish function found, creating module...');
          // @ts-ignore
          const module = Stockfish({
            locateFile: (path: string) => {
              if (path.endsWith('.wasm')) {
                const wasmUrl = `${origin}/stockfish-18-lite-single.wasm`;
                console.log('[Stockfish Worker] Locating WASM at:', wasmUrl);
                return wasmUrl;
              }
              return path;
            }
          });

          if (module && typeof module.then === 'function') {
            console.log('[Stockfish Worker] Module is a Promise, waiting...');
            module.then((instance: any) => {
              console.log('[Stockfish Worker] Engine instance ready');
              engine = instance;
              // Stockfish Emscripten builds usually use onmessage or addMessageListener
              if (typeof engine.addMessageListener === 'function') {
                engine.addMessageListener((msg: string) => self.postMessage(msg));
              } else {
                engine.onmessage = (msg: string) => self.postMessage(msg);
              }
              self.postMessage('ready');
            }).catch((err: any) => {
              console.error('[Stockfish Worker] Module init failed:', err);
              self.postMessage(`error: Module init failed: ${err}`);
            });
          } else {
            console.log('[Stockfish Worker] Module is an instance, ready');
            engine = module;
            if (typeof engine.addMessageListener === 'function') {
              engine.addMessageListener((msg: string) => self.postMessage(msg));
            } else {
              engine.onmessage = (msg: string) => self.postMessage(msg);
            }
            self.postMessage('ready');
          }
        } else {
          console.error('[Stockfish Worker] Stockfish function NOT found after importScripts');
          self.postMessage('error: Stockfish function not found after importScripts');
        }
      } catch (error) {
        console.error('[Stockfish Worker] Critical error during init:', error);
        self.postMessage(`error: ${error instanceof Error ? error.message : String(error)}`);
      }
      return;
    }

    if (engine && typeof message === 'string') {
      engine.postMessage(message);
    }
  };
}
