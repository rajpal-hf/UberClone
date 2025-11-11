import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { MailModule } from './common/mail/mail.module';
import { SmsModule } from './common/sms/sms.module';
import { DriverModule } from './driver/driver.module';

@Module({
	imports: [AuthModule,
		ConfigModule.forRoot(),	
		MongooseModule.forRoot(process.env.MONGO_URL!), MailModule, SmsModule, DriverModule,
	
	],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
