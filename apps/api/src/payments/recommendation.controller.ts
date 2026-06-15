import { Controller, Get, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RecommendationService } from './recommendation.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../common/types/jwt-payload.type';

@ApiTags('recommendations')
@ApiBearerAuth('access-token')
@Controller('cafes')
export class RecommendationController {
  constructor(private readonly recommendationService: RecommendationService) {}

  @Get(':cafeId/recommendation')
  getRecommendation(@Param('cafeId') cafeId: string, @CurrentUser() user: JwtPayload) {
    return this.recommendationService.getRecommendation(cafeId, user);
  }
}
