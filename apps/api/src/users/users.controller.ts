import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { UpdateMeSchema, UpdateMeDto } from './dto/update-me.dto';
import type { JwtPayload } from '../common/types/jwt-payload.type';

@ApiTags('users')
@ApiBearerAuth('access-token')
@Controller('me')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  getMe(@CurrentUser() user: JwtPayload) {
    return this.usersService.getMe(user.id);
  }

  @Patch()
  updateMe(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(UpdateMeSchema)) dto: UpdateMeDto,
  ) {
    return this.usersService.updateMe(user.id, dto);
  }
}
