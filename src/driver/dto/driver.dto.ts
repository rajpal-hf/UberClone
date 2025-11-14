import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsOptional, IsNotEmpty } from "class-validator";

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

}

export class StatusDto {
	@IsNotEmpty()
	id : string
} 