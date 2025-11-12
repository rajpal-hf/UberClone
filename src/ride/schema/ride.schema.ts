// ride.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {  HydratedDocument, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Ride  {
	@Prop({ required :true  , type : Types.ObjectId ,ref : 'Auth' })
	riderId: string;

	@Prop({ required: true, type: Types.ObjectId, ref: 'Auth' })
	driverId?: string;

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

	@Prop({ default: 'pending' })
	rideStatus: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';	

	@Prop()
	fare?: number;

	@Prop({ default: 0 })
	distance?: number;

	@Prop({ type: Date })
	startTime?: Date;

	@Prop({ type: Date })
	endTime?: Date;
}

export type RideDocument = HydratedDocument<Ride>
export const RideSchema = SchemaFactory.createForClass(Ride);
