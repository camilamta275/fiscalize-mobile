import { useState } from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type TextFieldProps = TextInputProps & {
  containerStyle?: StyleProp<ViewStyle>;
  error?: string;
  hint?: string;
  label: string;
};

/**
 * Labelled input matching the reference's form controls: a `background`
 * surface, `input` border and a primary ring while focused.
 */
// Created by AI.
export function TextField({
  containerStyle,
  error,
  hint,
  label,
  multiline,
  onBlur,
  onFocus,
  style,
  ...rest
}: TextFieldProps) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      <ThemedText type="label">{label}</ThemedText>
      <TextInput
        multiline={multiline}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        placeholderTextColor={theme.mutedForeground}
        style={[
          styles.input,
          multiline && styles.multiline,
          {
            backgroundColor: rest.editable === false ? theme.backgroundElement : theme.background,
            borderColor: error ? theme.destructive : focused ? theme.ring : theme.input,
            color: rest.editable === false ? theme.textSecondary : theme.text,
          },
          style,
        ]}
        {...rest}
      />
      {error ? (
        <ThemedText style={{ color: theme.destructive }} type="caption">
          {error}
        </ThemedText>
      ) : hint ? (
        <ThemedText themeColor="mutedForeground" type="caption">
          {hint}
        </ThemedText>
      ) : null}
    </View>
  );
}

// Created by AI.
const styles = StyleSheet.create({
  container: {
    gap: Spacing.one,
  },
  input: {
    borderRadius: Radius.md,
    borderWidth: 1,
    fontSize: 15,
    minHeight: 46,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  multiline: {
    minHeight: 110,
    textAlignVertical: 'top',
  },
});
