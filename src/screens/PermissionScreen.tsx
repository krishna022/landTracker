import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../utils/theme';

const { width, height } = Dimensions.get('window');

interface PermissionItem {
  id: string;
  title: string;
  description: string;
  permission: any; // Using any to avoid type conflicts with react-native-permissions
  icon: string;
  granted: boolean;
}

const PermissionScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<any>>();
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [loading, setLoading] = useState(false);

  const permissionList: Omit<PermissionItem, 'granted'>[] = [
    {
      id: 'camera',
      title: 'Camera Access',
      description: 'Required to capture photos of your properties and documents for verification purposes.',
      permission: Platform.OS === 'ios' ? PERMISSIONS.IOS.CAMERA : PERMISSIONS.ANDROID.CAMERA,
      icon: '📷',
    },
    {
      id: 'gallery',
      title: 'Photo Gallery',
      description: 'Needed to select and upload property images from your device gallery.',
      permission: Platform.OS === 'ios'
        ? PERMISSIONS.IOS.PHOTO_LIBRARY
        : PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
      icon: '🖼️',
    },
    {
      id: 'location',
      title: 'Location Access',
      description: 'Allows us to show nearby properties and provide location-based property recommendations.',
      permission: Platform.OS === 'ios'
        ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
        : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
      icon: '📍',
    },
    {
      id: 'storage',
      title: 'Storage Access',
      description: 'Required to save property documents and images locally on your device.',
      permission: Platform.OS === 'ios'
        ? PERMISSIONS.IOS.PHOTO_LIBRARY
        : PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE,
      icon: '💾',
    },
  ];

  useEffect(() => {
    initializePermissions();
  }, []);

  const initializePermissions = async () => {
    const initialPermissions = permissionList.map(perm => ({
      ...perm,
      granted: false,
    }));
    setPermissions(initialPermissions);
  };

  const requestPermission = async (permissionItem: PermissionItem) => {
    try {
      setLoading(true);
      const result = await request(permissionItem.permission);

      const updatedPermissions = permissions.map(perm =>
        perm.id === permissionItem.id
          ? { ...perm, granted: result === RESULTS.GRANTED }
          : perm
      );

      setPermissions(updatedPermissions);

      if (result === RESULTS.DENIED) {
        Alert.alert(
          'Permission Required',
          `${permissionItem.title} is required for the app to function properly. You can grant it later in app settings.`,
          [{ text: 'OK' }]
        );
      } else if (result === RESULTS.BLOCKED) {
        Alert.alert(
          'Permission Blocked',
          `Please go to your device settings and enable ${permissionItem.title.toLowerCase()} for this app.`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open Settings',
              onPress: () => {
                // Note: You might want to use a library like react-native-open-settings
                // to open the app settings directly
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Permission request error:', error);
      Alert.alert('Error', 'Failed to request permission. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const requestAllPermissions = async () => {
    setLoading(true);
    try {
      const results = await Promise.all(
        permissions.map(async (perm) => {
          const result = await request(perm.permission);
          return {
            ...perm,
            granted: result === RESULTS.GRANTED,
          };
        })
      );

      setPermissions(results);

      // Check if all permissions are granted
      const allGranted = results.every(perm => perm.granted);

      if (allGranted) {
        await markPermissionsCompleted();
        navigation.navigate('Login' as never);
      } else {
        Alert.alert(
          'Permissions Incomplete',
          'Some permissions are still required for the best experience. You can grant them later or try again.',
          [
            { text: 'Try Again', style: 'default' },
            {
              text: 'Continue',
              onPress: async () => {
                await markPermissionsCompleted();
                navigation.navigate('Login' as never);
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Bulk permission request error:', error);
      Alert.alert('Error', 'Failed to request permissions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const markPermissionsCompleted = async () => {
    try {
      await AsyncStorage.setItem('permissions_completed', 'true');
    } catch (error) {
      console.error('Error saving permissions status:', error);
    }
  };

  const skipPermissions = async () => {
    Alert.alert(
      'Skip Permissions',
      'Some features may not work properly without these permissions. You can grant them later in the app settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Skip',
          style: 'destructive',
          onPress: async () => {
            await markPermissionsCompleted();
            navigation.navigate('Login' as never);
          }
        }
      ]
    );
  };

  const allGranted = permissions.every(perm => perm.granted);
  const someGranted = permissions.some(perm => perm.granted);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Welcome to Land Tracker</Text>
          <Text style={styles.subtitle}>
            To provide you with the best experience, we need access to a few permissions
          </Text>
        </View>

        <View style={styles.permissionsContainer}>
          {permissions.map((permission) => (
            <View key={permission.id} style={styles.permissionCard}>
              <View style={styles.permissionHeader}>
                <Text style={styles.permissionIcon}>{permission.icon}</Text>
                <View style={styles.permissionInfo}>
                  <Text style={styles.permissionTitle}>{permission.title}</Text>
                  <Text style={styles.permissionDescription}>
                    {permission.description}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.permissionButton,
                    permission.granted && styles.permissionGranted,
                    loading && styles.permissionDisabled,
                  ]}
                  onPress={() => requestPermission(permission)}
                  disabled={loading || permission.granted}
                >
                  <Text style={[
                    styles.permissionButtonText,
                    permission.granted && styles.permissionGrantedText,
                  ]}>
                    {permission.granted ? 'Granted' : 'Grant'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[
              styles.primaryButton,
              loading && styles.buttonDisabled,
            ]}
            onPress={requestAllPermissions}
            disabled={loading}
          >
            <Text style={styles.primaryButtonText}>
              {loading ? 'Requesting...' : 'Grant All Permissions'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.secondaryButton,
              loading && styles.buttonDisabled,
            ]}
            onPress={skipPermissions}
            disabled={loading}
          >
            <Text style={styles.secondaryButtonText}>Skip for Now</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            You can change these permissions anytime in your device settings
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: height * 0.05,
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.onBackground,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.onSurface,
    textAlign: 'center',
    opacity: 0.8,
    lineHeight: 24,
  },
  permissionsContainer: {
    marginBottom: 40,
  },
  permissionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: theme.colors.outline,
  },
  permissionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  permissionIcon: {
    fontSize: 32,
    marginRight: 16,
    marginTop: 2,
  },
  permissionInfo: {
    flex: 1,
    marginRight: 16,
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: 8,
  },
  permissionDescription: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    lineHeight: 20,
  },
  permissionButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  permissionGranted: {
    backgroundColor: theme.colors.secondary,
  },
  permissionDisabled: {
    opacity: 0.6,
  },
  permissionButtonText: {
    color: theme.colors.onPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  permissionGrantedText: {
    color: theme.colors.onSecondary,
  },
  actionsContainer: {
    marginBottom: 32,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryButtonText: {
    color: theme.colors.onPrimary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.outline,
  },
  secondaryButtonText: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default PermissionScreen;
