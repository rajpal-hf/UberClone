
import { IsOptional, IsInt, Min, IsMongoId, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class GetUsersDto {
	@ApiProperty()
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	
	page?: number = 1;

	@ApiProperty()
	@IsOptional()
	@Type(() => Number)
	@IsInt()

	limit?: number = 10;
}

export class GetDriversDto {
	@ApiProperty({example : 1})
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	page?: number = 1;

	@ApiProperty()
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	limit?: number = 10;	
}

export class DriverActionDto {
	@ApiProperty()
	@IsNotEmpty()
	userId: string;
}

export class VehicleActionDto {
	@IsMongoId()
	vehicleId: string;
}

export class SendNotificationDto{
	@ApiProperty()
	@IsNotEmpty()
	title: string;

	@ApiProperty()
	@IsNotEmpty()
	message: string;

	@ApiProperty({example : ["fcm_token1", "fcm_token2"]})
	@IsNotEmpty({each:true})
	recipients: string[];
}