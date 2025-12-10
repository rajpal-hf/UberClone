import { Module } from '@nestjs/common';
import { CronJobService } from './cron-job.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Ride, RideSchema } from 'src/ride/schema/ride.schema';
import { Auth, AuthSchema } from 'src/auth/schema/auth.schema';
import { WebsocketGateway } from 'src/websocket/websocket.gateway';
import { WebsocketModule } from 'src/websocket/websocket.module';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: Ride.name, schema: RideSchema },
			{ name: Auth.name, schema: AuthSchema },
		]),
		WebsocketModule
	],
	providers: [CronJobService],
	exports: [CronJobService],
})
export class CronJobModule {}
