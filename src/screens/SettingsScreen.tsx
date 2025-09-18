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
import { useTheme } from '../store/ThemeContext';
import { useTranslation } from '../utils/translations';
import { usePreferences } from '../store/PreferencesContext';

const SettingsScreen: React.FC = () => {
  const { state, setThemeMode, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const { preferences, setLanguage } = usePreferences();
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
          value: state.isDark,
          onToggle: () => setThemeMode(state.isDark ? 'light' : 'dark'),
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

  const renderSettingItem = (item: any, index: number) => {
    if (item.type === 'toggle') {
      return (
        <View key={index} style={[styles.settingItem, { borderBottomColor: state.theme.colors.outline }]}>
          <View style={styles.settingContent}>
            <Text style={[styles.settingLabel, { color: state.theme.colors.onSurface }]}>
              {item.label}
            </Text>
            {item.subtitle && (
              <Text style={[styles.settingSubtitle, { color: state.theme.colors.onSurface, opacity: 0.6 }]}>
                {item.subtitle}
              </Text>
            )}
          </View>
          <Switch
            value={item.value}
            onValueChange={item.onToggle}
            trackColor={{ false: state.theme.colors.outline, true: state.theme.colors.primary }}
            thumbColor={item.value ? state.theme.colors.onPrimary : state.theme.colors.surface}
          />
        </View>
      );
    }

    return (
      <TouchableOpacity key={index} style={[styles.settingItem, { borderBottomColor: state.theme.colors.outline }]} onPress={item.onPress}>
        <View style={styles.settingContent}>
          <Text style={[styles.settingLabel, { color: state.theme.colors.onSurface }]}>
            {item.label}
          </Text>
          {item.subtitle && (
            <Text style={[styles.settingSubtitle, { color: state.theme.colors.onSurface, opacity: 0.6 }]}>
              {item.subtitle}
            </Text>
          )}
        </View>
        <Text style={[styles.settingArrow, { color: state.theme.colors.onSurface, opacity: 0.5 }]}>
          →
        </Text>
      </TouchableOpacity>
    );
  };

  const showLanguageSelection = () => {
    const languages = [
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
      { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
      { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
      { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
      { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: state.theme.colors.background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={[styles.header, { backgroundColor: state.theme.colors.surface }]}>
          <Text style={[styles.title, { color: state.theme.colors.onSurface }]}>⚙️ Settings</Text>
          <Text style={[styles.subtitle, { color: state.theme.colors.onSurface, opacity: 0.7 }]}>Customize your experience</Text>
        </View>

        <View style={styles.content}>
          {settingsSections.map((section, sectionIndex) => (
            <View key={sectionIndex} style={styles.section}>
              <Text style={[styles.sectionTitle, { color: state.theme.colors.onBackground }]}>{section.title}</Text>
              <View style={[styles.sectionContent, { backgroundColor: state.theme.colors.surface }]}>
                {section.items.map((item, itemIndex) => renderSettingItem(item, itemIndex))}
              </View>
            </View>
          ))}

          <View style={[styles.appInfo, { backgroundColor: state.theme.colors.surface }]}>
            <Text style={[styles.appInfoTitle, { color: state.theme.colors.onSurface }]}>📱 App Information</Text>
            <View style={styles.appInfoContent}>
              <View style={[styles.appInfoItem, { borderBottomColor: state.theme.colors.outline }]}>
                <Text style={[styles.appInfoLabel, { color: state.theme.colors.onSurface }]}>Version</Text>
                <Text style={[styles.appInfoValue, { color: state.theme.colors.onSurface, opacity: 0.7 }]}>1.0.0</Text>
              </View>
              <View style={[styles.appInfoItem, { borderBottomColor: state.theme.colors.outline }]}>
                <Text style={[styles.appInfoLabel, { color: state.theme.colors.onSurface }]}>Build</Text>
                <Text style={[styles.appInfoValue, { color: state.theme.colors.onSurface, opacity: 0.7 }]}>2024.1.1</Text>
              </View>
              <View style={styles.appInfoItem}>
                <Text style={[styles.appInfoLabel, { color: state.theme.colors.onSurface }]}>Last Updated</Text>
                <Text style={[styles.appInfoValue, { color: state.theme.colors.onSurface, opacity: 0.7 }]}>January 15, 2024</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA', // fallback color
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF', // fallback color
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1C1C1C', // fallback color
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#1C1C1C', // fallback color
    opacity: 0.7,
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
    color: '#1C1C1C', // fallback color
    marginBottom: 12,
  },
  sectionContent: {
    backgroundColor: '#FFFFFF', // fallback color
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#BDBDBD', // fallback color
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
  },
  settingArrow: {
    fontSize: 18,
  },
  appInfo: {
    backgroundColor: '#FFFFFF', // fallback color
    borderRadius: 12,
    padding: 20,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  appInfoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1C', // fallback color
    marginBottom: 16,
  },
  appInfoContent: {
    gap: 12,
  },
  appInfoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#BDBDBD', // fallback color
  },
  appInfoLabel: {
    fontSize: 16,
    color: '#1C1C1C', // fallback color
    fontWeight: '500',
  },
  appInfoValue: {
    fontSize: 16,
    color: '#1C1C1C', // fallback color
    opacity: 0.7,
  },
});

export default SettingsScreen;
