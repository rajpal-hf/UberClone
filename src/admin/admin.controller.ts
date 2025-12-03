// admin/admin.controller.ts
import { Controller, Get, Post, Query, Body, UseGuards, Param } from '@nestjs/common';
import { AdminService } from './admin.service';
import { DriverActionDto, GetDriversDto, GetUsersDto, VehicleActionDto } from './dto/admin.dto';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/guard/auth.Guard';
import { RolesGuard } from 'src/roleGuard/roles.guard';
import { Roles } from 'src/roleGuard/roles.decorator';
import { UserRole } from 'src/common/constants';


	
@ApiBearerAuth()
@UseGuards(AuthGuard , RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin')
	
export class AdminController {
	constructor(private readonly adminService: AdminService) { }

	@Get('dashboard')
	async getDashboardStats() {
		return this.adminService.getDashboardStats();
	}

	@Get('trips')
	async getTrips(@Query() query: GetDriversDto) {
		return this.adminService.getTrips(query.page || 1, query.limit|| 10);
	}

	@Get('payments')
	async getPayments(@Query() query: GetDriversDto) {
		return this.adminService.getPayments(query.page || 1, query.limit|| 10);
	}

	@Get('ride-status-summary')
	async getRideStatusSummary() {
		return this.adminService.getRideStatusSummary();
	}

	@Get('weekly-revenue')
	async getWeeklyRevenue() {
		return this.adminService.getWeeklyRevenue();
	}		

	@Get('riders')
	async getUsers(@Query() query: GetUsersDto) {
		return this.adminService.getRider(query.page || 1, query.limit || 10);
	}
	@Get('riders/:id')
	async getUserById(@Param('id') id: string	) {
		return this.adminService.getSingleRider(id);
	}

	@Get('drivers')
	async getDrivers(@Query() query: GetDriversDto) {
		return this.adminService.getDriver(query.page || 1, query.limit|| 10);
	}

	@Get('new-drivers')
	async getNewDrivers(@Query() query: GetDriversDto) {
		return this.adminService.getNewDrivers(query.page || 1, query.limit|| 10);
	}
	@Post('drivers/accept')
	async acceptDriver(@Body() body: DriverActionDto) {
		return this.adminService.acceptDriver(body.userId);
	}

	@Post('vehicles/accept')
	async acceptVehicle(@Body() body: VehicleActionDto) {
		return this.adminService.acceptVehicle(body.vehicleId);
	}
}
