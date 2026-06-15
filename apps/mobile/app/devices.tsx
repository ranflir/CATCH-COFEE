import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export default function DevicesScreen() {
  const [status, setStatus] = useState<string>('아직 등록하지 않았습니다.');
  const [pending, setPending] = useState(false);

  async function registerPushToken() {
    setPending(true);
    setStatus('토큰 요청 중…');
    try {
      if (!Device.isDevice) {
        setStatus('실기기에서만 Expo Push 토큰을 발급할 수 있습니다.');
        return;
      }

      const permission = await Notifications.requestPermissionsAsync();
      if (!permission.granted) {
        setStatus('알림 권한이 필요합니다.');
        return;
      }

      const token = (await Notifications.getExpoPushTokenAsync()).data;
      // TODO: 로그인 후 accessToken 주입 — MVP 스켈레톤은 API URL만 표시
      setStatus(
        `Expo Push Token: ${token.slice(0, 24)}…\n` +
          `등록 API: POST ${API_URL}/api/v1/me/devices\n` +
          `(로그인 연동 후 ApiClient 로 platform=expo, pushToken 전송)`,
      );
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
      <Button title="Expo Push Token 받기" onPress={registerPushToken} disabled={pending} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 16 },
  title: { fontSize: 22, fontWeight: '600' },
  body: { color: '#333', lineHeight: 22 },
});
