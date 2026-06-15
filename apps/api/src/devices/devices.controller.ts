import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DevicesService } from './devices.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  RegisterDeviceSchema,
  RegisterDeviceDto,
} from './dto/register-device.dto';
import type { JwtPayload } from '../common/types/jwt-payload.type';

@ApiTags('devices')
@ApiBearerAuth('access-token')
@Controller('me/devices')
export class DevicesController {
  constructor(private readonly service: DevicesService) {}

  @Get()
  list(@CurrentUser() user: JwtPayload) {
    return this.service.list(user.id);
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  register(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(RegisterDeviceSchema)) dto: RegisterDeviceDto,
  ) {
    return this.service.register(user.id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.service.remove(id, user.id);
  }
}
