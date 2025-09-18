import React, { useState } from 'react';
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
import { useThemedStyles } from '../hooks/useThemedStyles';

const { width } = Dimensions.get('window');

const AnalyticsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { state: themeState } = useTheme();
  const theme = themeState.theme;

  const [selectedPeriod, setSelectedPeriod] = useState('month');

  // Mock analytics data - in a real app, this would come from an API
  const analyticsData = {
    totalProperties: 12,
    totalValue: 2500000,
    monthlyGrowth: 8.5,
    topPerforming: 'Residential Plot A',
    recentActivity: [
      { action: 'Property Added', property: 'Commercial Space B', date: '2024-01-15' },
      { action: 'Value Updated', property: 'Agricultural Land C', date: '2024-01-14' },
      { action: 'Document Uploaded', property: 'Residential Plot A', date: '2024-01-13' },
    ],
    propertyTypes: [
      { type: 'Residential', count: 5, percentage: 42 },
      { type: 'Commercial', count: 3, percentage: 25 },
      { type: 'Agricultural', count: 3, percentage: 25 },
      { type: 'Industrial', count: 1, percentage: 8 },
    ],
  };

  const styles = useThemedStyles((theme) => StyleSheet.create({
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
    headerSpacer: {
      width: 60,
    },
    periodSelector: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 8,
    },
    periodButton: {
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 20,
      backgroundColor: theme.colors.surface,
      alignItems: 'center',
    },
    periodButtonActive: {
      backgroundColor: theme.colors.primary,
    },
    periodButtonText: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.onSurface,
    },
    periodButtonTextActive: {
      color: theme.colors.onPrimary,
    },
    metricsContainer: {
      paddingHorizontal: 16,
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.onBackground,
      marginBottom: 16,
    },
    statsGrid: {
      gap: 12,
    },
    statCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      borderLeftWidth: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    statHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    statIcon: {
      fontSize: 24,
      marginRight: 12,
    },
    statContent: {
      flex: 1,
    },
    statValue: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.onSurface,
      marginBottom: 4,
    },
    statTitle: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.onSurface,
      marginBottom: 2,
    },
    statSubtitle: {
      fontSize: 12,
      color: theme.colors.onSurface,
      opacity: 0.7,
    },
    distributionContainer: {
      paddingHorizontal: 16,
      marginBottom: 24,
    },
    propertyTypeCard: {
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
    propertyTypeInfo: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    propertyTypeName: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.colors.onSurface,
    },
    propertyTypeCount: {
      fontSize: 14,
      color: theme.colors.onSurface,
      opacity: 0.7,
    },
    progressBar: {
      height: 6,
      backgroundColor: theme.colors.outline,
      borderRadius: 3,
      marginBottom: 8,
    },
    progressFill: {
      height: '100%',
      borderRadius: 3,
    },
    percentageText: {
      fontSize: 12,
      color: theme.colors.onSurface,
      opacity: 0.7,
      textAlign: 'right',
    },
    activityContainer: {
      paddingHorizontal: 16,
      marginBottom: 24,
    },
    activityItem: {
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
    activityIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.primary + '20',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    activityIconText: {
      fontSize: 18,
    },
    activityContent: {
      flex: 1,
    },
    activityAction: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.onSurface,
      marginBottom: 2,
    },
    activityProperty: {
      fontSize: 14,
      color: theme.colors.onSurface,
      opacity: 0.8,
      marginBottom: 2,
    },
    activityDate: {
      fontSize: 12,
      color: theme.colors.onSurface,
      opacity: 0.6,
    },
    insightsContainer: {
      paddingHorizontal: 16,
      marginBottom: 24,
    },
    insightCard: {
      flexDirection: 'row',
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
    insightIcon: {
      fontSize: 24,
      marginRight: 12,
    },
    insightContent: {
      flex: 1,
    },
    insightTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.onSurface,
      marginBottom: 4,
    },
    insightText: {
      fontSize: 14,
      color: theme.colors.onSurface,
      opacity: 0.8,
      lineHeight: 20,
    },
    exportContainer: {
      paddingHorizontal: 16,
      marginBottom: 32,
    },
    exportButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: 8,
      paddingVertical: 16,
      alignItems: 'center',
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
    },
    exportButtonText: {
      color: theme.colors.onPrimary,
      fontSize: 16,
      fontWeight: 'bold',
    },
  }));

  const StatCard = ({
    title,
    value,
    subtitle,
    icon,
    color,
  }: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: string;
    color: string;
  }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statHeader}>
        <Text style={styles.statIcon}>{icon}</Text>
        <View style={styles.statContent}>
          <Text style={styles.statValue}>{value}</Text>
          <Text style={styles.statTitle}>{title}</Text>
          {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
        </View>
      </View>
    </View>
  );

  const PropertyTypeCard = ({
    type,
    count,
    percentage,
  }: {
    type: string;
    count: number;
    percentage: number;
  }) => (
    <View style={styles.propertyTypeCard}>
      <View style={styles.propertyTypeInfo}>
        <Text style={styles.propertyTypeName}>{type}</Text>
        <Text style={styles.propertyTypeCount}>{count} properties</Text>
      </View>
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            { width: `${percentage}%`, backgroundColor: theme.colors.primary }
          ]}
        />
      </View>
      <Text style={styles.percentageText}>{percentage}%</Text>
    </View>
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
          <Text style={styles.headerTitle}>Analytics</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {['week', 'month', 'quarter', 'year'].map((period) => (
            <TouchableOpacity
              key={period}
              style={[
                styles.periodButton,
                selectedPeriod === period && styles.periodButtonActive,
              ]}
              onPress={() => setSelectedPeriod(period)}
            >
              <Text style={[
                styles.periodButtonText,
                selectedPeriod === period && styles.periodButtonTextActive,
              ]}>
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Key Metrics */}
        <View style={styles.metricsContainer}>
          <Text style={styles.sectionTitle}>📊 Key Metrics</Text>

          <View style={styles.statsGrid}>
            <StatCard
              title="Total Properties"
              value={analyticsData.totalProperties}
              subtitle="Active listings"
              icon="🏠"
              color={theme.colors.primary}
            />

            <StatCard
              title="Portfolio Value"
              value={`$${(analyticsData.totalValue / 1000000).toFixed(1)}M`}
              subtitle="Estimated value"
              icon="💰"
              color={theme.colors.secondary}
            />

            <StatCard
              title="Monthly Growth"
              value={`${analyticsData.monthlyGrowth}%`}
              subtitle="Value increase"
              icon="📈"
              color={theme.colors.tertiary || theme.colors.primary}
            />

            <StatCard
              title="Top Performer"
              value={analyticsData.topPerforming}
              subtitle="Highest value"
              icon="⭐"
              color={theme.colors.error}
            />
          </View>
        </View>

        {/* Property Types Distribution */}
        <View style={styles.distributionContainer}>
          <Text style={styles.sectionTitle}>🏷️ Property Types</Text>

          {analyticsData.propertyTypes.map((propertyType, index) => (
            <PropertyTypeCard
              key={index}
              type={propertyType.type}
              count={propertyType.count}
              percentage={propertyType.percentage}
            />
          ))}
        </View>

        {/* Recent Activity */}
        <View style={styles.activityContainer}>
          <Text style={styles.sectionTitle}>📝 Recent Activity</Text>

          {analyticsData.recentActivity.map((activity, index) => (
            <View key={index} style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Text style={styles.activityIconText}>
                  {activity.action.includes('Added') ? '➕' :
                   activity.action.includes('Updated') ? '✏️' : '📎'}
                </Text>
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityAction}>{activity.action}</Text>
                <Text style={styles.activityProperty}>{activity.property}</Text>
                <Text style={styles.activityDate}>{activity.date}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Insights */}
        <View style={styles.insightsContainer}>
          <Text style={styles.sectionTitle}>💡 Insights</Text>

          <View style={styles.insightCard}>
            <Text style={styles.insightIcon}>📊</Text>
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>Portfolio Performance</Text>
              <Text style={styles.insightText}>
                Your portfolio has grown by {analyticsData.monthlyGrowth}% this month.
                Consider adding more residential properties for better diversification.
              </Text>
            </View>
          </View>

          <View style={styles.insightCard}>
            <Text style={styles.insightIcon}>🎯</Text>
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle}>Market Opportunity</Text>
              <Text style={styles.insightText}>
                Commercial properties in your area are showing strong growth.
                Consider expanding your commercial portfolio.
              </Text>
            </View>
          </View>
        </View>

        {/* Export Data */}
        <View style={styles.exportContainer}>
          <TouchableOpacity style={styles.exportButton}>
            <Text style={styles.exportButtonText}>📊 Export Analytics Report</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AnalyticsScreen;
