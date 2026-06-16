import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Button, Platform, StyleSheet, Text, View } from 'react-native';
import { createAuthedApiClient } from '../lib/api';
import { getAccessToken } from '../lib/auth';

export default function DevicesScreen() {
  const [status, setStatus] = useState<string>('로그인 후 푸시 토큰을 등록할 수 있습니다.');
  const [pending, setPending] = useState(false);

  async function registerPushToken() {
    setPending(true);
    setStatus('토큰 요청 중…');
    try {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        setStatus('먼저 로그인하세요.');
        return;
      }

      if (!Device.isDevice) {
        setStatus('실기기에서만 Expo Push 토큰을 발급할 수 있습니다.');
        return;
      }

      const permission = await Notifications.requestPermissionsAsync();
      if (!permission.granted) {
        setStatus('알림 권한이 필요합니다.');
        return;
      }

      const expoPushToken = (await Notifications.getExpoPushTokenAsync()).data;
      const platform = Platform.OS === 'ios' ? 'ios' : 'android';
      const client = await createAuthedApiClient();

      await client.request('/api/v1/me/devices', {
        method: 'POST',
        body: { expoPushToken, platform },
      });

      setStatus(`등록 완료 (${platform})\n${expoPushToken.slice(0, 28)}…`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : '등록 실패');
    } finally {
      setPending(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>디바이스 / 푸시</Text>
      <Text style={styles.body}>{status}</Text>
      <Button title="POST /me/devices 등록" onPress={registerPushToken} disabled={pending} />
      <Link href="/login" style={styles.link}>
        로그인
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 16 },
  title: { fontSize: 22, fontWeight: '600' },
  body: { color: '#333', lineHeight: 22 },
  link: { color: '#6f4e37' },
});
