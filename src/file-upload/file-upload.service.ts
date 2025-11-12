import { Injectable } from '@nestjs/common';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';

@Injectable()
export class FileUploadService {
	private uploadDir = './uploads'; 

	constructor() {
		if (!fs.existsSync(this.uploadDir)) {
			fs.mkdirSync(this.uploadDir, { recursive: true });
		}
	}

	
	getMulterStorage(subFolder: string = '') {
		const destination = join(this.uploadDir, subFolder);

		if (!fs.existsSync(destination)) {
			fs.mkdirSync(destination, { recursive: true });
		}

		return diskStorage({
			destination,
			filename: (req, file, callback) => {
				const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
				const ext = extname(file.originalname);
				const filename = `${file.fieldname}-${uniqueSuffix}${ext}`;
				callback(null, filename);
			},
		});
	}

	getFileUrl(file: Express.Multer.File, subFolder: string = ''): string {

		return `${process.env.BASE_URL || 'http://localhost:3000'}/uploads/${subFolder}/${file.filename}`;
	}
}
