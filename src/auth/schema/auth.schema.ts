import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import { UserRole } from "src/common/constants";



@Schema({timestamps:true})
export class Auth {
	@Prop({required:true, trim:true})
	name: string 
	
	@Prop({ required: true, trim: true , unique :true})
	email: string 

	@Prop({ required: true, trim: true, unique:true })
	phone: string 

	@Prop({required :true , trim : true }) 
	password : string
		
	@Prop({default :null})
	socketId: string 

	@Prop({ default: UserRole.RIDER })
	role : UserRole
	
}

export type AuthDocument = HydratedDocument<Auth>

export const AuthSchema = SchemaFactory.createForClass(Auth)


