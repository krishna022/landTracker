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
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from '../utils/translations';
import { useTheme } from '../store/ThemeContext';
import { useThemedStyles } from '../hooks/useThemedStyles';

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
  const { state: themeState } = useTheme();
  const theme = themeState.theme;
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [grantedPermissions, setGrantedPermissions] = useState<string[]>([]);
  const { t } = useTranslation();

  const permissionList: Omit<PermissionItem, 'granted'>[] = [
    {
      id: 'camera',
      title: t('cameraAccess'),
      description: t('cameraDescription'),
      permission: Platform.OS === 'ios' ? PERMISSIONS.IOS.CAMERA : PERMISSIONS.ANDROID.CAMERA,
      icon: '📷',
    },
    {
      id: 'gallery',
      title: t('photoGallery'),
      description: t('galleryDescription'),
      permission: Platform.OS === 'ios'
        ? PERMISSIONS.IOS.PHOTO_LIBRARY
        : PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
      icon: '🖼️',
    },
    {
      id: 'location',
      title: t('locationAccess'),
      description: t('locationDescription'),
      permission: Platform.OS === 'ios'
        ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
        : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
      icon: '📍',
    },
    {
      id: 'storage',
      title: t('storageAccess'),
      description: t('storageDescription'),
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

  const requestPermission = async (permission: any, permissionName: string) => {
    try {
      console.log(`Requesting ${permissionName} permission...`);
      const result = await request(permission);
      console.log(`${permissionName} permission result:`, result);

      if (result === RESULTS.GRANTED) {
        console.log(`${permissionName} permission granted`);
        setGrantedPermissions(prev => [...prev, permissionName]);
        return true;
      } else if (result === RESULTS.BLOCKED) {
        console.log(`${permissionName} permission blocked`);
        Alert.alert(
          t('permissionBlocked'),
          t('permissionBlockedMessage'),
          [
            { text: t('openSettings'), onPress: () => Linking.openSettings() },
            { text: t('continue'), style: 'default' }
          ]
        );
        return false;
      } else {
        console.log(`${permissionName} permission denied`);
        return false;
      }
    } catch (error) {
      console.error(`Error requesting ${permissionName} permission:`, error);
      return false;
    }
  };

  const requestAllPermissions = async () => {
    console.log('Starting bulk permission request...');
    setLoading(true);

    // Add a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      console.log('Permission request timeout - forcing loading to false');
      setLoading(false);
      Alert.alert(
        t('requestTimeout'),
        t('requestTimeoutMessage'),
        [
          { text: t('tryAgain'), onPress: () => requestAllPermissions() },
          { text: t('skip'), onPress: skipPermissions, style: 'destructive' }
        ]
      );
    }, 30000); // 30 second timeout

    try {
      // Request permissions one by one instead of Promise.all to better handle errors
      const updatedPermissions = [...permissions];

      for (let i = 0; i < permissions.length; i++) {
        const perm = permissions[i];
        console.log(`Requesting permission for: ${perm.title}`);

        try {
          const result = await request(perm.permission);
          console.log(`Permission result for ${perm.title}:`, result);

          updatedPermissions[i] = {
            ...perm,
            granted: result === RESULTS.GRANTED,
          };
        } catch (error) {
          console.error(`Error requesting permission for ${perm.title}:`, error);
          // Continue with other permissions even if one fails
          updatedPermissions[i] = {
            ...perm,
            granted: false,
          };
        }
      }

      // Clear the timeout since we completed successfully
      clearTimeout(timeout);

      console.log('All permissions processed:', updatedPermissions);
      setPermissions(updatedPermissions);

      // Check if all permissions are granted
      const allGranted = updatedPermissions.every(perm => perm.granted);
      console.log('All permissions granted:', allGranted);

      if (allGranted) {
        console.log('All permissions granted, marking as completed and navigating...');
        await markPermissionsCompleted();
        navigation.navigate('Login' as never);
      } else {
        const grantedCount = updatedPermissions.filter(perm => perm.granted).length;
        console.log(`${grantedCount}/${updatedPermissions.length} permissions granted`);

        Alert.alert(
          t('permissionsIncomplete'),
          `${grantedCount} ${t('permissionsIncompleteMessage')}`,
          [
            {
              text: t('tryAgain'),
              onPress: () => requestAllPermissions(),
              style: 'default'
            },
            {
              text: t('continueAnyway'),
              onPress: async () => {
                console.log('User chose to continue anyway...');
                await markPermissionsCompleted();
                navigation.navigate('Login' as never);
              },
              style: 'default'
            }
          ]
        );
      }
    } catch (error) {
      // Clear the timeout on error
      clearTimeout(timeout);
      console.error('Bulk permission request error:', error);
      Alert.alert(
        t('error'),
        'Failed to request permissions. Please try again.',
        [
          { text: t('tryAgain'), onPress: () => requestAllPermissions() },
          { text: t('skip'), onPress: skipPermissions, style: 'destructive' }
        ]
      );
    } finally {
      console.log('Setting loading to false');
      setLoading(false);
    }
  };

  const markPermissionsCompleted = async () => {
    try {
      console.log('Marking permissions as completed...');
      await AsyncStorage.setItem('permissions_completed', 'true');
      console.log('Permissions marked as completed successfully');
    } catch (error) {
      console.error('Error saving permissions status:', error);
    }
  };

  // Force reset loading state if it gets stuck
  const resetLoadingState = () => {
    console.log('Force resetting loading state');
    setLoading(false);
  };

  // Add a useEffect to monitor loading state and reset if needed
  useEffect(() => {
    let timeoutId: number;

    if (loading) {
      // If loading is true for more than 45 seconds, reset it
      timeoutId = setTimeout(() => {
        console.log('Loading state stuck for too long, resetting...');
        resetLoadingState();
        Alert.alert(
          t('requestStuck'),
          t('requestStuckMessage'),
          [
            { text: t('tryAgain'), onPress: () => requestAllPermissions() },
            { text: t('skip'), onPress: skipPermissions, style: 'destructive' }
          ]
        );
      }, 45000);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [loading]);

  const skipPermissions = async () => {
    Alert.alert(
      t('skipPermissions'),
      t('skipPermissionsMessage'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('skip'),
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

  const styles = useThemedStyles((theme, rtlStyles) => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      direction: (rtlStyles?.container.direction as 'rtl' | 'ltr') || 'ltr',
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
      flexDirection: (rtlStyles?.row.flexDirection as 'row' | 'row-reverse') || 'row',
      alignItems: 'flex-start',
    },
    permissionIcon: {
      fontSize: 32,
      marginRight: rtlStyles?.marginEnd.marginRight || 16,
      marginLeft: rtlStyles?.marginEnd.marginLeft || 0,
      marginTop: 2,
    },
    permissionInfo: {
      flex: 1,
      marginRight: rtlStyles?.marginEnd.marginRight || 16,
      marginLeft: rtlStyles?.marginEnd.marginLeft || 0,
    },
    permissionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.onSurface,
      marginBottom: 8,
      textAlign: (rtlStyles?.textAlign.textAlign as 'left' | 'right') || 'left',
    },
    permissionDescription: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      lineHeight: 20,
      textAlign: (rtlStyles?.textAlign.textAlign as 'left' | 'right') || 'left',
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
  }));

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{t('welcomeToLandTracker')}</Text>
          <Text style={styles.subtitle}>
            {t('permissionSubtitle')}
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
                  onPress={() => requestPermission(permission.permission, permission.title)}
                  disabled={loading || permission.granted}
                >
                  <Text style={[
                    styles.permissionButtonText,
                    permission.granted && styles.permissionGrantedText,
                  ]}>
                    {permission.granted ? t('granted') : t('grant')}
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
              {loading ? t('requesting') : t('grantAllPermissions')}
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
            <Text style={styles.secondaryButtonText}>{t('skipForNow')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {t('permissionFooter')}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default PermissionScreen;
