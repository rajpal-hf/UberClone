import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Vehicle, VehicleDocument } from './schema/vehicle.schema';
import { Model, ObjectId } from 'mongoose';
import { CreateVehicleDto } from './dto/vehicle.dto';

@Injectable()
export class VehicleService {
	constructor(
		@InjectModel(Vehicle.name) private readonly vehicleModel: Model<VehicleDocument>,
	) { }

	async createVehicle(id: ObjectId, dto: CreateVehicleDto) {
		const { vehicleType, modelName, color, plateNumber, rcBookUrl } = dto;
		const driverId = id;

		

		try {
			// ✅ Validate required fields
			if (!driverId || !vehicleType || !modelName || !color || !plateNumber) {
				throw new HttpException('All fields are required', 400);
			}

			/**
			 A driver cannot have two vehicles with the same type
			 */
			const existingVehicleByDriverType = await this.vehicleModel.findOne({
				driverId,
				vehicleType,
			});
		
		
			
			if (existingVehicleByDriverType) {
				throw new HttpException(
					`Driver already has a vehicle of type "${vehicleType}"`,
					409,
				);
			}

			/**
			 * A driver cannot reuse the same plate number,
			 * even if the vehicle type is different
			 */

			const sameDriverPlate = await this.vehicleModel.findOne({
				driverId,
				plateNumber,
				vehicleType
			});

			
			if (sameDriverPlate) {
				throw new HttpException(
					`Driver already owns a vehicle with plate number "${plateNumber}"`,
					409,
				);
			}

			/**
			 * Allow same plate number for different vehicle types,
			 * but globally prevent the same (plateNumber + vehicleType) pair
			 */

			const existingVehicleByPlateAndType = await this.vehicleModel.findOne({
				plateNumber,
				vehicleType,
			});


			if (existingVehicleByPlateAndType) {
				throw new HttpException(
					`A ${vehicleType} with plate number "${plateNumber}" already exists`,
					409,
				);
			}

			// Create and save the vehicle
			const newVehicle = new this.vehicleModel({
				driverId,
				vehicleType,
				modelName,
				color,
				plateNumber,
				rcBookUrl,
			});

			const savedVehicle = await newVehicle.save();

			return {
				message: 'Vehicle created successfully',
				data: savedVehicle,
			};
		} catch (error) {
			if (error instanceof HttpException) throw error;

			throw new HttpException(
				error.message || 'Something went wrong while creating the vehicle',
				500,
			);
		}
	}
}
