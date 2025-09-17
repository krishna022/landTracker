import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  Animated,
  Switch,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { useAuth } from '../../store/AuthContext';
import { useTheme } from '../../store/ThemeContext';
import { useThemedStyles } from '../../hooks/useThemedStyles';

const { width, height } = Dimensions.get('window');

const PinSetupScreen: React.FC = () => {
  const navigation = useNavigation();
  const { state: themeState } = useTheme();
  const theme = themeState.theme;
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'create' | 'confirm' | 'biometric'>('create');
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setupPin, cleanupIncompleteSession, completeAuthentication } = useAuth();

  const shakeAnimation = new Animated.Value(0);

  const styles = useThemedStyles((theme) => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      flex: 1,
      paddingHorizontal: 24,
      justifyContent: 'space-between',
    },
    header: {
      alignItems: 'center',
      marginTop: height * 0.1,
      marginBottom: 40,
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
    },
    pinDotsContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginBottom: 60,
    },
    pinDot: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: theme.colors.outline,
      marginHorizontal: 12,
      backgroundColor: theme.colors.surface,
    },
    pinDotFilled: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    numpadContainer: {
      alignSelf: 'center',
      marginBottom: 40,
    },
    numpadRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginBottom: 20,
    },
    numpadButton: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      marginHorizontal: 20,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    numpadButtonEmpty: {
      backgroundColor: 'transparent',
      shadowOpacity: 0,
      elevation: 0,
    },
    numpadButtonText: {
      fontSize: 24,
      fontWeight: '600',
      color: theme.colors.onSurface,
    },
    backspaceIcon: {
      fontSize: 24,
      color: theme.colors.onSurface,
    },
    biometricContainer: {
      flex: 1,
      justifyContent: 'center',
    },
    biometricHeader: {
      alignItems: 'center',
      marginBottom: 40,
    },
    biometricIcon: {
      fontSize: 64,
      marginBottom: 16,
    },
    biometricTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.onBackground,
      marginBottom: 8,
      textAlign: 'center',
    },
    biometricSubtitle: {
      fontSize: 16,
      color: theme.colors.onSurface,
      textAlign: 'center',
      opacity: 0.8,
      lineHeight: 22,
    },
    biometricOption: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 40,
    },
    biometricOptionLeft: {
      flex: 1,
      marginRight: 16,
    },
    biometricOptionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.onSurface,
      marginBottom: 4,
    },
    biometricOptionDescription: {
      fontSize: 14,
      color: theme.colors.onSurface,
      opacity: 0.7,
    },
    biometricActions: {
      gap: 16,
    },
    completeButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: 16,
      paddingVertical: 16,
      alignItems: 'center',
    },
    buttonDisabled: {
      backgroundColor: theme.colors.outline,
    },
    completeButtonText: {
      color: theme.colors.onPrimary,
      fontSize: 18,
      fontWeight: '600',
    },
    skipButton: {
      alignItems: 'center',
      paddingVertical: 12,
    },
    skipButtonText: {
      color: theme.colors.onSurface,
      fontSize: 16,
      opacity: 0.7,
    },
    footer: {
      alignItems: 'center',
      paddingBottom: 40,
    },
    footerText: {
      fontSize: 14,
      color: theme.colors.onSurface,
      textAlign: 'center',
      opacity: 0.6,
      lineHeight: 20,
    },
  }));

  const handlePinPress = (digit: string) => {
    const currentPin = step === 'create' ? pin : confirmPin;
    
    if (currentPin.length < 4) {
      const newPin = currentPin + digit;
      
      if (step === 'create') {
        setPin(newPin);
        // Auto-proceed when PIN is complete (4 digits)
        if (newPin.length === 4) {
          setTimeout(() => setStep('confirm'), 500);
        }
      } else {
        setConfirmPin(newPin);
        // Auto-validate when confirmation is complete
        if (newPin.length === 4) {
          setTimeout(() => validatePins(pin, newPin), 500);
        }
      }
    }
  };

  const handleBackspace = () => {
    if (step === 'create') {
      setPin(pin.slice(0, -1));
    } else {
      setConfirmPin(confirmPin.slice(0, -1));
    }
  };

  const validatePins = async (originalPin: string, confirmationPin: string) => {
    if (originalPin === confirmationPin) {
      // PINs match, proceed to biometric setup
      setStep('biometric');
    } else {
      // PINs don't match
      setConfirmPin('');
      setStep('create');
      setPin('');
      
      // Shake animation for mismatch
      Animated.sequence([
        Animated.timing(shakeAnimation, { toValue: 10, duration: 100, useNativeDriver: true }),
        Animated.timing(shakeAnimation, { toValue: -10, duration: 100, useNativeDriver: true }),
        Animated.timing(shakeAnimation, { toValue: 10, duration: 100, useNativeDriver: true }),
        Animated.timing(shakeAnimation, { toValue: 0, duration: 100, useNativeDriver: true }),
      ]).start();
      
      Toast.show({
        type: 'error',
        text1: 'PINs do not match',
        text2: 'Please try again',
        position: 'bottom'
      });
    }
  };

