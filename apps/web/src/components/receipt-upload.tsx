'use client';

import { presignAndUploadReceipt } from '@catch-coffee/types';
import { useState, type ChangeEvent } from 'react';
import { createApiClient } from '@/lib/api';

type Props = {
  onUploaded: (publicUrl: string) => void;
  disabled?: boolean;
};

export function ReceiptUpload({ onUploaded, disabled }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  async function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);
    setPreview(URL.createObjectURL(file));

    try {
      const client = createApiClient();
      const result = await presignAndUploadReceipt(client, file);
      onUploaded(result.publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : '업로드 실패');
      setPreview(null);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="receipt-upload">
      <label className="label">
        영수증 이미지 (필수)
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={onFileChange}
          disabled={disabled || uploading}
        />
      </label>
      {uploading && <p className="muted">업로드 중…</p>}
      {error && <p className="error">{error}</p>}
      {preview && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt="영수증 미리보기" className="preview" />
      )}
    </div>
  );
}
