import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { MailModule } from './common/mail/mail.module';

@Module({
	imports: [AuthModule,
		ConfigModule.forRoot(),	
		MongooseModule.forRoot(process.env.MONGO_URL!), MailModule,
	
	],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
