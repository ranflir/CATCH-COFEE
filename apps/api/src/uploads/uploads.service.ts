import { Injectable } from '@nestjs/common';
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
      this._client = new S3Client({
        region: this.config.getOrThrow<string>('AWS_REGION'),
      });
    }
    return this._client;
  }

  private publicBaseUrl(bucket: string): string {
    const configured = this.config.get<string>('S3_PUBLIC_BASE_URL');
    if (configured) {
      return configured.replace(/\/$/, '');
    }
    const region = this.config.getOrThrow<string>('AWS_REGION');
    return `https://${bucket}.s3.${region}.amazonaws.com`;
  }
}
