import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../store/ThemeContext';
import { useTranslation } from '../utils/translations';
import { usePreferences } from '../store/PreferencesContext';
import { useThemedStyles } from '../hooks/useThemedStyles';

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { state: themeState, setThemeMode, toggleTheme } = useTheme();
  const theme = themeState.theme;
  const { preferences, setLanguage } = usePreferences();
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState(true);
  const [locationServices, setLocationServices] = useState(true);
  const [biometricAuth, setBiometricAuth] = useState(false);
  const [autoBackup, setAutoBackup] = useState(true);

  const settingsSections = [
    {
      title: '🔔 Notifications',
      items: [
        {
          label: 'Push Notifications',
          value: notifications,
          onToggle: setNotifications,
          type: 'toggle',
        },
        {
          label: 'Email Alerts',
          onPress: () => Alert.alert('Email Alerts', 'Configure email notification preferences'),
          type: 'action',
        },
        {
          label: 'SMS Notifications',
          onPress: () => Alert.alert('SMS Notifications', 'Configure SMS notification preferences'),
          type: 'action',
        },
      ],
    },
    {
      title: '🎨 Appearance',
      items: [
        {
          label: 'Dark Mode',
          value: themeState.isDark,
          onToggle: () => setThemeMode(themeState.isDark ? 'light' : 'dark'),
          type: 'toggle',
        },
        {
          label: 'Font Size',
          onPress: () => Alert.alert('Font Size', 'Adjust font size preferences'),
          type: 'action',
        },
        {
          label: t('language'),
          subtitle: preferences.language.nativeName,
          onPress: () => showLanguageSelection(),
          type: 'action',
        },
      ],
    },
    {
      title: '🔒 Privacy & Security',
      items: [
        {
          label: 'Biometric Authentication',
          value: biometricAuth,
          onToggle: setBiometricAuth,
          type: 'toggle',
        },
        {
          label: 'Location Services',
          value: locationServices,
          onToggle: setLocationServices,
          type: 'toggle',
        },
        {
          label: 'Data Privacy',
          onPress: () => Alert.alert('Data Privacy', 'Review data privacy settings'),
          type: 'action',
        },
        {
          label: 'Two-Factor Authentication',
          onPress: () => Alert.alert('2FA', 'Configure two-factor authentication'),
          type: 'action',
        },
      ],
    },
    {
      title: '💾 Data & Storage',
      items: [
        {
          label: 'Auto Backup',
          value: autoBackup,
          onToggle: setAutoBackup,
          type: 'toggle',
        },
        {
          label: 'Storage Usage',
          subtitle: '2.3 GB used',
          onPress: () => Alert.alert('Storage', 'View storage usage details'),
          type: 'action',
        },
        {
          label: 'Clear Cache',
          onPress: () => Alert.alert('Clear Cache', 'Are you sure you want to clear cache?'),
          type: 'action',
        },
        {
          label: 'Export Data',
          onPress: () => Alert.alert('Export Data', 'Export your data to external storage'),
          type: 'action',
        },
      ],
    },
    {
      title: '📞 Support',
      items: [
        {
          label: 'Help Center',
          onPress: () => Alert.alert('Help Center', 'Access help and documentation'),
          type: 'action',
        },
        {
          label: 'Contact Support',
          onPress: () => Alert.alert('Contact Support', 'Get in touch with our support team'),
          type: 'action',
        },
        {
          label: 'Report a Bug',
          onPress: () => Alert.alert('Report Bug', 'Report a bug or issue'),
          type: 'action',
        },
        {
          label: 'Rate App',
          onPress: () => Alert.alert('Rate App', 'Rate our app on the store'),
          type: 'action',
        },
      ],
    },
    {
      title: '📄 Legal',
      items: [
        {
          label: 'Terms of Service',
          onPress: () => Alert.alert('Terms of Service', 'Read our terms of service'),
          type: 'action',
        },
        {
          label: 'Privacy Policy',
          onPress: () => Alert.alert('Privacy Policy', 'Read our privacy policy'),
          type: 'action',
        },
        {
          label: 'Licenses',
          onPress: () => Alert.alert('Licenses', 'View open source licenses'),
          type: 'action',
        },
      ],
    },
  ];

  const showLanguageSelection = () => {
    const languages = [
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
      { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
      { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
      { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
      { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
      { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
    ];

    const buttons: Array<{
      text: string;
      onPress: () => void;
      style?: 'default' | 'destructive' | 'cancel';
    }> = languages.map(language => ({
      text: language.nativeName,
      onPress: () => handleLanguageChange(language),
      style: language.code === preferences.language.code ? 'destructive' : 'default'
    }));

    buttons.push({
      text: t('cancel'),
      style: 'cancel',
      onPress: () => {} // Empty function for cancel button
    });

    Alert.alert(
      t('selectLanguage'),
      t('chooseCountry'),
      buttons
    );
  };

  const handleLanguageChange = async (language: { code: string; name: string; nativeName: string }) => {
    try {
      console.log('Changing language to:', language);
      await setLanguage(language);

      Alert.alert(
        t('success'),
        `Language changed to ${language.nativeName}. The app will now use this language.`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Force a re-render by updating a state that triggers re-render
              // This will cause all components using useTranslation to re-render
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error changing language:', error);
      Alert.alert(t('error'), 'Failed to change language. Please try again.');
    }
  };

  const styles = useThemedStyles((theme, rtlStyles) => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      direction: (rtlStyles?.container.direction as 'rtl' | 'ltr') || 'ltr',
    },
    scrollView: {
      flex: 1,
    },
    header: {
      padding: 24,
      paddingBottom: 16,
      backgroundColor: theme.colors.surface,
      borderBottomLeftRadius: 20,
      borderBottomRightRadius: 20,
      marginBottom: 16,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: theme.colors.onSurface,
      marginBottom: 4,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 16,
      color: theme.colors.onSurface,
      opacity: 0.7,
      textAlign: 'center',
    },
    content: {
      paddingHorizontal: 16,
      paddingBottom: 32,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.onSurface,
      marginBottom: 12,
      textAlign: (rtlStyles?.textAlign.textAlign as 'left' | 'right') || 'left',
    },
    sectionContent: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    settingItem: {
      flexDirection: (rtlStyles?.row.flexDirection as 'row' | 'row-reverse') || 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outline,
    },
    settingContent: {
      flex: 1,
    },
    settingLabel: {
      fontSize: 16,
      fontWeight: '500',
      marginBottom: 2,
      color: theme.colors.onSurface,
      textAlign: (rtlStyles?.textAlign.textAlign as 'left' | 'right') || 'left',
    },
    settingSubtitle: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      textAlign: (rtlStyles?.textAlign.textAlign as 'left' | 'right') || 'left',
    },
    settingArrow: {
      fontSize: 18,
      color: theme.colors.onSurfaceVariant,
    },
    appInfo: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 20,
      marginTop: 8,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    appInfoTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.onSurface,
      marginBottom: 16,
      textAlign: 'center',
    },
    appInfoContent: {
      gap: 12,
    },
    appInfoItem: {
      flexDirection: (rtlStyles?.row.flexDirection as 'row' | 'row-reverse') || 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outline,
    },
    appInfoLabel: {
      fontSize: 16,
      color: theme.colors.onSurface,
      fontWeight: '500',
      textAlign: (rtlStyles?.textAlign.textAlign as 'left' | 'right') || 'left',
    },
    appInfoValue: {
      fontSize: 16,
      color: theme.colors.onSurface,
      opacity: 0.7,
      textAlign: (rtlStyles?.textAlignReverse.textAlign as 'left' | 'right') || 'right',
    },
  }));

  const renderSettingItem = (item: any, index: number) => {
    if (item.type === 'toggle') {
      return (
        <View key={index} style={[styles.settingItem, { borderBottomColor: theme.colors.outline }]}>
          <View style={styles.settingContent}>
            <Text style={[styles.settingLabel, { color: theme.colors.onSurface }]}>
              {item.label}
            </Text>
            {item.subtitle && (
              <Text style={[styles.settingSubtitle, { color: theme.colors.onSurface, opacity: 0.6 }]}>
                {item.subtitle}
              </Text>
            )}
          </View>
          <Switch
            value={item.value}
            onValueChange={item.onToggle}
            trackColor={{ false: theme.colors.outline, true: theme.colors.primary }}
            thumbColor={item.value ? theme.colors.onPrimary : theme.colors.surface}
          />
        </View>
      );
    }

    return (
      <TouchableOpacity key={index} style={[styles.settingItem, { borderBottomColor: theme.colors.outline }]} onPress={item.onPress}>
        <View style={styles.settingContent}>
          <Text style={[styles.settingLabel, { color: theme.colors.onSurface }]}>
            {item.label}
          </Text>
          {item.subtitle && (
            <Text style={[styles.settingSubtitle, { color: theme.colors.onSurface, opacity: 0.6 }]}>
              {item.subtitle}
            </Text>
          )}
        </View>
        <Text style={[styles.settingArrow, { color: theme.colors.onSurface, opacity: 0.5 }]}>
          →
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.title, { color: theme.colors.onSurface }]}>⚙️ Settings</Text>
          <Text style={[styles.subtitle, { color: theme.colors.onSurface, opacity: 0.7 }]}>Customize your experience</Text>
        </View>

        <View style={styles.content}>
          {settingsSections.map((section, sectionIndex) => (
            <View key={sectionIndex} style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>{section.title}</Text>
              <View style={styles.sectionContent}>
                {section.items.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[styles.settingItem, { borderBottomColor: theme.colors.outline }]}
                    onPress={item.onPress}
                  >
                    <View style={styles.settingContent}>
                      <Text style={[styles.settingLabel, { color: theme.colors.onSurface }]}>
                        {item.label}
                      </Text>
                      {item.subtitle && (
                        <Text style={[styles.settingSubtitle, { color: theme.colors.onSurface, opacity: 0.6 }]}>
                          {item.subtitle}
                        </Text>
                      )}
                    </View>
                    <Text style={[styles.settingArrow, { color: theme.colors.onSurface, opacity: 0.5 }]}>
                      ›
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}

          <View style={styles.appInfo}>
            <Text style={styles.appInfoTitle}>App Information</Text>
            <View style={styles.appInfoContent}>
              <View style={styles.appInfoItem}>
                <Text style={styles.appInfoLabel}>Version</Text>
                <Text style={styles.appInfoValue}>1.0.0</Text>
              </View>
              <View style={styles.appInfoItem}>
                <Text style={styles.appInfoLabel}>Build</Text>
                <Text style={styles.appInfoValue}>2024.01</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SettingsScreen;
