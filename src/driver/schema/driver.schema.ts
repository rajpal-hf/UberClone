// driver.schema.ts
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, HydratedDocument } from "mongoose";
import { Types } from "mongoose";
import { DriverStatus, VerficationSTATUS } from "src/common/constants";

@Schema({ timestamps: true })
export class Driver {
	@Prop({ type: Types.ObjectId, ref: 'Auth', required: true })
	driverId: string;

	@Prop({})
	vehicleId: string;

	@Prop()
	panNumber:string

	@Prop()
	licenseNumber: string;


	@Prop()
	licensePhotoUrl: string; 

	@Prop()
	aadhaarNumber: string;


	@Prop()
	aadhaarFrontUrl: string;


	@Prop()
	aadhaarBackUrl: string;


	@Prop({ required: true, default: true })
	IsPhoneNumberVerified: boolean;

	@Prop({ required: true, default: true })
	IsEmailVerified: boolean;

	@Prop({ default: VerficationSTATUS.PENDING, enum: VerficationSTATUS })
	verificationStatusFromAdmin: VerficationSTATUS;		

	@Prop({ default: DriverStatus.OFFLINE, enum: DriverStatus}) // online / offline wala Status
	status: DriverStatus;
}

export const DriverSchema = SchemaFactory.createForClass(Driver);
export type DriverDocument = HydratedDocument<Driver>


