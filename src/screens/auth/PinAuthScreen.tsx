import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  SafeAreaView,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { useAuth } from '../../store/AuthContext';
import { theme } from '../../utils/theme';

const { width, height } = Dimensions.get('window');

interface PinAuthScreenProps {
  navigation: any;
}

const PinAuthScreen: React.FC<PinAuthScreenProps> = ({ navigation }) => {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [userName, setUserName] = useState('');
  const [storedPin, setStoredPin] = useState('');
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const { state, completeAuthentication, logout } = useAuth();

  const shakeAnimation = new Animated.Value(0);

  useEffect(() => {
    loadUserData();
    checkBiometricAvailability();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('auth_user');
      const pinData = await AsyncStorage.getItem('user_pin');
      
      if (userData) {
        const user = JSON.parse(userData);
        setUserName(user.name);
      }
      
      if (pinData) {
        setStoredPin(pinData);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const checkBiometricAvailability = async () => {
    try {
      // TODO: Implement biometric check using react-native-biometrics or similar
      // For now, we'll assume it's available
      setBiometricAvailable(true);
    } catch (error) {
      setBiometricAvailable(false);
    }
  };

  const handlePinPress = (digit: string) => {
    if (pin.length < 6) {
      const newPin = pin + digit;
      setPin(newPin);
      
      // Auto-validate when PIN is complete
      if (newPin.length === 4 || newPin.length === 6) {
        validatePin(newPin);
      }
    }
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
  };

  const validatePin = async (pinToValidate: string) => {
    setLoading(true);
    
    try {
      // Check against stored PIN
      if (pinToValidate === storedPin) {
        // PIN is correct, complete authentication
        await completeAuthentication();
        
        Toast.show({
          type: 'success',
          text1: 'Welcome back!',
          text2: `Hello ${userName}`,
          position: 'bottom'
        });
        
        // Navigate to main app
        navigation.replace('Main');
      } else {
        // Incorrect PIN
        setAttempts(prev => prev + 1);
        setPin('');
        
        // Shake animation for incorrect PIN
        Animated.sequence([
          Animated.timing(shakeAnimation, { toValue: 10, duration: 100, useNativeDriver: true }),
          Animated.timing(shakeAnimation, { toValue: -10, duration: 100, useNativeDriver: true }),
          Animated.timing(shakeAnimation, { toValue: 10, duration: 100, useNativeDriver: true }),
          Animated.timing(shakeAnimation, { toValue: 0, duration: 100, useNativeDriver: true }),
        ]).start();
        
        Toast.show({
          type: 'error',
          text1: 'Incorrect PIN',
          text2: `${3 - attempts} attempts remaining`,
          position: 'bottom'
        });
        
        // Lock after 3 attempts
        if (attempts >= 2) {
          handleLogout();
        }
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to validate PIN',
        position: 'bottom'
      });
    }
    
    setLoading(false);
  };

  const handleBiometricAuth = async () => {
    try {
      // TODO: Implement biometric authentication
      Toast.show({
        type: 'info',
        text1: 'Biometric Auth',
        text2: 'Feature coming soon',
        position: 'bottom'
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Biometric Error',
        text2: 'Failed to authenticate',
        position: 'bottom'
      });
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.multiRemove(['auth_tokens', 'auth_user', 'user_pin']);
      await logout();
      navigation.replace('Auth');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const renderPinDots = () => {
    return (
      <View style={styles.pinDotsContainer}>
        {[...Array(6)].map((_, index) => (
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
                disabled={item === ''}
              >
                {item === 'backspace' ? (
                  <Text style={styles.backspaceText}>⌫</Text>
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
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome back</Text>
        <Text style={styles.userNameText}>{userName}</Text>
        <Text style={styles.instructionText}>Enter your PIN to continue</Text>
      </View>

      <Animated.View 
        style={[
          styles.pinContainer,
          { transform: [{ translateX: shakeAnimation }] }
        ]}
      >
        {renderPinDots()}
      </Animated.View>

      {renderNumpad()}

      <View style={styles.bottomActions}>
        {biometricAvailable && (
          <TouchableOpacity
            style={styles.biometricButton}
            onPress={handleBiometricAuth}
          >
            <Text style={styles.biometricButtonText}>👆</Text>
            <Text style={styles.biometricText}>Use Fingerprint</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.logoutButtonText}>Use Different Account</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '600',
    color: theme.colors.onBackground,
    marginBottom: 8,
  },
  userNameText: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.primary,
    marginBottom: 16,
  },
  instructionText: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  pinContainer: {
    alignItems: 'center',
    marginVertical: 40,
  },
  pinDotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: theme.colors.outline,
    marginHorizontal: 8,
  },
  pinDotFilled: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  numpadContainer: {
    paddingHorizontal: 40,
    paddingBottom: 20,
  },
  numpadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  numpadButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: theme.colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  numpadButtonEmpty: {
    backgroundColor: 'transparent',
    elevation: 0,
    shadowOpacity: 0,
  },
  numpadButtonText: {
    fontSize: 24,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
  backspaceText: {
    fontSize: 24,
    color: theme.colors.onSurface,
  },
  bottomActions: {
    alignItems: 'center',
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  biometricButton: {
    alignItems: 'center',
    marginBottom: 30,
    padding: 16,
  },
  biometricButtonText: {
    fontSize: 32,
    marginBottom: 8,
  },
  biometricText: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  logoutButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  logoutButtonText: {
    fontSize: 16,
    color: theme.colors.outline,
    textAlign: 'center',
  },
});

export default PinAuthScreen;
