import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, HydratedDocument } from "mongoose";
import { Types } from "mongoose";
import { VehicleType, VerficationSTATUS } from "src/common/constants";



@Schema({ timestamps: true })
export class Vehicle extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Auth', required: true })
  driverId: string;

  @Prop({ required: true, enum : VehicleType })
  vehicleType: VehicleType; 

  @Prop({ required: true })
  modelName: string;

  @Prop({ required: true })
  color: string;

  @Prop({ required: true })
  plateNumber: string;

  @Prop()
  rcBookUrl: string;

  @Prop({ default: VerficationSTATUS.PENDING, enum:VerficationSTATUS })
  verificationStatus: VerficationSTATUS;
}

export const VehicleSchema = SchemaFactory.createForClass(Vehicle);
export type VehicleDocument = HydratedDocument<Vehicle>
