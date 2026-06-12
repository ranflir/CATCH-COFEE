import { Injectable, NotFoundException } from '@nestjs/common';
import type { UserDevice } from '@catch-coffee/db';
import { DevicesRepository } from './devices.repository';
import type { RegisterDeviceDto } from './dto/register-device.dto';
import { ErrorCode } from '../common/constants/error-codes';

@Injectable()
export class DevicesService {
  constructor(private readonly repository: DevicesRepository) {}

  list(userId: string): Promise<UserDevice[]> {
    return this.repository.listByUser(userId);
  }

  async register(userId: string, dto: RegisterDeviceDto): Promise<UserDevice> {
    // 토큰은 기기 단위 고유 → 이미 등록돼 있으면 현재 사용자로 재할당, 없으면 신규 insert
    const existing = await this.repository.findActiveByToken(dto.expoPushToken);
    if (existing) {
      if (existing.userId === userId && existing.platform === dto.platform) {
        return existing;
      }
      return this.repository.reassign(existing.id, {
        userId,
        platform: dto.platform,
      });
    }
    return this.repository.insert({
      userId,
      expoPushToken: dto.expoPushToken,
      platform: dto.platform,
    });
  }

  async remove(id: string, userId: string): Promise<{ id: string }> {
    const removed = await this.repository.softDelete(id, userId);
    if (!removed) {
      throw new NotFoundException({ code: ErrorCode.DEVICE_NOT_FOUND });
    }
    return { id: removed.id };
  }
}
