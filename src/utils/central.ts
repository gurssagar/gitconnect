/**
 * Centralized Account Management Server
 */

import * as http from 'http';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

export interface CentralServerOptions {
  port?: number;
  dataDir?: string;
}

export class CentralServer {
  private server: http.Server | null = null;
  private port: number;
  private dataDir: string;

  constructor(options: CentralServerOptions = {}) {
    this.port = options.port || 3888;
    this.dataDir = options.dataDir || path.join(os.homedir(), '.gitconnect', 'central');
  }

  async start(): Promise<void> {
    await fs.mkdir(this.dataDir, { recursive: true });
    this.server = http.createServer((req, res) => this.handleRequest(req, res));
    return new Promise((resolve) => {
      this.server!.listen(this.port, () => {
        console.log(`Central server running on port ${this.port}`);
        resolve();
      });
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve) => { this.server?.close(() => resolve()) || resolve(); });
  }

  private async handleRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    res.setHeader('Content-Type', 'application/json');
    const url = req.url || '/';
    try {
      if (url === '/health') { res.writeHead(200); res.end(JSON.stringify({ status: 'ok' })); }
      else if (url === '/accounts') { const data = await fs.readFile(path.join(this.dataDir, 'accounts.json'), 'utf-8').catch(() => '[]'); res.writeHead(200); res.end(data); }
      else { res.writeHead(404); res.end(JSON.stringify({ error: 'Not found' })); }
    } catch (e) { res.writeHead(500); res.end(JSON.stringify({ error: (e as Error).message })); }
  }
}