import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { RECEIPT_CONTENT_TYPES } from './dto/presign.dto';

const PRESIGN_EXPIRES_SECONDS = 300;

export interface PresignResult {
  uploadUrl: string;
  objectKey: string;
  publicUrl: string;
  expiresIn: number;
}

@Injectable()
export class UploadsService {
  private _client?: S3Client;

  constructor(private readonly config: ConfigService) {}

  async presignReceipt(userId: string, contentType: string): Promise<PresignResult> {
    const bucket = this.config.getOrThrow<string>('S3_BUCKET');
    const ext = RECEIPT_CONTENT_TYPES[contentType] ?? 'bin';
    const objectKey = `receipts/${userId}/${randomUUID()}.${ext}`;

    const uploadUrl = await getSignedUrl(
      this.client,
      new PutObjectCommand({ Bucket: bucket, Key: objectKey, ContentType: contentType }),
      { expiresIn: PRESIGN_EXPIRES_SECONDS },
    );

    return {
      uploadUrl,
      objectKey,
      publicUrl: `${this.publicBaseUrl(bucket)}/${objectKey}`,
      expiresIn: PRESIGN_EXPIRES_SECONDS,
    };
  }

  private get client(): S3Client {
    if (!this._client) {
      const endpoint = this.config.get<string>('S3_ENDPOINT')?.replace(/\/$/, '');
      const accessKeyId = this.config.get<string>('AWS_ACCESS_KEY_ID');
      const secretAccessKey = this.config.get<string>('AWS_SECRET_ACCESS_KEY');

      // R2 등 커스텀 endpoint 는 region 'auto' + path-style 권장
      const region = endpoint
        ? (this.config.get<string>('AWS_REGION') ?? 'auto')
        : this.config.getOrThrow<string>('AWS_REGION');

      this._client = new S3Client({
        region,
        ...(endpoint ? { endpoint, forcePathStyle: true } : {}),
        ...(accessKeyId && secretAccessKey
          ? { credentials: { accessKeyId, secretAccessKey } }
          : {}),
      });
    }
    return this._client;
  }

  private publicBaseUrl(bucket: string): string {
    const configured = this.config.get<string>('S3_PUBLIC_BASE_URL')?.replace(/\/$/, '');
    if (configured) {
      return configured;
    }

    const endpoint = this.config.get<string>('S3_ENDPOINT');
    if (endpoint) {
      // R2/S3 호환 스토리지는 공개 URL 을 자동 추론할 수 없음 → 명시 필요
      throw new InternalServerErrorException(
        'S3_PUBLIC_BASE_URL 환경변수가 필요합니다 (R2 public bucket URL 또는 커스텀 도메인).',
      );
    }

    const region = this.config.getOrThrow<string>('AWS_REGION');
    return `https://${bucket}.s3.${region}.amazonaws.com`;
  }
}
