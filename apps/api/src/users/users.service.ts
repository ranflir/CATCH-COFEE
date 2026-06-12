import { Injectable, NotFoundException } from '@nestjs/common';
import type { User } from '@catch-coffee/db';
import { UsersRepository } from './users.repository';
import type { UpdateMeDto } from './dto/update-me.dto';
import { ErrorCode } from '../common/constants/error-codes';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: string;
  trustScore: number;
  createdAt: Date;
}

function toProfile(user: User): UserProfile {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    role: user.role,
    trustScore: user.trustScore,
    createdAt: user.createdAt,
  };
}

@Injectable()
export class UsersService {
  constructor(private readonly repository: UsersRepository) {}

  async getMe(userId: string): Promise<UserProfile> {
    const user = await this.repository.findActiveById(userId);
    if (!user) {
      throw new NotFoundException({ code: ErrorCode.AUTH_USER_NOT_FOUND });
    }
    return toProfile(user);
  }

  async updateMe(userId: string, dto: UpdateMeDto): Promise<UserProfile> {
    const user = await this.repository.updateProfile(userId, dto);
    if (!user) {
      throw new NotFoundException({ code: ErrorCode.AUTH_USER_NOT_FOUND });
    }
    return toProfile(user);
  }
}
