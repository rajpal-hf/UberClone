// ride.service.ts
import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Ride, RideDocument } from './schema/ride.schema';
import {  CreateRideDto } from './dto/ride.dto';
import { Auth, AuthDocument } from 'src/auth/schema/auth.schema';
import { RideCancelBy, UserRole } from 'src/common/constants';
import { Driver, DriverDocument } from 'src/driver/schema/driver.schema';
import { WebsocketService } from 'src/websocket/websocket.service';


@Injectable()
export class RideService {
	constructor(
		@InjectModel(Ride.name) private rideModel: Model<RideDocument>,
		@InjectModel(Auth.name) private authModel: Model<AuthDocument>,
		@InjectModel(Driver.name) private driverModel: Model<DriverDocument>,
		private readonly wsService: WebsocketService
	) { }

	async createRide(dto: CreateRideDto, id: ObjectId) {
		try {
			const existingRide = await this.rideModel.findOne({
				riderId: id,
				rideStatus: { $in: ['pending', 'accepted', 'in_progress'] },
			});

			if (existingRide) {
				throw new HttpException('User already has an active ride.', 400);
			}


			const ride = await this.rideModel.create({
				...dto,
				riderId: id,
				rideStatus: 'pending',
				createdAt: new Date(),
			});

		
			await this.wsService.notifyDriversNearby(dto.pickupLocation, ride);

			return {
				success: true,
				ride
			}

		} catch (error) {
			console.log(error)
			throw error instanceof HttpException ? error :
				new HttpException("Internal Server Error - creating ride", 500);
		}
	}




	async getRides(id: string) {
		// get all rides with status - pending 

		try {
			const rides = await this.rideModel.find({ id: id, rideStatus: 'pending' })
			return {
				success: true,
				rides
			}
		}
		catch (error) {
			console.log(error)
			throw error instanceof HttpException ? error : new HttpException("Internal Server Error - creating ride", 500)
		}
	}



	
	async acceptRide(rideId: string, dId: string) {

		try {

			const ride = await this.rideModel.findOneAndUpdate(
				{
					_id: rideId,
					driverId: { $exists: false }
				},
				{
					$set: {
						driverId: dId,
						rideStatus: 'accepted'
					}
				},
				{ new: true }
			);

			if (!ride) {
				throw new HttpException('Ride not found or already taken', 404);
			}

			this.wsService.sendToUser(
				ride.riderId.toString(),
				"ride_accepted",
				ride
			);

			// 🔥 Notify all drivers that ride is taken
			this.wsService.broadcast("ride_taken", { rideId });

			return {
				success: true,
				ride
			}

		} catch (error) {
			console.log(error)
			throw error instanceof HttpException ? error :
				new HttpException("Internal Server Error - accepting ride", 500)
		}
	}




	async startRide(rideId: string, dId: string) {

		// Make sure rider can only start start ride when he within under 100m
		try {

			const ride = await this.rideModel.findOneAndUpdate(
				{ _id: rideId, userId: dId },
				{ $set: { rideStatus: 'in_progress' } },
				{ new: true }
			)

			if (!ride) {
				throw new HttpException('Ride not found', 404);
			}

			return {
				success: true,
				ride
			}

		} catch (error) {
			console.log(error)
			throw error instanceof HttpException ? error :
				new HttpException("Internal Server Error - accepting ride", 500)
		}

	}

	async completeRide(rideId: string, dId: string) {
		try {
			const ride = await this.rideModel.findOneAndUpdate(
				{ _id: rideId, userId: dId },
				{ $set: { rideStatus: 'completed' } },
				{ new: true }
			)

			if (!ride) {
				throw new HttpException('Ride not found', 404);
			}

			return {
				success: true,
				ride
			}

		} catch (error) {
			console.log(error)
			throw error instanceof HttpException ? error :
				new HttpException("Internal Server Error - accepting ride", 500)
		}

	}

	async cancelRide(id: string, Uid: ObjectId) {
		const rideId = id
		console.log("riderId kya hai ji", rideId)
		try {
			const user = await this.authModel.findById(Uid);
			const userRole = user?.role

			if (!userRole) {
				throw new HttpException('User not found', 404);
			}

			if (userRole === UserRole.RIDER) {
				await this.rideModel.findOneAndUpdate(
					{ _id: rideId },
					{ $set: { rideStatus: 'cancelled', userId: null, cancelBy: RideCancelBy.RIDER } },

				);
			}
			if (userRole === UserRole.DRIVER) {
				await this.rideModel.findOneAndUpdate(
					{ _id: rideId },
					{ $set: { rideStatus: 'cancelled', userId: Uid, cancelBy: RideCancelBy.DRIVER } },

				);
			}

			return {
				success: true,
				message: "Ride Cancelled"
			}


		}
		catch (error) {
			console.log(error)
			throw error instanceof HttpException ? error : new HttpException("Internal Server Error - creating ride", 500)
		}

	}

}

	// async acceptRide(rideId: string, userId: string) {
	// 	const ride = await this.rideModel.findById(rideId);
	// 	if (!ride) throw new NotFoundException('Ride not found');
	// 	ride.userId = userId;
	// 	ride.status = 'accepted';
	// 	ride.startTime = new Date();
	// 	return ride.save();
	// }

	// async completeRide(rideId: string) {
	// 	const ride = await this.rideModel.findById(rideId);
	// 	if (!ride) throw new NotFoundException('Ride not found');

	// 	ride.endTime = new Date();
	// 	ride.status = 'completed';


	// 	const distance = await this.calculateDistance(
	// 		ride.pickupLocation,
	// 		ride.dropoffLocation
	// 	);
	// 	ride.distance = distance;
	// 	ride.fare = calculateFare(distance);

	// 	return ride.save();
	// }

	// async getRide(id: string) {
	// 	return this.rideModel.findById(id);
	// }

	// private async calculateDistance(pickup, dropoff): Promise<number> {
	// 	const R = 6371; 
	// 	const dLat = ((dropoff.lat - pickup.lat) * Math.PI) / 180;
	// 	const dLng = ((dropoff.lng - pickup.lng) * Math.PI) / 180;
	// 	const a =
	// 		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
	// 		Math.cos((pickup.lat * Math.PI) / 180) *
	// 		Math.cos((dropoff.lat * Math.PI) / 180) *
	// 		Math.sin(dLng / 2) *
	// 		Math.sin(dLng / 2);
	// 	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	// 	return R * c;
	// }
// }
