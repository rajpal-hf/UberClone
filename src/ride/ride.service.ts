// ride.service.ts
import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId, Types } from 'mongoose';
import { Ride, RideDocument } from './schema/ride.schema';
import {  ActualDropoffDto, CreateRideDto, EstimatedFareDto } from './dto/ride.dto';
import { Auth, AuthDocument } from 'src/auth/schema/auth.schema';
import { RideCancelBy, UserRole } from 'src/common/constants';
import { Driver, DriverDocument } from 'src/driver/schema/driver.schema';
import { WebsocketService } from 'src/websocket/websocket.service';
import { getDistanceInMeters, totalFare, totalTime, typeWiseFare, typeWiseSpeed } from 'src/common/fareCal';
import { RazorpayService } from 'src/payment/razorpay.service';


@Injectable()
export class RideService {
	constructor(
		@InjectModel(Ride.name) private rideModel: Model<RideDocument>,
		@InjectModel(Auth.name) private authModel: Model<AuthDocument>,
		@InjectModel(Driver.name) private driverModel: Model<DriverDocument>,
		private readonly wsService: WebsocketService,
		private readonly razorpayService : RazorpayService
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

			// here is error
			await this.wsService.broadcastNewRide(ride);

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
					rideStatus: "pending",
					$or: [
						{ driverId: { $exists: false } },
						{ driverId: null }
					]
				},
				{
					$set: {
						driverId: new Types.ObjectId(dId),
						rideStatus: 'accepted'
					}
				},
				{ new: true }
			);

			if (!ride) {
				throw new HttpException('Ride not found or already taken', 404);
			}

			// use wsService.sendTo to notify the rider
			this.wsService.sendTo(ride.riderId.toString(), "ride_accepted", ride);

			// Notify all drivers (optional) that ride is taken
			this.wsService.broadcast("ride_taken", { rideId });

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





	async startRide(rideId: string, dId: string) {

		console.log("check 1")
		try {

			console.log("check 2")

			const id = new Types.ObjectId(rideId)

			
			const ride = await this.rideModel.findById(rideId);
			if (!ride) throw new HttpException("Ride not found", 404);

			
			const driver = await this.driverModel.findOne({ userId: new Types.ObjectId(dId) });
			if (!driver) throw new HttpException("Driver not found", 404);
			
			console.log("check 3")
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
			console.log( " xxx " , rr )
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

	async completeRide(rideId: string, driverId: string, dto: ActualDropoffDto) {
		try {
			const ride = await this.rideModel.findOne({
				_id: new Types.ObjectId(rideId),
				driverId: new Types.ObjectId(driverId),
			});

			// ithe ride mili ? ..

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

			// Create Razorpay Order after ride completion
			const order = await this.razorpayService.createOrder(fare);

			// Save payment order inside ride
			ride.paymentOrderId = order.id;
			await ride.save();

			return {
				success: true,
				ride,
				payment: {
					orderId: order.id,
					amount: order.amount,
					currency: order.currency
				}
			};

		} catch (error) {
			console.log(error);
			throw error instanceof HttpException
				? error
				: new HttpException("Internal Server Error - completing ride", 500);
		}
	}

	

	// async completeRide(

	// 	rideId: string,
	// 	driverId: string,
	// 	dto : ActualDropoffDto
	// ) {
	// 	try {
	// 		// Find ride and make sure the assigned driver is completing

	// 		console.log("check 1", rideId, driverId)
	// 		console.log("check 2" , dto)

	// 		const ride = await this.rideModel.findOne({
	// 			_id: new Types.ObjectId(rideId),
	// 			driverId : new Types.ObjectId(driverId)
	// 		});

	// 		if (!ride) {
	// 			throw new HttpException('Ride not found or not assigned to this driver', 404);
	// 		}

	// 		if (ride.rideStatus === 'completed') {
	// 			throw new HttpException('Ride already completed', 400);
	// 		}

	// 		if (ride.rideStatus === 'cancelled') {
	// 			throw new HttpException('Cannot complete a cancelled ride', 400);
	// 		}

	// 		const distanceMeters = getDistanceInMeters(
	// 			ride.pickupLocation.lat,
	// 			ride.pickupLocation.lng,
	// 			dto.dropoffLocation.lat,
	// 			dto.dropoffLocation.lng
	// 		);

	// 		//  Fare calculation
	// 		const rideType = ride.vehicleType;
	// 		const fare = totalFare(rideType, distanceMeters);
	// 		const timeTaken = totalTime(rideType, distanceMeters);


			
	// 		// Update ride
	// 		ride.actualDropoffLocation = dto.dropoffLocation;
	// 		ride.distance = distanceMeters / 1000;
	// 		ride.fare! < fare ? (ride.fare = fare) : (ride.fare = ride.fare);
	// 		ride.endTime = new Date();
	// 		ride.rideStatus = "completed";

	// 		await ride.save();

	// 		return {
	// 			success: true,
	// 			ride
	// 		};

	// 	} catch (error) {
	// 		console.log(error);
	// 		throw error instanceof HttpException
	// 			? error
	// 			: new HttpException("Internal Server Error - completing ride", 500);
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
					{ $set: { rideStatus: 'cancelled', userId: null, cancelBy: RideCancelBy.RIDER}},
				);
			}
			if (userRole === UserRole.DRIVER) {
				await this.rideModel.findOneAndUpdate(
					{ _id: rideId },
					{ $set: { rideStatus: 'cancelled', userId: Uid, cancelBy: RideCancelBy.DRIVER }},
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
	


	//```````````````````  getAcceptedRide ```````````````````

	
	async getAcceptedRide(rideId: string , req : string) {
		try {
			const id = new Types.ObjectId(req)
			const ride = await this.rideModel.findOne({ _id: rideId, rideStatus: 'accepted', userId: id }).populate('driverId name phone');


			const driverId = ride?.driverId;
			if (!driverId) {	
				throw new HttpException("Driver not found", 404);
			}
			return {
				success: true,
				driverId
			}
		
		}
		catch (error) {
			console.log(error)
			throw error instanceof HttpException ? error : new HttpException("Internal Server Error - getting driver for ride", 500)
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

	async getNewRides(rideId: string) {
		try {
			const rides = await this.rideModel.find({ rideStatus: 'pending' });
			console.log(rides)
			return rides
		} catch (error) {
			console.log(error)
			throw error instanceof HttpException ? error : new HttpException("Internal Server Error - creating ride", 500)	
		}
	}



}

