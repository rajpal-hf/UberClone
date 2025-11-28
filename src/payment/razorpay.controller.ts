// payment.controller.ts
import { Body, Controller, Post } from '@nestjs/common';
import { RazorpayService } from './razorpay.service';

@Controller('payment')
export class RazorpayController {
	constructor(
		private razorpayService: RazorpayService
		
	) { }

	@Post('create-order')
	async createOrder(@Body('amount') amount: number) {
		console.log("Creating order for amount:", amount);
		const order = await this.razorpayService.createOrder(amount);
		return { orderId: order.id, amount: order.amount, currency: order.currency };
	}

	@Post('verify')
	async verifyPayment(@Body() body: any) {

		const {
			razorpay_order_id,																
			razorpay_payment_id,
			razorpay_signature,
			rideId,
			riderId,
			amount,
		} = body;

		// Step 1: Verify signature
		const valid = this.razorpayService.verifyPayment(
			razorpay_signature,
			razorpay_order_id,
			razorpay_payment_id,
		);

		if (!valid) {
			return { success: false, message: 'Invalid signature' };
		}
		// Step 2: Validate amount with ride
		const ride = await this.razorpayService.getRideById(rideId);
		if (!ride) return { success: false, message: 'Ride not found' };

		if (ride.fare! * 100 !== amount) {
			return { success: false, message: 'Amount mismatch' };
		}

		await this.razorpayService.savePayment({
			rideId,
			riderId,
			amount: ride.fare!,
			transactionId: razorpay_payment_id,
			status: "SUCCESS",
		});
		return { success: true };
	}

}
