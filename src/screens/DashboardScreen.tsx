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
import { useTheme } from '../store/ThemeContext';
import { useRTL } from '../store/RTLContext';
import { useThemedStyles } from '../hooks/useThemedStyles';
import { getFlexDirection, getTextAlign } from '../utils/rtl';

const { width } = Dimensions.get('window');

const DashboardScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { state } = useTheme();
  const { isRTL, languageCode } = useRTL();

  const styles = useThemedStyles((theme, rtlStyles) => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollView: {
      flex: 1,
    },
    header: {
      backgroundColor: theme.colors.primary,
      padding: 20,
      paddingTop: 10,
      borderBottomLeftRadius: 20,
      borderBottomRightRadius: 20,
      marginBottom: 20,
    },
    userInfo: {
      flexDirection: (rtlStyles?.row?.flexDirection as any) || 'row',
      alignItems: 'center',
      marginBottom: 15,
    },
    avatar: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: theme.colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 15,
    },
    avatarText: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.onSurface,
    },
    greetingContainer: {
      flex: 1,
    },
    greeting: {
      fontSize: 16,
      color: theme.colors.onPrimary,
      opacity: 0.8,
    },
    userName: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.onPrimary,
    },
    notificationButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
    },
    notificationIcon: {
      fontSize: 18,
      color: theme.colors.onSurface,
    },
    statsSection: {
      paddingHorizontal: 20,
      marginBottom: 30,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.onBackground,
      marginBottom: 15,
      textAlign: (rtlStyles?.textAlign?.textAlign as any) || 'left',
    },
    statsContainer: {
      flexDirection: (rtlStyles?.row?.flexDirection as any) || 'row',
      justifyContent: 'space-between',
    },
    statCard: {
      flex: 1,
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 15,
      marginHorizontal: 5,
      alignItems: 'center',
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    statIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.primaryContainer,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 10,
    },
    statIcon: {
      fontSize: 20,
    },
    statNumber: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.primary,
      marginBottom: 5,
    },
    statLabel: {
      fontSize: 12,
      color: theme.colors.onSurface,
      opacity: 0.7,
      textAlign: 'center',
    },
    actionsSection: {
      paddingHorizontal: 20,
      marginBottom: 30,
    },
    actionsGrid: {
      flexDirection: (rtlStyles?.row?.flexDirection as any) || 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    actionCard: {
      width: (width - 50) / 2,
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 20,
      marginBottom: 15,
      alignItems: 'center',
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    actionIconContainer: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: theme.colors.primaryContainer,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 15,
    },
    actionIcon: {
      fontSize: 24,
    },
    actionTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.onBackground,
      marginBottom: 5,
      textAlign: 'center',
    },
    actionSubtitle: {
      fontSize: 12,
      color: theme.colors.onSurface,
      opacity: 0.7,
      textAlign: 'center',
    },
    activitySection: {
      paddingHorizontal: 20,
      marginBottom: 30,
    },
    sectionHeader: {
      flexDirection: (rtlStyles?.row?.flexDirection as any) || 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 15,
    },
    seeAllText: {
      fontSize: 14,
      color: theme.colors.primary,
      fontWeight: '500',
    },
    emptyActivityContainer: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 40,
      alignItems: 'center',
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    emptyActivityIcon: {
      fontSize: 48,
      marginBottom: 15,
    },
    emptyActivityTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.onBackground,
      marginBottom: 10,
      textAlign: 'center',
    },
    emptyActivityText: {
      fontSize: 14,
      color: theme.colors.onSurface,
      opacity: 0.7,
      textAlign: 'center',
      marginBottom: 20,
    },
    getStartedButton: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 30,
      paddingVertical: 12,
      borderRadius: 25,
    },
    getStartedButtonText: {
      color: theme.colors.onPrimary,
      fontSize: 16,
      fontWeight: 'bold',
    },
    tipsSection: {
      paddingHorizontal: 20,
      marginBottom: 30,
    },
    tipCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 20,
      flexDirection: 'row',
      alignItems: 'flex-start',
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    tipIcon: {
      fontSize: 24,
      marginRight: 15,
    },
    tipContent: {
      flex: 1,
    },
    tipTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.onBackground,
      marginBottom: 5,
    },
    tipText: {
      fontSize: 14,
      color: theme.colors.onSurface,
      opacity: 0.7,
      lineHeight: 20,
    },
  }));

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
    <SafeAreaView style={[styles.container, { backgroundColor: state.theme.colors.background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={[styles.header, { backgroundColor: state.theme.colors.primary }]}>
          <View style={styles.userInfo}>
            <View style={[styles.avatar, { backgroundColor: state.theme.colors.surface }]}>
              <Text style={[styles.avatarText, { color: state.theme.colors.onSurface }]}>
                {user?.name?.charAt(0) || 'U'}
              </Text>
            </View>
            <View style={styles.greetingContainer}>
              <Text style={[styles.greeting, { color: state.theme.colors.onPrimary }]}>{getGreeting()}</Text>
              <Text style={[styles.userName, { color: state.theme.colors.onPrimary }]}>
                {user?.name || 'User'}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={[styles.notificationButton, { backgroundColor: state.theme.colors.surface }]}>
            <Text style={[styles.notificationIcon, { color: state.theme.colors.onSurface }]}>🔔</Text>
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
              <Text style={styles.getStartedButtonText}>Get Started</Text>
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

export default DashboardScreen;
