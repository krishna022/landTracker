import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Vibration,
} from 'react-native';
import { useAuth } from '../../store/AuthContext';
import { theme } from '../../utils/theme';

const PinLoginScreen: React.FC = () => {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginWithPin, user } = useAuth();

  const handleNumberPress = (number: string) => {
    if (pin.length < 4) {
      setPin(prev => prev + number);
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handleSubmit = async () => {
    if (pin.length !== 4) {
      Alert.alert('Error', 'Please enter a 4-digit PIN');
      return;
    }

    setLoading(true);
    try {
      await loginWithPin(pin);
    } catch (error: any) {
      Alert.alert('Invalid PIN', 'Please try again');
      Vibration.vibrate(500);
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (pin.length === 4) {
      handleSubmit();
    }
  }, [pin]);

  const renderPinDots = () => {
    return Array.from({ length: 4 }, (_, index) => (
      <View
        key={index}
        style={[
          styles.pinDot,
          { backgroundColor: index < pin.length ? theme.colors.primary : theme.colors.outline }
        ]}
      />
    ));
  };

  const renderNumberPad = () => {
    const numbers = [
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['7', '8', '9'],
      ['', '0', 'backspace']
    ];

    return numbers.map((row, rowIndex) => (
      <View key={rowIndex} style={styles.numberRow}>
        {row.map((item, itemIndex) => {
          if (item === '') {
            return <View key={itemIndex} style={styles.numberButton} />;
          }
          
          if (item === 'backspace') {
            return (
              <TouchableOpacity
                key={itemIndex}
                style={styles.numberButton}
                onPress={handleBackspace}
              >
                <Text style={styles.backspaceText}>⌫</Text>
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity
              key={itemIndex}
              style={styles.numberButton}
              onPress={() => handleNumberPress(item)}
            >
              <Text style={styles.numberText}>{item}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    ));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>
          {user?.name ? `Hi ${user.name}` : 'Enter your PIN'}
        </Text>

        <View style={styles.pinContainer}>
          <Text style={styles.pinLabel}>Enter your 4-digit PIN</Text>
          <View style={styles.pinDots}>
            {renderPinDots()}
          </View>
        </View>

        <View style={styles.numberPad}>
          {renderNumberPad()}
        </View>

        <TouchableOpacity style={styles.biometricButton}>
          <Text style={styles.biometricText}>Use Biometric</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.forgotButton}>
          <Text style={styles.forgotText}>Forgot PIN?</Text>
        </TouchableOpacity>
      </View>
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
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.onBackground,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.onSurface,
    marginBottom: 60,
  },
  pinContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  pinLabel: {
    fontSize: 16,
    color: theme.colors.onSurface,
    marginBottom: 20,
  },
  pinDots: {
    flexDirection: 'row',
    gap: 16,
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  numberPad: {
    marginBottom: 40,
  },
  numberRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  numberButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
  },
  numberText: {
    fontSize: 24,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
  backspaceText: {
    fontSize: 20,
    color: theme.colors.onSurface,
  },
  biometricButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  biometricText: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  forgotButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  forgotText: {
    fontSize: 14,
    color: theme.colors.onSurface,
  },
});

export default PinLoginScreen;
