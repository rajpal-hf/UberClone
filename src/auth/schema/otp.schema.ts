import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ timestamps: true })
export class Otp {
	@Prop({ required: true })
	email: string;

	@Prop({ required: true })
	otp: string;

	@Prop({ type: Date, required: true })
	expiresIn: Date;
}

export type OtpDocument = HydratedDocument<Otp>;
export const OtpSchema = SchemaFactory.createForClass(Otp);

OtpSchema.index({ expiresIn: 1 }, { expireAfterSeconds: 0 });


