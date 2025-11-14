
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
