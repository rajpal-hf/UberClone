import { Injectable } from "@nestjs/common";
import { WebSocket } from "ws";
import * as jwt from "jsonwebtoken";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Auth } from "src/auth/schema/auth.schema";
import { Driver } from "src/driver/schema/driver.schema";
import { Ride } from "src/ride/schema/ride.schema";
import { DriverStatus } from "src/common/constants";

@Injectable()
export class WebsocketService {
	private clients = new Map<string, WebSocket>(); // userId -> socket

	constructor(
		@InjectModel(Auth.name) private authModel: Model<Auth>,
		@InjectModel(Driver.name) private driverModel: Model<Driver>,
		@InjectModel(Ride.name) private rideModel: Model<Ride>,
	) { }

	validateToken(token: string) {
		try {
			const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
			return this.authModel.findById(decoded.id);
		} catch {
			return null;
		}
	}

	async registerClient(userId: string, role: string, socket: WebSocket) {
		this.clients.set(userId, socket);
		await this.authModel.findByIdAndUpdate(userId, { isOnline: true });
		console.log("Registered WS client", userId);
	}


	sendToUser(userId: string, event: string, data: any) {
		return this.sendTo(userId, event, data);
	}

	sendTo(userId: string, event: string, data: any) {
		const socket = this.clients.get(userId);
		if (!socket) {
			console.log("sendTo: socket not found for user", userId);
			return;
		}
		try {
			socket.send(JSON.stringify({ event, data }));
		} catch (err) {
			console.log("WS send error to", userId, err);
		}
	}

	broadcast(event: string, data: any) {
		for (const socket of this.clients.values()) {
			try {
				socket.send(JSON.stringify({ event, data }));
			} catch (err) {
				console.log("broadcast send error", err);
			}
		}
	}

	// NEW RIDE → SEND TO ONLINE DRIVERS
	async broadcastNewRide(ride: any) {
		const drivers = await this.driverModel.find({ status: DriverStatus.ONLINE });
		

		console.log(`Found ${drivers.length} online drivers`);

		for (const driver of drivers) {
			console.log("driver.userId.toString()", driver.userId.toString());
			// console.log("driver.userId", driver.userId);
			const socket = this.clients.get(driver.userId.toString());
			// console.log("socket", socket);

			if (!socket) continue;

			try {
				socket.send(JSON.stringify({
					event: "new_ride",
					data: {
						rideId: ride._id,
						pickupLocation: ride.pickupLocation,
						dropoffLocation: ride.dropoffLocation,
						distance: ride.distance,
						fare: ride.fare,
					}
				}));
				console.log(`Broadcasted new ride to driver ${driver.userId}`);
			} catch (err) {
				console.log("Error sending new_ride to driver", driver.userId, err);
			}
		}
	}

	// DRIVER LOCATION
	async updateDriverLocation(socket: WebSocket, location: any) {
		const userId = (socket as any).userId;

		await this.driverModel.updateOne({ userId }, { currentLocation: location });

		// if driver is in a ride → send to rider
		const ride = await this.rideModel.findOne({ driverId: userId, rideStatus: "in_progress" });
		if (ride) {
			this.sendTo(ride.riderId.toString(), "driver_location", location);
		}
	}

	// ACCEPT RIDE
	async acceptRide(rideId: string, client: WebSocket) {
		const driverId = (client as any).userId;

		const ride = await this.rideModel.findOneAndUpdate(
			{ _id: rideId, rideStatus: "pending" },
			{ rideStatus: "accepted", driverId },
			{ new: true }
		);

		if (!ride) return;

		this.sendTo(ride.riderId.toString(), "ride_accepted", ride);

		this.broadcast("ride_taken", { rideId });
	}
}




// import { Injectable } from "@nestjs/common";
// import { WebSocket } from "ws";
// import * as jwt from "jsonwebtoken";
// import { InjectModel } from "@nestjs/mongoose";
// import { Model } from "mongoose";
// import { Auth, AuthDocument } from "src/auth/schema/auth.schema";
// import { Driver, DriverDocument } from "src/driver/schema/driver.schema";
// import { Ride, RideDocument } from "src/ride/schema/ride.schema";
// import { DriverStatus } from "src/common/constants";

