import { Injectable } from '@nestjs/common';
import firebase from 'firebase-admin';

@Injectable()
export class FcmService {
	async sendPushNotification(token: string, title: string, body: string) {
		const message = {
			notification: {
				title,
				body,
			},
			token,
		
		};
		
		try {
			const response = await firebase.messaging().send(message);
			return { success: true, messageId: response };
		} catch (error) {
			throw new Error(`Failed to send notification: ${error.message}`);
		}
	}
}



