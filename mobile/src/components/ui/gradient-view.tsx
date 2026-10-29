import { View, type ViewProps } from 'react-native';

/**
 * A `View` whose background is a CSS-style linear gradient.
 *
 * React Native 0.76+ renders `experimental_backgroundImage` natively, so this
 * reproduces the reference's `gov-gradient` without pulling in an extra
 * gradient dependency.
 */
// Created by AI.
export function GradientView({
  angle = 135,
  colors,
  style,
  ...rest
}: ViewProps & { angle?: number; colors: readonly [string, string] }) {
  return (
    <View
      style={[
        { experimental_backgroundImage: `linear-gradient(${angle}deg, ${colors[0]}, ${colors[1]})` },
        style,
      ]}
      {...rest}
    />
  );
}
