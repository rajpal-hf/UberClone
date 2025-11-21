import { Module } from '@nestjs/common';
import { RideController } from './ride.controller';
import { RideService } from './ride.service';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { Ride, RideSchema } from './schema/ride.schema';
import { Auth, AuthSchema } from 'src/auth/schema/auth.schema';
import { Driver, DriverSchema } from 'src/driver/schema/driver.schema';
import { WebsocketService } from 'src/websocket/websocket.service';
import { WebsocketGateway } from 'src/websocket/websocket.gateway';
import { RazorpayService } from 'src/payment/razorpay.service';
import { Payment, PaymentSchema } from './schema/payment.schema';

@Module({
	imports: [
		JwtModule.register({
			secret : process.env.JWT_SECRET
		}),
		MongooseModule.forFeature([
			{ name : Ride.name , schema : RideSchema},
			{ name : Auth.name , schema : AuthSchema},
			{ name : Driver.name , schema : DriverSchema},
			{ name : Payment.name , schema : PaymentSchema},
		])
	],
  controllers: [RideController],
	providers: [RideService, WebsocketService, 
		WebsocketGateway, RazorpayService
	]
})
export class RideModule {}
