import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { ScreenContainer, Heading, Body, Button } from '@/components/ui';
import { spacing, fontSize } from '@/constants/theme';

export default function NotFoundScreen() {
  return (
    <ScreenContainer>
      <View style={styles.container}>
        <Body style={styles.emoji}>🤷</Body>
        <Heading style={styles.title}>Page not found</Heading>
        <Button title="Go Home" onPress={() => router.replace('/(tabs)')} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  emoji: {
    fontSize: 64,
  },
  title: {
    fontSize: fontSize.xxl,
  },
});
