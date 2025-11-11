import { Module } from '@nestjs/common';
import { VehicleService } from './vehicle.service';
import { VehicleController } from './vehicle.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Vehicle, VehicleSchema } from './schema/vehicle.schema';
import { JwtModule } from '@nestjs/jwt';

@Module({
	imports: [

		JwtModule.register({
			secret: process.env.JWT_SECRET,
		}), 
		MongooseModule.forFeature([
			{ name: Vehicle.name, schema: VehicleSchema }
		])
	],
  providers: [VehicleService],
  controllers: [VehicleController]
})
	
export class VehicleModule {}
