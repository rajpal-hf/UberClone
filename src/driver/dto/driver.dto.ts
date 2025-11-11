import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsOptional, IsNumber, IsArray, ValidateNested } from "class-validator";


export class CreateDriverProfileDto {


	@ApiProperty({
		description: "Driver license number",
		example: "MH12-2024-AB1234"
	})
	@IsString()
	licenseNumber: string;
	
	
	@ApiProperty({
		description: "Driver Pan number",
		example: "AAACH2702H"
	})
	@IsString()
	panNumber: string;

	@ApiProperty({
		description: "URL of uploaded driver license photo",
		example: "https://example.com/license.jpg"
	})
	@IsString()
	licensePhotoUrl: string;

	@ApiProperty({
		description: "Aadhaar card number",
		example: "1234-5678-9012"
	})
	@IsString()
	aadhaarNumber: string;

	@ApiProperty({
		description: "URL of Aadhaar front image",
		example: "https://example.com/aadhaar-front.jpg"
	})
	@IsString()
	aadhaarFrontUrl: string;

	@ApiProperty({
		description: "URL of Aadhaar back image",
		example: "https://example.com/aadhaar-back.jpg"
	})
	@IsString()
	aadhaarBackUrl: string;

	@ApiProperty({
		description: "Optional Vehicle ID (if vehicle already registered)",
		required: false,
		example: "6731a6b3e41b5f8fcedda922"
	})
	@IsOptional()
	@IsString()
	vehicleId?: string;

}
