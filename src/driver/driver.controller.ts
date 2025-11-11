import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { DriverService } from './driver.service';
import { CreateDriverProfileDto } from './dto/driver.dto';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/guard/auth.Guard';
import { Roles } from 'src/roleGuard/roles.decorator';
import { UserRole } from 'src/common/constants';


@ApiBearerAuth()
@UseGuards(AuthGuard)
@Roles(UserRole.DRIVER)
@Controller('driver')
export class DriverController {
	constructor(private readonly driverService: DriverService) { }


	@Post('create-driver')
	createDriver(@Body() dto: CreateDriverProfileDto, @Req() req: any) {
		return this.driverService.createDriver(req.user.id, dto)
	}

}
