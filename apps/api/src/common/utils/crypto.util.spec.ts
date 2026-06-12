import { encryptSecret, decryptSecret } from './crypto.util';

describe('crypto.util', () => {
  const secret = 'test-encryption-key-at-least-32-chars-long';

  it('암호화 후 복호화하면 원문이 복원된다', () => {
    const plaintext = 'card-token-1234-5678';
    const encrypted = encryptSecret(plaintext, secret);
    expect(encrypted).not.toContain(plaintext);
    expect(decryptSecret(encrypted, secret)).toBe(plaintext);
  });

  it('같은 평문이라도 매번 다른 암호문을 생성한다(IV 랜덤)', () => {
    const a = encryptSecret('same', secret);
    const b = encryptSecret('same', secret);
    expect(a).not.toBe(b);
  });

  it('다른 키로는 복호화에 실패한다', () => {
    const encrypted = encryptSecret('secret-value', secret);
    expect(() => decryptSecret(encrypted, 'a-different-key-also-32-chars-xx')).toThrow();
  });

  it('변조된 암호문(GCM 태그 불일치)은 복호화에 실패한다', () => {
    const encrypted = encryptSecret('secret-value', secret);
    const [iv, tag] = encrypted.split(':');
    const tampered = [iv, tag, Buffer.from('tampered').toString('base64')].join(':');
    expect(() => decryptSecret(tampered, secret)).toThrow();
  });

  it('형식이 잘못된 payload는 에러를 던진다', () => {
    expect(() => decryptSecret('not-valid', secret)).toThrow('Invalid encrypted payload format');
  });
});
