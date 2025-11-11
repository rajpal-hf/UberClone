import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsOptional, IsEnum } from "class-validator";
import { VehicleType } from "src/common/constants";

export class CreateVehicleDto {
	
	@ApiProperty({
		description: "Type of vehicle (e.g. CAR, BIKE, AUTO)",
		enum: VehicleType,
		example: VehicleType.CAR,
	})
	@IsEnum(VehicleType)
	vehicleType: VehicleType;

	@ApiProperty({
		description: "Vehicle model name (e.g. Corolla, Pulsar 150)",
		example: "Corolla",
	})
	@IsString()
	modelName: string;

	@ApiProperty({
		description: "Vehicle color",
		example: "White",
	})
	@IsString()
	color: string;

	@ApiProperty({
		description: "Unique registration plate number",
		example: "PB02AA1984",
	})
	@IsString()
	plateNumber: string;

	@ApiProperty({
		description: "RC Book (Registration Certificate) document URL",
		example: "https://example.com/rcbook.jpg",
		required: false,
	})
	@IsOptional()
	@IsString()
	rcBookUrl?: string;
}
