/**
 * Kubernetes Config Management
 * Manage k8s configs per project/account
 */

import { execSync } from 'child_process';

export const kubernetesManager = {
  async apply(file: string): Promise<boolean> {
    try { execSync(`kubectl apply -f ${file}`, { stdio: 'pipe' }); return true; } catch { return false; }
  },
  async delete(file: string): Promise<boolean> {
    try { execSync(`kubectl delete -f ${file}`, { stdio: 'pipe' }); return true; } catch { return false; }
  },
  async getContexts(): Promise<string[]> {
    try { return execSync('kubectl config get-contexts -o name', { encoding: 'utf-8' }).trim().split('\n'); } catch { return []; }
  },
  async useContext(context: string): Promise<boolean> {
    try { execSync(`kubectl config use-context ${context}`, { stdio: 'pipe' }); return true; } catch { return false; }
  },
  generateDeployment(name: string, image: string): string {
    return `apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${name}
spec:
  replicas: 1
  selector:
    matchLabels:
      app: ${name}
  template:
    metadata:
      labels:
        app: ${name}
    spec:
      containers:
      - name: ${name}
        image: ${image}
        ports:
        - containerPort: 80
`;
  },
};