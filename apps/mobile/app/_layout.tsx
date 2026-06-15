import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack>
        <Stack.Screen name="index" options={{ title: 'Catch Coffee' }} />
        <Stack.Screen name="devices" options={{ title: '푸시 등록' }} />
      </Stack>
    </>
  );
}
