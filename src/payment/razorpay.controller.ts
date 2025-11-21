// // payment.controller.ts
// import { Body, Controller, Post } from '@nestjs/common';
// import { RazorpayService } from './razorpay.service';
// import { RideService } from '../ride/ride.service';
// import { PaymentMethod } from '../common/constants';

// @Controller('payment')
// export class RazorpayController {
// 	constructor(
// 		private paymentService: RazorpayService,
// 		private rideService: RideService,
// 	) { }

// 	@Post('create-order')
// 	async createOrder(@Body('amount') amount: number) {
// 		const order = await this.paymentService.createOrder(amount);
// 		return {
// 			orderId: order.id,
// 			amount: order.amount,
// 			currency: order.currency,
// 			key: process.env.RAZORPAY_KEY_ID,
// 		};
// 	}

// 	@Post('verify')
// 	async verifyPayment(@Body() body: any) {
// 		const {
// 			razorpay_order_id,
// 			razorpay_payment_id,
// 			razorpay_signature,
// 			rideId,
// 			riderId,
// 			amount,
// 		} = body;

// 		// 1. Verify signature
// 		const valid = this.paymentService.verifyPayment(
// 			razorpay_signature,
// 			razorpay_order_id,
// 			razorpay_payment_id,
// 		);

// 		if (!valid) {
// 			return { success: false, message: 'Invalid signature' };
// 		}

// 		// 2. Validate amount using ride fare
// 		const ride = await this.rideService.getRideById(rideId);
// 		if (!ride) return { success: false, message: 'Ride not found' };

// 		if (ride.fare * 100 !== amount) {
// 			return {
// 				success: false,
// 				message: 'Amount mismatch — possible tampering',
// 			};
// 		}

// 		// ❗❗❗❗❗ IMPORTANT: THIS WAS MISSING ❗❗❗❗❗
// 		// 3. SAVE PAYMENT TO DATABASE
// 		await this.paymentService.savePayment({
// 			rideId,
// 			riderId,
// 			amount: ride.fare,
// 			transactionId: razorpay_payment_id,
// 			status: PaymentMethod.SUCCESS,
// 		});

// 		// 4. Mark ride as paid
// 		await this.rideService.markRidePaid(rideId, razorpay_payment_id);

// 		return { success: true };
// 	}
// }


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
