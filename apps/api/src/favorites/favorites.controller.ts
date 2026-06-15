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
import { FavoritesService } from './favorites.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  AddFavoriteSchema,
  AddFavoriteDto,
  UpdateFavoriteSchema,
  UpdateFavoriteDto,
} from './dto/favorite.dto';
import type { JwtPayload } from '../common/types/jwt-payload.type';

@ApiTags('favorites')
@ApiBearerAuth('access-token')
@Controller()
export class FavoritesController {
  constructor(private readonly service: FavoritesService) {}

  @Get('me/favorites')
  list(@CurrentUser() user: JwtPayload) {
    return this.service.list(user.id);
  }

  @Post('cafes/:cafeId/favorites')
  @HttpCode(HttpStatus.NO_CONTENT)
  add(
    @CurrentUser() user: JwtPayload,
    @Param('cafeId') cafeId: string,
    @Body(new ZodValidationPipe(AddFavoriteSchema)) dto: AddFavoriteDto,
  ) {
    return this.service.add(user.id, cafeId, dto.notifyEnabled ?? true);
  }

  @Patch('cafes/:cafeId/favorites')
  updateNotify(
    @CurrentUser() user: JwtPayload,
    @Param('cafeId') cafeId: string,
    @Body(new ZodValidationPipe(UpdateFavoriteSchema)) dto: UpdateFavoriteDto,
  ) {
    return this.service.updateNotify(user.id, cafeId, dto.notifyEnabled);
  }

  @Delete('cafes/:cafeId/favorites')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: JwtPayload, @Param('cafeId') cafeId: string) {
    return this.service.remove(user.id, cafeId);
  }
}
