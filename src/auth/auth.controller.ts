import { Body, Controller, Get, Post, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto, SendOtpDto, UserLoginDto } from './dto';
import type { Response } from 'express'
import { AuthGuard } from './guard/auth.Guard';
import { ApiBearerAuth } from '@nestjs/swagger';
import { dot } from 'node:test/reporters';


@Controller('auth')
export class AuthController {
	constructor(private readonly authService: AuthService) { }



	@Post('signup')
	signup(@Body() dto: CreateUserDto) {
		return this.authService.signup(dto)
	}

	@Post('send-opt')
	sendOtp(@Body() dto :SendOtpDto){
		return this.authService.sendOtp(dto)
	}
	
		
	@Post('login')
	login(@Body() dto: UserLoginDto ,@Res({ passthrough: true })  res: Response) {
		return this.authService.login(dto, res)
	}



}
