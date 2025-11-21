import {
	Controller,
	Post,
	Headers,
	Req,
	Res,
	HttpStatus,
	Body,
} from '@nestjs/common';
import Razorpay from 'razorpay';
import * as crypto from 'crypto';
import type { Response, Request } from 'express';

@Controller('razorpay/webhook')
export class RazorpayWebhookController {
	private razorpay: Razorpay;

	constructor() {
		this.razorpay = new Razorpay({
			key_id: process.env.RAZORPAY_KEY_ID,
			key_secret: process.env.RAZORPAY_KEY_SECRET,
		});
	}

	@Post()
	async handleWebhook(
		@Req() req: Request,
		@Res() res: Response,
		@Headers('x-razorpay-signature') signature: string,
		@Body() body: any,
	) {
		try {
			const webhookSecret = process.env.RAZORPAY_KEY_SECRET;
			const shasum = crypto.createHmac('sha256', webhookSecret!);
			shasum.update(JSON.stringify(body));
			const digest = shasum.digest('hex');

			// verification webHook ki
			if (digest !== signature) {
				console.log('Invalid webhook signature');
				return res.status(HttpStatus.BAD_REQUEST).json({ success: false });
			}

			console.log('Webhook verified!');
			console.log('Event:', body.event);
			console.log('payload:', body.payload);

			
			switch (body.event) {
				case 'payment.captured':
					console.log('💸 Payment captured:', body.payload.payment.entity);
					// yha pe hogi db-call ko call 
					break;

				case 'order.paid':
					console.log('🧾 Order paid:', body.payload.order.entity);
					// yha pe hogi db-call ko call 
					break;

				default:
					console.log('⚠️ Unhandled event type:', body.event);
			}

			return res.status(HttpStatus.OK).json({ success: true });
		} catch (error) {
			console.error('Webhook Error:', error);
			return res
				.status(HttpStatus.INTERNAL_SERVER_ERROR)
				.json({ success: false });
		}
	}
}
