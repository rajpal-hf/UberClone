import { Injectable, HttpException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId, Types } from 'mongoose';
import { Auth, AuthDocument } from 'src/auth/schema/auth.schema';
import { Driver, DriverDocument } from 'src/driver/schema/driver.schema';
import { Vehicle, VehicleDocument } from 'src/vehicle/schema/vehicle.schema';
import { VerficationSTATUS, UserRole } from 'src/common/constants';
import { Ride, RideDocument } from 'src/ride/schema/ride.schema';
import { Payment, PaymentDocument, PaymentStatus } from 'src/ride/schema/payment.schema';

@Injectable()
export class AdminService {
	constructor(
		@InjectModel(Auth.name) private authModel: Model<AuthDocument>,
		@InjectModel(Driver.name) private driverModel: Model<DriverDocument>,
		@InjectModel(Vehicle.name) private vehicleModel: Model<VehicleDocument>,
		@InjectModel(Ride.name) private rideModel: Model<RideDocument>,
		@InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
	) { }

	// ------------------ USERS ------------------
	async getRider(page: number, limit: number) {
		
		try {
		const skip = (page - 1) * limit;
		const total = await this.authModel.countDocuments({role: UserRole.RIDER});
		const users = await this.authModel
			.find({role: UserRole.RIDER})
			.skip(skip)
			.limit(limit)
			.select('-password') 
			.lean();


		const totalPages = Math.ceil(total / limit); 
			return {
				page,
				limit,
			total,
			totalPages,
			users,
		};
		} catch (error) {
			console.log(error)	
			throw error instanceof HttpException ? error : new HttpException("Internal Server Error - getting users", 500)
		}
		
	}

	async getSingleRider(id: string) {
		try {
			if (!Types.ObjectId.isValid(id)) {
				throw new HttpException("Invalid rider ID", 400);
			}

			const user = await this.authModel
				.findOne({ _id: new Types.ObjectId(id), role: UserRole.RIDER })
				.select("-password")
				.lean();

			if (!user) {
				throw new HttpException("Rider not found", 404);
			}
			
			return { user };
		} catch (error) {
			throw new HttpException("Error fetching rider detail", 500);
		}
	}


	//  `````````````````Drivers``````````````
	async getDriver(page: number, limit: number) {

		try {
			const skip = (page - 1) * limit;
			const total = await this.driverModel.countDocuments();
			const drivers = await this.driverModel
				.find()
				.skip(skip)
				.limit(limit)
				.populate('userId', 'email phone name')
				.populate('vehicleId')
				.lean();
			
			console.log(drivers)
			
			const totalPages = Math.ceil(total / limit);

			return {
				total,
				totalPages,
				page,
				limit,
				drivers,
			};
		} catch (error) {
			console.log(error)
			throw error instanceof HttpException ? error : new HttpException("Internal Server Error - getting driver", 500)
		}
		
	}
	async getSingleDriver(id: string) {
		try {
			if (!Types.ObjectId.isValid(id)) {
				throw new HttpException("Invalid driver ID", 400);
			}

			const driver = await this.driverModel
				.findById(id)
				.populate("userId", "name email phone")
				.populate("vehicleId")
				.lean();

			if (!driver) {
				throw new HttpException("Driver not found", 404);
			}

			const rides = await this.rideModel
				.find({ driverId: id })
				.populate("riderId", "name email")
				.lean();

			return { driver, rides };
		} catch (error) {
			throw new HttpException("Error fetching driver detail", 500);
		}
	}


	async getNewDrivers(page: number, limit: number) {
		try {

			const skip = (page - 1) * limit;
			const total = await this.driverModel.countDocuments({
				verificationStatusFromAdmin: VerficationSTATUS.PENDING,
			});


			const drivers = await this.driverModel
				.find({
					verificationStatusFromAdmin: VerficationSTATUS.PENDING,
				})
				.skip(skip)
				.limit(limit)
				.populate('userId', 'email phone name')
				.populate('vehicleId')
				.lean();

			const totalPages = Math.ceil(total / limit);

			return {
				total,
				totalPages,
				page,
				limit,
				drivers,
			};
		} catch (error) {
			console.log(error)
			throw error instanceof HttpException ? error : new HttpException("Internal Server Error - getting driver", 500)
		}
		
	}

	// ------------------ ACCEPT DRIVER ------------------
	async acceptDriver(id: string) {

		if (!Types.ObjectId.isValid(id)) {
			throw new HttpException('Invalid driver ID', 400);
		}

		const userId	 =	new Types.ObjectId(id);
		console.log("idddddddddddddddd",id)
		console.log("idddddddddddddddd", typeof(id))

		const driver = await this.driverModel.findOne({ userId : userId });
		console.log("Driverrrrrrrrrrrrrrr",driver)
		if (!driver) {
			throw new HttpException('Driver not found', 404);
		}

		if (driver.verificationStatusFromAdmin === VerficationSTATUS.VERIFIED) {
			throw new HttpException('Driver is already accepted', 409);
		}

		
		if (!driver.vehicleId) {
			throw new HttpException('Driver has no vehicle assigned', 400);
		}

		const vehicle = await this.vehicleModel.findById(driver.vehicleId);
		if (!vehicle) {
			throw new HttpException('Assigned vehicle not found', 404);
		}

		// Check vehicle not already accepted
		if (vehicle.verificationStatus === VerficationSTATUS.VERIFIED) {
			throw new HttpException('Vehicle is already verified', 409);
		}

		// Accept driver 
		driver.verificationStatusFromAdmin = VerficationSTATUS.VERIFIED;
		await driver.save();

		
		return {
			message: 'Driver and assigned vehicle accepted successfully',
			driver,
			vehicle,
		};	
	}

