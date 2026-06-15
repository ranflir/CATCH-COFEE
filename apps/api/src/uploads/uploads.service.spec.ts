import { InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { UploadsService } from './uploads.service';

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn(),
}));

const mockGetSignedUrl = getSignedUrl as jest.MockedFunction<typeof getSignedUrl>;

function createService(env: Record<string, string | undefined>): UploadsService {
  const config = {
    get: jest.fn((key: string) => env[key]),
    getOrThrow: jest.fn((key: string) => {
      const value = env[key];
      if (value === undefined || value === '') {
        throw new Error(`Missing ${key}`);
      }
      return value;
    }),
  } as unknown as ConfigService;

  return new UploadsService(config);
}

describe('UploadsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSignedUrl.mockResolvedValue('https://signed.example/upload');
  });

  it('presignReceipt returns AWS S3 public URL when endpoint is not set', async () => {
    const service = createService({
      S3_BUCKET: 'my-bucket',
      AWS_REGION: 'ap-northeast-2',
      AWS_ACCESS_KEY_ID: 'key',
      AWS_SECRET_ACCESS_KEY: 'secret',
    });

    const result = await service.presignReceipt('user-1', 'image/jpeg');

    expect(result.uploadUrl).toBe('https://signed.example/upload');
    expect(result.expiresIn).toBe(300);
    expect(result.objectKey).toMatch(/^receipts\/user-1\/[0-9a-f-]+\.jpg$/);
    expect(result.publicUrl).toMatch(
      /^https:\/\/my-bucket\.s3\.ap-northeast-2\.amazonaws\.com\/receipts\/user-1\//,
    );
  });

  it('presignReceipt uses S3_PUBLIC_BASE_URL for R2-style endpoint', async () => {
    const service = createService({
      S3_BUCKET: 'catch-coffee',
      S3_ENDPOINT: 'https://abc123.r2.cloudflarestorage.com',
      S3_PUBLIC_BASE_URL: 'https://pub-xyz.r2.dev',
      AWS_ACCESS_KEY_ID: 'r2-key',
      AWS_SECRET_ACCESS_KEY: 'r2-secret',
    });

    const result = await service.presignReceipt('user-2', 'image/png');

    expect(result.publicUrl).toMatch(/^https:\/\/pub-xyz\.r2\.dev\/receipts\/user-2\/.+\.png$/);
    expect(mockGetSignedUrl).toHaveBeenCalledTimes(1);
  });

  it('throws when R2 endpoint is set without S3_PUBLIC_BASE_URL', async () => {
    const service = createService({
      S3_BUCKET: 'catch-coffee',
      S3_ENDPOINT: 'https://abc123.r2.cloudflarestorage.com',
      AWS_ACCESS_KEY_ID: 'r2-key',
      AWS_SECRET_ACCESS_KEY: 'r2-secret',
    });

    await expect(service.presignReceipt('user-3', 'image/webp')).rejects.toThrow(
      InternalServerErrorException,
    );
  });
});
