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
import { RazorpayModule } from './payment/razorpay.module';
import { FcmModule } from './fcm/fcm.module';
// import { PayoutModule } from './payout/payout.module';
import { CronJobModule } from './cron-job/cron-job.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
	imports: [

		ScheduleModule.forRoot(),

		AuthModule,
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
		RazorpayModule,
		FcmModule,
		CronJobModule,
		// PayoutModule,
	],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
