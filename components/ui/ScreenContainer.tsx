import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GradientBackground } from './GradientBackground';
import { spacing } from '@/constants/theme';

interface ScreenContainerProps {
  children: React.ReactNode;
  padded?: boolean;
}

export function ScreenContainer({ children, padded = true }: ScreenContainerProps) {
  return (
    <GradientBackground>
      <SafeAreaView style={[styles.container, padded && styles.padded]}>
        {children}
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  padded: {
    paddingHorizontal: spacing.lg,
  },
});
