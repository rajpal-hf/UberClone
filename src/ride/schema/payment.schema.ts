import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument, Types } from "mongoose";

export enum PaymentStatus {
	SUCCESS = 'SUCCESS',
	FAILED = 'FAILED',
	PENDING = 'PENDING',
}

@Schema()
export class Payment {
	@Prop({ required: true, type: Types.ObjectId, ref: 'Ride' })
	rideId: mongoose.ObjectId;

	@Prop({ required: true, type: Types.ObjectId, ref: 'Auth' })
	riderId: mongoose.ObjectId;

	@Prop({ required: true })
	amount: number;

	@Prop({ required: true })
	transactionId: string;

	@Prop({ required: true, default: Date.now })
	paymentDate: Date;

	@Prop({ required: true, enum: PaymentStatus })
	status: PaymentStatus;
}

export type PaymentDocument = HydratedDocument<Payment>;
export const PaymentSchema = SchemaFactory.createForClass(Payment);
