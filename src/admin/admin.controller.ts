// admin/admin.controller.ts
import { Controller, Get, Post, Query, Body } from '@nestjs/common';
import { AdminService } from './admin.service';
import { DriverActionDto, GetDriversDto, GetUsersDto, VehicleActionDto } from './dto/admin.dto';


@Controller('admin')
export class AdminController {
	constructor(private readonly adminService: AdminService) { }

	
	@Get('users')
	async getUsers(@Query() query: GetUsersDto) {
		return this.adminService.getUser(query.page || 1, query.limit || 10);
	}

	@Get('drivers')
	async getDrivers(@Query() query: GetDriversDto) {
		return this.adminService.getDriver(query.page || 1, query.limit|| 10);
	}

	@Post('drivers/accept')
	async acceptDriver(@Body() body: DriverActionDto) {
		return this.adminService.acceptDriver(body.driverId);
	}

	@Post('vehicles/accept')
	async acceptVehicle(@Body() body: VehicleActionDto) {
		return this.adminService.acceptVehicle(body.vehicleId);
	}
}
