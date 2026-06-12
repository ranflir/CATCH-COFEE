import { Module } from '@nestjs/common';
import { FavoritesController } from './favorites.controller';
import { FavoritesService } from './favorites.service';
import { FavoritesRepository } from './favorites.repository';
import { CafesRepository } from '../cafes/cafes.repository';

@Module({
  controllers: [FavoritesController],
  providers: [FavoritesService, FavoritesRepository, CafesRepository],
})
export class FavoritesModule {}
