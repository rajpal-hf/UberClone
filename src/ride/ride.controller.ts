// ride.controller.ts

import { Body, Controller, Get, Param, Patch, Post, Put, Req, UseGuards } from '@nestjs/common';
import { RideService } from './ride.service';
import {  ActualDropoffDto, CreateRideDto, DriverLocationDto, EstimatedFareDto, RideParamDto } from './dto/ride.dto';
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
	@Post('ride-fare')
	estimatedFare(@Body() dto: EstimatedFareDto) {
		return this.rideService.estimatedFare(dto);
	}

	
	@ApiBearerAuth()
	@UseGuards(AuthGuard, RolesGuard)
	@Roles(UserRole.DRIVER)
	@Post('accept/:id')
	acceptRide(@Param() params: RideParamDto, @Req() req: any, @Body() dto: DriverLocationDto) {
		
		return this.rideService.acceptRide(params.id , req.user.id , dto)
	}
	

	@ApiBearerAuth()
	@UseGuards(AuthGuard, RolesGuard)
	@Roles(UserRole.DRIVER)
	@Patch('start/:id')
	startRide(@Param() params: RideParamDto, @Req() req: any) {
		return this.rideService.startRide(params.id , req.user.id)
	}
	
	@ApiBearerAuth()
	@UseGuards(AuthGuard, RolesGuard)
	@Roles(UserRole.DRIVER)
	@Patch('complete/:id')
	completeRide(@Param() params: RideParamDto, @Req() req: any , @Body() dto: ActualDropoffDto) {
		return this.rideService.completeRide(params.id , req.user.id , dto)
	}

	@ApiBearerAuth()
	@UseGuards(AuthGuard)
	@Patch('cancel/:id')
	cancelRide(@Param() params: RideParamDto, @Req() req: any) {
		return this.rideService.cancelRide(params.id, req.user.id);
	}

	
	@ApiBearerAuth()
	@UseGuards(AuthGuard)
	@Get('driver/:id')
	getDriverForRide(@Param() params: RideParamDto, @Req() req: any) {
		return this.rideService.getAcceptedOrInProgressRide(params.id , req.user.id)
	}

	@ApiBearerAuth()
	@UseGuards(AuthGuard, RolesGuard)
	@Roles(UserRole.DRIVER)
	@Get('new-rides')
	getAllRides() {
		return this.rideService.getAllnewRides()
	}


	@ApiBearerAuth()
	@UseGuards(AuthGuard )
	@Get('pickup-navigation/:id')
	pickupNavigation(@Param() params: RideParamDto, @Req() req: any) {
		return this.rideService.pickupNavigation(params.id , req.user.id)
	}


	@ApiBearerAuth()
	@UseGuards(AuthGuard )
	@Get('active-ride/:id')
	activeRide(@Param() params: RideParamDto, @Req() req: any) {
		return this.rideService.activeRide(params.id , req.user.id)
	}



}
