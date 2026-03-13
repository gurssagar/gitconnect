/** Error Tracking */
export const errorTracker = { capture: (err: Error) => console.error('[ERROR]', err.message) };