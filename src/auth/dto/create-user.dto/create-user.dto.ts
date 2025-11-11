import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsEnum, IsNotEmpty, IsString } from "class-validator";
import { UserRole } from "src/common/constants";

export class CreateUserDto {
	@ApiProperty({example: "test"})
	@IsString()
	@IsNotEmpty()
	name: string
	
	@ApiProperty({ example: "7894561230" })
	@IsString()
	@IsNotEmpty()
	phone: string


	@ApiProperty({ example: "test@gmail.com" })
	@IsEmail()
	@IsNotEmpty()
	email: string


	@ApiProperty({example: "1111"})
	@IsString()
	@IsNotEmpty()
	password: string


	@ApiProperty({
		example: "driver",
		enum: UserRole,
		description: "User role, can be 'driver' or 'rider'",
	})
	@IsEnum(UserRole)
	@IsNotEmpty()
	role: UserRole;
}


export class UserLoginDto { 
	@ApiProperty({ example: "test@gmail.com" })
	@IsEmail()
	@IsNotEmpty()
	email: string

	@ApiProperty({ example: "1111" })
	@IsString()
	@IsNotEmpty()
	password: string
}
export class SendOtpDto {
	@ApiProperty()
	@IsNotEmpty()
	@IsEmail()
	email : string
}
export class VerifyNumberDto	 { 
	@ApiProperty({example : "+91 7973368197"})
	@IsString()
	@IsNotEmpty()
	phone : string
}

