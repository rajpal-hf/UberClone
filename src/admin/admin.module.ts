import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { Auth, AuthSchema } from 'src/auth/schema/auth.schema';
import { Driver, DriverSchema } from 'src/driver/schema/driver.schema';
import { Vehicle, VehicleSchema } from 'src/vehicle/schema/vehicle.schema';
import { Ride, RideSchema } from 'src/ride/schema/ride.schema';
import { Payment, PaymentSchema } from 'src/ride/schema/payment.schema';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: Auth.name, schema: AuthSchema },
			{ name: Driver.name, schema: DriverSchema },
			{ name: Vehicle.name, schema: VehicleSchema },
			{ name: Ride.name, schema: RideSchema },
			{name : Payment.name, schema : PaymentSchema}
			
		]),
		JwtModule.register({
			secret : process.env.JWT_SECRET
		})

	],
  controllers: [AdminController],
  providers: [AdminService]
})
export class AdminModule {}
