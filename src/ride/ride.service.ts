// ride.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Ride } from './schema/ride.schema';
import { CreateRideDto } from './dto/ride.dto';
import { calculateFare } from 'src/utils/fair-calculate';

@Injectable()
export class RideService {
	constructor(@InjectModel(Ride.name) private rideModel: Model<Ride>) { }

	async createRide(dto: CreateRideDto) {
		const ride = new this.rideModel(dto);
		return ride.save();
	}

	async acceptRide(rideId: string, driverId: string) {
		const ride = await this.rideModel.findById(rideId);
		if (!ride) throw new NotFoundException('Ride not found');
		ride.driverId = driverId;
		ride.status = 'accepted';
		ride.startTime = new Date();
		return ride.save();
	}

	async completeRide(rideId: string) {
		const ride = await this.rideModel.findById(rideId);
		if (!ride) throw new NotFoundException('Ride not found');

		ride.endTime = new Date();
		ride.status = 'completed';


		const distance = await this.calculateDistance(
			ride.pickupLocation,
			ride.dropoffLocation
		);
		ride.distance = distance;
		ride.fare = calculateFare(distance);

		return ride.save();
	}

	async getRide(id: string) {
		return this.rideModel.findById(id);
	}

	private async calculateDistance(pickup, dropoff): Promise<number> {
		const R = 6371; 
		const dLat = ((dropoff.lat - pickup.lat) * Math.PI) / 180;
		const dLng = ((dropoff.lng - pickup.lng) * Math.PI) / 180;
		const a =
			Math.sin(dLat / 2) * Math.sin(dLat / 2) +
			Math.cos((pickup.lat * Math.PI) / 180) *
			Math.cos((dropoff.lat * Math.PI) / 180) *
			Math.sin(dLng / 2) *
			Math.sin(dLng / 2);
		const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
		return R * c;
	}
}
