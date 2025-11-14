import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Vehicle, VehicleDocument } from './schema/vehicle.schema';
import mongoose, { Model, ObjectId, Types } from 'mongoose';
import { CreateVehicleDto } from './dto/vehicle.dto';
import { Driver, DriverDocument } from 'src/driver/schema/driver.schema';

@Injectable()
export class VehicleService {
	constructor(
		@InjectModel(Vehicle.name) private readonly vehicleModel: Model<VehicleDocument>,
		@InjectModel(Driver.name) private readonly driverModel: Model<DriverDocument>,
	) { }

	async createVehicle(id: string, dto: CreateVehicleDto) {
		const { vehicleType, modelName, color, plateNumber, rcBookUrl } = dto;

		// Validation
		if (!mongoose.Types.ObjectId.isValid(id)) {
			throw new HttpException('Invalid ObjectId format', 400);
		}

		const userId = new Types.ObjectId(id);

		try {
			// Check for missing fields
			if (!vehicleType || !modelName || !color || !plateNumber) {
				throw new HttpException('All fields are required', 400);
			}

			// Use aggregation to check for duplicates in a single query
			const existingVehicle = await this.vehicleModel.aggregate([
				{
					$match: {
						$or: [
							{ userId: id, vehicleType },
							{ plateNumber, vehicleType },
						],
					},
				},
				{
					$group: {
						_id: null,
						count: { $sum: 1 },
					},
				},
			]);

			if (existingVehicle.length > 0) {
				const errorMessage = existingVehicle[0].count > 1
					? `A ${vehicleType} with plate number "${plateNumber}" already exists`
					: `Driver already has a vehicle of type "${vehicleType}"`;
				throw new HttpException(errorMessage, 409);
			}

			// Create and save the vehicle
			const newVehicle = new this.vehicleModel({
				userId,
				vehicleType,
				modelName,
				color,
				plateNumber,
				rcBookUrl,
			});

			await newVehicle.save();

		
			const newdriver = await this.driverModel.updateOne(
				{ userId  },
				{ $set: { vehicleId: newVehicle._id } },
			);

			return {	
				message: 'Vehicle created successfully',
				data: newVehicle,
				newdriver : newdriver
			};
		} catch (error) {
			console.error('Error creating vehicle:', error);

			if (error instanceof HttpException) throw error;

			throw new HttpException(
				error.message || 'Something went wrong while creating the vehicle',
				500,
			);
		}
	}
}