	// ------------------ ACCEPT VEHICLE ------------------
	async acceptVehicle(vehicleId: string) {
		if (!Types.ObjectId.isValid(vehicleId)) {
			throw new HttpException('Invalid vehicle ID', 400);
		}

		const vehicle = await this.vehicleModel.findById(vehicleId);
		if (!vehicle) {
			throw new HttpException('Vehicle not found', 404);
		}

		if (vehicle.verificationStatus === VerficationSTATUS.VERIFIED) {
			throw new HttpException('Vehicle is already accepted', 409);
		}

		// Multi-checks: ensure driver exists and is verified
		const driver = await this.driverModel.findById(vehicle.userId);
		if (!driver) {
			throw new HttpException('Driver not found for this vehicle', 404);
		}

		if (driver.verificationStatusFromAdmin !== VerficationSTATUS.VERIFIED) {
			throw new HttpException('Driver must be accepted before vehicle', 400);
		}

		// Check for duplicate vehicle of same type & plate number
		const duplicateVehicle = await this.vehicleModel.findOne({
			vehicleType: vehicle.vehicleType,
			plateNumber: vehicle.plateNumber,
			_id: { $ne: vehicle._id },
		});

		if (duplicateVehicle) {
			throw new HttpException(
				`Another vehicle of type ${vehicle.vehicleType} with the same plate number exists`,
				409,
			);
		}

		vehicle.verificationStatus = VerficationSTATUS.VERIFIED;
		await vehicle.save();

		return {
			message: 'Vehicle accepted successfully',
			vehicle,
		};
	}


	async getDashboardStats() {
		try {
			const totalRiders = await this.authModel.countDocuments({ role: UserRole.RIDER });
			const totalDrivers = await this.authModel.countDocuments({ role: UserRole.DRIVER });
			// const totalDrivers = await this.driverModel.countDocuments();

			const completedTrips = await this.rideModel.countDocuments({ rideStatus: "completed" });
			const ongoingTrips = await this.rideModel.countDocuments({ rideStatus: "in_progress" });
			const cancelledTrips = await this.rideModel.countDocuments({ rideStatus: "cancelled" });

			const totalRevenue = await this.paymentModel.aggregate([
				{ $match: { status: PaymentStatus.SUCCESS } },
				{ $group: { _id: null, total: { $sum: "$amount" } } }
			]);

			return {
				totalRiders,
				totalDrivers,
				trips: {
					completed: completedTrips,
					ongoing: ongoingTrips,
					cancelled: cancelledTrips,
				},
				revenue: totalRevenue[0]?.total || 0,
			}
		} catch (error) {
			console.log(error);
			throw new HttpException("Internal Error - Dashboard Stats", 500);
		}
	}

	async getTrips(page: number, limit: number) {
		try {
			const skip = (page - 1) * limit;
			const total = await this.rideModel.countDocuments();

			const rides = await this.rideModel.find()
				.populate("riderId", "name email")
				.populate("driverId", "name email")
				.skip(skip)
				.limit(limit)
				.lean();

			return {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit),
				rides,
			};
		} catch (error) {
			throw new HttpException("Error getting rides", 500);
		}
	}



	async getPayments(page: number, limit: number) {

		try {
			const skip = (page - 1) * limit;
			const total = await this.paymentModel.countDocuments();

			const payments = await this.paymentModel.find()
				.populate("rideId", "fare")
				.populate("riderId", "name Phone")
				.skip(skip)
				.limit(limit)
				.lean();

			return {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit),
				payments,
			};
		} catch (error) {
			console.error(error);
			throw error instanceof HttpException ? error : new HttpException("Error getting payments", 500);
		}
		
	}

	async getRideStatusSummary() {
		const statuses = await this.rideModel.aggregate([
			{ $group: { _id: "$rideStatus", total: { $sum: 1 } } },
			{ $project: { name: "$_id", value: "$total", _id: 0 } },
		]);

		return statuses;
	}

	async getWeeklyRevenue() {
		const revenue = await this.paymentModel.aggregate([
			{ $match: { status: PaymentStatus.SUCCESS } },
			{
				$group: {
					_id: { $dayOfWeek: "$paymentDate" },
					revenue: { $sum: "$amount" }
				}
			},
			{
				$project: {
					_id: 0,
					day: "$_id",
					revenue: 1
				}
			}
		]);
		return revenue;
	}


}
