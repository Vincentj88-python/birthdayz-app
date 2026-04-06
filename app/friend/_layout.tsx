import { Stack } from 'expo-router';

export default function FriendLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="add" options={{ presentation: 'modal' }} />
      <Stack.Screen name="import" options={{ presentation: 'modal' }} />
      <Stack.Screen name="[id]" />
    </Stack>
  );
}
