import { useEffect } from 'react';
import type { ViewProps } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { cn } from '@/lib/utils';

export type SkeletonProps = ViewProps & { className?: string };

export function Skeleton({ className, style, ...rest }: SkeletonProps) {
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      className={cn('rounded-lg bg-background-selected dark:bg-background-selected-dark', className)}
      style={[animatedStyle, style]}
      {...rest}
    />
  );
}
