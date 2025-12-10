// ride.service.ts
import { BadRequestException, HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId, Types } from 'mongoose';
import { Ride, RideDocument } from './schema/ride.schema';
import { ActualDropoffDto, CreateRideDto, CreateScheduleRideDto, DriverLocationDto, EstimatedFareDto } from './dto/ride.dto';
import { Auth, AuthDocument } from 'src/auth/schema/auth.schema';
import { RideCancelBy, UserRole, VerficationSTATUS } from 'src/common/constants';
import { Driver, DriverDocument } from 'src/driver/schema/driver.schema';
import { getDistanceInMeters, totalFare, totalTime, typeWiseFare, typeWiseSpeed } from 'src/common/fareCal';
import { verify } from 'crypto';

@Injectable()
export class RideService {
	constructor(
		@InjectModel(Ride.name) private rideModel: Model<RideDocument>,
		@InjectModel(Auth.name) private authModel: Model<AuthDocument>,
		@InjectModel(Driver.name) private driverModel: Model<DriverDocument>,
	) { }

	async createRide(dto: CreateRideDto, rid: string) {

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


	async scheduleRide(dto: CreateScheduleRideDto, userId: string) {

		const scheduledDate = new Date(dto.scheduledFor);
		const now = new Date();


		if (isNaN(scheduledDate.getTime())) {
			throw new BadRequestException("Invalid date format");
		}

		if (scheduledDate <= now) {
			throw new BadRequestException("Scheduled time must be in the future");
		}

		const minGap = 30 * 60 * 1000; // 30min
		if (scheduledDate.getTime() - now.getTime() < minGap) {
			throw new BadRequestException(`Ride must be scheduled at least 30 minutes ahead`);
		}

		const ride = await this.rideModel.create({
			riderId: new Types.ObjectId(userId),
			...dto,
			scheduledFor: scheduledDate,
			status: 'scheduled',
			cronLocked: false,
			reminderSent: false,
			retryCount: 0,
		});

		return {
			message: "Ride scheduled successfully",
			rideId: ride._id,
			scheduledFor: scheduledDate.toISOString(),
		};
	}

	// Get all scheduled rides for a user
	async getScheduledRides(userId: string) {
		try {
			const rides = await this.rideModel
				.find({
					riderId: new Types.ObjectId(userId),
					status: { $in: ['scheduled', 'processing'] },
				})
				.sort({ scheduledFor: 1 })
				.lean();

			return {
				success: true,
				rides,
			};
		} catch (error) {
			console.log(error);
			throw error instanceof HttpException
				? error
				: new HttpException("Internal Server Error - get scheduled rides", 500);
		}
	}

	// Cancel a scheduled ride
	async cancelScheduledRide(rideId: string, userId: string) {
		try {
			const ride = await this.rideModel.findById(rideId);

			if (!ride) {
				throw new NotFoundException("Ride not found");
			}

			// Verify ownership
			if (ride.riderId.toString() !== userId) {
				throw new BadRequestException("Unauthorized to cancel this ride");
			}

			// Can only cancel if still in scheduled or processing state
			if (!['scheduled', 'processing'].includes(ride.status)) {
				throw new BadRequestException(
					`Cannot cancel ride in ${ride.status} status. Only scheduled rides can be cancelled.`
				);
			}

			// Update ride status
			ride.status = 'failed';
			ride.cronLocked = false;
			await ride.save();

			return {
				success: true,
				message: "Scheduled ride cancelled successfully",
				ride,
			};
		} catch (error) {
			console.log(error);
			throw error instanceof HttpException
				? error
				: new HttpException("Internal Server Error - cancel scheduled ride", 500);
		}
	}





	async startRide(rideId: string, dId: string){

		console.log("check 1")
		try {

			console.log("check 2")
			console.log("rideId and dId in startRide", rideId, dId)

			if (!Types.ObjectId.isValid(rideId) || !Types.ObjectId.isValid(dId)) {
				throw new HttpException("Invalid ObjectId format - BE - startRide", 400);
			}
			console.log(typeof rideId , typeof dId)

			const id = new Types.ObjectId(rideId)


			const ride = await this.rideModel.findById(rideId);
			if (!ride) throw new HttpException("Ride not found", 404);


			const driver = await this.driverModel.findOne({ userId: new Types.ObjectId(dId) });
			if (!driver) throw new HttpException("Driver not found", 404);


			// pickup coordinates from ride

			// const pickupLat = ride.pickupLocation.lat;
			// const pickupLng = ride.pickupLocation.lng;


			// // driver live location

			// const driverLat = ride.driverLocation.lat
			// const driverLng = ride.driverLocation.lng

			// const distance = getDistanceInMeters(
			// 	driverLat,
			// 	driverLng,
			// 	pickupLat,
			// 	pickupLng
			// );

			console.log("check 4")

			// check threshold
			// if (distance > 100) {
			// 	throw new HttpException(
			// 		`Driver is too far from pickup location: ${Math.round(distance)}m`,
			// 		400
			// 	);
			// }

			// update ride status


			const rr = await this.rideModel.findById(rideId)
			console.log(" xxx ", rr)
			const updatedRide = await this.rideModel.findOneAndUpdate(
				{ _id: rideId, driverId: new Types.ObjectId(dId) },
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

	// async startRide(rideId: string, driverId: string) {
	// 	try {
	// 		// Find the ride
	// 		const ride = await this.rideModel.findById(rideId);
	// 		console.log("ride found in startRide", ride)
	// 		if (!ride) throw new HttpException("Ride not found", 404);

	// 		// Check if ride is already in progress or completed
	// 		if (ride.rideStatus === "in_progress") {
	// 			throw new HttpException("Ride already in progress", 400);
	// 		}
	// 		if (ride.rideStatus === "completed") {
	// 			throw new HttpException("Ride already completed", 400);
	// 		}

	// 		// Find the driver
	// 		const driver = await this.driverModel.findOne({ userId: new Types.ObjectId(driverId) });
	// 		if (!driver) throw new HttpException("Driver not found", 404);



	// 		// Ensure driver location exists
	// 		if (!ride.driverLocation) {
	// 			throw new HttpException("Driver location unavailable", 400);
	// 		}

	// 		// Calculate distance from driver to pickup location
	// 		const distanceMeters = getDistanceInMeters(
	// 			ride.driverLocation.lat,
	// 			ride.driverLocation.lng,
	// 			ride.pickupLocation.lat,
	// 			ride.pickupLocation.lng
	// 		);

	// 		// Only allow starting if within 100 meters
	// 		if (distanceMeters > 100) {
	// 			throw new HttpException(
	// 				`Driver is too far from pickup location: ${Math.round(distanceMeters)} meters`,
	// 				400
	// 			);
	// 		}


	// 		// Update ride status and startTime
	// 		ride.rideStatus = "in_progress";
	// 		ride.startTime = new Date();
	// 		await ride.save();

	// 		console.log("ride started successfully", ride)

	// 		return {
	// 			success: true,
	// 			ride,
	// 		};
	// 	} catch (error) {
	// 		console.error(error);
	// 		throw error instanceof HttpException
	// 			? error
	// 			: new HttpException("Internal Server Error - starting ride", 500);
	// 	}
	// }


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


	async acceptRide(rideId: string, dId: string, dto: DriverLocationDto) {
		try {
			const ride = await this.rideModel.findOneAndUpdate(
				{
					_id: rideId,
					rideStatus: "pending",
					$or: [
						{ driverId: { $exists: false } },
						{ driverId: null }
					]
				},
				{
					$set: {
						...dto,
						driverId: new Types.ObjectId(dId),
						rideStatus: 'accepted'
					}
				},
				{ new: true }
			);

			if (!ride) {
				throw new HttpException('Ride not found or already taken', 404);
			}



			// Notify all drivers (optional) that ride is taken

			return {
				success: true,
				ride
			};
		} catch (error) {
			console.log(error);
			throw error instanceof HttpException ? error :
				new HttpException("Internal Server Error - accepting ride", 500)
		}
	}


	async completeRide(rideId: string, driverId: string, dto: ActualDropoffDto) {
		try {
			const ride = await this.rideModel.findOne({
				_id: new Types.ObjectId(rideId),
				driverId: new Types.ObjectId(driverId),
			});

			if (!ride) throw new HttpException('Ride not found', 404);

			// Distance + fare
			const distanceMeters = getDistanceInMeters(
				ride.pickupLocation.lat,
				ride.pickupLocation.lng,
				dto.dropoffLocation.lat,
				dto.dropoffLocation.lng
			);

			const rideType = ride.vehicleType;
			const fare = totalFare(rideType, distanceMeters);

			// Update ride details
			ride.actualDropoffLocation = dto.dropoffLocation;
			ride.distance = distanceMeters / 1000;
			ride.fare! > fare ? ride.fare : (ride.fare = fare);
			ride.endTime = new Date();
			ride.rideStatus = "completed";

			await ride.save();
			return {
				success: true,
				ride,
			};

		} catch (error) {
			console.log(error);
			throw error instanceof HttpException
				? error
				: new HttpException("Internal Server Error - completing ride", 500);
		}
	}



	// async completeRide(rideId: string, driverId: string, dto: ActualDropoffDto) {
	// 	try {
	// 		const ride = await this.rideModel.findOne({
	// 			_id: new Types.ObjectId(rideId),
	// 			driverId: new Types.ObjectId(driverId),
	// 		});

	// 		if (!ride) throw new HttpException("Ride not found", 404);

	// 		// ----- EDGE CASE 1: verify ride status -----
	// 		if (ride.rideStatus === "completed")
	// 			throw new HttpException("Ride already completed", 400);

	// 		if (ride.rideStatus === "cancelled")
	// 			throw new HttpException("Cancelled ride cannot be completed", 400);

	// 		if (ride.rideStatus !== "in_progress")
	// 			throw new HttpException(
	// 				`Ride must be in_progress to complete. Current: ${ride.rideStatus}`,
	// 				400
	// 			);

	// 		// ----- EDGE CASE 2: ensure driverLocation exists -----
	// 		if (!ride.driverLocation)
	// 			throw new HttpException(
	// 				"Driver location not available. Cannot verify final proximity.",
	// 				400
	// 			);

	// 		// Distance from pickup → actual dropoff
	// 		const tripDistanceMeters = getDistanceInMeters(
	// 			ride.pickupLocation.lat,
	// 			ride.pickupLocation.lng,
	// 			dto.dropoffLocation.lat,
	// 			dto.dropoffLocation.lng
	// 		);

	// 		// ----- EDGE CASE 3: dropoff too close to pickup -----
	// 		if (tripDistanceMeters < 20)
	// 			throw new HttpException(
	// 				"Dropoff is too close to pickup. Cannot complete ride.",
	// 				400
	// 			);

	// 		// ----- EDGE CASE 4: unrealistic trip distance -----
	// 		if (tripDistanceMeters < 200)
	// 			throw new HttpException(
	// 				"Ride distance too small. Invalid dropoff.",
	// 				400
	// 			);

	// 		const driverDistanceMeters = getDistanceInMeters(
	// 			ride.driverLocation.lat,
	// 			ride.driverLocation.lng,
	// 			dto.dropoffLocation.lat,
	// 			dto.dropoffLocation.lng
	// 		);

	// 		if (driverDistanceMeters > 1000) {
	// 			throw new HttpException(
	// 				`Driver too far from dropoff. Must be under 1000m. Current: ${Math.round(
	// 					driverDistanceMeters
	// 				)}m`,
	// 				400
	// 			);
	// 		}

	// 		const newFare = totalFare(ride.vehicleType, tripDistanceMeters);

	// 		if (!ride.fare || newFare > ride.fare) {
	// 			ride.fare = newFare;
	// 		}

	// 		ride.actualDropoffLocation = dto.dropoffLocation;
	// 		ride.distance = tripDistanceMeters / 1000;
	// 		ride.endTime = new Date();
	// 		ride.rideStatus = "completed";

	// 		await ride.save();

	// 		return {
	// 			success: true,
	// 			ride,
	// 		};

	// 	} catch (error) {
	// 		console.log(error);
	// 		throw error instanceof HttpException
	// 			? error
	// 			: new HttpException(
	// 				"Internal Server Error - completing ride",
	// 				500
	// 			);
	// 	}
	// }




	//```````````````````  cancelRide ```````````````````



	async cancelRide(id: string, Uid: ObjectId) {
		const rideId = id
		console.log("riderId kya hai ji", rideId)
		try {
			const user = await this.authModel.findById(Uid);
			const userRole = user?.role

			if (!userRole) {
				throw new HttpException('User not found', 404);
			}

			const ride = await this.rideModel.findById(rideId)
			if (!ride) {
				throw new HttpException('Ride not found', 404);
			}
			if (ride.rideStatus === 'in_progress' || ride.rideStatus === 'completed') {
				throw new HttpException('Ride is already ' + ride.rideStatus, 400);
			}
			if (userRole === UserRole.RIDER) {
				await this.rideModel.findOneAndUpdate(
					{ _id: rideId },
					{ $set: { rideStatus: 'cancelled', cancelBy: RideCancelBy.RIDER } },
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
				ride,
				message: "Ride Cancelled"
			}
		}
		catch (error) {
			console.log(error)
			throw error instanceof HttpException ? error : new HttpException("Internal Server Error - creating ride", 500)
		}

	}



	//```````````````````  getAcceptedRide ```````````````````


	async getAcceptedOrInProgressRide(rideId: string, req: string) {
		try {
			if (!Types.ObjectId.isValid(rideId) || !Types.ObjectId.isValid(req)) {
				throw new HttpException("Invalid ObjectId format - BE - getRide", 400);
			}

			const riderObjectId = new Types.ObjectId(req);
			const id = new Types.ObjectId(rideId);

			console.log("Request IDs -> Rider:", riderObjectId, "Ride:", id);

			const ride = await this.rideModel
				.findOne({
					_id: id,
					riderId: riderObjectId,
					rideStatus: { $in: ['accepted', 'in_progress'] }
				})
				.populate({ path: 'driverId', select: 'name phone' });

			if (!ride) {
				throw new HttpException('Ride not found - accepted/in_progress', 404);
			}

			return { success: true, ride };
		}
		catch (error) {
			console.log(error);
			throw error instanceof HttpException
				? error
				: new HttpException("Internal Server Error - getting ride", 500);
		}
	}


	async pickupNavigation(rideId: string, req: string) {
		try {
			// Validate incoming parameters
			console.log("rideId and req pickupNavigation", rideId, req)
			console.log("type of rideId pickupNavigation", typeof rideId)

			if (!rideId || typeof rideId !== "string") {
				throw new HttpException("Invalid rideId - BE - pickupNavigation", 400);
			}

			if (!req || typeof req !== "string") {
				throw new HttpException("Invalid driverId - BE - pickupNavigation", 400);
			}

			let id: Types.ObjectId;
			let driverId: Types.ObjectId;

			try {
				id = new Types.ObjectId(rideId);
				driverId = new Types.ObjectId(req);
			} catch (err) {
				throw new HttpException("Invalid ObjectId format - BE - pickupNavigation", 400);
			}


			const ride = await this.rideModel
				.findOne({
					_id: id,
					rideStatus: "accepted",
					driverId: driverId,
				})
				.populate("riderId", "name phone");

			if (!ride) {
				throw new HttpException("Accepted ride not found - BE - pickupNavigation", 404);
			}

			if (!ride.pickupLocation ||
				typeof ride.pickupLocation.lat !== "number" ||
				typeof ride.pickupLocation.lng !== "number") {
				throw new HttpException("Invalid or missing pickup location", 422);
			}

			if (!ride.driverLocation ||
				typeof ride.driverLocation.lat !== "number" ||
				typeof ride.driverLocation.lng !== "number") {
				throw new HttpException("Invalid or missing driver location", 422);
			}


			let pickupDistance: number;

			try {
				pickupDistance = getDistanceInMeters(
					ride.pickupLocation.lat,
					ride.pickupLocation.lng,
					ride.driverLocation.lat,
					ride.driverLocation.lng
				);
			} catch (err) {
				throw new HttpException("Error calculating pickup distance", 500);
			}

			if (isNaN(pickupDistance) || pickupDistance < 0) {
				throw new HttpException("Invalid distance calculation result", 500);
			}

			return {
				success: true,
				message: "Pickup navigation calculated successfully",
				rideId: ride._id,
				driverId: ride.driverId,
				user: ride.riderId ?? null,
				pickupLocation: ride.pickupLocation,
				driverLocation: ride.driverLocation,
				pickupDistance: (pickupDistance / 1000).toFixed(2),
				isDriverClose: pickupDistance <= 30,  // example threshold
			};

		} catch (error) {
			console.log("Error in pickupNavigation", error);
			throw error instanceof HttpException
				? error
				: new HttpException(
					"Internal Server Error - getting driver for ride",
					500
				);
		}
	}


	async activeRide(rideId: string, driverIdString: string) {
		try {
			let rideObjectId: Types.ObjectId;
			let driverId: Types.ObjectId;

			try {
				rideObjectId = new Types.ObjectId(rideId);
				driverId = new Types.ObjectId(driverIdString);
			} catch (err) {
				throw new HttpException("Invalid ObjectId format - activeRide", 400);
			}

			console.log("rideObjectId", rideObjectId);
			console.log("driverId", driverId);

			const ride = await this.rideModel
				.findOne({
					_id: rideObjectId,
					rideStatus: "in_progress",
					driverId: driverId,
				})
				.populate("riderId", "name phone");

			if (!ride) {
				throw new HttpException("Ride not found or not in progress", 404);
			}

			// Validate coords
			if (!ride.pickupLocation || !ride.dropoffLocation || !ride.driverLocation) {
				throw new HttpException("Location data missing in ride", 422);
			}


			const totalMeters = getDistanceInMeters(
				ride.pickupLocation.lat,
				ride.pickupLocation.lng,
				ride.dropoffLocation.lat,
				ride.dropoffLocation.lng
			);
			const totalKm = +(totalMeters / 1000).toFixed(2);


			const remainingMeters = getDistanceInMeters(
				ride.driverLocation.lat,
				ride.driverLocation.lng,
				ride.dropoffLocation.lat,
				ride.dropoffLocation.lng
			);
			const remainingKm = +(remainingMeters / 1000).toFixed(2);


			const now = new Date();
			const startTime = ride.startTime ?? now;

			const elapsedMinutes = Math.floor((now.getTime() - startTime.getTime()) / 60000);


			const speedKmHr = typeWiseSpeed[ride.vehicleType]; // from your fareCal
			const estimatedRemainingMinutes = Math.ceil((remainingKm / speedKmHr) * 60);


			const farePerKm = typeWiseFare[ride.vehicleType];

			const estimatedFare = +(totalKm * farePerKm).toFixed(2);

			const coveredKm = +(totalKm - remainingKm).toFixed(2);

			return {
				success: true,
				message: "Active ride details calculated successfully",

				rideId: ride._id,
				driverId: ride.driverId,
				user: ride.riderId ?? null,

				pickupLocation: ride.pickupLocation,
				driverLocation: ride.driverLocation,
				dropoffLocation: ride.dropoffLocation,

				totalDistanceKm: totalKm,
				coveredDistanceKm: coveredKm,
				remainingDistanceKm: remainingKm,

				elapsedMinutes,
				estimatedRemainingMinutes,
				estimatedFare,

				isDriverClose: remainingKm <= 0.03, // 30 meters approx
			};

		} catch (error) {
			console.log("Error in Active Ride", error);
			throw error instanceof HttpException
				? error
				: new HttpException("Internal Server Error - Active Ride", 500);
		}
	}




	//```````````````````  getDriversForRide `````````````````````````````
	getDriversForRide(rideId: string) {
		try {
			const drivers = this.rideModel
				.findById(rideId)
				.populate('driverId name phone');
		} catch (error) {
			console.log(error);
			throw error instanceof HttpException ? error : new HttpException("Internal Server Error - getting driver for ride", 500);
		}
	}




	//```````````````````  estimatedFare  ``````````
	async estimatedFare(dto: EstimatedFareDto) {
		try {
			// 1. Get distance in meters
			const distanceInMeters = getDistanceInMeters(
				dto.pickupLocation.lat,
				dto.pickupLocation.lng,
				dto.dropoffLocation.lat,
				dto.dropoffLocation.lng
			);

			const km = distanceInMeters / 1000;


			// 2. Calculate fare and time for each vehicle type
			const estimatedFare = {};
			const estimatedTime = {};

			for (const type of Object.keys(typeWiseFare)) {
				const farePerKm = typeWiseFare[type];
				const speedKmHr = typeWiseSpeed[type];

				estimatedFare[type] = + (farePerKm * km).toFixed(2);
				estimatedTime[type] = +Math.ceil((km / speedKmHr) * 60)
			}

			// 3. Return results
			return {
				success: true,
				distanceInKm: +km.toFixed(2),
				estimatedFare,
				estimatedTime
			};
		} catch (error) {
			console.error(error);
			return {
				success: false,
				message: "Failed to calculate estimated fare."
			};
		}
	}

	async getAllnewRides() {
		try {
			const rides = await this.rideModel.find({ rideStatus: 'pending' }).populate('riderId', 'name phone');

			return {
				success: true,
				rides
			}
		} catch (error) {
			console.log(error)
			throw error instanceof HttpException ? error : new HttpException("Internal Server Error - new rides", 500)
		}
	}


	async isDeriverVerified(driverId: string) {
		try {
			console.log("Checking verification for driverId:", driverId);
			const driver = await this.driverModel.findOne({ userId: new Types.ObjectId(driverId) });

			if (!driver) {
				throw new HttpException("Driver not found", 404);
			}

			const isVerifiedByDocs = driver.verificationStatusFromAdmin === VerficationSTATUS.VERIFIED;

			console.log("isDeriverVerified:", isVerifiedByDocs);

			return isVerifiedByDocs
			

		} catch (error) {
			console.log(error);
			throw error instanceof HttpException
				? error
				: new HttpException("Internal Server Error - checking driver verification", 500);
		}
	}


}





