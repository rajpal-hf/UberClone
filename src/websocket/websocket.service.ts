import { Injectable } from "@nestjs/common";
import { WebSocket } from "ws";
import * as jwt from "jsonwebtoken";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Auth } from "src/auth/schema/auth.schema";
import { Driver } from "src/driver/schema/driver.schema";
import { Ride } from "src/ride/schema/ride.schema";

@Injectable()
export class WebsocketService {
  private clients = new Map<string, WebSocket>(); // userId → ws

  constructor(
    @InjectModel(Auth.name) private authModel: Model<Auth>,
    @InjectModel(Driver.name) private driverModel: Model<Driver>,
    @InjectModel(Ride.name) private rideModel: Model<Ride>,
  ) {}

  // ✔ Validate token
  async validateToken(token: string) {
    try {
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
      return this.authModel.findById(decoded.id);
    } catch {
      return null;
    }
  }


  // ✔ Register user socket
  async registerClient(userId: string, role: string, client: WebSocket) {
    this.clients.set(userId, client);

    await this.authModel.findByIdAndUpdate(userId, {
      socketId: userId,
      isOnline: true
    });
  }


  // ✔ Disconnect user
  async unregisterClient(client: WebSocket) {
    for (const [userId, ws] of this.clients.entries()) {
      if (ws === client) {
        this.clients.delete(userId);
        await this.authModel.findByIdAndUpdate(userId, {
          socketId: null,
          isOnline: false
        });
      }
    }
  }


  // ✔ Send message to specific user
  sendToUser(userId: string, event: string, data: any) {
    const client = this.clients.get(userId);
    if (client) {
      client.send(JSON.stringify({ event, data }));
    }
  }


  // ✔ Send ride request to online drivers
  async notifyDriversNearby(location: any, ride: Ride) {
    const drivers = await this.driverModel.find({ status: "ONLINE" });

    drivers.forEach(d => {
      const socket = this.clients.get(d.userId.toString());
      if (socket) {
        socket.send(JSON.stringify({ event: "new_ride", data: ride }));
      }
    });
  }


  // ✔ Driver location updating
  async updateDriverLocation(client: WebSocket, location: any) {
    const userId = (client as any).userId;
    
    await this.driverModel.updateOne(
      { userId },
      { currentLocation: location }
    );

    // forward to rider if in ride
    const ride = await this.rideModel.findOne({
      userId,
      rideStatus: "in_progress"
    });

    if (ride) {
      this.sendToUser(ride.riderId.toString(), "driver_location", location);
    }
  }


  // ✔ Driver accepts ride
  async handleRideAccept(rideId: string, client: WebSocket) {
    const driverId = (client as any).userId;

    const ride = await this.rideModel.findOneAndUpdate(
      { _id: rideId, rideStatus: "pending" },
      { rideStatus: "accepted", userId: driverId },
      { new: true }
    );

    if (!ride) return;

    // notify rider
    this.sendToUser(
      ride.riderId.toString(),
      "ride_accepted",
      ride
    );

    // notify other drivers
    this.broadcast("ride_taken", { rideId });
  }


  // ✔ Broadcast
  broadcast(event: string, data: any) {
    this.clients.forEach(ws => {
      ws.send(JSON.stringify({ event, data }));
    });
  }
}



// // src/websocket/websocket.service.ts
// import { Injectable } from '@nestjs/common';
// import { WebSocket } from 'ws';

// interface ConnectedUser {
// 	userId: string;
// 	role: 'DRIVER' | 'RIDER';
// 	client: WebSocket;
// }

// @Injectable()
// export class WebsocketService {
// 	private clients: ConnectedUser[] = [];

// 	registerClient(userId: string, role: string, client: WebSocket) {
// 		// remove if already exists (avoid duplicates)
// 		this.clients = this.clients.filter((c) => c.userId !== userId);
// 		this.clients.push({ userId, role: role as any, client });
// 	}

// 	removeClient(client: WebSocket) {
// 		this.clients = this.clients.filter((c) => c.client !== client);
// 	}

// 	getAllDrivers(): WebSocket[] {
// 		return this.clients.filter((c) => c.role === 'DRIVER').map((c) => c.client);
// 	}

// 	getClientByUserId(userId: string): WebSocket | undefined {
// 		return this.clients.find((c) => c.userId === userId)?.client;
// 	}

// 	broadcastToAll(payload: any) {
// 		for (const { client } of this.clients) {
// 			client.send(JSON.stringify(payload));
// 		}
// 	}
// }
