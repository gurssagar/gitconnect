/**
 * REST API Versioning
 */
export const apiVersioning = {
  currentVersion: 'v1',
  supportedVersions: ['v1'],
  getVersionedPath(path: string, version?: string): string { return `/api/${version || this.currentVersion}${path}`; },
};