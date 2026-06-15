import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UploadsService } from './uploads.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { PresignReceiptSchema, PresignReceiptDto } from './dto/presign.dto';
import type { JwtPayload } from '../common/types/jwt-payload.type';

@ApiTags('uploads')
@ApiBearerAuth('access-token')
@Controller('uploads')
export class UploadsController {
  constructor(private readonly service: UploadsService) {}

  @Post('receipt-presign')
  presignReceipt(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(PresignReceiptSchema)) dto: PresignReceiptDto,
  ) {
    return this.service.presignReceipt(user.id, dto.contentType);
  }
}
