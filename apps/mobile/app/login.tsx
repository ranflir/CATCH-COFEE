import { ApiRequestError, type AuthTokens } from '@catch-coffee/types';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Button,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { createApiClient } from '../lib/api';
import { saveStoredAuth } from '../lib/auth';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('demo@catch.coffee');
  const [password, setPassword] = useState('Password123!');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onLogin() {
    setPending(true);
    setError(null);
    try {
      const client = createApiClient();
      const tokens = await client.request<AuthTokens>('/api/v1/auth/login', {
        method: 'POST',
        body: { email, password },
      });
      await saveStoredAuth(tokens);
      router.replace('/devices');
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : '로그인 실패');
    } finally {
      setPending(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>로그인</Text>
      <TextInput
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="이메일"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        secureTextEntry
        placeholder="비밀번호"
        value={password}
        onChangeText={setPassword}
      />
      {error && <Text style={styles.error}>{error}</Text>}
      <Button title={pending ? '로그인 중…' : '로그인'} onPress={onLogin} disabled={pending} />
      <Link href="/" style={styles.link}>
        홈으로
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', gap: 12 },
  title: { fontSize: 24, fontWeight: '700' },
  input: {
    borderWidth: 1,
    borderColor: '#e8dfd6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  error: { color: '#b42318' },
  link: { color: '#6f4e37', marginTop: 8 },
});
