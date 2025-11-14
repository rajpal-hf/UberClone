// src/websocket/websocket.service.ts
import { Injectable } from '@nestjs/common';
import { WebSocket } from 'ws';

interface ConnectedUser {
	userId: string;
	role: 'DRIVER' | 'RIDER';
	client: WebSocket;
}

@Injectable()
export class WebsocketService {
	private clients: ConnectedUser[] = [];

	registerClient(userId: string, role: string, client: WebSocket) {
		// remove if already exists (avoid duplicates)
		this.clients = this.clients.filter((c) => c.userId !== userId);
		this.clients.push({ userId, role: role as any, client });
	}

	removeClient(client: WebSocket) {
		this.clients = this.clients.filter((c) => c.client !== client);
	}

	getAllDrivers(): WebSocket[] {
		return this.clients.filter((c) => c.role === 'DRIVER').map((c) => c.client);
	}

	getClientByUserId(userId: string): WebSocket | undefined {
		return this.clients.find((c) => c.userId === userId)?.client;
	}

	broadcastToAll(payload: any) {
		for (const { client } of this.clients) {
			client.send(JSON.stringify(payload));
		}
	}
}
