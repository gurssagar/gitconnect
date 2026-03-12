/**
 * REST API for GitConnect
 * Provides programmatic access to GitConnect functionality
 */

import * as http from 'http';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { ConfigManager } from '../core/config';

export interface APIServerOptions {
  port?: number;
  host?: string;
}

export class GitConnectAPI {
  private server: http.Server | null = null;
  private config: ConfigManager;
  private port: number;
  private host: string;

  constructor(options: APIServerOptions = {}) {
    this.config = new ConfigManager();
    this.port = options.port || 3777;
    this.host = options.host || 'localhost';
  }

  /**
   * Start the API server
   */
  async start(): Promise<void> {
    this.server = http.createServer((req, res) => {
      this.handleRequest(req, res);
    });

    return new Promise((resolve, reject) => {
      this.server!.listen(this.port, this.host, () => {
        console.log(`GitConnect API running at http://${this.host}:${this.port}`);
        resolve();
      });
      this.server!.on('error', reject);
    });
  }

  /**
   * Stop the API server
   */
  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => resolve());
      } else {
        resolve();
      }
    });
  }

  /**
   * Handle incoming requests
   */
  private async handleRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    const url = req.url || '/';
    const method = req.method || 'GET';

    res.setHeader('Content-Type', 'application/json');

    try {
      // CORS headers
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      if (method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }

      // Routes
      if (url === '/api/accounts' && method === 'GET') {
        await this.getAccounts(res);
      } else if (url === '/api/status' && method === 'GET') {
        await this.getStatus(res);
      } else if (url.match(/^\/api\/accounts\/[\w-]+$/) && method === 'GET') {
        const id = url.split('/').pop()!;
        await this.getAccount(res, id);
      } else if (url === '/api/projects' && method === 'GET') {
        await this.getProjects(res);
      } else {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Not found' }));
      }
    } catch (error) {
      res.writeHead(500);
      res.end(JSON.stringify({ error: (error as Error).message }));
    }
  }

  private async getAccounts(res: http.ServerResponse): Promise<void> {
    const accounts = await this.config.getAccounts();
    // Mask sensitive data
    const safe = accounts.map(a => ({
      id: a.id,
      username: a.username,
      email: a.email,
      platform: a.platform,
      createdAt: a.createdAt,
    }));
    res.writeHead(200);
    res.end(JSON.stringify({ accounts: safe }));
  }

  private async getAccount(res: http.ServerResponse, id: string): Promise<void> {
    const account = await this.config.getAccount(id);
    if (!account) {
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Account not found' }));
      return;
    }
    res.writeHead(200);
    res.end(JSON.stringify({
      id: account.id,
      username: account.username,
      email: account.email,
      platform: account.platform,
      createdAt: account.createdAt,
    }));
  }

  private async getProjects(res: http.ServerResponse): Promise<void> {
    const projects = await this.config.getProjects();
    res.writeHead(200);
    res.end(JSON.stringify({ projects }));
  }

  private async getStatus(res: http.ServerResponse): Promise<void> {
    const initialized = await this.config.isInitialized();
    const accounts = await this.config.getAccounts();
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'ok',
      initialized,
      accountCount: accounts.length,
    }));
  }
}

export const apiServer = new GitConnectAPI();