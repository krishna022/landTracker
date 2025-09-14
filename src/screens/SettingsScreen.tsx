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
import { theme } from '../utils/theme';

const SettingsScreen: React.FC = () => {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
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
          value: darkMode,
          onToggle: setDarkMode,
          type: 'toggle',
        },
        {
          label: 'Font Size',
          onPress: () => Alert.alert('Font Size', 'Adjust font size preferences'),
          type: 'action',
        },
        {
          label: 'Language',
          subtitle: 'English (US)',
          onPress: () => Alert.alert('Language', 'Select your preferred language'),
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
        <View key={index} style={styles.settingItem}>
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>{item.label}</Text>
            {item.subtitle && (
              <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
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
      <TouchableOpacity key={index} style={styles.settingItem} onPress={item.onPress}>
        <View style={styles.settingContent}>
          <Text style={styles.settingLabel}>{item.label}</Text>
          {item.subtitle && (
            <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
          )}
        </View>
        <Text style={styles.settingArrow}>→</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>⚙️ Settings</Text>
          <Text style={styles.subtitle}>Customize your experience</Text>
        </View>

        <View style={styles.content}>
          {settingsSections.map((section, sectionIndex) => (
            <View key={sectionIndex} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <View style={styles.sectionContent}>
                {section.items.map((item, itemIndex) => renderSettingItem(item, itemIndex))}
              </View>
            </View>
          ))}

          <View style={styles.appInfo}>
            <Text style={styles.appInfoTitle}>📱 App Information</Text>
            <View style={styles.appInfoContent}>
              <View style={styles.appInfoItem}>
                <Text style={styles.appInfoLabel}>Version</Text>
                <Text style={styles.appInfoValue}>1.0.0</Text>
              </View>
              <View style={styles.appInfoItem}>
                <Text style={styles.appInfoLabel}>Build</Text>
                <Text style={styles.appInfoValue}>2024.1.1</Text>
              </View>
              <View style={styles.appInfoItem}>
                <Text style={styles.appInfoLabel}>Last Updated</Text>
                <Text style={styles.appInfoValue}>January 15, 2024</Text>
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
    backgroundColor: theme.colors.background,
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
    shadowColor: '#000',
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
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.onSurface,
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
    color: theme.colors.onBackground,
    marginBottom: 12,
  },
  sectionContent: {
    backgroundColor: theme.colors.surface,
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
    borderBottomColor: theme.colors.outline,
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.onSurface,
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: theme.colors.onSurface,
    opacity: 0.6,
  },
  settingArrow: {
    fontSize: 18,
    color: theme.colors.onSurface,
    opacity: 0.5,
  },
  appInfo: {
    backgroundColor: theme.colors.surface,
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
    color: theme.colors.onSurface,
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
    borderBottomColor: theme.colors.outline,
  },
  appInfoLabel: {
    fontSize: 16,
    color: theme.colors.onSurface,
    fontWeight: '500',
  },
  appInfoValue: {
    fontSize: 16,
    color: theme.colors.onSurface,
    opacity: 0.7,
  },
});

export default SettingsScreen;
