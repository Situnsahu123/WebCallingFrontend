/**
 * Polyfills for Node.js globals required by libraries like simple-peer.
 */
(window as any).process = {
  env: { DEBUG: undefined },
  version: '',
  nextTick: (fn: any) => setTimeout(fn, 0),
};
