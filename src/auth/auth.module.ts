import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Auth, AuthSchema } from './schema/auth.schema';
import { JwtModule } from '@nestjs/jwt';
import { MailModule } from '../common/mail/mail.module'
import { MailService } from '../common/mail/mail.service'



@Module({
	imports: [
		MailModule,
		MongooseModule.forFeature([
			{ name : Auth.name , schema : AuthSchema}
		]),

		JwtModule.register({
			secret: process.env.JWT_SECRET ,
			signOptions: { expiresIn: '1d' },
		}),
	],
  controllers: [AuthController],
	providers: [AuthService,MailService ],


	
})
export class AuthModule {}
