import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CafesService } from '../cafes/cafes.service';
import { UsersService } from './users.service';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { UpdateMeSchema, UpdateMeDto } from './dto/update-me.dto';
import type { JwtPayload } from '../common/types/jwt-payload.type';

@ApiTags('users')
@ApiBearerAuth('access-token')
@Controller('me')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly cafesService: CafesService,
  ) {}

  @Get()
  getMe(@CurrentUser() user: JwtPayload) {
    return this.usersService.getMe(user.id);
  }

  @Roles('seller', 'admin')
  @Get('cafes')
  listMyCafes(@CurrentUser() user: JwtPayload) {
    return this.cafesService.listMyCafes(user);
  }

  @Patch()
  updateMe(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(UpdateMeSchema)) dto: UpdateMeDto,
  ) {
    return this.usersService.updateMe(user.id, dto);
  }
}
