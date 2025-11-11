import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Auth, AuthSchema } from './schema/auth.schema';
import { JwtModule } from '@nestjs/jwt';
import { MailModule } from '../common/mail/mail.module'
import { MailService } from '../common/mail/mail.service'
import { SmsModule } from 'src/common/sms/sms.module';
import { SmsService } from 'src/common/sms/sms.service';
import { Sms, SmsSchema } from './schema/sms.schema';



@Module({
	imports: [
		MailModule,
		SmsModule,
		MongooseModule.forFeature([
			{ name: Auth.name, schema: AuthSchema },
			{ name : Sms.name , schema : SmsSchema}
		]),

		JwtModule.register({
			secret: process.env.JWT_SECRET ,
			signOptions: { expiresIn: '1d' },
		}),
	],
  controllers: [AuthController],
	providers: [AuthService,MailService ,SmsService],


	
})
export class AuthModule {}
