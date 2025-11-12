import { Module } from '@nestjs/common';
import { RideController } from './ride.controller';
import { RideService } from './ride.service';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { Ride, RideSchema } from './schema/ride.schema';

@Module({
	imports: [
		JwtModule.register({
			secret : process.env.JWT_SECRET
		}),
		MongooseModule.forFeature([
			{ name : Ride.name , schema : RideSchema}
		])
	],
  controllers: [RideController],
  providers: [RideService]
})
export class RideModule {}
