import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { useAuth } from '../../store/AuthContext';
import { theme } from '../../utils/theme';

const { width, height } = Dimensions.get('window');

const PinAuthScreen: React.FC = () => {
  const navigation = useNavigation();
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [userName, setUserName] = useState('');
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const { validatePin, completeAuthentication } = useAuth();

  const shakeAnimation = new Animated.Value(0);

  useEffect(() => {
    loadUserData();
    checkBiometricAvailability();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('auth_user');
      
      if (userData) {
        const user = JSON.parse(userData);
        setUserName(user.name);
        setBiometricAvailable(user.biometricEnabled || false);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const checkBiometricAvailability = async () => {
    // Placeholder for biometric availability check
    // In a real app, you would check if biometric hardware is available
    try {
      setBiometricAvailable(true);
    } catch (error) {
      setBiometricAvailable(false);
    }
  };

  const handlePinPress = (digit: string) => {
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      
      // Auto-validate when PIN is complete
      if (newPin.length === 4) {
        setTimeout(() => validatePinInput(newPin), 300);
      }
    }
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
  };

  const validatePinInput = async (pinToValidate: string) => {
    setLoading(true);
    
    try {
      // Use the new validatePin method from AuthContext
      await validatePin(pinToValidate);
      
      // Complete authentication to mark user as logged in
      await completeAuthentication();
      
      Toast.show({
        type: 'success',
        text1: 'Welcome Back!',
        text2: `Hello ${userName}`,
        position: 'bottom'
      });
      
      // Navigate to main app
      (navigation as any).reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    } catch (error: any) {
      console.error('PIN validation error:', error);
      
      setAttempts(prev => prev + 1);
      setPin('');
      
      // Shake animation for wrong PIN
      Animated.sequence([
        Animated.timing(shakeAnimation, { toValue: 10, duration: 100, useNativeDriver: true }),
        Animated.timing(shakeAnimation, { toValue: -10, duration: 100, useNativeDriver: true }),
        Animated.timing(shakeAnimation, { toValue: 10, duration: 100, useNativeDriver: true }),
        Animated.timing(shakeAnimation, { toValue: 0, duration: 100, useNativeDriver: true }),
      ]).start();
      
      // Handle lockout if needed
      if (error.response?.data?.lockedUntil) {
        Toast.show({
          type: 'error',
          text1: 'Account Locked',
          text2: error.message || 'Too many failed attempts',
          position: 'bottom'
        });
      } else {
        const attemptsRemaining = error.response?.data?.attemptsRemaining;
        Toast.show({
          type: 'error',
          text1: 'Incorrect PIN',
          text2: attemptsRemaining ? `${attemptsRemaining} attempts remaining` : 'Please try again',
          position: 'bottom'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricAuth = async () => {
    // Placeholder for biometric authentication
    Toast.show({
      type: 'info',
      text1: 'Biometric Authentication',
      text2: 'Feature will be implemented here',
      position: 'bottom'
    });
  };

  const handleBackToLogin = () => {
    (navigation as any).navigate('Login');
  };

  const renderPinDots = () => {
    return (
      <View style={styles.pinDotsContainer}>
        {[...Array(4)].map((_, index) => (
          <View
            key={index}
            style={[
              styles.pinDot,
              index < pin.length && styles.pinDotFilled
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

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.content, { transform: [{ translateX: shakeAnimation }] }]}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoEmoji}>🔐</Text>
          </View>
          <Text style={styles.title}>Enter Your PIN</Text>
          <Text style={styles.subtitle}>
            {userName ? `Welcome back, ${userName}` : 'Enter your 4-digit PIN to continue'}
          </Text>
        </View>

        {renderPinDots()}

        {renderNumpad()}

        <View style={styles.footer}>
          {biometricAvailable && (
            <TouchableOpacity
              style={styles.biometricButton}
              onPress={handleBiometricAuth}
              disabled={loading}
            >
              <Text style={styles.biometricIcon}>👆</Text>
              <Text style={styles.biometricText}>Use Biometric</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackToLogin}
            disabled={loading}
          >
            <Text style={styles.backButtonText}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
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
  logoContainer: {
    marginBottom: 24,
  },
  logoEmoji: {
    fontSize: 48,
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
    lineHeight: 22,
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
  footer: {
    alignItems: 'center',
    paddingBottom: 40,
    gap: 20,
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  biometricIcon: {
    fontSize: 20,
  },
  biometricText: {
    fontSize: 16,
    color: theme.colors.onSurface,
    fontWeight: '500',
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: theme.colors.onSurface,
    opacity: 0.7,
  },
});

export default PinAuthScreen;
