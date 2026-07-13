import { useSignIn } from '@clerk/expo';
import { type Href, Link, useRouter } from 'expo-router';
import React from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const BRAND = '#208AEF';

export default function SignInPage() {
  const { signIn, errors, fetchStatus } = useSignIn();
  const router = useRouter();
  const theme = useTheme();

  const [emailAddress, setEmailAddress] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [code, setCode] = React.useState('');

  const handleSubmit = async () => {
    const { error } = await signIn.password({ emailAddress, password });
    if (error) {
      console.error(JSON.stringify(error, null, 2));
      return;
    }

    if (signIn.status === 'complete') {
      await signIn.finalize({
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
    } else if (signIn.status === 'needs_client_trust') {
      const emailCodeFactor = signIn.supportedSecondFactors.find(
        (factor) => factor.strategy === 'email_code',
      );
      if (emailCodeFactor) {
        await signIn.mfa.sendEmailCode();
      }
    } else {
      console.error('Sign-in attempt not complete:', signIn);
    }
  };

  const handleVerify = async () => {
    await signIn.mfa.verifyEmailCode({ code });
    if (signIn.status === 'complete') {
      await signIn.finalize({
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
      console.error('Sign-in attempt not complete:', signIn);
    }
  };

  const inputStyle = [styles.input, { borderColor: theme.backgroundElement, color: theme.text, backgroundColor: theme.background }];

  if (signIn.status === 'needs_client_trust') {
    return (
      <ThemedView style={styles.flex}>
        <SafeAreaView style={styles.flex}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
            <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
              <ThemedText type="subtitle" style={styles.title}>Verify your account</ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.subtitle}>
                Enter the code we sent to your email.
              </ThemedText>

              <ThemedText style={styles.label}>Verification code</ThemedText>
              <TextInput
                id="mfa-code"
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
                <ThemedText style={styles.buttonText}>Verify</ThemedText>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
                onPress={() => signIn.mfa.sendEmailCode()}
              >
                <ThemedText style={styles.secondaryButtonText}>Resend code</ThemedText>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
                onPress={() => signIn.reset()}
              >
                <ThemedText style={styles.secondaryButtonText}>Start over</ThemedText>
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
            <ThemedText type="subtitle" style={styles.title}>Welcome back</ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.subtitle}>
              Sign in to continue to myPA
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
            {errors?.fields?.identifier && (
              <ThemedText style={styles.error}>{errors.fields.identifier.message}</ThemedText>
            )}

            <ThemedText style={styles.label}>Password</ThemedText>
            <TextInput
              id="password-input"
              style={inputStyle}
              value={password}
              placeholder="Enter your password"
              placeholderTextColor={theme.textSecondary ?? '#666'}
              secureTextEntry
              onChangeText={setPassword}
              autoComplete="password"
              textContentType="password"
            />
            {errors?.fields?.password && (
              <ThemedText style={styles.error}>{errors.fields.password.message}</ThemedText>
            )}

            <Pressable
              id="sign-in-btn"
              style={({ pressed }) => [
                styles.button,
                (!emailAddress || !password || fetchStatus === 'fetching') && styles.buttonDisabled,
                pressed && styles.buttonPressed,
              ]}
              onPress={handleSubmit}
              disabled={!emailAddress || !password || fetchStatus === 'fetching'}
            >
              <ThemedText style={styles.buttonText}>
                {fetchStatus === 'fetching' ? 'Signing in…' : 'Sign in'}
              </ThemedText>
            </Pressable>

            <View style={styles.linkContainer}>
              <ThemedText themeColor="textSecondary">Don't have an account? </ThemedText>
              <Link href="/(auth)/sign-up" id="go-to-sign-up">
                <ThemedText type="linkPrimary">Sign up</ThemedText>
              </Link>
            </View>
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
