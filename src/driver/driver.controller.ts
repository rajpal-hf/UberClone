import {
	Body,
	Controller,
	Post,
	Req,
	UseGuards,
	UploadedFiles,
	UseInterceptors,
} from '@nestjs/common';
import { DriverService } from './driver.service';
import { CreateDriverProfileDto } from './dto/driver.dto';
import { ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/guard/auth.Guard';
import { Roles } from 'src/roleGuard/roles.decorator';
import { UserRole } from 'src/common/constants';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { FileUploadService } from 'src/file-upload/file-upload.service';

@ApiBearerAuth()
@UseGuards(AuthGuard)
@Roles(UserRole.DRIVER)
@Controller('driver')
export class DriverController {
	constructor(
		private readonly driverService: DriverService,
		private readonly fileUploadService: FileUploadService,
	) { }

	@Post('create-driver')
	@ApiConsumes('multipart/form-data')
	@UseInterceptors(
		AnyFilesInterceptor({
			storage: new FileUploadService().getMulterStorage('driverDocs'),
		}),
	)
	async createDriver(
		@UploadedFiles() files: Express.Multer.File[],
		@Body() dto: CreateDriverProfileDto,
		@Req() req: any,
	) {
		const uploadedFiles: Record<string, string> = {};

		for (const file of files) {
			uploadedFiles[file.fieldname] = this.fileUploadService.getFileUrl(file, 'drivers');
		}

		 const updatedDto = {
			...dto,
			aadhaarFront: uploadedFiles['aadhaarFront'] || dto.aadhaarFront,
			aadhaarBack: uploadedFiles['aadhaarBack'] || dto.aadhaarBack,
			licensePhoto: uploadedFiles['licensePhoto'] || dto.licensePhoto,
		};

		return this.driverService.createDriver(req.user.id, updatedDto);
	}
}
