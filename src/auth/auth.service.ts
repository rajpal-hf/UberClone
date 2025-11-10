import { HttpException, HttpStatus, Injectable, Logger, OnApplicationBootstrap, Res } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Auth, AuthDocument } from './schema/auth.schema';
import { Model } from 'mongoose';
import { UserRole } from 'src/common/constants';
import { CreateUserDto, SendOtpDto, UserLoginDto } from './dto';
import { randomInt} from 'crypto'
import type  {Response} from 'express'
import bcrypt from "bcryptjs"
import { JwtService } from '@nestjs/jwt';
import { MailService} from "../common/mail/mail.service"
import {MailOptions} from "../common/mail/mail.service"


@Injectable()
export class AuthService implements OnApplicationBootstrap {
	constructor(
		@InjectModel(Auth.name) private authModel: Model<AuthDocument>,
		private readonly mailService : MailService,
		private jwt : JwtService
	) { }


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
			const { name, password, phone, email, role } = dto

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



	// ```````````````````` send otp ```````````````

  private generateOtp(): string {
    return String(randomInt(100000, 999999)); // Corrected to return a string
  }

  async sendOtp(dto: SendOtpDto) {
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


	// login user/driver 
	async login(dto: UserLoginDto,  res: Response) {
		try {
			const { email, password } = dto;

			if (!email || !password) {
				throw new HttpException('All fields are required', 400);
			}

			const user = await this.authModel.findOne({ email });
			if (!user) {
				throw new HttpException('User with this email not found', 400);
			}

			// Check password
			const checkPass = await bcrypt.compare(password, user.password);
			if (!checkPass) {
				throw new HttpException('Password does not match', 400);
			}

			

			const token = await this.signToken(
				user._id,
				user.email.toString(),
				user.role.toString(),
			);


			res.cookie('token', token, {
				httpOnly: true,
				maxAge: 24 * 60 * 60 * 1000, 
			});

			user.password = "-----";

			return {
				success: true,
				message: 'Login successful',
				user,
				tok : token,
			};
		} catch (error) {
			throw error instanceof HttpException
				? error
				: new HttpException('Internal Server Error - login', 500);
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

	async getALL() {
		return await this.authModel.find();
}

	}
