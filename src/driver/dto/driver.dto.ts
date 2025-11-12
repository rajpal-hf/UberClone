import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsOptional } from "class-validator";

export class CreateDriverProfileDto {
	@ApiProperty({ example: "MH12-2024-AB1234" })
	@IsString()
	licenseNumber: string;

	@ApiProperty({ example: "AAACH2702H" })
	@IsString()
	panNumber: string;

	@ApiProperty({ type: "string", format: "binary", required: false })
	licensePhoto?: any;

	@ApiProperty({ example: "123456789012" })
	@IsString()
	aadhaarNumber: string;

	@ApiProperty({ type: "string", format: "binary", required: false })
	aadhaarFront?: any;

	@ApiProperty({ type: "string", format: "binary", required: false })
	aadhaarBack?: any;

	@ApiProperty({ required: false, example: "6731a6b3e41b5f8fcedda922" })
	@IsOptional()
	@IsString()
	vehicleId?: string;
}
