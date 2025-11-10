import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

export interface MailOptions {
	to: string;
	subject: string;
	body: string;
}

@Injectable()
export class MailService {
	private transporter :any;

	constructor() {
		// Create a transporter using your email service credentials
		this.transporter = nodemailer.createTransport({
			host: process.env.EMAIL_HOST, 
			auth: {
				user: process.env.EMAIL_USERNAME,
				pass: process.env.EMAIL_PASSWORD, 
			},
		});
	}

	// Function to send an email
	async sendMail(mailOptions: MailOptions){
		const { to, subject, body } = mailOptions;

		const mailInfo = {
			from: 'noreply@henceforth.com',
			to,
			subject,
			text: body,
		};

		try {
			await this.transporter.sendMail(mailInfo);
			console.log('Email sent successfully!');
		} catch (error) {
			console.error('Error sending email:', error);
			throw new Error('Error sending email');
		}
	}
}
