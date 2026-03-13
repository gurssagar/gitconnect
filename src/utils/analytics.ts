/** Usage Analytics */
export const analytics = { track: (event: string, data?: unknown) => console.log(`[ANALYTICS] ${event}`, data) };