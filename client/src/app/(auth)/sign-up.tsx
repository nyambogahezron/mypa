import { useAuth, useSignUp } from '@clerk/expo';
import { type Href, Link, useRouter } from 'expo-router';
import React from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const BRAND = '#208AEF';

export default function SignUpPage() {
  const { signUp, errors, fetchStatus } = useSignUp();
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const theme = useTheme();

  const [emailAddress, setEmailAddress] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [code, setCode] = React.useState('');

  const handleSubmit = async () => {
    const { error } = await signUp.password({ emailAddress, password });
    if (error) {
      console.error(JSON.stringify(error, null, 2));
      return;
    }
    if (!error) await signUp.verifications.sendEmailCode();
  };

  const handleVerify = async () => {
    await signUp.verifications.verifyEmailCode({ code });
    if (signUp.status === 'complete') {
      await signUp.finalize({
        navigate: ({ session, decorateUrl }) => {
          if (session?.currentTask) {
            console.log(session?.currentTask);
            return;
          }
          const url = decorateUrl('/');
          if (url.startsWith('http')) {
            // @ts-ignore
            window.location.href = url;
          } else {
            router.replace(url as Href);
          }
        },
      });
    } else {
      console.error('Sign-up attempt not complete:', signUp);
    }
  };

  const inputStyle = [styles.input, { borderColor: theme.backgroundElement, color: theme.text, backgroundColor: theme.background }];

  if (signUp.status === 'complete' || isSignedIn) {
    return null;
  }

  // Email verification step
  if (
    signUp.status === 'missing_requirements' &&
    signUp.unverifiedFields.includes('email_address') &&
    signUp.missingFields.length === 0
  ) {
    return (
      <ThemedView style={styles.flex}>
        <SafeAreaView style={styles.flex}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
            <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
              <ThemedText type="subtitle" style={styles.title}>Check your email</ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.subtitle}>
                We sent a 6-digit code to {emailAddress}
              </ThemedText>

              <ThemedText style={styles.label}>Verification code</ThemedText>
              <TextInput
                id="verify-code"
                style={inputStyle}
                value={code}
                placeholder="Enter verification code"
                placeholderTextColor={theme.textSecondary ?? '#666'}
                onChangeText={setCode}
                keyboardType="numeric"
                autoFocus
              />
              {errors?.fields?.code && (
                <ThemedText style={styles.error}>{errors.fields.code.message}</ThemedText>
              )}

              <Pressable
                id="verify-btn"
                style={({ pressed }) => [
                  styles.button,
                  fetchStatus === 'fetching' && styles.buttonDisabled,
                  pressed && styles.buttonPressed,
                ]}
                onPress={handleVerify}
                disabled={fetchStatus === 'fetching'}
              >
                <ThemedText style={styles.buttonText}>
                  {fetchStatus === 'fetching' ? 'Verifying…' : 'Verify email'}
                </ThemedText>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
                onPress={() => signUp.verifications.sendEmailCode()}
              >
                <ThemedText style={styles.secondaryButtonText}>Resend code</ThemedText>
              </Pressable>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.flex}>
      <SafeAreaView style={styles.flex}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
          <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
            <ThemedText type="subtitle" style={styles.title}>Create account</ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.subtitle}>
              Join myPA to get started
            </ThemedText>

            <ThemedText style={styles.label}>Email address</ThemedText>
            <TextInput
              id="email-input"
              style={inputStyle}
              autoCapitalize="none"
              value={emailAddress}
              placeholder="Enter your email"
              placeholderTextColor={theme.textSecondary ?? '#666'}
              onChangeText={setEmailAddress}
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
            />
            {errors?.fields?.emailAddress && (
              <ThemedText style={styles.error}>{errors.fields.emailAddress.message}</ThemedText>
            )}

            <ThemedText style={styles.label}>Password</ThemedText>
            <TextInput
              id="password-input"
              style={inputStyle}
              value={password}
              placeholder="Create a password"
              placeholderTextColor={theme.textSecondary ?? '#666'}
              secureTextEntry
              onChangeText={setPassword}
              autoComplete="new-password"
              textContentType="newPassword"
            />
            {errors?.fields?.password && (
              <ThemedText style={styles.error}>{errors.fields.password.message}</ThemedText>
            )}

            <Pressable
              id="sign-up-btn"
              style={({ pressed }) => [
                styles.button,
                (!emailAddress || !password || fetchStatus === 'fetching') && styles.buttonDisabled,
                pressed && styles.buttonPressed,
              ]}
              onPress={handleSubmit}
              disabled={!emailAddress || !password || fetchStatus === 'fetching'}
            >
              <ThemedText style={styles.buttonText}>
                {fetchStatus === 'fetching' ? 'Creating account…' : 'Sign up'}
              </ThemedText>
            </Pressable>

            <View style={styles.linkContainer}>
              <ThemedText themeColor="textSecondary">Already have an account? </ThemedText>
              <Link href="/(auth)/sign-in" id="go-to-sign-in">
                <ThemedText type="linkPrimary">Sign in</ThemedText>
              </Link>
            </View>

            {/* Required for sign-up flows – Clerk's bot protection */}
            <View nativeID="clerk-captcha" />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flexGrow: 1,
    padding: Spacing.four,
    gap: Spacing.two,
    justifyContent: 'center',
  },
  title: {
    marginBottom: Spacing.one,
  },
  subtitle: {
    marginBottom: Spacing.three,
    fontSize: 15,
  },
  label: {
    fontWeight: '600',
    fontSize: 14,
    marginTop: Spacing.one,
  },
  input: {
    borderWidth: 1,
    borderRadius: Spacing.two,
    padding: Spacing.three,
    fontSize: 16,
  },
  button: {
    backgroundColor: BRAND,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.two,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  buttonPressed: { opacity: 0.75 },
  buttonDisabled: { opacity: 0.45 },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  secondaryButton: {
    paddingVertical: Spacing.two,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: BRAND,
    fontWeight: '600',
    fontSize: 14,
  },
  linkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.three,
    gap: 2,
  },
  error: {
    color: '#d32f2f',
    fontSize: 12,
    marginTop: -4,
  },
});
