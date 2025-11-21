// payment.service.ts
import { HttpException, Injectable } from '@nestjs/common';
import Razorpay from 'razorpay';
import * as crypto from 'crypto';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Payment, PaymentDocument } from 'src/ride/schema/payment.schema';
import { Ride, RideDocument } from 'src/ride/schema/ride.schema';

@Injectable()
export class RazorpayService {
	private razorpay: Razorpay;

	constructor(
		@InjectModel(Payment.name) private readonly paymentModel: Model<PaymentDocument>,
		@InjectModel(Ride.name) private readonly rideModel	: Model<RideDocument>,
	) {
			this.razorpay = new Razorpay({
			key_id: process.env.RAZORPAY_KEY_ID,
			key_secret: process.env.RAZORPAY_KEY_SECRET,
		});
	}

	async createOrder(amount: number, currency = 'INR') {
		const options = {
			amount: amount * 100, 
			currency,
			receipt: 'receipt_' + new Date().getTime(),
		};
		const order = await this.razorpay.orders.create(options);
		return order;
	}

	verifyPayment(signature: string, orderId: string, paymentId: string) {
		const body = orderId + '|' + paymentId;
		const expectedSignature = crypto
			.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
			.update(body.toString())
			.digest('hex');
		return expectedSignature === signature;
	}	


	async savePayment(data: {
		rideId: string,
		riderId: string,
		amount: number,
		transactionId: string,
		status: string,
	}) {
		const payment = await this.paymentModel.create({
			rideId: new Types.ObjectId(data.rideId),
			riderId: new Types.ObjectId(data.riderId),
			amount: data.amount,
			transactionId: data.transactionId,
			status: data.status
		});
		return payment;
	}


	async getRideById(rideId: string) {
		try {
			const ride = await this.rideModel.findById(rideId);
			if (!ride) {
				throw new HttpException('Ride not found', 404);
			}
			return ride;	
		} catch (error) {
			console.log(error)
			throw error instanceof HttpException ? error : new HttpException("Internal Server Error - getting driver for ride", 500)
		}
	}	


}
