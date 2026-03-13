/** Background Tasks */
export const backgroundTasks = { run: (fn: () => void) => fn, schedule: (fn: () => void, ms: number) => setInterval(fn, ms) };