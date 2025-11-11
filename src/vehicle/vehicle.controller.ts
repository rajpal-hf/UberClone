import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { VehicleService } from './vehicle.service';
import { CreateVehicleDto } from './dto/vehicle.dto';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/guard/auth.Guard';
import { Roles } from 'src/roleGuard/roles.decorator';
import { UserRole } from 'src/common/constants';

@Controller('vehicle')
export class VehicleController {

	constructor(private readonly vechileService: VehicleService){}
	
	@ApiBearerAuth()
	@UseGuards(AuthGuard)
	@Roles(UserRole.DRIVER)
	@Post('create-vehicle')
	createVehicle(@Body() dto: CreateVehicleDto , @Req() req :any) {
		return this.vechileService.createVehicle(req.user.id , dto)
	}

}
