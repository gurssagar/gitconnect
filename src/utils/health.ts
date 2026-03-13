/** Health Checks */
export const healthCheck = { check: () => ({ status: 'healthy', timestamp: new Date().toISOString() }) };