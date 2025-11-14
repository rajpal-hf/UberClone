import { Module } from '@nestjs/common';
import { VehicleService } from './vehicle.service';
import { VehicleController } from './vehicle.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Vehicle, VehicleSchema } from './schema/vehicle.schema';
import { JwtModule } from '@nestjs/jwt';
import { Driver, DriverSchema } from 'src/driver/schema/driver.schema';

@Module({
	imports: [

		JwtModule.register({
			secret: process.env.JWT_SECRET,
		}), 
		MongooseModule.forFeature([
			{ name: Vehicle.name, schema: VehicleSchema },
			{ name: Driver.name, schema: DriverSchema },
		])
	],
  providers: [VehicleService],
  controllers: [VehicleController]
})
	
export class VehicleModule {}
