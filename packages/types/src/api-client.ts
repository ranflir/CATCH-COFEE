/** NestJS ResponseFormatInterceptor / AllExceptionsFilter 와 동일한 envelope */

export type ApiSuccess<T> = {
  success: true;
  data: T;
};

export type ApiErrorBody = {
  code: string;
  message?: string;
  details?: unknown;
};

export type ApiFailure = {
  success: false;
  error: ApiErrorBody;
  meta?: Record<string, unknown>;
};

export type ApiEnvelope<T> = ApiSuccess<T> | ApiFailure;

export class ApiRequestError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: unknown;

  constructor(status: number, error: ApiErrorBody) {
    super(error.message ?? error.code);
    this.name = 'ApiRequestError';
    this.code = error.code;
    this.status = status;
    this.details = error.details;
  }
}

export type ApiClientOptions = {
  baseUrl: string;
  getAccessToken?: () => string | null | undefined;
};

export type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  /** envelope 없이 raw JSON 반환 (드물게 사용) */
  raw?: boolean;
};

/**
 * Catch Coffee REST API fetch 클라이언트.
 * 성공 시 `data` 필드만 반환, 실패 시 ApiRequestError throw.
 */
export class ApiClient {
  constructor(private readonly options: ApiClientOptions) {}

  get baseUrl(): string {
    return this.options.baseUrl.replace(/\/$/, '');
  }

  async request<T>(path: string, init: RequestOptions = {}): Promise<T> {
    const { body, raw, headers: initHeaders, ...rest } = init;
    const headers = new Headers(initHeaders);

    if (body !== undefined && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const token = this.options.getAccessToken?.();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...rest,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    const json: unknown = await response.json().catch(() => null);

    if (raw) {
      return json as T;
    }

    if (!response.ok || !json || typeof json !== 'object') {
      throw new ApiRequestError(response.status, {
        code: 'HTTP_ERROR',
        message: `HTTP ${response.status}`,
      });
    }

    const envelope = json as ApiEnvelope<T>;
    if (!envelope.success) {
      throw new ApiRequestError(response.status, envelope.error);
    }

    return envelope.data;
  }
}

/** R2 presigned URL 로 브라우저에서 직접 PUT (CORS는 R2 버킷 설정) */
export async function uploadReceiptToPresignedUrl(
  uploadUrl: string,
  file: Blob,
  contentType: string,
): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: file,
  });

  if (!response.ok) {
    throw new Error(`영수증 업로드 실패 (HTTP ${response.status})`);
  }
}

export type ReceiptContentType = 'image/jpeg' | 'image/png' | 'image/webp';

export type PresignReceiptResult = {
  uploadUrl: string;
  objectKey: string;
  publicUrl: string;
  expiresIn: number;
};

export async function presignAndUploadReceipt(
  client: ApiClient,
  file: File,
): Promise<PresignReceiptResult & { publicUrl: string }> {
  const contentType = file.type as ReceiptContentType;
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(contentType)) {
    throw new Error('JPEG, PNG, WebP 이미지만 업로드할 수 있습니다.');
  }

  const presign = await client.request<PresignReceiptResult>(
    '/api/v1/uploads/receipt-presign',
    { method: 'POST', body: { contentType } },
  );

  await uploadReceiptToPresignedUrl(presign.uploadUrl, file, contentType);
  return presign;
}
