import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../store/AuthContext';
import { theme } from '../utils/theme';

const { width } = Dimensions.get('window');

const DashboardScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const handleAddProperty = () => {
    // @ts-ignore - Navigation typing
    navigation.navigate('Properties', { screen: 'AddProperty' });
  };

  const handleViewProperties = () => {
    // @ts-ignore - Navigation typing
    navigation.navigate('Properties');
  };

  const handleViewMap = () => {
    // @ts-ignore - Navigation typing
    navigation.navigate('Map');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.name?.charAt(0) || 'U'}
              </Text>
            </View>
            <View style={styles.greetingContainer}>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <Text style={styles.userName}>
                {user?.name || 'User'}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Text style={styles.notificationIcon}>🔔</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Your Portfolio</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Text style={styles.statIcon}>🏞️</Text>
              </View>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Properties</Text>
            </View>
            
            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Text style={styles.statIcon}>📐</Text>
              </View>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Total Area</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Text style={styles.statIcon}>💰</Text>
              </View>
              <Text style={styles.statNumber}>$0</Text>
              <Text style={styles.statLabel}>Est. Value</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionCard} onPress={handleAddProperty}>
              <View style={styles.actionIconContainer}>
                <Text style={styles.actionIcon}>➕</Text>
              </View>
              <Text style={styles.actionTitle}>Add Property</Text>
              <Text style={styles.actionSubtitle}>Register new land</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard} onPress={handleViewProperties}>
              <View style={styles.actionIconContainer}>
                <Text style={styles.actionIcon}>📋</Text>
              </View>
              <Text style={styles.actionTitle}>My Properties</Text>
              <Text style={styles.actionSubtitle}>View all properties</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard} onPress={handleViewMap}>
              <View style={styles.actionIconContainer}>
                <Text style={styles.actionIcon}>🗺️</Text>
              </View>
              <Text style={styles.actionTitle}>Map View</Text>
              <Text style={styles.actionSubtitle}>Explore locations</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard}>
              <View style={styles.actionIconContainer}>
                <Text style={styles.actionIcon}>📊</Text>
              </View>
              <Text style={styles.actionTitle}>Analytics</Text>
              <Text style={styles.actionSubtitle}>View reports</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.activitySection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.emptyActivityContainer}>
            <Text style={styles.emptyActivityIcon}>📈</Text>
            <Text style={styles.emptyActivityTitle}>No Activity Yet</Text>
            <Text style={styles.emptyActivityText}>
              Your property activities will appear here
            </Text>
            <TouchableOpacity style={styles.getStartedButton} onPress={handleAddProperty}>
              <Text style={styles.getStartedText}>Get Started</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tips Section */}
        <View style={styles.tipsSection}>
          <Text style={styles.sectionTitle}>Tips & Insights</Text>
          <View style={styles.tipCard}>
            <Text style={styles.tipIcon}>💡</Text>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Start by adding your first property</Text>
              <Text style={styles.tipText}>
                Upload property documents, mark boundaries on the map, and track important details.
              </Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.onPrimary,
  },
  greetingContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 14,
    color: theme.colors.onSurface,
    opacity: 0.8,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.onBackground,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  notificationIcon: {
    fontSize: 20,
  },
  statsSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.onBackground,
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statIcon: {
    fontSize: 20,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.onSurface,
    textAlign: 'center',
    opacity: 0.8,
  },
  actionsSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: (width - 60) / 2,
    backgroundColor: theme.colors.surface,
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  actionIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionIcon: {
    fontSize: 24,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onBackground,
    marginBottom: 4,
    textAlign: 'center',
  },
  actionSubtitle: {
    fontSize: 12,
    color: theme.colors.onSurface,
    opacity: 0.8,
    textAlign: 'center',
  },
  activitySection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  emptyActivityContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
  },
  emptyActivityIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyActivityTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.onBackground,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyActivityText: {
    fontSize: 14,
    color: theme.colors.onSurface,
    opacity: 0.8,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  getStartedButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  getStartedText: {
    color: theme.colors.onPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  tipsSection: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  tipCard: {
    backgroundColor: theme.colors.primaryContainer,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tipIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onPrimaryContainer,
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: theme.colors.onPrimaryContainer,
    opacity: 0.8,
    lineHeight: 20,
  },
});

export default DashboardScreen;
