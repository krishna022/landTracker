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
import { useAuth } from '../store/AuthContext';
import { theme } from '../utils/theme';

const NotificationsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();

  const [notificationSettings, setNotificationSettings] = useState({
    propertyAlerts: true,
    priceUpdates: true,
    marketNews: false,
    accountActivity: true,
    promotionalOffers: false,
    systemUpdates: true,
  });

  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);

  // Mock notification history
  const notificationHistory = [
    {
      id: 1,
      title: 'Property Price Update',
      message: 'The price of Residential Plot A has been updated.',
      time: '2 hours ago',
      type: 'property',
      read: false,
    },
    {
      id: 2,
      title: 'New Market Report',
      message: 'Monthly market analysis for your area is now available.',
      time: '1 day ago',
      type: 'market',
      read: true,
    },
    {
      id: 3,
      title: 'Account Security',
      message: 'Your password was changed successfully.',
      time: '2 days ago',
      type: 'security',
      read: true,
    },
    {
      id: 4,
      title: 'Subscription Reminder',
      message: 'Your Pro subscription will renew in 3 days.',
      time: '3 days ago',
      type: 'subscription',
      read: true,
    },
  ];

  const toggleNotificationSetting = (key: keyof typeof notificationSettings) => {
    setNotificationSettings(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const markAsRead = (id: number) => {
    // In a real app, this would update the notification status via API
    Alert.alert('Success', 'Notification marked as read');
  };

  const deleteNotification = (id: number) => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => {
          // In a real app, this would delete the notification via API
          Alert.alert('Success', 'Notification deleted');
        }},
      ]
    );
  };

  const clearAllNotifications = () => {
    Alert.alert(
      'Clear All',
      'Are you sure you want to clear all notifications?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear All', style: 'destructive', onPress: () => {
          // In a real app, this would clear all notifications via API
          Alert.alert('Success', 'All notifications cleared');
        }},
      ]
    );
  };

  const NotificationSetting = ({
    title,
    description,
    value,
    onToggle,
  }: {
    title: string;
    description: string;
    value: boolean;
    onToggle: () => void;
  }) => (
    <View style={styles.settingItem}>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: theme.colors.outline, true: theme.colors.primary + '50' }}
        thumbColor={value ? theme.colors.primary : theme.colors.onSurface}
      />
    </View>
  );

  const NotificationItem = ({
    notification,
  }: {
    notification: typeof notificationHistory[0];
  }) => (
    <TouchableOpacity
      style={[styles.notificationItem, !notification.read && styles.unreadNotification]}
      onPress={() => markAsRead(notification.id)}
      onLongPress={() => deleteNotification(notification.id)}
    >
      <View style={styles.notificationIcon}>
        <Text style={styles.notificationIconText}>
          {notification.type === 'property' ? '🏠' :
           notification.type === 'market' ? '📊' :
           notification.type === 'security' ? '🔒' : '💳'}
        </Text>
      </View>
      <View style={styles.notificationContent}>
        <Text style={[styles.notificationTitle, !notification.read && styles.unreadText]}>
          {notification.title}
        </Text>
        <Text style={styles.notificationMessage}>{notification.message}</Text>
        <Text style={styles.notificationTime}>{notification.time}</Text>
      </View>
      {!notification.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <TouchableOpacity
            style={styles.clearButton}
            onPress={clearAllNotifications}
          >
            <Text style={styles.clearButtonText}>Clear All</Text>
          </TouchableOpacity>
        </View>

        {/* Notification Channels */}
        <View style={styles.channelsContainer}>
          <Text style={styles.sectionTitle}>📱 Notification Channels</Text>

          <View style={styles.channelItem}>
            <View style={styles.channelContent}>
              <Text style={styles.channelTitle}>Push Notifications</Text>
              <Text style={styles.channelDescription}>Receive notifications on your device</Text>
            </View>
            <Switch
              value={pushEnabled}
              onValueChange={setPushEnabled}
              trackColor={{ false: theme.colors.outline, true: theme.colors.primary + '50' }}
              thumbColor={pushEnabled ? theme.colors.primary : theme.colors.onSurface}
            />
          </View>

          <View style={styles.channelItem}>
            <View style={styles.channelContent}>
              <Text style={styles.channelTitle}>Email Notifications</Text>
              <Text style={styles.channelDescription}>Receive notifications via email</Text>
            </View>
            <Switch
              value={emailEnabled}
              onValueChange={setEmailEnabled}
              trackColor={{ false: theme.colors.outline, true: theme.colors.primary + '50' }}
              thumbColor={emailEnabled ? theme.colors.primary : theme.colors.onSurface}
            />
          </View>
        </View>

        {/* Notification Types */}
        <View style={styles.settingsContainer}>
          <Text style={styles.sectionTitle}>🔔 Notification Types</Text>

          <NotificationSetting
            title="Property Alerts"
            description="Get notified about property updates and changes"
            value={notificationSettings.propertyAlerts}
            onToggle={() => toggleNotificationSetting('propertyAlerts')}
          />

          <NotificationSetting
            title="Price Updates"
            description="Receive alerts when property prices change"
            value={notificationSettings.priceUpdates}
            onToggle={() => toggleNotificationSetting('priceUpdates')}
          />

          <NotificationSetting
            title="Market News"
            description="Stay updated with local market trends and news"
            value={notificationSettings.marketNews}
            onToggle={() => toggleNotificationSetting('marketNews')}
          />

          <NotificationSetting
            title="Account Activity"
            description="Get notified about account changes and security"
            value={notificationSettings.accountActivity}
            onToggle={() => toggleNotificationSetting('accountActivity')}
          />

          <NotificationSetting
            title="Promotional Offers"
            description="Receive special offers and promotional content"
            value={notificationSettings.promotionalOffers}
            onToggle={() => toggleNotificationSetting('promotionalOffers')}
          />

          <NotificationSetting
            title="System Updates"
            description="Important app updates and maintenance notifications"
            value={notificationSettings.systemUpdates}
            onToggle={() => toggleNotificationSetting('systemUpdates')}
          />
        </View>

        {/* Notification History */}
        <View style={styles.historyContainer}>
          <Text style={styles.sectionTitle}>📋 Recent Notifications</Text>

          {notificationHistory.map((notification) => (
            <NotificationItem key={notification.id} notification={notification} />
          ))}
        </View>

        {/* Test Notification */}
        <View style={styles.testContainer}>
          <TouchableOpacity
            style={styles.testButton}
            onPress={() => Alert.alert('Test', 'Test notification sent!')}
          >
            <Text style={styles.testButtonText}>🔔 Send Test Notification</Text>
          </TouchableOpacity>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.onBackground,
  },
  clearButton: {
    padding: 8,
  },
  clearButtonText: {
    fontSize: 14,
    color: theme.colors.error,
    fontWeight: '500',
  },
  channelsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.onBackground,
    marginBottom: 16,
  },
  channelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  channelContent: {
    flex: 1,
  },
  channelTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.onSurface,
    marginBottom: 4,
  },
  channelDescription: {
    fontSize: 14,
    color: theme.colors.onSurface,
    opacity: 0.7,
  },
  settingsContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.onSurface,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: theme.colors.onSurface,
    opacity: 0.7,
  },
  historyContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  unreadNotification: {
    backgroundColor: theme.colors.primary + '10',
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationIconText: {
    fontSize: 18,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.onSurface,
    marginBottom: 4,
  },
  unreadText: {
    fontWeight: 'bold',
  },
  notificationMessage: {
    fontSize: 14,
    color: theme.colors.onSurface,
    opacity: 0.8,
    marginBottom: 4,
    lineHeight: 20,
  },
  notificationTime: {
    fontSize: 12,
    color: theme.colors.onSurface,
    opacity: 0.6,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
  },
  testContainer: {
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  testButton: {
    backgroundColor: theme.colors.secondary,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: theme.colors.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  testButtonText: {
    color: theme.colors.onSecondary,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default NotificationsScreen;
