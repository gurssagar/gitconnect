/** Natural Language Commands */
export const nlpCommands = { parse: (text: string) => ({ action: 'commit', params: {} }), execute: (cmd: string) => true };