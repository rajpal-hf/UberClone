import { Module } from '@nestjs/common';
import { FcmService } from './fcm.service';
import { firebaseAdminProvider } from './fcm-admin';
import { FcmController } from './fcm.controller';

@Module({
  
  providers: [FcmService,firebaseAdminProvider],
  exports: [FcmService],
  controllers: [FcmController],
})
export class FcmModule {}
