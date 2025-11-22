// ride.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, {  HydratedDocument, Types } from 'mongoose';
import { Auth } from 'src/auth/schema/auth.schema';
import { PaymentMethod, RideCancelBy, VehicleType } from 'src/common/constants';
import { Vehicle } from 'src/vehicle/schema/vehicle.schema';

@Schema({ timestamps: true })
export class Ride  {
	@Prop({ required :true  , type : Types.ObjectId ,ref : 'Auth' })
	riderId: mongoose.ObjectId;

	@Prop({type: Types.ObjectId, ref: 'Auth' })
	driverId?: Auth;

	@Prop({ required: true, enum: VehicleType })
	vehicleType: VehicleType;



	@Prop({ type: Object, required: true })
	pickupLocation: {
		lat: number;
		lng: number;
		address?: string;
	};

	@Prop({ type: Object, required: true })
	dropoffLocation: {
		lat: number;
		lng: number;
		address?: string;
	};

	@Prop({ type: Object})
	driverLocation: {
		lat: number;
		lng: number;
		address?: string;
	};
	@Prop({ type: Object})
	actualDropoffLocation: {
		lat: number;
		lng: number;
		address?: string;
	};

	@Prop({ default: 'pending' })
	rideStatus: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';	

	@Prop()
	pamentMethod?: PaymentMethod; // online/ offline

	@Prop()
	paymentOrderId?: string
	

	@Prop({ default: "pending" })
	paymentStatus: "pending" | "paid" | "failed";


	@Prop()
	fare?: number;

	@Prop({ default: 0 })
	distance?: number;

	@Prop({ type: Date })
	startTime?: Date;

	@Prop({ type: Date })
	endTime?: Date;

	@Prop({ enum: RideCancelBy })
	cancelBy : RideCancelBy
}

export type RideDocument = HydratedDocument<Ride>
export const RideSchema = SchemaFactory.createForClass(Ride);
