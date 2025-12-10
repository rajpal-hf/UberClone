import { Controller, Get } from '@nestjs/common';
import { FcmService } from './fcm.service';

@Controller('fcm')
export class FcmController {
	constructor(private readonly fcmService: FcmService) { }
	
	@Get('test')
	async sendTestNotification() {
		const message = {
			token: 'fAhFbzktbFEhiF884PlgEd:APA91bFLPz8XZ3r2B_idn_qzlXfqEpM8a_VCGcoahiUrOoPy8IH8YW9tNPnHLun8-KMkfBWdSCIo5Jx2jhoGwL_N3-sUWUEEQbs9gPw8Aglv6X425d3cW1g',
			notification: {
				title: 'Test Notification',
				body: 'This is a test notification from FCM',
			},
		};
		return this.fcmService.sendPushNotification(
			message.token,
			message.notification.title,
			message.notification.body,
		);
	}
}
