import { Injectable, HttpException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId, Types } from 'mongoose';
import { Auth, AuthDocument } from 'src/auth/schema/auth.schema';
import { Driver, DriverDocument } from 'src/driver/schema/driver.schema';
import { Vehicle, VehicleDocument } from 'src/vehicle/schema/vehicle.schema';
import { VerficationSTATUS, UserRole } from 'src/common/constants';

@Injectable()
export class AdminService {
	constructor(
		@InjectModel(Auth.name) private authModel: Model<AuthDocument>,
		@InjectModel(Driver.name) private driverModel: Model<DriverDocument>,
		@InjectModel(Vehicle.name) private vehicleModel: Model<VehicleDocument>,
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
}
