// src/websocket/websocket.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WebsocketGateway } from './websocket.gateway';
import { WebsocketService } from './websocket.service';
import { Auth, AuthSchema } from 'src/auth/schema/auth.schema';
import { Driver, DriverSchema } from 'src/driver/schema/driver.schema';
import { Ride, RideSchema } from 'src/ride/schema/ride.schema';
import { JwtModule } from '@nestjs/jwt';
@Module({
	imports: [


		JwtModule.register({secret : process.env.JWT_SECRET}),
		MongooseModule.forFeature([
			{ name: Auth.name, schema: AuthSchema },
			{ name: Driver.name, schema: DriverSchema },
			{ name: Ride.name, schema: RideSchema },
		]),

		
	],
	providers: [WebsocketGateway, WebsocketService],
	exports: [WebsocketGateway, WebsocketService],
})
export class WebsocketModule { }
