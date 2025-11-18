import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { WebSocket } from 'ws';
import { WebsocketService } from './websocket.service';

@WebSocketGateway({ cors: true, path: '/ws' })
export class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: WebSocket.Server;

  constructor(private wsService: WebsocketService) {}

  
  // 🔥 Step 1: CONNECTION
  async handleConnection(client: WebSocket, req: any) {
    const token = new URL(req.url, "http://localhost").searchParams.get("token");

    const user = await this.wsService.validateToken(token!);
    if (!user) return client.close();

    // temporary attach
    (client as any).userId = user._id.toString();
    (client as any).role = user.role;

    console.log("WS Connected →", user._id);
  }


  // 🔥 Step 2: DISCONNECT
  async handleDisconnect(client: WebSocket) {
    await this.wsService.unregisterClient(client);
  }


  // 🔥 Step 3: Final Registration
  @SubscribeMessage("register")
  async register(@MessageBody() _, @ConnectedSocket() client: WebSocket) {
    const { userId, role } = client as any;
    await this.wsService.registerClient(userId, role, client);

    client.send(JSON.stringify({ event: "registered", userId }));
  }


  // 🔥 Step 4: DRIVER LOCATION UPDATE
  @SubscribeMessage("driver_location")
  async driverLocation(@MessageBody() data, @ConnectedSocket() client: WebSocket) {
    await this.wsService.updateDriverLocation(client, data);
  }


  // 🔥 Step 5: RIDE ACCEPT
  @SubscribeMessage("accept_ride")
  async acceptRide(@MessageBody() data, @ConnectedSocket() client: WebSocket) {
    await this.wsService.handleRideAccept(data.rideId, client);
  }
}




// // src/websocket/websocket.gateway.ts
// import {WebSocketGateway,WebSocketServer,OnGatewayConnection,OnGatewayDisconnect,SubscribeMessage,MessageBody,ConnectedSocket,} from '@nestjs/websockets';
// import { WebSocket } from 'ws';
// import { WebsocketService } from './websocket.service';

// @WebSocketGateway({ path: '/ws', cors: true })
// export class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
// 	@WebSocketServer() server: WebSocket.Server;

// 	constructor(private websocketService: WebsocketService) { }

// 	handleConnection(client: WebSocket) {
// 		console.log(' Client connected');
// 		// yha pe hoga authentication
// 	}

// 	handleDisconnect(client: WebSocket) {
// 		console.log('Client disconnected');
// 		this.websocketService.removeClient(client);
// 	}

// 	// client registers themselves (driver or rider)
// 	@SubscribeMessage('register')
// 	handleRegister(
// 		@MessageBody() data: { userId: string; role: string },
// 		@ConnectedSocket() client: WebSocket,
// 	) {
// 		console.log(`Registered: ${data.userId} (${data.role})`);
// 		this.websocketService.registerClient(data.userId, data.role, client);
// 	}


// 	notifyDrivers(ride: any) {
// 		const drivers = this.websocketService.getAllDrivers();
// 		drivers.forEach((driverClient) => {
// 			driverClient.send(
// 				JSON.stringify({
// 					event: 'new_ride',
// 					data: ride,
// 				}),
// 			);
// 		});
// 	}

	
// 	// Example for chat
// 	@SubscribeMessage('chat')
// 	handleChat(@MessageBody() message: any, @ConnectedSocket() client: WebSocket) {
// 		this.websocketService.broadcastToAll({
// 			event: 'chat',
// 			data: message,
// 		});
// 	}
// }
