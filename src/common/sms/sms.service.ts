import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { randomInt } from 'crypto';
import twilio, { Twilio } from 'twilio';

export interface SmsOptions {
	to: string
	body : string
}

@Injectable()
export class SmsService {
	private client: Twilio;

	private readonly accountSid = process.env.TWILIO_ACCOUNT_SID;
	private readonly authToken = process.env.TWILIO_AUTH_TOKEN;
	private readonly fromNumber = process.env.TWILIO_PHONE_NUMBER;
	private readonly verifyServiceSid = process.env.VERIFY_SERVICE_SID;

	constructor() {
		if (!this.accountSid || !this.authToken) {
			throw new Error('Twilio credentials are missing from environment variables.');
		}
		this.client = twilio(this.accountSid, this.authToken);
	}

	// ✅ Generate a 6-digit OTP


	// ✅ Send an OTP SMS
	async sendSms(options: SmsOptions) {
		const {body , to} = options
		if (!this.fromNumber) {
			throw new HttpException('Twilio phone number not configured', HttpStatus.BAD_REQUEST);
		}


		try {
			const message = await this.client.messages.create({
				body: body,
				from: this.fromNumber,
				to : to,
			});

			return {
				success: true,
				sid: message.sid,
				status: message.status,
			};
		} catch (error: any) {
			console.error('Error in sendSms:', error);
			throw new HttpException(
				error.message || 'Failed to send SMS',
				HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}
}
