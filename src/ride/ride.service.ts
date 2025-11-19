// ride.service.ts
import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId, Types } from 'mongoose';
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


	async createRide(dto: CreateRideDto, rid: string) {

		console.log("check 2")

		const id = new Types.ObjectId(rid);

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

		// here is error
			await this.wsService.(dto.pickupLocation, ride);


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


			// here is error
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



	private getDistanceInMeters(lat1, lon1, lat2, lon2) {
	const R = 6371000; // radius of Earth in meters
	const toRad = (value) => (value * Math.PI) / 180;

	const dLat = toRad(lat2 - lat1);
	const dLon = toRad(lon2 - lon1);

	const a =
		Math.sin(dLat / 2) ** 2 +
		Math.cos(toRad(lat1)) *
		Math.cos(toRad(lat2)) *
		Math.sin(dLon / 2) ** 2;

	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

	return R * c; 
}

	async startRide(rideId: string, dId: string) {
		try {
			// Fetch ride + driver location
			const id = new Types.ObjectId(rideId)	
			const ride = await this.rideModel.findById(rideId);
			if (!ride) throw new HttpException("Ride not found", 404);

			const driver = await this.driverModel.findById(dId);
			if (!driver) throw new HttpException("Driver not found", 404);

			// pickup coordinates from ride

			const pickupLat = ride.pickupLocation.lat;
			const pickupLng = ride.pickupLocation.lng;
			

			// driver live location

			const driverLat = ride.driverLocation.lat
			const driverLng = ride.driverLocation.lng
			// const { lat: driverLat, lng: driverLng } = driver.currentLocation;

			// calculate distance
			const distance = this.getDistanceInMeters(
				driverLat,
				driverLng,
				pickupLat,
				pickupLng
			);

			// check threshold
			if (distance > 100) {
				throw new HttpException(
					`Driver is too far from pickup location: ${Math.round(distance)}m`,
					400
				);
			}

			// update ride status
			const updatedRide = await this.rideModel.findOneAndUpdate(
				{ _id: rideId, userId: dId },
				{ $set: { rideStatus: "in_progress" } },
				{ new: true }
			);

			return {
				success: true,
				ride: updatedRide
			};

		} catch (error) {
			console.log(error);
			throw error instanceof HttpException
				? error
				: new HttpException("Internal Server Error - starting ride", 500);
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

	async 	cancelRide(id: string, Uid: ObjectId) {
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



