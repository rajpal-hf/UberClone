import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument, Types } from "mongoose";
import { PaymentMethod } from "src/common/constants";

@Schema()
export class Payment {
	@Prop({ required: true, type: Types.ObjectId, ref: 'Order' })
	rideId:mongoose.ObjectId;

	@Prop({ required: true, type: Types.ObjectId, ref: 'User' })
	riderId: mongoose.ObjectId;

	@Prop({ required: true })
	amount: number;

	@Prop({ required: true })
	transactionId: string;

	@Prop({ required: true, default: Date.now })
	paymentDate: Date;
	


	@Prop({ required: true, enum: PaymentMethod })
	status: PaymentMethod;
}

export type PaymentDocument = HydratedDocument<Payment>;

export const PaymentSchema = SchemaFactory.createForClass(Payment);