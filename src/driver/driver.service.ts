import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Driver, DriverDocument } from './schema/driver.schema';
import mongoose, { Model, ObjectId, Types } from 'mongoose';
import { FileUploadService } from 'src/file-upload/file-upload.service';
import { CreateDriverProfileDto } from './dto/driver.dto';
import { error } from 'console';
import { Auth, AuthDocument } from 'src/auth/schema/auth.schema';
import { DriverStatus } from 'src/common/constants';
import { Ride, RideDocument } from 'src/ride/schema/ride.schema';

@Injectable()
export class DriverService {
	constructor(
		@InjectModel(Driver.name) private driverModel: Model<DriverDocument>,
		@InjectModel(Auth.name) private authModel: Model<AuthDocument>,
		@InjectModel(Ride.name) private rideModel: Model<RideDocument>,
		private readonly fileUploadService : FileUploadService
	) { }


async createDriver(id: string, dto: CreateDriverProfileDto) {
	const {
		licenseNumber,
		panNumber,
		licensePhoto,
		aadhaarNumber,
		aadhaarFront,
		aadhaarBack,
	} = dto;

	try {
		if (
			!licenseNumber ||
			!panNumber ||
			!licensePhoto ||
			!aadhaarNumber ||
			!aadhaarFront ||
			!aadhaarBack
		) {
			throw new HttpException('All fields are required', 400);
		}

		
		if (!mongoose.Types.ObjectId.isValid(id)) {
			throw new HttpException('Invalid ObjectId format', 400);
		}

		const userId = new Types.ObjectId(id); // Convert to ObjectId

		// Check if this driver already has a profile
		const existingProfile = await this.driverModel.findOne({ userId });
		if (existingProfile) {
			throw new HttpException('Driver profile already exists', 409);
		}

		// Prevent duplicate Aadhaar or License globally
		const duplicateLicense = await this.driverModel.findOne({ licenseNumber });
		if (duplicateLicense) {
			throw new HttpException(
				`License number "${licenseNumber}" is already registered`,
				409,
			);
		}

		const duplicateAadhaar = await this.driverModel.findOne({ aadhaarNumber });
		if (duplicateAadhaar) {
			throw new HttpException(
				`Aadhaar number "${aadhaarNumber}" is already registered`,
				409,
			);
		}

		// Validate format of PAN, Aadhaar, License numbers
		const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
		const aadhaarRegex = /^[0-9]{12}$/;
		if (!panRegex.test(panNumber)) {
			throw new HttpException('Invalid PAN number format', 400);
		}
		if (!aadhaarRegex.test(aadhaarNumber)) {
			throw new HttpException('Invalid Aadhaar number format', 400);
		}

		// Create new driver record
		const newDriver = new this.driverModel({
			userId,
			licenseNumber,
			panNumber,
			licensePhotoUrl: licensePhoto,
			aadhaarNumber,
			aadhaarFrontUrl: aadhaarFront,
			aadhaarBackUrl: aadhaarBack,
		});

		const savedDriver = await newDriver.save();

		return {
			message: 'Driver profile created successfully',
			data: savedDriver,
		};
	} catch (error) {
		console.error('Error creating driver:', error);

		if (error instanceof HttpException) throw error;

		// Handle MongoDB validation or duplicate key errors
		if (error.code === 11000) {
			const duplicateField = Object.keys(error.keyValue)[0];
			throw new HttpException(
				`Duplicate value for field: ${duplicateField}`,
				409,
			);
		}

		throw new HttpException(
			error.message || 'Something went wrong while creating the driver profile',
			500,
		);
	}
}


	async changeStatusForTrip(uId: string) {
		try {

			const id = new Types.ObjectId(uId);
			
			console.log(id, " == id", typeof (id))
			
			console.log(id)

			const driver = await this.driverModel.findOne({ userId: id });
			
			if (!driver) {
				throw new HttpException('Driver not found', 404);
			}

		
			const user = await this.authModel.findById(driver.userId);
			if (!user) {
				throw new HttpException('Associated user not found', 404);
			}

			if (driver.status === DriverStatus.ON_TRIP) {
				throw new HttpException(
					'Cannot change availability while driver is on a trip',
					400,
				);
			}

			driver.status =
				driver.status === DriverStatus.OFFLINE ? DriverStatus.ONLINE : DriverStatus.OFFLINE;

			await driver.save();

			return {
				message: `Driver is now ${driver.status.toLowerCase()}`,
				status: driver.status,
			};
		} catch (error) {
			console.error('Error changing driver trip status:', error);
			throw error instanceof HttpException
				? error
				: new HttpException('Internal Server Error', 500);
		}
	}


	async getTotalRides(reqId : string) {
		try {

			const id = new Types.ObjectId(reqId);
			

			const totalRides = await this.rideModel.countDocuments({
				driverId: id,
				rideStatus: "completed",
			});

			return {
				totalRides,
			};
		} catch (error) {
			console.error('Error getting total rides:', error);
			throw error instanceof HttpException
				? error
				: new HttpException('Internal Server Error', 500);
		}
	}


	async updateProfile(id: string) {
		try {
			const driver = await this.authModel.findById(id);
			if (!driver) {
				throw new HttpException('Driver not found', 404);
			}

		}
		catch {
			
		}


	}




}
