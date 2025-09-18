import React, { useState, useEffect } from 'react';
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
  Animated,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { useAuth } from '../../store/AuthContext';
import { useTheme } from '../../store/ThemeContext';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { ValidationUtils } from '../../utils/validation';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from '../../utils/translations';
import { useRTL } from '../../store/RTLContext';

const { width, height } = Dimensions.get('window');

interface FormErrors {
  email?: string;
  password?: string;
}

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const { login, completeAuthentication } = useAuth();
  const navigation = useNavigation();
  const route = useRoute();
  const { state: themeState } = useTheme();
  const theme = themeState.theme;
  const { t } = useTranslation();
  const { isRTL } = useRTL();
  
  // Handle email verification success
  useEffect(() => {
    const params = route.params as any;
    if (params?.emailVerified) {
      Toast.show({
        type: 'success',
        text1: t('email') + ' ' + t('confirm'),
        text2: t('login'),
      });
      // Pre-fill email if available
      if (params.email) {
        setEmail(params.email);
      }
    }
  }, [route.params]);

  const validateForm = (): boolean => {
    const result = ValidationUtils.validateLoginForm(email, password);

    setErrors(result.errors);

    if (!result.isValid) {
      // Show the first error in a toast
      const firstError = Object.values(result.errors)[0];
      if (firstError) {
        Toast.show({
          type: 'error',
          text1: t('error'),
          text2: firstError,
          position: 'bottom'
        });
      }
    }

    return result.isValid;
  };

  const handleInputChange = (field: 'email' | 'password', value: string) => {
    if (field === 'email') {
      setEmail(value);
    } else {
      setPassword(value);
    }
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

// LoginScreen.tsx - handleLogin function
const handleLogin = async () => {
  if (!email || !password) {
    Toast.show({
      type: 'error',
      text1: t('error'),
      text2: t('email') + ' ' + t('password') + ' ' + t('confirm'),
    });
    return;
  }

  setLoading(true);

  try {
    console.log('LoginScreen: Calling authContext.login with:', { email });
    const result = await login(email, password);
    
    if (result === null) {
      // Email verification is required
      console.log('LoginScreen: Email verification required');
      
      Toast.show({
        type: 'info',
        text1: t('email') + ' ' + t('confirm'),
        text2: t('continue'),
      });
      
      return;
    }
    
    console.log('LoginScreen: Login successful, result:', result);
    
    // Check if user has PIN setup
    if (result.user.hasPinSetup) {
      console.log('LoginScreen: User has PIN setup, completing authentication');
      await completeAuthentication();
      
      Toast.show({
        type: 'success',
        text1: t('login') + ' ' + t('success'),
        text2: t('welcome'),
      });
   } else {
    console.log('LoginScreen: User needs PIN setup, navigating to PinSetup');
    
    Toast.show({
      type: 'info',
      text1: t('settings'),
      text2: t('continue'),
    });
    
    // Use reset to clear the navigation stack and replace with PinSetup
    navigation.reset({
      index: 0,
      routes: [{ name: 'PinSetup' as never }],
    });
  }
    
  } catch (error: any) {
    console.log('LoginScreen error details:', error);
    
    console.error('LoginScreen: Login failed:', error);
    Toast.show({
      type: 'error',
      text1: t('login') + ' ' + t('error'),
      text2: error.response?.data?.message || error.message || t('tryAgain'),
    });
    
  } finally {
    setLoading(false);
  }
};

  const handleForgotPassword = () => {
    Toast.show({
      type: 'info',
      text1: t('forgotPassword'),
      text2: t('continue'),
      position: 'bottom'
    });
  };

  const handleRegister = () => {
    // @ts-ignore - Navigation typing
    navigation.navigate('Register');
  };

  const styles = useThemedStyles((theme, rtlStyles) => StyleSheet.create({
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
    },
    formSection: {
      marginBottom: 32,
    },
    inputContainer: {
      marginBottom: 20,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.onBackground,
      marginBottom: 8,
      marginLeft: 4,
    },
    inputWrapper: {
      flexDirection: (rtlStyles?.row?.flexDirection as any) || 'row',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: theme.colors.outline,
      borderRadius: 16,
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 16,
      paddingVertical: 4,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    inputFocused: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primaryContainer,
      shadowColor: theme.colors.primary,
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    inputIcon: {
      fontSize: 20,
      marginRight: 12,
    },
    input: {
      flex: 1,
      fontSize: 16,
      color: theme.colors.onSurface,
      paddingVertical: 12,
    },
    eyeButton: {
      padding: 8,
    },
    eyeIcon: {
      fontSize: 18,
    },
    forgotPassword: {
      alignSelf: 'flex-end',
      marginTop: -8,
      marginBottom: 24,
      paddingVertical: 8,
      paddingHorizontal: 4,
    },
    forgotPasswordText: {
      fontSize: 14,
      color: theme.colors.primary,
      fontWeight: '600',
    },
    loginButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: 16,
      paddingVertical: 16,
      flexDirection: (rtlStyles?.row?.flexDirection as any) || 'row',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
      marginBottom: 24,
    },
    buttonDisabled: {
      backgroundColor: theme.colors.outline,
      shadowOpacity: 0.1,
    },
    loginButtonText: {
      color: theme.colors.onPrimary,
      fontSize: 16,
      fontWeight: 'bold',
      marginRight: 8,
    },
    buttonArrow: {
      color: theme.colors.onPrimary,
      fontSize: 18,
      fontWeight: 'bold',
    },
    divider: {
      flexDirection: (rtlStyles?.row?.flexDirection as any) || 'row',
      alignItems: 'center',
      marginVertical: 24,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: theme.colors.outline,
      opacity: 0.5,
    },
    dividerText: {
      fontSize: 12,
      color: theme.colors.onSurface,
      marginHorizontal: 16,
      fontWeight: '600',
      opacity: 0.7,
    },
    biometricButton: {
      flexDirection: (rtlStyles?.row?.flexDirection as any) || 'row',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: theme.colors.primary,
      borderRadius: 16,
      paddingVertical: 14,
      backgroundColor: theme.colors.surface,
    },
    biometricIcon: {
      fontSize: 20,
      marginRight: 8,
    },
    biometricText: {
      color: theme.colors.primary,
      fontSize: 16,
      fontWeight: '600',
    },
    footer: {
      flexDirection: (rtlStyles?.row?.flexDirection as any) || 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 'auto',
      paddingTop: 4,
    },
    footerText: {
      fontSize: 14,
      color: theme.colors.onSurface,
      opacity: 0.8,
    },
    link: {
      fontSize: 14,
      color: theme.colors.primary,
      fontWeight: 'bold',
    },
    inputError: {
      borderColor: theme.colors.error,
      borderWidth: 2,
    },
    errorText: {
      color: theme.colors.error,
      fontSize: 12,
      marginTop: 4,
      marginLeft: 16,
    },
  }));

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
          <View style={styles.headerSection}>
            <View style={styles.logoContainer}>
              <View style={styles.logo}>
                <Text style={styles.logoText}>🏞️</Text>
              </View>
            </View>
            <Text style={styles.title}>{t('welcome')}</Text>
            <Text style={styles.subtitle}>{t('login')}</Text>
          </View>

          <View style={styles.formSection}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t('email')}</Text>
              <View style={[styles.inputWrapper, emailFocused && styles.inputFocused, errors.email && styles.inputError]}>
                <Text style={styles.inputIcon}>📧</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t('email')}
                  placeholderTextColor={theme.colors.outline}
                  value={email}
                  onChangeText={(value) => handleInputChange('email', value)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                />
              </View>
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t('password')}</Text>
              <View style={[styles.inputWrapper, passwordFocused && styles.inputFocused, errors.password && styles.inputError]}>
                <Text style={styles.inputIcon}>🔐</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t('password')}
                  placeholderTextColor={theme.colors.outline}
                  value={password}
                  onChangeText={(value) => handleInputChange('password', value)}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                />
                <TouchableOpacity 
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>
              {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
            </View>

            <TouchableOpacity style={styles.forgotPassword} onPress={handleForgotPassword}>
              <Text style={styles.forgotPasswordText}>{t('forgotPassword')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.loginButton, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text style={styles.loginButtonText}>
                {loading ? t('loading') : t('login')}
              </Text>
              {!loading && <Text style={styles.buttonArrow}>{isRTL ? '←' : '→'}</Text>}
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* <TouchableOpacity style={styles.biometricButton}>
              <Text style={styles.biometricIcon}>👆</Text>
              <Text style={styles.biometricText}>Use Biometric Login</Text>
            </TouchableOpacity> */}
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>{t('dontHaveAccount')} </Text>
            <TouchableOpacity onPress={handleRegister} activeOpacity={0.7}>
              <Text style={styles.link}>{t('createAccount')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginScreen;
