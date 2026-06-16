import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      {/* @ts-expect-error monorepo @types/react 19 hoisting vs Expo React 18 */}
      <Stack>
        <Stack.Screen name="index" options={{ title: 'Catch Coffee' }} />
        <Stack.Screen name="login" options={{ title: '로그인' }} />
        <Stack.Screen name="devices" options={{ title: '푸시 등록' }} />
      </Stack>
    </>
  );
}
