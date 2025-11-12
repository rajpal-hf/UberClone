
import { IsOptional, IsInt, Min, IsMongoId } from 'class-validator';
import { Type } from 'class-transformer';

export class GetUsersDto {
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	page?: number = 1;

	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	limit?: number = 10;
}

export class GetDriversDto {
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	page?: number = 1;

	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	limit?: number = 10;
}




export class DriverActionDto {
	@IsMongoId()
	driverId: string;
}




export class VehicleActionDto {
	@IsMongoId()
	vehicleId: string;
}
