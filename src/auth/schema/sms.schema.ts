import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ timestamps: true })
export class Sms {
	@Prop({ required: true })
	phone: string;

	@Prop({ required: true })
	otp: string;

	
	@Prop({ type: Date, required: true })
	expiresIn: Date;
}

export type SmsDocument = HydratedDocument<Sms>;
export const SmsSchema = SchemaFactory.createForClass(Sms);


// TTL - auto delete expire in s
SmsSchema.index({ expiresIn: 1 }, { expireAfterSeconds: 0 });
