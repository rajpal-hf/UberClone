import {
	WebSocketGateway,
	WebSocketServer,
	SubscribeMessage,
	ConnectedSocket,
	MessageBody,
} from '@nestjs/websockets';
import { WebSocket } from 'ws';
import { WebsocketService } from './websocket.service';

@WebSocketGateway({ cors: true, path: '/ws' })
export class WebsocketGateway {
	@WebSocketServer() server: WebSocket.Server;

	constructor(private wsService: WebsocketService) { }

	// When client connects
	async handleConnection(client: WebSocket, req: any) {
		const token = new URL(req.url, "http://localhost").searchParams.get("token");
		const user = await this.wsService.validateToken(token!);
		if (!user) return client.close();

		(client as any).userId = user._id.toString();
		(client as any).role = user.role;

		console.log("WS Connected:", user._id);

		// Automatically register
		await this.wsService.registerClient(user._id.toString(), user.role, client);
		client.send(JSON.stringify({ event: "registered", userId: user._id.toString() }));
	}

	@SubscribeMessage("new_ride")
	async newRide(@MessageBody() data, @ConnectedSocket() client: WebSocket) {
		await this.wsService.broadcastNewRide(data);
	}

	// Driver updates location
	@SubscribeMessage("driver_location")
	async driverLocation(@MessageBody() location, @ConnectedSocket() client: WebSocket) {
		
		await this.wsService.updateDriverLocation(client, location);
	}

	// Driver accepts ride
	@SubscribeMessage("accept_ride")
	async acceptRide(@MessageBody() data, @ConnectedSocket() client: WebSocket) {
		await this.wsService.acceptRide(data.rideId, client);
	}
}





// import {
//   WebSocketGateway,
//   WebSocketServer,
//   SubscribeMessage,
//   ConnectedSocket,
//   MessageBody,
//   OnGatewayConnection,
//   OnGatewayDisconnect,
// } from '@nestjs/websockets';
// import { WebSocket } from 'ws';
// import { WebsocketService } from './websocket.service';

// @WebSocketGateway({ cors: true, path: '/ws' })
// export class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
//   @WebSocketServer() server: WebSocket.Server;

//   constructor(private wsService: WebsocketService) {}

  
//   // 🔥 Step 1: CONNECTION
//   async handleConnection(client: WebSocket, req: any) {
//     const token = new URL(req.url, "http://localhost").searchParams.get("token");

//     const user = await this.wsService.validateToken(token!);
//     if (!user) return client.close();

//     // temporary attach
//     (client as any).userId = user._id.toString();
//     (client as any).role = user.role;

//     console.log("WS Connected →", user._id);
//   }


//   // 🔥 Step 2: DISCONNECT
//   async handleDisconnect(client: WebSocket) {
//     await this.wsService.unregisterClient(client);
//   }


//   // 🔥 Step 3: Final Registration
//   @SubscribeMessage("register")
//   async register(@MessageBody() _, @ConnectedSocket() client: WebSocket) {
//     const { userId, role } = client as any;
//     await this.wsService.registerClient(userId, role, client);

//     client.send(JSON.stringify({ event: "registered", userId }));
// 	}
	
// 	@SubscribeMessage("new_ride")
// 	async newRide(@MessageBody() data, @ConnectedSocket() client: WebSocket) {
// 		// Rider has created a ride and wants to broadcast
// 		const { rideId } = data;

// 		const ride = await this.wsService.getRideById(rideId);
// 		if (!ride) return;

// 		await this.wsService.notifyDriversNearby(ride.pickupLocation, ride);
// 	}


//   // 🔥 Step 4: DRIVER LOCATION UPDATE
//   @SubscribeMessage("driver_location")
//   async driverLocation(@MessageBody() data, @ConnectedSocket() client: WebSocket) {
//     await this.wsService.updateDriverLocation(client, data);
//   }


//   // 🔥 Step 5: RIDE ACCEPT
//   @SubscribeMessage("accept_ride")
//   async acceptRide(@MessageBody() data, @ConnectedSocket() client: WebSocket) {
//     await this.wsService.handleRideAccept(data.rideId, client);
//   }
// }



