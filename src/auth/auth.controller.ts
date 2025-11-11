import { Body, Controller, Get, Post, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto, SendOtpDto, UserLoginDto, VerifyNumberDto } from './dto';
import type { Response } from 'express'


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

	@Post('email-verify')
	emailVerify(@Body() dto: SendOtpDto) {
		return this.authService.emailVerify(dto)
	}

	@Post('number-verify')
	phoneVerify(@Body() dto: VerifyNumberDto) {
		return this.authService.verifyPhone(dto)
	}
}
