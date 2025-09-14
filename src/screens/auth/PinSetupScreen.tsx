import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  Animated,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useAuth } from '../../store/AuthContext';
import { theme } from '../../utils/theme';

const { width, height } = Dimensions.get('window');

interface PinSetupScreenProps {
  navigation: any;
}

const PinSetupScreen: React.FC<PinSetupScreenProps> = ({ navigation }) => {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'create' | 'confirm'>('create');
  const [loading, setLoading] = useState(false);
  const { setupPin, state, completeAuthentication } = useAuth();

  const shakeAnimation = new Animated.Value(0);

  const handlePinPress = (digit: string) => {
    const currentPin = step === 'create' ? pin : confirmPin;
    
    if (currentPin.length < 6) {
      const newPin = currentPin + digit;
      
      if (step === 'create') {
        setPin(newPin);
        // Auto-proceed when PIN is complete
        if (newPin.length === 4 || newPin.length === 6) {
          setStep('confirm');
        }
      } else {
        setConfirmPin(newPin);
        // Auto-validate when confirmation is complete
        if (newPin.length === pin.length) {
          validatePins(pin, newPin);
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
    setLoading(true);
    
    try {
      if (originalPin === confirmationPin) {
        // PINs match, save it and complete authentication
        await setupPin(originalPin);
        await completeAuthentication();
        
        Toast.show({
          type: 'success',
          text1: 'PIN Setup Complete!',
          text2: 'Your PIN has been saved securely',
          position: 'bottom'
        });
        
        // Navigate to main app
        navigation.replace('Main');
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
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to setup PIN',
        position: 'bottom'
      });
    }
    
    setLoading(false);
  };

  const handleSkip = async () => {
    // Allow user to skip PIN setup and go to main app
    await completeAuthentication();
    navigation.replace('Main');
  };

  const renderPinDots = () => {
    const currentPin = step === 'create' ? pin : confirmPin;
    const maxLength = step === 'create' ? 6 : pin.length;
    
    return (
      <View style={styles.pinDotsContainer}>
        {[...Array(maxLength)].map((_, index) => (
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
        <Text style={styles.welcomeText}>
          {step === 'create' ? 'Create your PIN' : 'Confirm your PIN'}
        </Text>
        <Text style={styles.userNameText}>Hello, {state.user?.name}</Text>
        <Text style={styles.instructionText}>
          {step === 'create' 
            ? 'Create a 4-6 digit PIN for quick access'
            : 'Enter your PIN again to confirm'
          }
        </Text>
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
        {step === 'create' && (
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
          >
            <Text style={styles.skipButtonText}>Skip for now</Text>
          </TouchableOpacity>
        )}
        
        {step === 'confirm' && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              setStep('create');
              setConfirmPin('');
            }}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
        )}
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
    fontSize: 18,
    fontWeight: '500',
    color: theme.colors.primary,
    marginBottom: 16,
  },
  instructionText: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 22,
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
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  skipButtonText: {
    fontSize: 16,
    color: theme.colors.outline,
    textAlign: 'center',
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  backButtonText: {
    fontSize: 16,
    color: theme.colors.primary,
    textAlign: 'center',
    fontWeight: '600',
  },
});

export default PinSetupScreen;
