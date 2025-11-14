// src/websocket/websocket.gateway.ts
import {WebSocketGateway,WebSocketServer,OnGatewayConnection,OnGatewayDisconnect,SubscribeMessage,MessageBody,ConnectedSocket,} from '@nestjs/websockets';
import { WebSocket } from 'ws';
import { WebsocketService } from './websocket.service';

@WebSocketGateway({ path: '/ws', cors: true })
export class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
	@WebSocketServer() server: WebSocket.Server;

	constructor(private websocketService: WebsocketService) { }

	handleConnection(client: WebSocket) {
		console.log(' Client connected');
		// authenticate here 
	}

	handleDisconnect(client: WebSocket) {
		console.log('Client disconnected');
		this.websocketService.removeClient(client);
	}

	// client registers themselves (driver or rider)
	@SubscribeMessage('register')
	handleRegister(
		@MessageBody() data: { userId: string; role: string },
		@ConnectedSocket() client: WebSocket,
	) {
		console.log(`Registered: ${data.userId} (${data.role})`);
		this.websocketService.registerClient(data.userId, data.role, client);
	}


	notifyDrivers(ride: any) {
		const drivers = this.websocketService.getAllDrivers();
		drivers.forEach((driverClient) => {
			driverClient.send(
				JSON.stringify({
					event: 'new_ride',
					data: ride,
				}),
			);
		});
	}

	
	// Example for chat
	@SubscribeMessage('chat')
	handleChat(@MessageBody() message: any, @ConnectedSocket() client: WebSocket) {
		this.websocketService.broadcastToAll({
			event: 'chat',
			data: message,
		});
	}
}
