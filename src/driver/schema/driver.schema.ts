// driver.schema.ts
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import * as mongoose from "mongoose";
import { Types } from "mongoose";
import { Auth } from "src/auth/schema/auth.schema";
import { DriverStatus, VerficationSTATUS } from "src/common/constants";
import { Vehicle } from "src/vehicle/schema/vehicle.schema";

@Schema({ timestamps: true })
export class Driver {
	@Prop({ type: Types.ObjectId, ref: 'Auth', required: true })
	userId: mongoose.ObjectId;

	@Prop({ type:Types.ObjectId, ref: 'Vehicle'})
	vehicleId: Vehicle;

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

	@Prop()
	profileUpdateReason: string;


	@Prop({ default: VerficationSTATUS.PENDING, enum: VerficationSTATUS })
	verificationStatusFromAdmin: VerficationSTATUS;		

	@Prop({ default: DriverStatus.OFFLINE, enum: DriverStatus}) // online / offline wala Status
	status: DriverStatus;
}

export const DriverSchema = SchemaFactory.createForClass(Driver);
export type DriverDocument = mongoose.HydratedDocument<Driver>