/** Multi-tenant Support */
export const multiTenant = { createTenant: (id: string) => ({ id }), getTenant: (id: string) => ({ id }), listTenants: () => [] };