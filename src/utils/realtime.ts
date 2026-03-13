/**
 * Real-time Collaboration Mode
 * Enable real-time collaboration between team members
 */

import { EventEmitter } from 'events';

export interface CollaborationSession {
  id: string;
  name: string;
  owner: string;
  participants: Participant[];
  createdAt: string;
}

export interface Participant {
  id: string;
  name: string;
  email: string;
  status: 'online' | 'away' | 'offline';
}

export interface CollaborationEvent {
  type: 'account-switch' | 'commit' | 'push' | 'branch' | 'config-change';
  userId: string;
  timestamp: string;
  data: Record<string, unknown>;
}

class RealtimeCollaboration extends EventEmitter {
  sessions: Map<string, CollaborationSession> = new Map();
  currentSession: CollaborationSession | null = null;

  createSession(name: string, owner: Participant): CollaborationSession {
    const session: CollaborationSession = {
      id: `session-${Date.now()}`,
      name,
      owner: owner.id,
      participants: [owner],
      createdAt: new Date().toISOString(),
    };
    this.sessions.set(session.id, session);
    return session;
  }

  joinSession(sessionId: string, participant: Participant): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;
    session.participants.push(participant);
    this.emit('participant-joined', { sessionId, participant });
    return true;
  }

  leaveSession(sessionId: string, participantId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;
    session.participants = session.participants.filter(p => p.id !== participantId);
    this.emit('participant-left', { sessionId, participantId });
    return true;
  }

  broadcastEvent(event: CollaborationEvent): void {
    this.emit('event', event);
  }

  getParticipants(sessionId: string): Participant[] {
    return this.sessions.get(sessionId)?.participants || [];
  }

  updateStatus(sessionId: string, participantId: string, status: Participant['status']): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;
    const participant = session.participants.find(p => p.id === participantId);
    if (participant) {
      participant.status = status;
      this.emit('status-changed', { sessionId, participantId, status });
      return true;
    }
    return false;
  }

  shareAccountContext(accountName: string): void {
    if (this.currentSession) {
      this.broadcastEvent({
        type: 'account-switch',
        userId: 'current',
        timestamp: new Date().toISOString(),
        data: { accountName },
      });
    }
  }

  endSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }
}

export const realtimeCollaboration = new RealtimeCollaboration();