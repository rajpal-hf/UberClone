import { Module } from '@nestjs/common';
import { RazorpayController } from './razorpay.controller';
import { RazorpayService } from './razorpay.service';
import { RazorpayWebhookController } from './razorpay.webhook.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Payment, PaymentSchema } from 'src/ride/schema/payment.schema';
import { Ride, RideSchema } from 'src/ride/schema/ride.schema';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: Payment.name, schema: PaymentSchema },
			{ name: Ride.name, schema: RideSchema },

		]),
	],
  controllers: [RazorpayController,RazorpayWebhookController],
	providers: [RazorpayService],
	exports: [RazorpayService],
})
export class RazorpayModule {}
