import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { useAuth } from '../../store/AuthContext';
import { useTheme } from '../../store/ThemeContext';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { ValidationUtils } from '../../utils/validation';
import { useTranslation } from '../../utils/translations';

const { width, height } = Dimensions.get('window');

interface Country {
  name: string;
  code: string;
  flag: string;
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phoneCode: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneCode?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
}

const RegisterScreen: React.FC = () => {
  const { register } = useAuth();
  const navigation = useNavigation();
  const { state: themeState } = useTheme();
  const theme = themeState.theme;
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  
  const countries: Country[] = [
    { name: t('india'), code: '+91', flag: '🇮🇳' },
    { name: t('indonesia'), code: '+62', flag: '🇮🇩' },
    { name: t('bangladesh'), code: '+880', flag: '🇧🇩' },
    { name: t('china'), code: '+86', flag: '🇨🇳' },
    { name: t('bahrain'), code: '+973', flag: '🇧🇭' },
    { name: t('malaysia'), code: '+60', flag: '🇲🇾' },
    { name: t('australia'), code: '+61', flag: '🇦🇺' },
    { name: t('singapore'), code: '+65', flag: '🇸🇬' },
    { name: t('unitedStates'), code: '+1', flag: '🇺🇸' },
    { name: t('unitedKingdom'), code: '+44', flag: '🇬🇧' },
  ];
  
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phoneCode: '+91', // Default to India
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const validateForm = (): boolean => {
    const result = ValidationUtils.validateRegistrationForm({
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phoneCode: formData.phoneCode,
      phone: formData.phone,
      password: formData.password,
      confirmPassword: formData.confirmPassword
    });

    setErrors(result.errors);

    if (!result.isValid) {
      // Show the first error in a toast
      const firstError = Object.values(result.errors)[0];
      if (firstError) {
        Toast.show({
          type: 'error',
          text1: t('validationError'),
          text2: firstError,
          position: 'bottom'
        });
      }
    }

    return result.isValid;
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const result = await register({
        name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
        email: formData.email.trim().toLowerCase(),
        phoneCode: formData.phoneCode,
        phone: formData.phone.trim(),
        password: formData.password,
      });

      // Registration successful, navigate to email verification
      Toast.show({
        type: 'success',
        text1: t('registrationSuccessful'),
        text2: t('checkEmailForVerification'),
        position: 'bottom'
      });

      // @ts-ignore - Navigation typing
      navigation.navigate('EmailVerification', { 
        email: formData.email.trim().toLowerCase() 
      });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: t('registrationFailed'),
        text2: error.message || t('checkInformationAndTryAgain'),
        position: 'bottom'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    // @ts-ignore - Navigation typing
    navigation.navigate('Login');
  };

  const nextStep = () => {
    if (currentStep === 1) {
      // Validate step 1 fields
      if (!formData.firstName.trim() || !formData.lastName.trim()) {
        Toast.show({
          type: 'error',
          text1: t('requiredFields'),
          text2: t('fillNameFields'),
          position: 'bottom'
        });
        return;
      }
    }
    setCurrentStep(2);
  };

  const prevStep = () => {
    setCurrentStep(1);
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      <View style={[styles.stepDot, currentStep >= 1 && styles.stepDotActive]}>
        <Text style={[styles.stepNumber, currentStep >= 1 && styles.stepNumberActive]}>{t('step1')}</Text>
      </View>
      <View style={[styles.stepLine, currentStep >= 2 && styles.stepLineActive]} />
      <View style={[styles.stepDot, currentStep >= 2 && styles.stepDotActive]}>
        <Text style={[styles.stepNumber, currentStep >= 2 && styles.stepNumberActive]}>{t('step2')}</Text>
      </View>
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>{t('personalInformation')}</Text>
      <Text style={styles.stepSubtitle}>{t('letsStartWithBasicDetails')}</Text>

      {/* <View style={styles.inputRow}> */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>{t('firstName')} *</Text>
          <View style={[styles.inputWrapper, focusedField === 'firstName' && styles.inputFocused, errors.firstName && styles.inputError]}>
            <Text style={styles.inputIcon}>👤</Text>
            <TextInput
              style={styles.input}
              placeholder={t('firstNamePlaceholder')}
              placeholderTextColor={theme.colors.outline}
              value={formData.firstName}
              onChangeText={(value) => handleInputChange('firstName', value)}
              autoCapitalize="words"
              onFocus={() => setFocusedField('firstName')}
              onBlur={() => setFocusedField(null)}
            />
          </View>
          {errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>{t('lastName')} *</Text>
          <View style={[styles.inputWrapper, focusedField === 'lastName' && styles.inputFocused, errors.lastName && styles.inputError]}>
            <Text style={styles.inputIcon}>👤</Text>
            <TextInput
              style={styles.input}
              placeholder={t('lastNamePlaceholder')}
              placeholderTextColor={theme.colors.outline}
              value={formData.lastName}
              onChangeText={(value) => handleInputChange('lastName', value)}
              autoCapitalize="words"
              onFocus={() => setFocusedField('lastName')}
              onBlur={() => setFocusedField(null)}
            />
          </View>
          {errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}
        </View>
      {/* </View> */}

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>{t('phoneNumber')} *</Text>
        <View style={styles.phoneInputContainer}>
          {/* Country Code Selector */}
          <TouchableOpacity 
            style={[styles.countryCodeButton, focusedField === 'phoneCode' && styles.inputFocused, errors.phoneCode && styles.inputError]}
            onPress={() => setShowCountryPicker(true)}
          >
            <Text style={styles.countryFlag}>
              {countries.find(c => c.code === formData.phoneCode)?.flag || '🇮🇳'}
            </Text>
            <Text style={styles.countryCodeText}>{formData.phoneCode}</Text>
            <Text style={styles.dropdownArrow}>▼</Text>
          </TouchableOpacity>
          
          {/* Phone Number Input */}
          <View style={[styles.phoneNumberWrapper, focusedField === 'phone' && styles.inputFocused, errors.phone && styles.inputError]}>
            <TextInput
              style={styles.phoneNumberInput}
              placeholder={t('phoneNumberPlaceholder')}
              placeholderTextColor={theme.colors.outline}
              value={formData.phone}
              onChangeText={(value) => handleInputChange('phone', value)}
              keyboardType="phone-pad"
              onFocus={() => setFocusedField('phone')}
              onBlur={() => setFocusedField(null)}
            />
          </View>
        </View>
        {errors.phoneCode && <Text style={styles.errorText}>{errors.phoneCode}</Text>}
        {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
      </View>

      <TouchableOpacity style={styles.nextButton} onPress={nextStep}>
        <Text style={styles.nextButtonText}>{t('nextStep')}</Text>
        <Text style={styles.buttonArrow}>→</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>{t('accountSecurity')}</Text>
      <Text style={styles.stepSubtitle}>{t('setupLoginCredentials')}</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>{t('emailAddressRequired')}</Text>
        <View style={[styles.inputWrapper, focusedField === 'email' && styles.inputFocused, errors.email && styles.inputError]}>
          <Text style={styles.inputIcon}>📧</Text>
          <TextInput
            style={styles.input}
            placeholder={t('emailPlaceholder')}
            placeholderTextColor={theme.colors.outline}
            value={formData.email}
            onChangeText={(value) => handleInputChange('email', value)}
            keyboardType="email-address"
            autoCapitalize="none"
            onFocus={() => setFocusedField('email')}
            onBlur={() => setFocusedField(null)}
          />
        </View>
        {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>{t('passwordRequired')}</Text>
        <View style={[styles.inputWrapper, focusedField === 'password' && styles.inputFocused, errors.password && styles.inputError]}>
          <Text style={styles.inputIcon}>🔐</Text>
          <TextInput
            style={styles.input}
            placeholder={t('createStrongPassword')}
            placeholderTextColor={theme.colors.outline}
            value={formData.password}
            onChangeText={(value) => handleInputChange('password', value)}
            secureTextEntry={!showPassword}
            onFocus={() => setFocusedField('password')}
            onBlur={() => setFocusedField(null)}
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

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>{t('confirmPasswordRequired')}</Text>
        <View style={[styles.inputWrapper, focusedField === 'confirmPassword' && styles.inputFocused, errors.confirmPassword && styles.inputError]}>
          <Text style={styles.inputIcon}>🔒</Text>
          <TextInput
            style={styles.input}
            placeholder={t('confirmPasswordPlaceholder')}
            placeholderTextColor={theme.colors.outline}
            value={formData.confirmPassword}
            onChangeText={(value) => handleInputChange('confirmPassword', value)}
            secureTextEntry={!showConfirmPassword}
            onFocus={() => setFocusedField('confirmPassword')}
            onBlur={() => setFocusedField(null)}
          />
          <TouchableOpacity 
            style={styles.eyeButton}
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            <Text style={styles.eyeIcon}>{showConfirmPassword ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        </View>
        {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.backButton} onPress={prevStep}>
          <Text style={styles.backButtonText}>{t('backArrow')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.registerButton, loading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading}
        >
          <Text style={styles.registerButtonText}>
            {loading ? t('creating') : t('createAccount')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const styles = useThemedStyles((theme, rtlStyles) => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      direction: (rtlStyles?.container.direction as 'rtl' | 'ltr') || 'ltr',
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
      paddingTop: height * 0.06,
      paddingBottom: 32,
    },
    headerSection: {
      alignItems: 'center',
      marginBottom: 32,
    },
    logoContainer: {
      marginBottom: 20,
    },
    logo: {
      width: 70,
      height: 70,
      borderRadius: 35,
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
      fontSize: 28,
    },
    title: {
      fontSize: 28,
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
      marginBottom: 24,
    },
    stepIndicator: {
      flexDirection: (rtlStyles?.row.flexDirection as 'row' | 'row-reverse') || 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 24,
    },
    stepDot: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.colors.outline,
      justifyContent: 'center',
      alignItems: 'center',
    },
    stepDotActive: {
      backgroundColor: theme.colors.primary,
    },
    stepNumber: {
      fontSize: 14,
      fontWeight: 'bold',
      color: theme.colors.onSurface,
    },
    stepNumberActive: {
      color: theme.colors.onPrimary,
    },
    stepLine: {
      width: 40,
      height: 2,
      backgroundColor: theme.colors.outline,
      marginHorizontal: 8,
    },
    stepLineActive: {
      backgroundColor: theme.colors.primary,
    },
    stepContent: {
      marginBottom: 24,
    },
    stepTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      color: theme.colors.onBackground,
      marginBottom: 8,
      textAlign: 'center',
    },
    stepSubtitle: {
      fontSize: 14,
      color: theme.colors.onSurface,
      textAlign: 'center',
      opacity: 0.8,
      marginBottom: 24,
    },
    inputRow: {
      flexDirection: (rtlStyles?.row.flexDirection as 'row' | 'row-reverse') || 'row',
      marginBottom: 20,
    },
    inputContainer: {
      marginBottom: 20,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.onBackground,
      marginBottom: 8,
      marginLeft: rtlStyles?.marginStart.marginLeft || 4,
      marginRight: rtlStyles?.marginStart.marginRight || 0,
      textAlign: (rtlStyles?.textAlign.textAlign as 'left' | 'right') || 'left',
    },
    inputWrapper: {
      flexDirection: (rtlStyles?.row.flexDirection as 'row' | 'row-reverse') || 'row',
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
    inputError: {
      borderColor: theme.colors.error,
    },
    inputIcon: {
      fontSize: 18,
      marginRight: rtlStyles?.marginEnd.marginRight || 12,
      marginLeft: rtlStyles?.marginEnd.marginLeft || 0,
    },
    input: {
      flex: 1,
      fontSize: 16,
      color: theme.colors.onSurface,
      paddingVertical: 12,
      textAlign: (rtlStyles?.textAlign.textAlign as 'left' | 'right') || 'left',
    },
    eyeButton: {
      padding: 8,
    },
    eyeIcon: {
      fontSize: 16,
    },
    errorText: {
      color: theme.colors.error,
      fontSize: 12,
      marginTop: 4,
      marginLeft: rtlStyles?.marginStart.marginLeft || 4,
      marginRight: rtlStyles?.marginStart.marginRight || 0,
      textAlign: (rtlStyles?.textAlign.textAlign as 'left' | 'right') || 'left',
    },
    nextButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: 16,
      paddingVertical: 16,
      flexDirection: (rtlStyles?.row.flexDirection as 'row' | 'row-reverse') || 'row',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
      marginTop: 8,
    },
    nextButtonText: {
      color: theme.colors.onPrimary,
      fontSize: 16,
      fontWeight: 'bold',
      marginRight: rtlStyles?.marginEnd.marginRight || 8,
      marginLeft: rtlStyles?.marginEnd.marginLeft || 0,
    },
    buttonArrow: {
      color: theme.colors.onPrimary,
      fontSize: 18,
      fontWeight: 'bold',
    },
    buttonRow: {
      flexDirection: (rtlStyles?.row.flexDirection as 'row' | 'row-reverse') || 'row',
      gap: 12,
      marginTop: 8,
    },
    backButton: {
      flex: 1,
      borderWidth: 2,
      borderColor: theme.colors.outline,
      borderRadius: 16,
      paddingVertical: 16,
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
    },
    backButtonText: {
      color: theme.colors.onSurface,
      fontSize: 16,
      fontWeight: '600',
    },
    registerButton: {
      flex: 2,
      backgroundColor: theme.colors.primary,
      borderRadius: 16,
      paddingVertical: 16,
      alignItems: 'center',
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    buttonDisabled: {
      backgroundColor: theme.colors.outline,
      shadowOpacity: 0.1,
    },
    registerButtonText: {
      color: theme.colors.onPrimary,
      fontSize: 16,
      fontWeight: 'bold',
    },
    footer: {
      flexDirection: (rtlStyles?.row.flexDirection as 'row' | 'row-reverse') || 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 'auto',
      paddingTop: 24,
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
    // Phone input styles
    phoneInputContainer: {
      flexDirection: (rtlStyles?.row.flexDirection as 'row' | 'row-reverse') || 'row',
      gap: 8,
    },
    countryCodeButton: {
      flexDirection: (rtlStyles?.row.flexDirection as 'row' | 'row-reverse') || 'row',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: theme.colors.outline,
      borderRadius: 16,
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 12,
      paddingVertical: 16,
      minWidth: 120,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    countryFlag: {
      fontSize: 20,
      marginRight: rtlStyles?.marginEnd.marginRight || 8,
      marginLeft: rtlStyles?.marginEnd.marginLeft || 0,
    },
    countryCodeText: {
      fontSize: 16,
      color: theme.colors.onSurface,
      fontWeight: '500',
      flex: 1,
      textAlign: (rtlStyles?.textAlign.textAlign as 'left' | 'right') || 'left',
    },
    dropdownArrow: {
      fontSize: 12,
      color: theme.colors.onSurface,
      opacity: 0.6,
    },
    phoneNumberWrapper: {
      flex: 1,
      flexDirection: (rtlStyles?.row.flexDirection as 'row' | 'row-reverse') || 'row',
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
    phoneNumberInput: {
      flex: 1,
      fontSize: 16,
      color: theme.colors.onSurface,
      paddingVertical: 12,
      textAlign: (rtlStyles?.textAlign.textAlign as 'left' | 'right') || 'left',
    },
    // Modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      width: width * 0.9,
      maxHeight: height * 0.7,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    modalHeader: {
      flexDirection: (rtlStyles?.row.flexDirection as 'row' | 'row-reverse') || 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outline,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.onSurface,
      textAlign: (rtlStyles?.textAlign.textAlign as 'left' | 'right') || 'left',
    },
    modalCloseButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.colors.outline,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalCloseText: {
      fontSize: 16,
      color: theme.colors.onSurface,
      fontWeight: 'bold',
    },
    countryList: {
      maxHeight: height * 0.5,
    },
    countryItem: {
      flexDirection: (rtlStyles?.row.flexDirection as 'row' | 'row-reverse') || 'row',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outline,
    },
    countryItemFlag: {
      fontSize: 24,
      marginRight: rtlStyles?.marginEnd.marginRight || 16,
      marginLeft: rtlStyles?.marginEnd.marginLeft || 0,
    },
    countryItemName: {
      flex: 1,
      fontSize: 16,
      color: theme.colors.onSurface,
      fontWeight: '500',
      textAlign: (rtlStyles?.textAlign.textAlign as 'left' | 'right') || 'left',
    },
    countryItemCode: {
      fontSize: 16,
      color: theme.colors.onSurface,
      opacity: 0.7,
      fontWeight: '500',
      textAlign: (rtlStyles?.textAlignReverse.textAlign as 'left' | 'right') || 'right',
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
            <Text style={styles.title}>{t('joinLandTracker')}</Text>
            <Text style={styles.subtitle}>{t('createAccountToGetStarted')}</Text>
            
            {renderStepIndicator()}
          </View>

          {currentStep === 1 ? renderStep1() : renderStep2()}

          <View style={styles.footer}>
            <Text style={styles.footerText}>{t('alreadyHaveAccount')} </Text>
            <TouchableOpacity onPress={handleLogin} activeOpacity={0.7}>
              <Text style={styles.link}>{t('signIn')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Country Picker Modal */}
      <Modal
        visible={showCountryPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCountryPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('selectCountry')}</Text>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowCountryPicker(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.countryList}>
              {countries.map((country, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.countryItem}
                  onPress={() => {
                    setFormData(prev => ({ ...prev, phoneCode: country.code }));
                    setShowCountryPicker(false);
                  }}
                >
                  <Text style={styles.countryItemFlag}>{country.flag}</Text>
                  <Text style={styles.countryItemName}>{country.name}</Text>
                  <Text style={styles.countryItemCode}>{country.code}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default RegisterScreen;

