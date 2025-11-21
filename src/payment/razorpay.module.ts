import { Module } from '@nestjs/common';
import { RazorpayController } from './razorpay.controller';
import { RazorpayService } from './razorpay.service';
import { RazorpayWebhookController } from './razorpay.webhook.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Payment, PaymentSchema } from 'src/ride/schema/payment.schema';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: Payment.name, schema: PaymentSchema },
		]),
	],
  controllers: [RazorpayController,RazorpayWebhookController],
	providers: [RazorpayService],
	exports: [RazorpayService],
})
export class RazorpayModule {}
