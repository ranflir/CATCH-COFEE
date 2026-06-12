import { Injectable, NotFoundException } from '@nestjs/common';
import type { PaymentAlert } from '@catch-coffee/db';
import { PaymentAlertsRepository } from './payment-alerts.repository';
import { ErrorCode } from '../common/constants/error-codes';

@Injectable()
export class PaymentAlertsService {
  constructor(private readonly repository: PaymentAlertsRepository) {}

  async list(userId: string): Promise<PaymentAlert['paymentType'][]> {
    const rows = await this.repository.listByUser(userId);
    return rows.map((r) => r.paymentType);
  }

  async add(userId: string, paymentType: PaymentAlert['paymentType']): Promise<void> {
    await this.repository.add(userId, paymentType);
  }

  async remove(userId: string, paymentType: PaymentAlert['paymentType']): Promise<void> {
    const removed = await this.repository.remove(userId, paymentType);
    if (!removed) {
      throw new NotFoundException({ code: ErrorCode.PAYMENT_ALERT_NOT_FOUND });
    }
  }
}
