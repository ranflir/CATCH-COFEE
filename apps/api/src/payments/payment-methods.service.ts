import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { PaymentMethod } from '@catch-coffee/db';
import { PaymentMethodsRepository } from './payment-methods.repository';
import type { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import type { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';
import { encryptSecret } from '../common/utils/crypto.util';
import { ErrorCode } from '../common/constants/error-codes';

export interface PaymentMethodView {
  id: string;
  type: PaymentMethod['type'];
  label: string;
  isDefault: boolean;
  hasToken: boolean;
  createdAt: Date;
}

function toView(pm: PaymentMethod): PaymentMethodView {
  return {
    id: pm.id,
    type: pm.type,
    label: pm.label,
    isDefault: pm.isDefault,
    hasToken: pm.encryptedToken !== null,
    createdAt: pm.createdAt,
  };
}

@Injectable()
export class PaymentMethodsService {
  constructor(
    private readonly repository: PaymentMethodsRepository,
    private readonly config: ConfigService,
  ) {}

  async list(userId: string): Promise<PaymentMethodView[]> {
    const rows = await this.repository.listByUser(userId);
    return rows.map(toView);
  }

  async create(userId: string, dto: CreatePaymentMethodDto): Promise<PaymentMethodView> {
    const pm = await this.repository.create({
      userId,
      type: dto.type,
      label: dto.label,
      encryptedToken: dto.token ? this.encrypt(dto.token) : undefined,
      isDefault: dto.isDefault ?? false,
    });
    return toView(pm);
  }

  async update(
    id: string,
    userId: string,
    dto: UpdatePaymentMethodDto,
  ): Promise<PaymentMethodView> {
    const pm = await this.repository.update(id, userId, {
      label: dto.label,
      isDefault: dto.isDefault,
      ...(dto.token !== undefined && { encryptedToken: this.encrypt(dto.token) }),
    });
    if (!pm) {
      throw new NotFoundException({ code: ErrorCode.PAYMENT_METHOD_NOT_FOUND });
    }
    return toView(pm);
  }

  async remove(id: string, userId: string): Promise<void> {
    const deleted = await this.repository.softDelete(id, userId);
    if (!deleted) {
      throw new NotFoundException({ code: ErrorCode.PAYMENT_METHOD_NOT_FOUND });
    }
  }

  private encrypt(token: string): string {
    return encryptSecret(token, this.config.getOrThrow<string>('ENCRYPTION_KEY'));
  }
}
