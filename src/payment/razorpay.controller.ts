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
		console.log("Verifying payment with body:", body);

		const {razorpay_order_id,razorpay_payment_id,razorpay_signature,rideId,riderId,amount,
		} = body;

		// Step 1: Verify signature
		const valid = this.razorpayService.verifyPayment(
			razorpay_signature,
			razorpay_order_id,
			razorpay_payment_id,
		);
console.log("Is payment signature valid?", valid);
		if (!valid) {
			return { success: false, message: 'Invalid signature' };
		}
		// Step 2: Validate amount with ride
		const ride = await this.razorpayService.getRideById(rideId);
		if (!ride) return { success: false, message: 'Ride not found' };
		console.log("Ride found for payment verification:", rideId, "with fare:", ride.fare);
		console.log("Payment amount:", amount);

		if (ride.fare! * 100 !== amount) {
			return { success: false, message: 'Amount mismatch' };
		}
		console.log("Payment verified successfully for ride:", rideId);

		await this.razorpayService.savePayment({
			rideId,
			riderId,
			amount: ride.fare!,
			transactionId: razorpay_payment_id,
			status: "SUCCESS",
		});

		await this.razorpayService.updatePaymentStatus(rideId, "completed");
		
		return { success: true };
	}

}
