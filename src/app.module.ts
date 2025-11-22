import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { MailModule } from './common/mail/mail.module';
import { SmsModule } from './common/sms/sms.module';
import { DriverModule } from './driver/driver.module';
import { VehicleModule } from './vehicle/vehicle.module';
import { AdminModule } from './admin/admin.module';
import { FileUploadModule } from './file-upload/file-upload.module';
import { RideModule } from './ride/ride.module';
import { WebsocketModule } from './websocket/websocket.module';

@Module({
	imports: [AuthModule,
		ConfigModule.forRoot(),	
		MongooseModule.forRoot(process.env.MONGO_URL!),
		MailModule,
		SmsModule,
		DriverModule,
		VehicleModule,
		FileUploadModule,
		RideModule,
		AdminModule,			
		WebsocketModule,
	],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
