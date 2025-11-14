import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto, SendOtpDto, UserLoginDto, VerifyNumberDto } from './dto';
import type { Response } from 'express'
import { AuthGuard } from './guard/auth.Guard';
import { ApiBearerAuth, ApiProperty } from '@nestjs/swagger';


@Controller('auth')
export class AuthController {
	constructor(private readonly authService: AuthService) { }


	@Post('signup')
	signup(@Body() dto: CreateUserDto) {
		return this.authService.signup(dto)
	}


	@Post('login')
	login(@Body() dto: UserLoginDto ,@Res({ passthrough: true })  res: Response) {
		return this.authService.login(dto, res)
	}


	@Post('number-verify')
	phoneVerify(@Body() dto: VerifyNumberDto) {
		return this.authService.verifyPhone(dto)
	}
	
	@ApiProperty()
	@ApiBearerAuth()
	@UseGuards(AuthGuard)
	@Post('email-otp')
	sendOtpToEmail(@Req() req :any) {
		return this.authService.sendOtpToEmail(req.user.id)
	}

	@ApiProperty()
	@ApiBearerAuth()
	@UseGuards(AuthGuard)
	@Post('email-verify')
	emailVerify(@Req() req: any , @Body() dto: SendOtpDto) {
		return this.authService.verifyEmail(req.user.id, dto.otp)
	}



}
