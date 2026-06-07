import { useRef } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../design/ThemeProvider';
import { radii, spacing } from '../design/tokens';

type FieldName = 'serverUrl' | 'apiToken' | null;

type ConnectScreenProps = {
  serverUrl: string;
  apiToken: string;
  connectionError: string | null;
  connectionFieldErrors: {
    serverUrl: string | null;
    apiToken: string | null;
  };
  focusedField: FieldName;
  isSaving: boolean;
  onServerUrlChange: (value: string) => void;
  onApiTokenChange: (value: string) => void;
  onFocusField: (field: FieldName) => void;
  onBlurField: (field: Exclude<FieldName, null>) => void;
  onSaveConnection: () => void;
};

function ConnectScreen(props: ConnectScreenProps) {
  const { theme } = useTheme();
  const { colors } = theme;
  const hasError = Boolean(props.connectionError);
  const scrollViewRef = useRef<ScrollView>(null);

  function scrollFormToEnd(animated = true) {
    scrollViewRef.current?.scrollToEnd({ animated });
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.pageBackground }]}
      testID="connect-screen"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.content}
          onContentSizeChange={() => {
            scrollFormToEnd(false);
          }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <View style={styles.headerRow}>
            <Image source={require('../../assets/tarchpeek.png')} style={styles.logo} />
            <Text style={[styles.title, { color: colors.textPrimary }]}>TarchPeek</Text>
          </View>
          <Text style={[styles.body, styles.bodySpacing, { color: colors.textSecondary }]}>
            Connect to your TubeArchivist server.
          </Text>

          <View style={[styles.card, { backgroundColor: colors.surfaceBackground }]}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>Server URL</Text>
            <TextInput
              autoCapitalize="none"
              autoFocus
              autoCorrect={false}
              editable={!props.isSaving}
              focusable
              keyboardType="url"
              onBlur={() => {
                props.onBlurField('serverUrl');
              }}
              onChangeText={props.onServerUrlChange}
              onFocus={() => {
                props.onFocusField('serverUrl');
                scrollFormToEnd();
              }}
              placeholder="https://archive.local"
              placeholderTextColor={colors.inputPlaceholder}
              returnKeyType="next"
              selectTextOnFocus
              style={[
                styles.input,
                {
                  backgroundColor: colors.inputBackground,
                  borderColor: hasError ? colors.errorBorder : colors.inputBorder,
                  color: colors.textPrimary,
                },
                props.focusedField === 'serverUrl' && !hasError
                  ? [styles.inputFocused, { borderColor: colors.focusRing }]
                  : null,
                hasError ? [styles.inputFocused, { borderColor: colors.errorBorder }] : null,
              ]}
              testID="connect-server-url-input"
              value={props.serverUrl}
            />
            {props.connectionFieldErrors.serverUrl ? (
              <Text style={[styles.fieldError, { color: colors.errorText }]}>
                {props.connectionFieldErrors.serverUrl}
              </Text>
            ) : null}

            <Text style={[styles.label, { color: colors.textPrimary }]}>API token</Text>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              editable={!props.isSaving}
              focusable
              onBlur={() => {
                props.onBlurField('apiToken');
              }}
              onChangeText={props.onApiTokenChange}
              onFocus={() => {
                props.onFocusField('apiToken');
                scrollFormToEnd();
              }}
              placeholder="Paste API token"
              placeholderTextColor={colors.inputPlaceholder}
              returnKeyType="done"
              secureTextEntry
              selectTextOnFocus
              style={[
                styles.input,
                {
                  backgroundColor: colors.inputBackground,
                  borderColor: hasError ? colors.errorBorder : colors.inputBorder,
                  color: colors.textPrimary,
                },
                props.focusedField === 'apiToken' && !hasError
                  ? [styles.inputFocused, { borderColor: colors.focusRing }]
                  : null,
                hasError ? [styles.inputFocused, { borderColor: colors.errorBorder }] : null,
              ]}
              testID="connect-api-token-input"
              value={props.apiToken}
            />
            {props.connectionFieldErrors.apiToken ? (
              <Text style={[styles.fieldError, { color: colors.errorText }]}>
                {props.connectionFieldErrors.apiToken}
              </Text>
            ) : null}

            {props.connectionError ? (
              <View
                style={[
                  styles.errorBanner,
                  {
                    backgroundColor: colors.errorBackground,
                    borderColor: colors.errorBorder,
                  },
                ]}
                testID="connect-error-banner"
              >
                <Text style={[styles.errorBannerLabel, { color: colors.errorText }]}>
                  Connection failed
                </Text>
                <Text style={[styles.errorBannerBody, { color: colors.errorText }]}>
                  {props.connectionError}
                </Text>
              </View>
            ) : null}

            <Pressable
              accessibilityRole="button"
              accessibilityState={{ busy: props.isSaving, disabled: props.isSaving }}
              disabled={props.isSaving}
              focusable
              onPress={props.onSaveConnection}
              style={({ pressed }) => [
                styles.button,
                {
                  backgroundColor: props.isSaving
                    ? colors.buttonDisabledBackground
                    : colors.buttonPrimaryBackground,
                },
                pressed && !props.isSaving ? styles.buttonPressed : null,
              ]}
              testID="connect-save-button"
            >
              {props.isSaving ? (
                <ActivityIndicator color="#e2e8f0" />
              ) : (
                <Text style={[styles.buttonText, { color: colors.buttonLabel }]}>
                  Save connection
                </Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 40,
    fontWeight: '700',
  },
  logo: {
    height: 56,
    width: 56,
  },
  body: {
    fontSize: 18,
    lineHeight: 28,
    maxWidth: 480,
  },
  bodySpacing: {
    marginBottom: spacing.xl,
  },
  card: {
    borderRadius: radii.lg,
    gap: 10,
    maxWidth: 520,
    padding: 20,
  },
  errorBanner: {
    borderRadius: radii.md,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  errorBannerBody: {
    fontSize: 14,
    lineHeight: 20,
  },
  errorBannerLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  fieldError: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: -4,
    marginBottom: spacing.xs,
  },
  input: {
    borderRadius: radii.md,
    borderWidth: 1,
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  inputFocused: {
    borderWidth: 2,
  },
  button: {
    alignItems: 'center',
    borderRadius: radii.md,
    marginTop: spacing.sm,
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  buttonPressed: {
    opacity: 0.9,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});

export { ConnectScreen };
