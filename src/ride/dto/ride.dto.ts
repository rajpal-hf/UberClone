import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsString, IsNumber, IsOptional, IsMongoId } from 'class-validator';

export class CreateRideDto {
	@ApiProperty({
		description: 'Pickup location details including latitude, longitude, and optional address',
		example: {
			lat: 28.6139,
			lng: 77.2090,
			address: 'Connaught Place, New Delhi, India',
		},
	})
	@IsObject()
	@IsNotEmpty()
	pickupLocation: {

	lat: number;
	lng: number;
	address?: string;
};

@ApiProperty({
	description: 'Drop-off location details including latitude, longitude, and optional address',
	example: {
		lat: 28.4595,
		lng: 77.0266,
		address: 'Cyber Hub, Gurugram, Haryana, India',
	},
})
@IsObject()
@IsNotEmpty()
dropoffLocation: {
		lat: number;
		lng: number;
	address ?: string;
};
}

export class RideParamDto { 
	@ApiProperty({ example: "6915695714140498f021d98c" })
	@IsMongoId()
	id : string
}