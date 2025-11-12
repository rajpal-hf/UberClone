// ride.controller.ts
import { Body, Controller, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { RideService } from './ride.service';
import { CreateRideDto } from './dto/ride.dto';
import { AuthGuard } from 'src/auth/guard/auth.Guard';
import { RolesGuard } from 'src/roleGuard/roles.guard';
import { Roles } from 'src/roleGuard/roles.decorator';
import { UserRole } from 'src/common/constants';

@Controller('ride')
export class RideController {
	constructor(private rideService: RideService) { }

	// Rider requests a new ride
	@Post('request')
	createRide(@Body() dto: CreateRideDto) {
		return this.rideService.createRide(dto);
	}

	
	@UseGuards(AuthGuard,RolesGuard)
		@Roles(UserRole.DRIVER)
	@Put(':id/accept')
	acceptRide(@Param('id') id: string, @Req() req ) {
		return this.rideService.acceptRide(id, req.user.id);
	}

	// Complete ride
	@Put(':id/complete')
	completeRide(@Param('id') id: string) {
		return this.rideService.completeRide(id);
	}

	// Get ride details
	@Get(':id')
	getRide(@Param('id') id: string) {
		return this.rideService.getRide(id);
	}
}
