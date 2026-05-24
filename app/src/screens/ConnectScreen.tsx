import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../design/ThemeProvider';
import { radii, spacing } from '../design/tokens';

type FieldName = 'serverUrl' | 'apiToken' | null;

type ConnectScreenProps = {
  serverUrl: string;
  apiToken: string;
  connectionError: string | null;
  focusedField: FieldName;
  isHydrating: boolean;
  isSaving: boolean;
  statusMessage: string;
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.pageBackground }]} testID="connect-screen">
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={[styles.title, { color: colors.textPrimary }]}>TarchPeek</Text>
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
            hasTVPreferredFocus={props.isHydrating}
            keyboardType="url"
            onBlur={() => {
              props.onBlurField('serverUrl');
            }}
            onChangeText={props.onServerUrlChange}
            onFocus={() => {
              props.onFocusField('serverUrl');
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

          {props.connectionError ? (
            <View
              style={[
                styles.errorBanner,
                {
                  backgroundColor: colors.errorBackground,
                  borderColor: colors.errorBorder,
                },
              ]}
              testID="connect-error-banner">
              <Text style={[styles.errorBannerLabel, { color: colors.errorText }]}>Connection failed</Text>
              <Text style={[styles.errorBannerBody, { color: colors.errorText }]}>{props.connectionError}</Text>
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
            testID="connect-save-button">
            {props.isSaving ? (
              <ActivityIndicator color="#e2e8f0" />
            ) : (
              <Text style={[styles.buttonText, { color: colors.buttonLabel }]}>Save connection</Text>
            )}
          </Pressable>

          <Text style={[styles.status, { color: colors.textSecondary }]} testID="connect-status-message">
            {props.statusMessage}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export { ConnectScreen };

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
  title: {
    fontSize: 40,
    fontWeight: '700',
    marginBottom: spacing.lg,
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
  status: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: spacing.xs,
  },
});