// PinSetupScreen.tsx - Update handleComplete function
const handleComplete = async () => {
  setLoading(true);
  
  try {
    // Setup PIN with biometric preference
    const result = await setupPin(pin, biometricEnabled);
    
    // After PIN setup, complete authentication
    await completeAuthentication();
    
    Toast.show({
      type: 'success',
      text1: 'Setup Complete!',
      text2: biometricEnabled 
        ? 'PIN and biometric authentication enabled' 
        : 'PIN authentication enabled',
      position: 'bottom'
    });
    
    // Navigation will be handled automatically by AuthContext state change
    
  } catch (error: any) {
    console.error('PIN setup error:', error);
    Toast.show({
      type: 'error',
      text1: 'Setup Failed',
      text2: error.message || 'Failed to setup PIN',
      position: 'bottom'
    });
  } finally {
    setLoading(false);
  }
};

  const renderPinDots = () => {
    const currentPin = step === 'create' ? pin : confirmPin;
    
    return (
      <View style={styles.pinDotsContainer}>
        {[...Array(4)].map((_, index) => (
          <View
            key={index}
            style={[
              styles.pinDot,
              index < currentPin.length && styles.pinDotFilled
            ]}
          />
        ))}
      </View>
    );
  };

  const renderNumpad = () => {
    const numbers = [
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['7', '8', '9'],
      ['', '0', 'backspace']
    ];

    return (
      <View style={styles.numpadContainer}>
        {numbers.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.numpadRow}>
            {row.map((item, colIndex) => (
              <TouchableOpacity
                key={colIndex}
                style={[
                  styles.numpadButton,
                  item === '' && styles.numpadButtonEmpty
                ]}
                onPress={() => {
                  if (item === 'backspace') {
                    handleBackspace();
                  } else if (item !== '') {
                    handlePinPress(item);
                  }
                }}
                disabled={item === '' || loading}
                activeOpacity={0.7}
              >
                {item === 'backspace' ? (
                  <Text style={styles.backspaceIcon}>⌫</Text>
                ) : (
                  <Text style={styles.numpadButtonText}>{item}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
    );
  };

  const renderBiometricSetup = () => {
    return (
      <View style={styles.biometricContainer}>
        <View style={styles.biometricHeader}>
          <Text style={styles.biometricIcon}>👆</Text>
          <Text style={styles.biometricTitle}>Enable Biometric Authentication</Text>
          <Text style={styles.biometricSubtitle}>
            Use your fingerprint or face ID for quick and secure access to your account
          </Text>
        </View>

        <View style={styles.biometricOption}>
          <View style={styles.biometricOptionLeft}>
            <Text style={styles.biometricOptionTitle}>Biometric Login</Text>
            <Text style={styles.biometricOptionDescription}>
              Quick access using fingerprint or face recognition
            </Text>
          </View>
          <Switch
            value={biometricEnabled}
            onValueChange={setBiometricEnabled}
            trackColor={{ false: theme.colors.outline, true: theme.colors.primary }}
            thumbColor={biometricEnabled ? theme.colors.onPrimary : theme.colors.onSurface}
          />
        </View>

        <View style={styles.biometricActions}>
          <TouchableOpacity
            style={[styles.completeButton, loading && styles.buttonDisabled]}
            onPress={handleComplete}
            disabled={loading}
          >
            <Text style={styles.completeButtonText}>
              {loading ? 'Setting up...' : 'Complete Setup'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.skipButton}
            onPress={() => handleComplete()}
            disabled={loading}
          >
            <Text style={styles.skipButtonText}>Skip Biometric Setup</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const getStepTitle = () => {
    switch (step) {
      case 'create':
        return 'Create Your PIN';
      case 'confirm':
        return 'Confirm Your PIN';
      case 'biometric':
        return 'Security Setup';
      default:
        return '';
    }
  };

  const getStepSubtitle = () => {
    switch (step) {
      case 'create':
        return 'Choose a 4-digit PIN for secure access';
      case 'confirm':
        return 'Enter your PIN again to confirm';
      case 'biometric':
        return 'Choose your preferred authentication method';
      default:
        return '';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.content, { transform: [{ translateX: shakeAnimation }] }]}>
        <View style={styles.header}>
          <Text style={styles.title}>{getStepTitle()}</Text>
          <Text style={styles.subtitle}>{getStepSubtitle()}</Text>
        </View>

        {step === 'biometric' ? (
          renderBiometricSetup()
        ) : (
          <>
            {renderPinDots()}
            {renderNumpad()}
          </>
        )}

        {step !== 'biometric' && (
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Your PIN will be used to secure your account and sensitive information
            </Text>
          </View>
        )}
      </Animated.View>
    </SafeAreaView>
  );
};

export default PinSetupScreen;
