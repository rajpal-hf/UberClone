// driver.schema.ts
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, HydratedDocument } from "mongoose";
import { Types } from "mongoose";
import { DriverStatus, VerficationSTATUS } from "src/common/constants";

@Schema({ timestamps: true })
export class Driver extends Document {
	@Prop({ type: Types.ObjectId, ref: 'Auth', required: true })
	driverId: string;


	@Prop({ required: true, default : true})
	IsPhoneNumberVerified: boolean;

	@Prop({ required: true, default: true })
	IsEmailVerified: boolean;

	@Prop({ default: VerficationSTATUS.PENDING, enum: VerficationSTATUS})
	verificationStatusFromAdmin: VerficationSTATUS;		

	@Prop({})
	vehicleId: string;

	@Prop()
	panNumber:string

	// can add vehicle image 


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

	@Prop({
		type: {
			type: String,
			enum: ['Point'],
			default: 'Point'
		},
		coordinates: { type: [Number], default: [0, 0] }
	})
	location: {
		type: string;
		coordinates: [number, number];
	};

	@Prop({ default: DriverStatus.OFFLINE, enum: DriverStatus})
	status: DriverStatus;
}

export const DriverSchema = SchemaFactory.createForClass(Driver);
export type DriverDocument = HydratedDocument<Driver>



// DriverSchema.index({ location: '2dsphere' });
