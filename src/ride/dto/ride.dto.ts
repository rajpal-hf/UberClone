import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsString, IsNumber, IsOptional, IsMongoId, IsEnum } from 'class-validator';
import { VehicleType } from 'src/common/constants';

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
	
	
	@ApiProperty( { example: "auto" })
	@IsEnum(VehicleType)
	vehicleType: VehicleType
	
	@ApiProperty( { example: "4" })
	@IsNumber()
	fare: number
}

export class RideParamDto { 
	@ApiProperty({ example: "6915695714140498f021d98c" })
	@IsMongoId()
	id : string
}

export class EstimatedFareDto {
	
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
		address?: string;
	};
}	



export class ActualDropoffDto { 
	@ApiProperty({
		description: 'Drop-off location details including latitude, longitude, and optional address',
		example: {
			lat: 28.495758,
			lng: 77.090006,
			address: '12, DLF Tower 8th Rd',
		},
	})
	@IsObject()
	@IsNotEmpty()
	dropoffLocation: {
		lat: number;
		lng: number;
		address?: string;
	};
}