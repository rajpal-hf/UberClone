import * as firebase from 'firebase-admin';
import { Provider } from '@nestjs/common';

export const firebaseAdminProvider: Provider = {
	provide: 'FIREBASE_ADMIN',
	useFactory: () => {
		if (!firebase.apps.length) {
			firebase.initializeApp({
				credential: firebase.credential.cert({
					projectId: process.env.PROJECT_ID,
					clientEmail: process.env.CLIENT_EMAIL,
					privateKey: process.env.PRIVATE_KEY?.replace(/\\n/g, '\n'),
				}),
			});
		}

		return firebase;
	},
};