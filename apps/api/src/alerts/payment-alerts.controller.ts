import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PaymentAlertsService } from './payment-alerts.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  AddPaymentAlertSchema,
  PaymentTypeSchema,
  AddPaymentAlertDto,
} from './dto/payment-alert.dto';
import { ErrorCode } from '../common/constants/error-codes';
import type { JwtPayload } from '../common/types/jwt-payload.type';

@ApiTags('payment-alerts')
@ApiBearerAuth('access-token')
@Controller('me/payment-alerts')
export class PaymentAlertsController {
  constructor(private readonly service: PaymentAlertsService) {}

  @Get()
  list(@CurrentUser() user: JwtPayload) {
    return this.service.list(user.id);
  }

  @Post()
  @HttpCode(HttpStatus.NO_CONTENT)
  add(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(AddPaymentAlertSchema)) dto: AddPaymentAlertDto,
  ) {
    return this.service.add(user.id, dto.paymentType);
  }

  @Delete(':paymentType')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: JwtPayload, @Param('paymentType') paymentType: string) {
    const parsed = PaymentTypeSchema.safeParse(paymentType);
    if (!parsed.success) {
      throw new NotFoundException({ code: ErrorCode.PAYMENT_ALERT_NOT_FOUND });
    }
    return this.service.remove(user.id, parsed.data);
  }
}
