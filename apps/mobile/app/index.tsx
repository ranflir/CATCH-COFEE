import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Catch Coffee</Text>
      <Text style={styles.subtitle}>모바일 MVP</Text>
      <Link href="/login" style={styles.link}>
        로그인
      </Link>
      <Link href="/devices" style={styles.link}>
        푸시 토큰 등록 (/me/devices)
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', gap: 12 },
  title: { fontSize: 28, fontWeight: '700' },
  subtitle: { color: '#6b5e54' },
  link: { color: '#6f4e37', fontSize: 16, marginTop: 8 },
});
