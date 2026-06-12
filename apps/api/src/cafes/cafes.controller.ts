import { Controller, Get, Param, Query } from '@nestjs/common';
import { CafesService } from './cafes.service';
import { Public } from '../common/decorators/public.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CafeSearchSchema, type CafeSearchDto } from './dto/cafe-search.dto';
import { CafeMapSchema, type CafeMapDto } from './dto/cafe-map.dto';
import { CafeDetailQuerySchema, type CafeDetailQueryDto } from './dto/cafe-detail.dto';

@Controller('cafes')
export class CafesController {
  constructor(private readonly cafesService: CafesService) {}

  @Public()
  @Get()
  search(@Query(new ZodValidationPipe(CafeSearchSchema)) query: CafeSearchDto) {
    return this.cafesService.search(query);
  }

  // ':id'보다 먼저 선언해 정적 경로 우선 매칭.
  @Public()
  @Get('map')
  map(@Query(new ZodValidationPipe(CafeMapSchema)) query: CafeMapDto) {
    return this.cafesService.getMapMarkers(query);
  }

  @Public()
  @Get(':id')
  detail(
    @Param('id') id: string,
    @Query(new ZodValidationPipe(CafeDetailQuerySchema)) query: CafeDetailQueryDto,
  ) {
    return this.cafesService.getCafe(id, query.lat, query.lng);
  }

  @Public()
  @Get(':id/discounts')
  discounts(@Param('id') id: string) {
    return this.cafesService.getCafeDiscounts(id);
  }
}
