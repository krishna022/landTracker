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
import { useTheme } from '../../store/ThemeContext';

const { width, height } = Dimensions.get('window');

const PinAuthScreen: React.FC = () => {
  const navigation = useNavigation();
  const { state } = useTheme();
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

// PinAuthScreen.tsx - Update validatePinInput function
const validatePinInput = async (pinToValidate: string) => {
  setLoading(true);
  
  try {
    // Get user ID from stored user data
    const userData = await AsyncStorage.getItem('auth_user');
    if (!userData) {
      throw new Error('User data not found');
    }
    
    const user = JSON.parse(userData);
    
    // Call validatePin with user ID and PIN
    const result:any = await validatePin(pinToValidate, user?.id);
    
    // The validatePin API should return new tokens
    if (result.tokens) {
      // Store the new tokens
      await AsyncStorage.setItem('auth_tokens', JSON.stringify(result.tokens));
      
      // Complete authentication to mark user as logged in
      await completeAuthentication();
      
      Toast.show({
        type: 'success',
        text1: 'Welcome Back!',
        text2: `Hello ${userName}`,
        position: 'bottom'
      });
    } else {
      throw new Error('No tokens received from PIN validation');
    }
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
    
    // Handle specific error cases
    if (error.response?.status === 401) {
      Toast.show({
        type: 'error',
        text1: 'Invalid PIN',
        text2: 'Please try again',
        position: 'bottom'
      });
    } else if (error.response?.data?.lockedUntil) {
      Toast.show({
        type: 'error',
        text1: 'Account Locked',
        text2: 'Too many failed attempts',
        position: 'bottom'
      });
    } else {
      Toast.show({
        type: 'error',
        text1: 'Authentication Failed',
        text2: error.message || 'Please try again',
        position: 'bottom'
      });
    }
  } finally {
    setLoading(false);
  }
};

const handleLogout = async () => {
  try {
    // Clear all stored data
    await AsyncStorage.removeItem('auth_user');
    await AsyncStorage.removeItem('auth_tokens');
    await AsyncStorage.removeItem('pin_setup_user');
    
    // Navigate back to login
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' as never }],
    });
    
    Toast.show({
      type: 'info',
      text1: 'Logged Out',
      text2: 'Please login again',
      position: 'bottom'
    });
  } catch (error) {
    console.error('Logout error:', error);
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
              {
                borderColor: state.theme.colors.outline,
                backgroundColor: state.theme.colors.surface
              },
              index < pin.length && {
                backgroundColor: state.theme.colors.primary,
                borderColor: state.theme.colors.primary
              }
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
                  {
                    backgroundColor: state.theme.colors.surface,
                    shadowColor: state.theme.colors.shadow
                  },
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
                  <Text style={[styles.backspaceIcon, { color: state.theme.colors.onSurface }]}>⌫</Text>
                ) : (
                  <Text style={[styles.numpadButtonText, { color: state.theme.colors.onSurface }]}>{item}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: state.theme.colors.background }]}>
      <Animated.View style={[styles.content, { transform: [{ translateX: shakeAnimation }] }]}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoEmoji}>🔐</Text>
          </View>
          <Text style={[styles.title, { color: state.theme.colors.onBackground }]}>Enter Your PIN</Text>
          <Text style={[styles.subtitle, { color: state.theme.colors.onSurface }]}>
            {userName ? `Welcome back, ${userName}` : 'Enter your 4-digit PIN to continue'}
          </Text>
        </View>

        {renderPinDots()}

        {renderNumpad()}

        <View style={styles.footer}>
          {biometricAvailable && (
            <TouchableOpacity
              style={[styles.biometricButton, { backgroundColor: state.theme.colors.surface }]}
              onPress={handleBiometricAuth}
              disabled={loading}
            >
              <Text style={styles.biometricIcon}>👆</Text>
              <Text style={[styles.biometricText, { color: state.theme.colors.onSurface }]}>Use Biometric</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackToLogin}
            disabled={loading}
          >
            <Text style={[styles.backButtonText, { color: state.theme.colors.onSurface, opacity: 0.7 }]}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
        disabled={loading}
      >
        <Text style={[styles.logoutButtonText, { color: state.theme.colors.error }]}>Logout</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
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
    marginHorizontal: 12,
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
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
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
  },
  backspaceIcon: {
    fontSize: 24,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 40,
    gap: 20,
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
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
    fontWeight: '500',
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  backButtonText: {
    fontSize: 16,
    opacity: 0.7,
  },
  logoutButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 20,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default PinAuthScreen;
