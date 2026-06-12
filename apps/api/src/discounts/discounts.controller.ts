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
import { DiscountsService } from './discounts.service';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CreateDiscountSchema, type CreateDiscountDto } from './dto/create-discount.dto';
import { UpdateDiscountSchema, type UpdateDiscountDto } from './dto/update-discount.dto';
import type { JwtPayload } from '../common/types/jwt-payload.type';

@Controller()
export class DiscountsController {
  constructor(private readonly discountsService: DiscountsService) {}

  @Public()
  @Get('discounts/:id')
  getOne(@Param('id') id: string) {
    return this.discountsService.getDiscount(id);
  }

  @Roles('seller', 'admin')
  @Post('cafes/:cafeId/discounts')
  @HttpCode(HttpStatus.CREATED)
  create(
    @Param('cafeId') cafeId: string,
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(CreateDiscountSchema)) dto: CreateDiscountDto,
  ) {
    return this.discountsService.createForCafe(cafeId, user, dto);
  }

  @Roles('seller', 'admin')
  @Patch('discounts/:id')
  update(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(UpdateDiscountSchema)) dto: UpdateDiscountDto,
  ) {
    return this.discountsService.updateDiscount(id, user, dto);
  }

  @Roles('seller', 'admin')
  @Delete('discounts/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.discountsService.deleteDiscount(id, user);
  }
}