// @Injectable()
// export class WebsocketService {
//   private clients = new Map<string, WebSocket>(); // userId → wsid

//   constructor(
//     @InjectModel(Auth.name) private authModel: Model<AuthDocument>,
//     @InjectModel(Driver.name) private driverModel: Model<DriverDocument>,
//     @InjectModel(Ride.name) private rideModel: Model<RideDocument>,
//   ) {}

//   // ✔ Validate token
//   async validateToken(token: string) {
//     try {
//       const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
//       return this.authModel.findById(decoded.id);
//     } catch {
//       return null;
//     }
//   }


//   // ✔ Register user socket
//   async registerClient(userId: string, role: string, client: WebSocket) {
//     this.clients.set(userId, client);

//     await this.authModel.findByIdAndUpdate(userId, {
//       socketId: userId,
//       isOnline: true
//     });
// 	}
// 	async getRideById(rideId: string) {
// 		return this.rideModel.findById(rideId);
// 	}



//   // ✔ Disconnect user
//   async unregisterClient(client: WebSocket) {
//     for (const [userId, ws] of this.clients.entries()) {
//       if (ws === client) {
//         this.clients.delete(userId);
//         await this.authModel.findByIdAndUpdate(userId, {
//           socketId: null,
//           isOnline: false
//         });
//       }
//     }
//   }


  
//   sendToUser(userId: string, event: string, data: any) {
//     const client = this.clients.get(userId);
//     if (client) {
//       client.send(JSON.stringify({ event, data }));
//     }
//   }



// 	async notifyDriversNearby(location: any, ride: any) {

// 		console.log("check 3", location, ride)
// 		const drivers = await this.driverModel.find({ status: DriverStatus.ONLINE });
// 		console.log("check 4", drivers)

// 		for (const driver of drivers) {
			
// 			console.log("ladleeeeeeeeeeeeeeeeeeeeeee", driver.userId.toString())
// 			console.log("huuuuuuuuuuuuuuuuuuuuuu", this.clients)
// 			const socket = this.clients.get(driver.userId.toString());
// 			console.log("xxxxxxx", socket	)
// 			if (socket) {
// 				socket.send(JSON.stringify({
// 					event: "new_ride",
// 					data: {
// 						rideId: ride._id,
// 						pickupLocation: ride.pickupLocation,
// 						dropoffLocation: ride.dropoffLocation,
// 						distance: ride.distance || 0,
// 						fare: ride.fare || 0,
// 					}
// 				}));
// 			}
// 		}

// 		console.log("Broadcasted NEW RIDE to", drivers.length, "drivers");
// 	}



//   async updateDriverLocation(client: WebSocket, location: any) {
//     const userId = (client as any).userId;
    
//     await this.driverModel.updateOne(
//       { userId },
//       { currentLocation: location }
//     );

//     // forward to rider if in ride
//     const ride = await this.rideModel.findOne({
//       userId,
//       rideStatus: "in_progress"
//     });

//     if (ride) {
//       this.sendToUser(ride.riderId.toString(), "driver_location", location);
//     }
//   }


//   // ✔ Driver accepts ride
//   async handleRideAccept(rideId: string, client: WebSocket) {
//     const driverId = (client as any).userId;

//     const ride = await this.rideModel.findOneAndUpdate(
//       { _id: rideId, rideStatus: "pending" },
//       { rideStatus: "accepted", userId: driverId },
//       { new: true }
//     );

//     if (!ride) return;

//     // notify rider
//     this.sendToUser(
//       ride.riderId.toString(),
//       "ride_accepted",
//       ride
//     );

//     // notify other drivers
//     this.broadcast("ride_taken", { rideId });
//   }


//   // ✔ Broadcast
//   broadcast(event: string, data: any) {
//     this.clients.forEach(ws => {
//       ws.send(JSON.stringify({ event, data }));
//     });
//   }
// }



