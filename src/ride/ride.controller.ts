// ride.controller.ts
import { Body, Controller, Get, Param, Patch, Post, Put, Req, UseGuards } from '@nestjs/common';
import { RideService } from './ride.service';
import {  CreateRideDto, RideParamDto } from './dto/ride.dto';
import { AuthGuard } from 'src/auth/guard/auth.Guard';
import { RolesGuard } from 'src/roleGuard/roles.guard';
import { Roles } from 'src/roleGuard/roles.decorator';
import { UserRole } from 'src/common/constants';
import { ApiBearerAuth } from '@nestjs/swagger';
import Api from 'twilio/lib/rest/Api';

@Controller('ride')
export class RideController {
	constructor(private rideService: RideService) { }

	// Rider requests a new ride
	@ApiBearerAuth()
	@UseGuards(AuthGuard, RolesGuard)
	@Roles(UserRole.RIDER)
	@Post('request')
	createRide(@Body() dto: CreateRideDto, @Req() req: any) {
		return this.rideService.createRide(dto, req.user.id);
	}

	@ApiBearerAuth()
	@UseGuards(AuthGuard)
	@Put(':id/cancel')
	cancelRide(@Param() params: RideParamDto, @Req() req: any) {
		return this.rideService.cancelRide(params.id, req.user.id);
	}

	@ApiBearerAuth()
	@UseGuards(AuthGuard, RolesGuard)
	@Roles(UserRole.DRIVER)
	@Patch(':id/accept')
	acceptRide(@Param() params: RideParamDto, @Req() req: any) {
		return this.rideService.acceptRide(params.id , req.user.id)
	 }





	// @UseGuards(AuthGuard,RolesGuard)
	// 	@Roles(UserRole.DRIVER)
	// @Put(':id/accept')
	// acceptRide(@Param('id') id: string, @Req() req ) {
	// 	return this.rideService.acceptRide(id, req.user.id);
	// }

	// // Complete ride
	// @Put(':id/complete')
	// completeRide(@Param('id') id: string) {
	// 	return this.rideService.completeRide(id);
	// }

	// // Get ride details
	// @Get(':id')
	// getRide(@Param('id') id: string) {
	// 	return this.rideService.getRide(id);
	// }
}
