// create-ride.dto.ts
import { IsNotEmpty, IsNumber, IsObject, IsString } from 'class-validator';

export class CreateRideDto {
	
	@IsObject()
	pickupLocation: {
		lat: number;
		lng: number;
		address?: string;
	};

	@IsObject()
	dropoffLocation: {
		lat: number;
		lng: number;
		address?: string;
	};
}
