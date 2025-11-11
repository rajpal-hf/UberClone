import { Module } from '@nestjs/common';
import { DriverController } from './driver.controller';
import { DriverService } from './driver.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Driver, DriverSchema } from './schema/driver.schema';
import { JwtModule } from '@nestjs/jwt';

@Module({
	imports: [ 
		MongooseModule.forFeature([
			{ name : Driver.name , schema : DriverSchema}
			
		]),
		JwtModule.register({
				secret: process.env.JWT_SECRET ,
		}),
	],
  controllers: [DriverController],
  providers: [DriverService]
})
export class DriverModule {}
