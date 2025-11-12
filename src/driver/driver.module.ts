import { Module } from '@nestjs/common';
import { DriverController } from './driver.controller';
import { DriverService } from './driver.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Driver, DriverSchema } from './schema/driver.schema';
import { JwtModule } from '@nestjs/jwt';
import { FileUploadService } from 'src/file-upload/file-upload.service';
import { AuthModule } from 'src/auth/auth.module';
import { Auth, AuthSchema } from 'src/auth/schema/auth.schema';

@Module({
	imports: [
		
		MongooseModule.forFeature([
			{ name: Driver.name, schema: DriverSchema },
			{ name : Auth.name , schema : AuthSchema}
		]),
		JwtModule.register({
				secret: process.env.JWT_SECRET ,
		}),
	],
	
  controllers: [DriverController],
	providers: [DriverService, FileUploadService]
})
export class DriverModule {}
