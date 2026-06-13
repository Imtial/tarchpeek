import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  type TextLayoutEvent,
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

type ExpandableDescriptionContentProps = ExpandableDescriptionProps;

function ExpandableDescriptionContent({
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
}: ExpandableDescriptionContentProps) {
  const { theme } = useTheme();
  const [isExpanded, setIsExpanded] = useState(initialExpanded);
  const [measuredLineCount, setMeasuredLineCount] = useState<number | null>(null);
  const hasExpandableDescription = text.length > 140 || (measuredLineCount ?? 0) > collapsedLines;

  function handleTextLayout(event: TextLayoutEvent) {
    const nextLineCount = event.nativeEvent.lines.length;
    setMeasuredLineCount(currentLineCount =>
      currentLineCount === nextLineCount ? currentLineCount : nextLineCount,
    );
  }

  return (
    <View style={containerStyle}>
      {isExpanded ? (
        <ScrollView
          nestedScrollEnabled
          persistentScrollbar
          showsVerticalScrollIndicator
          style={[
            styles.expandedDescriptionScroll,
            expandedScrollStyle,
            expandedScrollMaxHeight ? { maxHeight: expandedScrollMaxHeight } : null,
          ]}
        >
          <Text onTextLayout={handleTextLayout} style={descriptionStyle}>
            {text}
          </Text>
        </ScrollView>
      ) : (
        <Text
          numberOfLines={collapsedLines}
          onTextLayout={handleTextLayout}
          style={descriptionStyle}
        >
          {text}
        </Text>
      )}
      {isExpanded && hasExpandableDescription ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            setIsExpanded(false);
            onExpandedChange?.(false);
          }}
          style={[styles.toggleButton, toggleButtonStyle]}
        >
          <Text
            style={[styles.toggleLabel, { color: theme.colors.textSecondary }, toggleLabelStyle]}
          >
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
          style={[styles.toggleButton, toggleButtonStyle]}
        >
          <Text
            style={[styles.toggleLabel, { color: theme.colors.textSecondary }, toggleLabelStyle]}
          >
            See more ...
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function ExpandableDescription(props: ExpandableDescriptionProps) {
  const { collapsedLines, initialExpanded = false, text } = props;

  return (
    <ExpandableDescriptionContent
      key={`${text}:${collapsedLines}:${initialExpanded ? 'expanded' : 'collapsed'}`}
      {...props}
    />
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
