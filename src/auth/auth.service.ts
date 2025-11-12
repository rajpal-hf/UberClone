import { HttpException, HttpStatus, Injectable, Logger, OnApplicationBootstrap, Res } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Auth, AuthDocument } from './schema/auth.schema';
import { Model } from 'mongoose';
import { UserRole } from 'src/common/constants';
import { CreateUserDto, SendOtpDto, UserLoginDto, VerifyNumberDto } from './dto';
import { randomInt} from 'crypto'
import type  {Response} from 'express'
import bcrypt from "bcryptjs"
import { JwtService } from '@nestjs/jwt';
import { MailService} from "../common/mail/mail.service"
import {MailOptions} from "../common/mail/mail.service"
import { SmsOptions, SmsService } from 'src/common/sms/sms.service';
import { Sms, SmsDocument } from './schema/sms.schema';


@Injectable()
export class AuthService implements OnApplicationBootstrap {
	constructor(
		@InjectModel(Auth.name) private authModel: Model<AuthDocument>,
		@InjectModel(Sms.name) private smsModel:Model<SmsDocument>,
		private readonly mailService: MailService,
		private readonly smsService : SmsService,
		private jwt : JwtService
	) { }

	private generateOtp(): string {
		return String(randomInt(100000, 999999)); // Corrected to return a string
	}

	async onApplicationBootstrap() {
		const admin = await this.authModel.findOne({ email: "admin@gmail.com" })
		if (!admin) {
			try {
				await this.authModel.create({
					name: "Admin",
					phone: '1234567890',
					email: "admin@gmail.com",
					password: "admin123",
					role: UserRole.ADMIN,
				})
			} catch (error) {
				throw error instanceof HttpException ? error : new HttpException("Internal Server error - Admin Creation ", 500)
			}
			Logger.log("Default admin Created")
		}
	}

	//``````````````````````````````````````````````````````````````````````````````sign up User/driver

	async signup(dto: CreateUserDto) {
		try {
			const { name, password, email, role } = dto
			const phone = dto.phone.replace(/\s+/g, '').trim();

			if (!name || !password || !phone || !email || !role) {
				throw new HttpException("All Fields are required", 400)
			}
			const userExist = await this.authModel.findOne({ email: email })

			if (userExist) {
				throw new HttpException("User Already exist", 400)
			}

			// hasspass
			const hashpass = await bcrypt.hash(password, 10)

			const user = await this.authModel.create({
				name,
				email,
				password: hashpass,
				phone,
				role: role
			})
			return {
				success: true,
				user
			}

		}
		catch (error) {
			throw error instanceof HttpException
				? error
				: new HttpException('Internal Server Error - signup', 500);
		}

	}

	// ```````````````````````````````````````````````````````````````````````````````login user/driver 
	async login(dto: UserLoginDto,  res: Response) {
		try {
        
        const phone = dto.phone.replace(/\s+/g, '').trim();
        const { otp } = dto;

        if (!phone || !otp) {
            throw new HttpException('All fields are required', HttpStatus.BAD_REQUEST);
        }

        const user = await this.authModel.findOne({ phone });
        if (!user) {
            throw new HttpException('User with this phone not found', HttpStatus.BAD_REQUEST);
        }

     
        const otpRecord = await this.smsModel.findOne({ phone }).sort({ createdAt: -1 });
        if (!otpRecord) {
            throw new HttpException('OTP not found', HttpStatus.BAD_REQUEST);
        }

      
        if (otpRecord.expiresIn < new Date()) {
            throw new HttpException('OTP expired', HttpStatus.BAD_REQUEST);
        }

        
        const isOtpValid = await bcrypt.compare(otp, otpRecord.otp);
        if (!isOtpValid) {
            throw new HttpException('OTP does not match', HttpStatus.BAD_REQUEST);
        }

        // Generate JWT token
        const token = await this.signToken(
            user._id,
            user.email.toString(),
            user.role.toString()
        );

        // Set cookie
        res.cookie('token', token, {
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000, // 1 day
        });

        // Hide password
        user.password = '-----';

        return {
            success: true,
            message: 'Login successful',
            user,
            token,
        };

    } catch (error) {
        throw error instanceof HttpException
            ? error
            : new HttpException('Internal Server Error - login', HttpStatus.INTERNAL_SERVER_ERROR);
    }
}



	async signToken(userId: any, email: string, role: string) {
		const payload = { id: userId, email, role };
		const token = await this.jwt.signAsync(payload, {
			expiresIn: '1d',
			secret: process.env.JWT_SECRET,
		});
		return token ;
	}

	// ```````````````````` ```````````````````````````````````````````````````````````send otp ```````````````



	async emailVerify(dto: SendOtpDto) {
		try {
			const { email } = dto;

			const userExist = await this.authModel.findOne({ email: email });
			if (userExist) {
				throw new HttpException('User already exists with this email', 400);
			}

			const otp = this.generateOtp(); // Generate OTP
			const subject = 'Your OTP Code';
			const body = `Your One-Time Password (OTP) is: ${otp}`;

			const mailOptions: MailOptions = {
				to: email,
				subject,
				body,
			};

			// Send OTP email
			await this.mailService.sendMail(mailOptions);

			return { success: true, message: 'OTP sent successfully!' };
		} catch (error) {
			console.log('Error in sending OTP:', error);
			throw error instanceof HttpException
				? error
				: new HttpException('Internal Server Error', 500);
		}
	}


	async verifyPhone(dto: VerifyNumberDto) {
		try {
			// Normalize phone number (remove spaces, etc.)
			const phone = dto.phone.replace(/\s+/g, '').trim();

			const OTP_EXPIRATION_MS = 5 * 60 * 1000; 
			const RATE_LIMIT_MS = 60 * 1000;         

			// Check rate limit
			const recentOtp = await this.smsModel.findOne({
				phone,
				createdAt: { $gt: new Date(Date.now() - RATE_LIMIT_MS) },
			});

			if (recentOtp) {
				throw new HttpException(
					'Please wait before requesting another OTP',
					HttpStatus.TOO_MANY_REQUESTS,
				);
			}

			// Generate and hash OTP
			const otp = this.generateOtp();
			const hashedOtp = await bcrypt.hash(otp, 10);

			// Send SMS
			const body = `Your OTP is: ${otp}`;
			await this.smsService.sendSms({ to: phone, body });

			// Store OTP
			await this.smsModel.create({
				phone,
				otp: hashedOtp,
				expiresIn: new Date(Date.now() + OTP_EXPIRATION_MS),
			});

			return { success: true, message: 'OTP sent successfully!' };
		} catch (error) {
			throw error instanceof HttpException
				? error
				: new HttpException('Internal Server Error', 500);
		}
	}


}
