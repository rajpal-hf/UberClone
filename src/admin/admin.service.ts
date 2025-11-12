import { Injectable, HttpException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Auth, AuthDocument } from 'src/auth/schema/auth.schema';
import { Driver, DriverDocument } from 'src/driver/schema/driver.schema';
import { Vehicle, VehicleDocument } from 'src/vehicle/schema/vehicle.schema';
import { VerficationSTATUS, DriverStatus } from 'src/common/constants';

@Injectable()
export class AdminService {
	constructor(
		@InjectModel(Auth.name) private authModel: Model<AuthDocument>,
		@InjectModel(Driver.name) private driverModel: Model<DriverDocument>,
		@InjectModel(Vehicle.name) private vehicleModel: Model<VehicleDocument>,
	) { }

	// ------------------ USERS ------------------
	async getUser(page:number, limit :number) {
		
		const skip = (page - 1) * limit;
		const total = await this.authModel.countDocuments();
		const users = await this.authModel
			.find()
			.skip(skip)
			.limit(limit)
			.select('-password') 
			.lean();

		return {
			total,
			page,
			limit,
			users,
		};
	}

	
	async getDriver(page: number, limit: number) {
		const skip = (page - 1) * limit;
		const total = await this.driverModel.countDocuments();
		const drivers = await this.driverModel
			.find()
			.skip(skip)
			.limit(limit)
			.populate('driverId', 'email phone name') 
			.populate('vehicleId') 
			.lean();

		return {
			total,
			page,
			limit,
			drivers,
		};
	}
	async GetNewDrivers(page: number, limit: number) {
		const skip = (page - 1) * limit;
		const total = await this.driverModel.countDocuments();

		
		const drivers = await this.driverModel
			.find()
			.skip(skip)
			.limit(limit)
			.populate('driverId', 'email phone name') 
			.populate('vehicleId') 
			.lean();

		return {
			total,
			page,
			limit,
			drivers,
		};
	}

	// ------------------ ACCEPT DRIVER ------------------
	async acceptDriver(driverId: string) {
		if (!Types.ObjectId.isValid(driverId)) {
			throw new HttpException('Invalid driver ID', 400);
		}

		const driver = await this.driverModel.findById(driverId);
		if (!driver) {
			throw new HttpException('Driver not found', 404);
		}

		if (driver.verificationStatusFromAdmin === VerficationSTATUS.VERIFIED) {
			throw new HttpException('Driver is already accepted', 409);
		}

		// Multi-checks: ensure driver's vehicle exists and no duplicates
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

		// Optionally accept vehicle too
		vehicle.verificationStatus = VerficationSTATUS.VERIFIED;
		await vehicle.save();

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
		const driver = await this.driverModel.findById(vehicle.driverId);
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
