import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Driver, DriverDocument } from './schema/driver.schema';
import { Model, ObjectId } from 'mongoose';
import { FileUploadService } from 'src/file-upload/file-upload.service';
import { CreateDriverProfileDto } from './dto/driver.dto';

@Injectable()
export class DriverService {
	constructor(
		@InjectModel(Driver.name) private driverModel: Model<DriverDocument>,
		private readonly fileUploadService : FileUploadService
	) { }

	async createDriver(id: ObjectId, dto: CreateDriverProfileDto) {
		const {
			licenseNumber,
			panNumber,
			licensePhoto,
			aadhaarNumber,
			aadhaarFront,
			aadhaarBack,
			vehicleId,
		} = dto;
		const driverId = id;

		console.log('Driver ID:', driverId);
		console.log('License Number:', licenseNumber);
		console.log('PAN Number:', panNumber);
		console.log('License Photo:', licensePhoto);
		console.log('Aadhaar Number:', aadhaarNumber);
		console.log('Aadhaar Front:', aadhaarFront);
		console.log('Aadhaar Back:', aadhaarBack);
		console.log('Vehicle ID:', vehicleId);

		try {
			//  Validate required fields
			if (
				!licenseNumber ||
				!panNumber ||
				!licensePhoto ||
				!aadhaarNumber ||
				!aadhaarFront ||
				!aadhaarBack ||
				!vehicleId
			) {
				throw new HttpException('All fields are required', 400);
			}

			// Check if this driver already has a profile

			const existingProfile = await this.driverModel.findOne({ driverId });
			if (existingProfile) {
				throw new HttpException('Driver profile already exists', 409);
			}

			// ✅ 3. Prevent duplicate Aadhaar or License globally
			const duplicateLicense = await this.driverModel.findOne({ licenseNumber });
			if (duplicateLicense) {
				throw new HttpException(
					`License number "${licenseNumber}" is already registered`,
					409,
				);
			}

			const duplicateAadhaar = await this.driverModel.findOne({
				aadhaarNumber,
			});
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

			//  Optional: Check if vehicle is already assigned to another driver
			const vehicleAlreadyAssigned = await this.driverModel.findOne({
				vehicleId,
			});
			if (vehicleAlreadyAssigned) {
				throw new HttpException(
					'This vehicle is already assigned to another driver',
					409,
				);
			}

			// Create new driver record
			const newDriver = new this.driverModel({
				driverId,
				licenseNumber,
				panNumber,
				licensePhotoUrl: licensePhoto,
				aadhaarNumber,
				aadhaarFrontUrl:aadhaarFront,
				aadhaarBackUrl:aadhaarBack,
				vehicleId,
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
}
