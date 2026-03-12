/**
 * Mobile Companion App Integration
 */

export const mobileApp = {
  /**
   * Generate QR code for mobile pairing
   */
  generatePairingQR(): string {
    return 'qr-code-data-for-mobile-pairing';
  },

  /**
   * Check if mobile app connected
   */
  isConnected(): boolean {
    return false;
  },

  /**
   * Get mobile API endpoint
   */
  getEndpoint(): string {
    return 'http://localhost:3777/mobile';
  },
};