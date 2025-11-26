
// import { Injectable } from "@nestjs/common";
// import { WebSocket } from "ws";
// import * as jwt from "jsonwebtoken";
// import { InjectModel } from "@nestjs/mongoose";
// import { Model } from "mongoose";
// import { Auth } from "src/auth/schema/auth.schema";
// import { Driver } from "src/driver/schema/driver.schema";
// import { Ride } from "src/ride/schema/ride.schema";
// import { DriverStatus } from "src/common/constants";

// @Injectable()
// export class WebsocketService {
// 	private clients = new Map<string, WebSocket>(); // userId -> socket

// 	constructor(
// 		@InjectModel(Auth.name) private authModel: Model<Auth>,
// 		@InjectModel(Driver.name) private driverModel: Model<Driver>,
// 		@InjectModel(Ride.name) private rideModel: Model<Ride>,
// 	) { }


// 	async broadcastNewRide(ride: any) {
// 		const drivers = await this.driverModel.find({ status: DriverStatus.ONLINE });
		

// 		console.log(`Found ${drivers.length} online drivers`);

// 		for (const driver of drivers) {
// 			console.log("driver.userId.toString()", driver.userId.toString());
// 			const socket = this.clients.get(driver.userId.toString());
			

// 			if (!socket) continue;

// 			try {
// 				socket.send(JSON.stringify({
// 					event: "new_ride",
// 					data: {
// 						rideId: ride._id,
// 						pickupLocation: ride.pickupLocation,
// 						dropoffLocation: ride.dropoffLocation,
// 						distance: ride.distance,
// 						fare: ride.fare,
// 					}
// 				}));
// 				console.log(`Broadcasted new ride to driver ${driver.userId}`);
// 			} catch (err) {
// 				console.log("Error sending new_ride to driver", driver.userId, err);
// 			}
// 		}
// 	}

	
// }









// // import { Injectable } from "@nestjs/common";
// // import { WebSocket } from "ws";
// // import * as jwt from "jsonwebtoken";
// // import { InjectModel } from "@nestjs/mongoose";
// // import { Model } from "mongoose";
// // import { Auth } from "src/auth/schema/auth.schema";
// // import { Driver } from "src/driver/schema/driver.schema";
// // import { Ride } from "src/ride/schema/ride.schema";
// // import { DriverStatus } from "src/common/constants";

// // @Injectable()
// // export class WebsocketService {
// // 	private clients = new Map<string, WebSocket>(); // userId -> socket

// // 	constructor(
// // 		@InjectModel(Auth.name) private authModel: Model<Auth>,
// // 		@InjectModel(Driver.name) private driverModel: Model<Driver>,
// // 		@InjectModel(Ride.name) private rideModel: Model<Ride>,
// // 	) { }

// // 	validateToken(token: string) {
// // 		try {
// // 			const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
// // 			return this.authModel.findById(decoded.id);
// // 		} catch {
// // 			return null;
// // 		}
// // 	}

// // 	async registerClient(userId: string, role: string, socket: WebSocket) {
// // 		this.clients.set(userId, socket);
// // 		await this.authModel.findByIdAndUpdate(userId, { isOnline: true });
// // 		console.log("Registered WS client", userId);
// // 	}


// // 	sendToUser(userId: string, event: string, data: any) {
// // 		return this.sendTo(userId, event, data);
// // 	}

// // 	sendTo(userId: string, event: string, data: any) {
// // 		const socket = this.clients.get(userId);
// // 		if (!socket) {
// // 			console.log("sendTo: socket not found for user", userId);
// // 			return;
// // 		}
// // 		try {
// // 			socket.send(JSON.stringify({ event, data }));
// // 		} catch (err) {
// // 			console.log("WS send error to", userId, err);
// // 		}
// // 	}

// // 	broadcast(event: string, data: any) {
// // 		for (const socket of this.clients.values()) {
// // 			try {
// // 				socket.send(JSON.stringify({ event, data }));
// // 			} catch (err) {
// // 				console.log("broadcast send error", err);
// // 			}
// // 		}
// // 	}

// // 	// NEW RIDE → SEND TO ONLINE DRIVERS
// // 	async broadcastNewRide(ride: any) {
// // 		const drivers = await this.driverModel.find({ status: DriverStatus.ONLINE });
		

// // 		console.log(`Found ${drivers.length} online drivers`);

// // 		for (const driver of drivers) {
// // 			console.log("driver.userId.toString()", driver.userId.toString());
// // 			// console.log("driver.userId", driver.userId);
// // 			const socket = this.clients.get(driver.userId.toString());
// // 			// console.log("socket", socket);

// // 			if (!socket) continue;

// // 			try {
// // 				socket.send(JSON.stringify({
// // 					event: "new_ride",
// // 					data: {
// // 						rideId: ride._id,
// // 						pickupLocation: ride.pickupLocation,
// // 						dropoffLocation: ride.dropoffLocation,
// // 						distance: ride.distance,
// // 						fare: ride.fare,
// // 					}
// // 				}));
// // 				console.log(`Broadcasted new ride to driver ${driver.userId}`);
// // 			} catch (err) {
// // 				console.log("Error sending new_ride to driver", driver.userId, err);
// // 			}
// // 		}
// // 	}

// // 	// DRIVER LOCATION
// // 	async updateDriverLocation(socket: WebSocket, location: any) {
// // 		const userId = (socket as any).userId;

// // 		await this.driverModel.updateOne({ userId }, { currentLocation: location });

// // 		// if driver is in a ride → send to rider
// // 		const ride = await this.rideModel.findOne({ driverId: userId, rideStatus: "in_progress" });
// // 		if (ride) {
// // 			this.sendTo(ride.riderId.toString(), "driver_location", location);
// // 		}
// // 	}

// // 	// ACCEPT RIDE
// // 	async acceptRide(rideId: string, client: WebSocket) {
// // 		const driverId = (client as any).userId;

// // 		const ride = await this.rideModel.findOneAndUpdate(
// // 			{ _id: rideId, rideStatus: "pending" },
// // 			{ rideStatus: "accepted", driverId },
// // 			{ new: true }
// // 		);

// // 		if (!ride) return;

// // 		this.sendTo(ride.riderId.toString(), "ride_accepted", ride);

// // 		this.broadcast("ride_taken", { rideId });
// // 	}
// // }




