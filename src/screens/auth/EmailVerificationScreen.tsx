import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  ScrollView,
  Animated,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { apiService } from '../../services/api';
import { theme } from '../../utils/theme';

const { width, height } = Dimensions.get('window');

interface RouteParams {
  email: string;
}

const EmailVerificationScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { email } = route.params as RouteParams;

  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);

  const inputRefs = useRef<TextInput[]>([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    // Start countdown timer
    const interval = setInterval(() => {
      setTimer((prevTimer) => {
        if (prevTimer <= 1) {
          setCanResend(true);
          clearInterval(interval);
          return 0;
        }
        return prevTimer - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleCodeChange = (value: string, index: number) => {
    if (value.length > 1) return; // Only allow single digits

    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);

    // Auto-focus next input
    if (value !== '' && index < 5) {
      inputRefs.current[index + 1]?.focus();
      setFocusedIndex(index + 1);
    }

    // Auto-focus previous input if deleting
    if (value === '' && index > 0) {
      inputRefs.current[index - 1]?.focus();
      setFocusedIndex(index - 1);
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && verificationCode[index] === '' && index > 0) {
      inputRefs.current[index - 1]?.focus();
      setFocusedIndex(index - 1);
    }
  };

  const handleVerify = async () => {
    const code = verificationCode.join('');

    if (code.length !== 6) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Code',
        text2: 'Please enter the complete 6-digit verification code',
      });
      return;
    }

    setLoading(true);

    try {
      const response = await apiService.auth.verifyEmail(email, code) as any;

      if (response.success) {
        Toast.show({
          type: 'success',
          text1: 'Email Verified',
          text2: 'Your email has been verified successfully',
        });

        // Navigate back to login with success flag
        (navigation as any).navigate('Login', { 
          emailVerified: true,
          email: email 
        });
      }
    } catch (error: any) {
      console.error('Email verification error:', error);
      Toast.show({
        type: 'error',
        text1: 'Verification Failed',
        text2: error.response?.data?.message || 'Please try again',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setResendLoading(true);

    try {
      const response = await apiService.auth.resendVerificationCode(email) as any;

      if (response.success) {
        Toast.show({
          type: 'success',
          text1: 'Code Sent',
          text2: 'A new verification code has been sent to your email',
        });

        // Reset timer and code
        setTimer(60);
        setCanResend(false);
        setVerificationCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
        setFocusedIndex(0);
      }
    } catch (error: any) {
      console.error('Resend code error:', error);
      Toast.show({
        type: 'error',
        text1: 'Resend Failed',
        text2: error.response?.data?.message || 'Please try again',
      });
    } finally {
      setResendLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isCodeComplete = verificationCode.every(digit => digit !== '');

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
            <View style={styles.headerSection}>
              <View style={styles.logoContainer}>
                <View style={styles.logo}>
                  <Text style={styles.logoText}>🏞️</Text>
                </View>
              </View>
              <Text style={styles.title}>Verify Your Email</Text>
              <Text style={styles.subtitle}>
                We've sent a 6-digit verification code to
              </Text>
              <Text style={styles.email}>{email}</Text>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.instruction}>
                Enter the verification code below
              </Text>

              <View style={styles.codeContainer}>
                {verificationCode.map((digit, index) => (
                  <View key={index} style={styles.codeInputWrapper}>
                    <TextInput
                      ref={(ref) => {
                        if (ref) inputRefs.current[index] = ref;
                      }}
                      style={[
                        styles.codeInput,
                        focusedIndex === index && styles.codeInputFocused,
                        digit !== '' && styles.codeInputFilled
                      ]}
                      value={digit}
                      onChangeText={(value) => handleCodeChange(value, index)}
                      onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                      keyboardType="numeric"
                      maxLength={1}
                      textAlign="center"
                      autoFocus={index === 0}
                      onFocus={() => setFocusedIndex(index)}
                      selectTextOnFocus
                    />
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={[
                  styles.verifyButton,
                  (!isCodeComplete || loading) && styles.buttonDisabled
                ]}
                onPress={handleVerify}
                disabled={!isCodeComplete || loading}
                activeOpacity={0.8}
              >
                <Text style={styles.verifyButtonText}>
                  {loading ? 'Verifying...' : 'Verify Email'}
                </Text>
                {!loading && <Text style={styles.buttonArrow}>→</Text>}
              </TouchableOpacity>

              <View style={styles.resendContainer}>
                {!canResend ? (
                  <Text style={styles.timerText}>
                    Resend code in {formatTime(timer)}
                  </Text>
                ) : (
                  <TouchableOpacity
                    style={styles.resendButton}
                    onPress={handleResendCode}
                    disabled={resendLoading}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.resendButtonText}>
                      {resendLoading ? 'Sending...' : 'Resend Code'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
                activeOpacity={0.7}
              >
                <Text style={styles.backButtonText}>← Back to Login</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: height * 0.08,
    paddingBottom: 32,
  },
  content: {
    flex: 1,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    marginBottom: 24,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  logoText: {
    fontSize: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.onBackground,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.onSurface,
    textAlign: 'center',
    opacity: 0.8,
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: '600',
    textAlign: 'center',
  },
  formSection: {
    marginBottom: 32,
  },
  instruction: {
    fontSize: 16,
    color: theme.colors.onSurface,
    textAlign: 'center',
    marginBottom: 32,
    opacity: 0.9,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  codeInputWrapper: {
    flex: 1,
    marginHorizontal: 4,
  },
  codeInput: {
    height: 60,
    borderWidth: 2,
    borderColor: theme.colors.outline,
    borderRadius: 12,
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    backgroundColor: theme.colors.surface,
    textAlign: 'center',
  },
  codeInputFocused: {
    borderColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  codeInputFilled: {
    backgroundColor: theme.colors.primaryContainer,
    borderColor: theme.colors.primary,
  },
  verifyButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonDisabled: {
    backgroundColor: theme.colors.surfaceVariant,
    shadowOpacity: 0,
    elevation: 0,
  },
  verifyButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  buttonArrow: {
    position: 'absolute',
    right: 24,
    top: 16,
    fontSize: 18,
    color: 'white',
  },
  resendContainer: {
    alignItems: 'center',
  },
  timerText: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
  },
  resendButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  resendButtonText: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: 16,
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  backButtonText: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 16,
  },
});

export default EmailVerificationScreen;
