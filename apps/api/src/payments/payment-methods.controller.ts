import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PaymentMethodsService } from './payment-methods.service';
import { Idempotent } from '../common/decorators/idempotent.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  CreatePaymentMethodSchema,
  CreatePaymentMethodDto,
} from './dto/create-payment-method.dto';
import {
  UpdatePaymentMethodSchema,
  UpdatePaymentMethodDto,
} from './dto/update-payment-method.dto';
import type { JwtPayload } from '../common/types/jwt-payload.type';

@ApiTags('payment-methods')
@ApiBearerAuth('access-token')
@Controller('me/payment-methods')
export class PaymentMethodsController {
  constructor(private readonly service: PaymentMethodsService) {}

  @Get()
  list(@CurrentUser() user: JwtPayload) {
    return this.service.list(user.id);
  }

  @Post()
  @Idempotent()
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(CreatePaymentMethodSchema)) dto: CreatePaymentMethodDto,
  ) {
    return this.service.create(user.id, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdatePaymentMethodSchema)) dto: UpdatePaymentMethodDto,
  ) {
    return this.service.update(id, user.id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.service.remove(id, user.id);
  }
}
