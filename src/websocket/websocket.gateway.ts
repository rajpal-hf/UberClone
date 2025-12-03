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

	private clients = new Map<string, WebSocket>(); 

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

	//  When Client Connects

	async handleConnection(client: WebSocket, req: any) {
		const token = new URL(req.url, 'http://localhost').searchParams.get('token');
		const user = await this.validateToken(token!);

		console.log("clients", this.clients)
		console.log("client", client)

		if (!user) return client.close();

		const userId = user._id.toString();

		(client as any).userId = userId;
		(client as any).role = user.role;

		console.log("client", client)


		this.clients.set(userId, client);

		console.log("this.clients", this.clients.keys())


		console.log('WS Connected:', userId);
	}


	handleDisconnect(client: WebSocket) {
		const userId = (client as any).userId;
		if (userId) {
			this.clients.delete(userId);
			console.log('WS Disconnected:', userId);
		}
	}

	//  Emit to specific user
	emitToUser(userId: string, event: string, data: any) {
		const client = this.clients.get(userId);
		if (client && client.readyState === WebSocket.OPEN) {
			client.send(JSON.stringify({ event, data }));
		}
	}

	//   Broadcast to all drivers
	broadcastToDrivers(event: string, data: any) {
		
		for (const [id, client] of this.clients) {
			if ((client as any).role === 'driver') {
				if (client.readyState === WebSocket.OPEN) {
					client.send(JSON.stringify({ event, data }));
				}
			}
		}
	}



	// ``` client vali side toh ane aa eh
@SubscribeMessage('ride:request')
	async handleRequest(@MessageBody() data: any, @ConnectedSocket() client: WebSocket) {
		const riderId = (client as any).userId;
		const result = await this.rideService.createRide(data, riderId);



		if (!result.success) return;

		// Send ride created response to rider
		this.emitToUser(riderId, "ride:created", {
			rideId: result.ride._id
		});

		// Notify drivers
		this.broadcastToDrivers('new:ride', result.ride);
	}



	// 1 Driver Accepts Ride
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
			// Notify Rider
			this.emitToUser(result.ride.riderId.toString(), 'ride:accepted', result.ride);

			// Notify Driver (important!)
			this.emitToUser(result.ride.driverId!.toString(), 'ride:accepted', result.ride);

		}

	//  Driver Starts Ride
	@SubscribeMessage('ride:start')
	async handleStart(
		@MessageBody() data: any,
		@ConnectedSocket() client: WebSocket,
	) {
		const driverId = (client as any).userId;
		const { rideId } = data;

		const result = await this.rideService.startRide(rideId, driverId);

		console.log("result - start", result )
		
		if (!result) {
			throw new HttpException('result not found - socket error', 404);
		};

		if (!result.ride) {
			throw new HttpException('result.ride not found - socket error', 404);
		};

		// notify rider
		this.emitToUser(result.ride.riderId.toString(), 'ride:started', result.ride);
	}

	//  Driver Live Location → Rider
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

		// const ride = await this.rideModel.findById(rideId);
		const ride = result.ride
		console.log("ride- cancel", ride)

		// notify both sides
		if (!ride) {
			throw new HttpException('Ride not found', 404);
		}
		this.emitToUser(ride.riderId.toString(), 'ride:cancelled', ride);
		
			this.emitToUser(ride.driverId!.toString(), 'ride:cancelled', ride);
	}

	
	@SubscribeMessage('ride:complete')
	async handleComplete(
		@MessageBody() data: any,
		@ConnectedSocket() client: WebSocket,
	) {

		console.log("complete BE call")
		const driverId = (client as any).userId;
		const { rideId, dropoffLocation } = data;

		const result = await this.rideService.completeRide(
			rideId,
			driverId,
			{ dropoffLocation }
		);

		console.log("result - complete", result)

		// send final update + payment details
		this.emitToUser(result.ride.riderId.toString(), 'ride:completed', result.ride);
		this.emitToUser(result.ride.driverId!.toString(), 'ride:completed', result.ride);
	}
}


