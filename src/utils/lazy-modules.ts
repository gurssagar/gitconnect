/** Lazy Modules */
export const lazyModules = { load: (name: string) => import(name), preload: (names: string[]) => names.map(() => true) };