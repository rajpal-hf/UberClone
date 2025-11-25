import {
	WebSocketGateway,
	WebSocketServer,
	SubscribeMessage,
	ConnectedSocket,
	MessageBody,
} from '@nestjs/websockets';

import { WebSocket } from 'ws';
import * as jwt from 'jsonwebtoken';

import { RideService } from 'src/ride/ride.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Auth, AuthDocument } from 'src/auth/schema/auth.schema';
import { HttpException } from '@nestjs/common';
import { Ride, RideDocument,  } from 'src/ride/schema/ride.schema';

@WebSocketGateway({ cors: true, path: '/ws' })
export class WebsocketGateway {
	@WebSocketServer() server: WebSocket.Server;

	private clients = new Map<string, WebSocket>(); // userId → socket

	constructor(
		private readonly rideService: RideService,
		@InjectModel(Auth.name) private authModel: Model<AuthDocument>,
		@InjectModel(Ride.name) private rideModel : Model<RideDocument>

	) { }


	private async validateToken(token: string) {
		try {
			const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
			return this.authModel.findById(decoded.id);
		} catch {
			return null;
		}
	}

	// ---------------------------------------
	//  ✔ When Client Connects
	// ---------------------------------------
	async handleConnection(client: WebSocket, req: any) {
		const token = new URL(req.url, 'http://localhost').searchParams.get('token');
		const user = await this.validateToken(token!);

		if (!user) return client.close();

		const userId = user._id.toString();

		(client as any).userId = userId;
		(client as any).role = user.role;

		this.clients.set(userId, client);

		console.log('WS Connected:', userId);
	}

	// ---------------------------------------
	//  ✔ When Client Disconnects
	// ---------------------------------------
	handleDisconnect(client: WebSocket) {
		const userId = (client as any).userId;
		if (userId) {
			this.clients.delete(userId);
			console.log('WS Disconnected:', userId);
		}
	}

	// ---------------------------------------
	//  ✔ Emit to specific user
	// ---------------------------------------
	emitToUser(userId: string, event: string, data: any) {
		const client = this.clients.get(userId);
		if (client && client.readyState === WebSocket.OPEN) {
			client.send(JSON.stringify({ event, data }));
		}
	}

	// ---------------------------------------
	//  ✔ Broadcast to all drivers
	// ---------------------------------------
	broadcastToDrivers(event: string, data: any) {
		for (const [id, client] of this.clients) {
			if ((client as any).role === 'DRIVER') {
				if (client.readyState === WebSocket.OPEN) {
					client.send(JSON.stringify({ event, data }));
				}
			}
		}
	}

	// ---------------------------------------
	//  ✔ Broadcast to all riders (rare)
	// ---------------------------------------
	broadcastToRiders(event: string, data: any) {
		for (const [id, client] of this.clients) {
			if ((client as any).role === 'RIDER') {
				if (client.readyState === WebSocket.OPEN) {
					client.send(JSON.stringify({ event, data }));
				}
			}
		}
	}

	// ------------------------------------------------------------------
	// 🚖  REAL TIME EVENT HANDLERS (5 incoming events from clients)
	// ------------------------------------------------------------------


	// ---------------------------------------------------------
	// 1️⃣ Driver Accepts Ride
	// ---------------------------------------------------------
	@SubscribeMessage('ride:accept')
	async handleAccept(
		@MessageBody() data: any,
		@ConnectedSocket() client: WebSocket,
	) {
		const driverId = (client as any).userId;
		const { rideId, lat, lng } = data;

		const result = await this.rideService.acceptRide(rideId, driverId, {
			driverLocation: { lat, lng }
		});

		// notify rider immediately
		this.emitToUser(result.ride.riderId.toString(), 'ride:accepted', result.ride);
	}

