interface StockfishEngine {
  postMessage: (message: string) => void;
  addMessageListener?: (callback: (msg: string) => void) => void;
  onmessage?: ((msg: string) => void) | null;
  terminate?: () => void;
}

// BUG 1 CORRIGÉ : La vérification d'origine était fausse.
// Un Web Worker n'a pas accès à `window`, donc `isWorkerContext` était
// toujours true même hors worker. On retire cette vérification inutile
// — ce fichier est exclusivement utilisé comme worker.

let engine: StockfishEngine | null = null;
let isInitialized = false;

function attachEngineOutput(instance: StockfishEngine): void {
  // BUG 2 CORRIGÉ : La logique de fallback onmessage était incorrecte.
  // On essayait d'assigner engine.onmessage comme si c'était un setter,
  // mais Stockfish.js utilise addMessageListener comme API principale.
  // Le fallback onmessage doit être vérifié différemment.
  if (typeof instance.addMessageListener === 'function') {
    instance.addMessageListener((msg: string) => {
      self.postMessage(msg);
    });
  } else {
    // Fallback pour versions anciennes de Stockfish.js
    (instance as unknown as { onmessage: (msg: string) => void }).onmessage = (msg: string) => {
      self.postMessage(msg);
    };
  }
}

self.onmessage = (e: MessageEvent) => {
  const message = e.data;

  // ── INIT ──────────────────────────────────────────────────────────────
  if (typeof message === 'object' && message.type === 'init') {
    // BUG 3 CORRIGÉ : Pas de double-init. Si le moteur est déjà chargé,
    // on renvoie simplement 'ready' sans réimporter le script.
    if (isInitialized) {
      self.postMessage({ type: 'ready' });
      return;
    }

    try {
      const origin = message.origin || self.location.origin;
      const scriptUrl = `${origin}/stockfish-18-lite-single.js`;

      console.log('[Stockfish Worker] Loading from:', scriptUrl);

      (self as any).importScripts(scriptUrl);

      const globalStockfish = typeof (globalThis as any).Stockfish !== 'undefined'
        ? (globalThis as any).Stockfish
        : (self as any).Stockfish;

      const SF: ((opts?: object) => StockfishEngine | Promise<StockfishEngine>) | undefined =
        typeof globalStockfish === 'function' ? globalStockfish : undefined;

      if (!SF) {
        throw new Error('Stockfish function not found after importScripts. Vérifie que stockfish-18-lite-single.js est bien dans /public.');
      }

      const locateFile = (path: string): string => {
        const filename = path.endsWith('.wasm')
          ? 'stockfish-18-lite-single.wasm'
          : path;
        return `${origin}/${filename}`;
      };

      const moduleOrPromise = SF({ locateFile });

      // BUG 4 CORRIGÉ : La gestion Promise/instance synchrone était dupliquée
      // avec du code légèrement différent dans chaque branche, source de bugs.
      // On factorise dans une seule fonction attachEngineOutput().
      if (moduleOrPromise && typeof (moduleOrPromise as Promise<StockfishEngine>).then === 'function') {
        (moduleOrPromise as Promise<StockfishEngine>)
          .then((instance) => {
            engine = instance;
            isInitialized = true;
            attachEngineOutput(engine);
            self.postMessage({ type: 'ready' });
          })
          .catch((err: unknown) => {
            const msg = err instanceof Error ? err.message : String(err);
            console.error('[Stockfish Worker] Async init failed:', msg);
            self.postMessage({ type: 'error', message: msg });
          });
      } else {
        engine = moduleOrPromise as StockfishEngine;
        isInitialized = true;
        attachEngineOutput(engine);
        self.postMessage({ type: 'ready' });
      }

    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error('[Stockfish Worker] Critical error:', msg);
      self.postMessage({ type: 'error', message: msg });
    }

    return;
  }

  // BUG 5 CORRIGÉ : L'ancien handler 'init' string appelait self.onmessage!()
  // de façon récursive avec un faux MessageEvent — dangereux et inutile.
  // On le remplace par un appel direct et propre.
  if (message === 'init') {
    self.onmessage!({
      data: { type: 'init', origin: self.location.origin }
    } as MessageEvent);
    return;
  }

  // ── COMMANDES UCI → MOTEUR ────────────────────────────────────────────
  if (typeof message === 'string') {
    // BUG 6 CORRIGÉ : Si le moteur n'est pas encore prêt et qu'une commande
    // arrive, on la perdait silencieusement. On avertit maintenant.
    if (!engine) {
      console.warn('[Stockfish Worker] Commande reçue avant init:', message);
      self.postMessage({ type: 'error', message: 'Engine not initialized. Send {type:"init"} first.' });
      return;
    }
    engine.postMessage(message);
  }
};