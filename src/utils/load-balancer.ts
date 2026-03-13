/** Load Balancing */
export const loadBalancer = { addNode: (node: string) => true, removeNode: (node: string) => true, route: () => 'node-1' };