	// ---------------------------------------------------------
	// 2️⃣ Driver Starts Ride
	// ---------------------------------------------------------
	@SubscribeMessage('ride:start')
	async handleStart(
		@MessageBody() data: any,
		@ConnectedSocket() client: WebSocket,
	) {
		const driverId = (client as any).userId;
		const { rideId } = data;

		const result = await this.rideService.startRide(rideId, driverId);
		if (!result) {
			throw new HttpException('result not found - socket error', 404);
		};
		if (!result) {
			throw new HttpException('result not found - socket error', 404);
		};

		if (!result.ride) {
			throw new HttpException('result.ride not found - socket error', 404);
		};

		// notify rider
		this.emitToUser(result.ride.riderId.toString(), 'ride:started', result.ride);
	}

	// ---------------------------------------------------------
	// 3️⃣ Driver Live Location → Rider
	// ---------------------------------------------------------
	@SubscribeMessage('driver:location')
	async handleDriverLocation(
		@MessageBody() data: any,
		@ConnectedSocket() client: WebSocket,
	) {
		const driverId = (client as any).userId;

		const { rideId, lat, lng } = data;

		const ride = await this.rideModel.findById(rideId);
		if (!ride) return;

		// send real-time location to rider
		this.emitToUser(ride.riderId.toString(), 'ride:location', { lat, lng });
	}

	
	@SubscribeMessage('ride:cancel')
	async handleCancel(
		@MessageBody() data: any,
		@ConnectedSocket() client: WebSocket,
	) {
		const userId = (client as any).userId;
		const { rideId } = data;

		const result = await this.rideService.cancelRide(rideId, userId);

		const ride = await this.rideModel.findById(rideId);

		// notify both sides
		if (!ride) {
			throw new HttpException('Ride not found', 404);
		}
		this.emitToUser(ride.riderId.toString(), 'ride:cancelled', ride);
		if (ride.driverId)
			this.emitToUser(ride.driverId.toString(), 'ride:cancelled', ride);
	}

	// ---------------------------------------------------------
	// 5️⃣ Complete Ride
	// ---------------------------------------------------------
	@SubscribeMessage('ride:complete')
	async handleComplete(
		@MessageBody() data: any,
		@ConnectedSocket() client: WebSocket,
	) {
		const driverId = (client as any).userId;
		const { rideId, dropoffLocation } = data;

		const result = await this.rideService.completeRide(
			rideId,
			driverId,
			{ dropoffLocation }
		);

		// send final update + payment details
		this.emitToUser(result.ride.riderId.toString(), 'ride:completed', result);
	}
}



// import {
// 	WebSocketGateway,
// 	WebSocketServer,
// 	SubscribeMessage,
// 	ConnectedSocket,
// 	MessageBody,
// } from '@nestjs/websockets';
// import { WebSocket } from 'ws';
// import { WebsocketService } from './websocket.service';

// @WebSocketGateway({ cors: true, path: '/ws' })
// export class WebsocketGateway {
// 	@WebSocketServer() server: WebSocket.Server;

// 	constructor(private wsService: WebsocketService) { }

// 	// When client connects
// 	async handleConnection(client: WebSocket, req: any) {
// 		const token = new URL(req.url, "http://localhost").searchParams.get("token");
// 		const user = await this.wsService.validateToken(token!);
// 		if (!user) return client.close();

// 		(client as any).userId = user._id.toString();
// 		(client as any).role = user.role;

// 		console.log("WS Connected:", user._id);

// 		// Automatically register
// 		await this.wsService.registerClient(user._id.toString(), user.role, client);
// 		client.send(JSON.stringify({ event: "registered", userId: user._id.toString() }));
// 	}

// 	@SubscribeMessage("new_ride")
// 	async newRide(@MessageBody() data, @ConnectedSocket() client: WebSocket) {
// 		await this.wsService.broadcastNewRide(data);
// 	}

// 	// Driver updates location
// 	@SubscribeMessage("driver_location")
// 	async driverLocation(@MessageBody() location, @ConnectedSocket() client: WebSocket) {
		
// 		await this.wsService.updateDriverLocation(client, location);
// 	}

// 	// Driver accepts ride
// 	@SubscribeMessage("accept_ride")
// 	async acceptRide(@MessageBody() data, @ConnectedSocket() client: WebSocket) {
// 		await this.wsService.acceptRide(data.rideId, client);
// 	}
// }
