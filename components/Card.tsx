import React from "react";
import { StyleProp, StyleSheet, View, ViewProps, ViewStyle } from "react-native";
import { useTheme } from "../lib/theme/ThemeProvider";

type CardProps = ViewProps & {
  style?: StyleProp<ViewStyle>;
};

export function Card({ children, style, ...props }: CardProps) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.card,
          borderColor: theme.cardBorder,
          shadowColor: theme.shadow,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    shadowOffset: {
      width: 0,
      height: 14,
    },
    shadowOpacity: 0.12,
    shadowRadius: 28,
    elevation: 4,
  },
});
