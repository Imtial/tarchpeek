import { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../design/ThemeProvider';

type ExpandableDescriptionProps = {
  text: string;
  collapsedLines: number;
  expandedScrollMaxHeight?: number;
  containerStyle?: StyleProp<ViewStyle>;
  descriptionStyle?: StyleProp<TextStyle>;
  expandedScrollStyle?: StyleProp<ViewStyle>;
  toggleButtonStyle?: StyleProp<ViewStyle>;
  toggleLabelStyle?: StyleProp<TextStyle>;
  initialExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
};

function ExpandableDescription({
  text,
  collapsedLines,
  expandedScrollMaxHeight,
  containerStyle,
  descriptionStyle,
  expandedScrollStyle,
  toggleButtonStyle,
  toggleLabelStyle,
  initialExpanded = false,
  onExpandedChange,
}: ExpandableDescriptionProps) {
  const { theme } = useTheme();
  const [isExpanded, setIsExpanded] = useState(initialExpanded);
  const [hasExpandableDescription, setHasExpandableDescription] = useState(text.length > 140);

  useEffect(() => {
    setIsExpanded(initialExpanded);
    setHasExpandableDescription(text.length > 140);
  }, [initialExpanded, text]);

  return (
    <View style={containerStyle}>
      {isExpanded ? (
        <ScrollView
          nestedScrollEnabled
          persistentScrollbar
          showsVerticalScrollIndicator
          style={[styles.expandedDescriptionScroll, expandedScrollStyle, expandedScrollMaxHeight ? { maxHeight: expandedScrollMaxHeight } : null]}>
          <Text style={descriptionStyle}>{text}</Text>
        </ScrollView>
      ) : (
        <Text
          numberOfLines={collapsedLines}
          onTextLayout={event => {
            setHasExpandableDescription(
              text.length > 140 || event.nativeEvent.lines.length > collapsedLines,
            );
          }}
          style={descriptionStyle}>
          {text}
        </Text>
      )}
      {isExpanded ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            setIsExpanded(false);
            onExpandedChange?.(false);
          }}
          style={[styles.toggleButton, toggleButtonStyle]}>
          <Text style={[styles.toggleLabel, { color: theme.colors.textSecondary }, toggleLabelStyle]}>
            See less...
          </Text>
        </Pressable>
      ) : null}
      {!isExpanded && hasExpandableDescription ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            setIsExpanded(true);
            onExpandedChange?.(true);
          }}
          style={[styles.toggleButton, toggleButtonStyle]}>
          <Text style={[styles.toggleLabel, { color: theme.colors.textSecondary }, toggleLabelStyle]}>
            See more ...
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  expandedDescriptionScroll: {
    flexGrow: 0,
    flexShrink: 1,
  },
  toggleButton: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  toggleLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
});

export { ExpandableDescription };
