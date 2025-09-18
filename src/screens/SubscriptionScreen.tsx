import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../store/AuthContext';
import { useTheme } from '../store/ThemeContext';
import { useThemedStyles } from '../hooks/useThemedStyles';

const SubscriptionScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { state: themeState } = useTheme();
  const theme = themeState.theme;

  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const subscriptionPlans = [
    {
      id: 'free',
      name: 'Free',
      price: '$0',
      period: 'Forever',
      features: [
        'Up to 5 properties',
        'Basic property tracking',
        'Community support',
        'Mobile app access',
      ],
      color: theme.colors.outline,
      popular: false,
    },
    {
      id: 'basic',
      name: 'Basic',
      price: '$9.99',
      period: 'per month',
      features: [
        'Up to 25 properties',
        'Advanced property analytics',
        'Priority email support',
        'Document storage (1GB)',
        'Property comparison tools',
      ],
      color: theme.colors.primary,
      popular: false,
    },
    {
      id: 'pro',
      name: 'Professional',
      price: '$19.99',
      period: 'per month',
      features: [
        'Unlimited properties',
        'Advanced analytics & reports',
        '24/7 priority support',
        'Document storage (10GB)',
        'API access',
        'Custom integrations',
        'Team collaboration',
      ],
      color: theme.colors.secondary,
      popular: true,
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 'Custom',
      period: 'pricing',
      features: [
        'Everything in Professional',
        'Unlimited storage',
        'Dedicated account manager',
        'Custom development',
        'On-premise deployment',
        'Advanced security features',
      ],
      color: theme.colors.tertiary || theme.colors.primary,
      popular: false,
    },
  ];

  const currentPlan = user?.subscription?.plan || 'free';
  const daysRemaining = user?.subscription?.daysRemaining;

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId);
  };

  const handleSubscribe = (planId: string) => {
    if (planId === 'free') {
      Alert.alert('Free Plan', 'You are already on the free plan.');
      return;
    }

    if (planId === 'enterprise') {
      Alert.alert(
        'Enterprise Plan',
        'Please contact our sales team for enterprise pricing and custom solutions.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Contact Sales',
            onPress: () => console.log('Open contact form or email')
          }
        ]
      );
      return;
    }

    Alert.alert(
      'Subscribe to Plan',
      `Are you sure you want to subscribe to the ${planId} plan?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Subscribe',
          onPress: () => {
            // In a real app, this would integrate with a payment processor
            Alert.alert('Success', `Successfully subscribed to ${planId} plan!`);
          }
        }
      ]
    );
  };

  const handleCancelSubscription = () => {
    Alert.alert(
      'Cancel Subscription',
      'Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing period.',
      [
        { text: 'Keep Subscription', style: 'cancel' },
        {
          text: 'Cancel',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Subscription Cancelled', 'Your subscription has been cancelled.');
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Subscription</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Current Plan Status */}
        <View style={styles.currentPlanCard}>
          <View style={styles.currentPlanHeader}>
            <Text style={styles.currentPlanTitle}>Current Plan</Text>
            <View style={[styles.planBadge, styles.planBadgePrimary]}>
              <Text style={styles.planBadgeText}>
                {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}
              </Text>
            </View>
          </View>

          {daysRemaining && daysRemaining > 0 && (
            <Text style={styles.daysRemaining}>
              {daysRemaining} days remaining in billing cycle
            </Text>
          )}

          {currentPlan !== 'free' && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancelSubscription}
            >
              <Text style={styles.cancelButtonText}>Cancel Subscription</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Subscription Plans */}
        <View style={styles.plansContainer}>
          <Text style={styles.sectionTitle}>Choose Your Plan</Text>

          {subscriptionPlans.map((plan) => (
            <TouchableOpacity
              key={plan.id}
              style={[
                styles.planCard,
                selectedPlan === plan.id && styles.planSelected,
                plan.popular && styles.planPopular,
              ]}
              onPress={() => handleSelectPlan(plan.id)}
            >
              {plan.popular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularBadgeText}>Most Popular</Text>
                </View>
              )}

              <View style={styles.planHeader}>
                <View style={styles.planInfo}>
                  <Text style={styles.planName}>{plan.name}</Text>
                  <View style={styles.priceContainer}>
                    <Text style={styles.planPrice}>{plan.price}</Text>
                    {plan.period !== 'Forever' && plan.period !== 'pricing' && (
                      <Text style={styles.planPeriod}>/{plan.period}</Text>
                    )}
                  </View>
                </View>
                <View style={[styles.planIcon, { backgroundColor: plan.color + '20' }]}>
                  <Text style={styles.planIconText}>
                    {plan.id === 'free' ? '🆓' :
                     plan.id === 'basic' ? '⭐' :
                     plan.id === 'pro' ? '💎' : '🏢'}
                  </Text>
                </View>
              </View>

              <View style={styles.featuresList}>
                {plan.features.map((feature, index) => (
                  <View key={index} style={styles.featureItem}>
                    <Text style={styles.featureBullet}>✓</Text>
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={[
                  styles.subscribeButton,
                  { backgroundColor: plan.color },
                  currentPlan === plan.id && styles.currentPlanButton,
                ]}
                onPress={() => handleSubscribe(plan.id)}
              >
                <Text style={[
                  styles.subscribeButtonText,
                  currentPlan === plan.id && styles.currentPlanButtonText,
                ]}>
                  {currentPlan === plan.id ? 'Current Plan' : 'Subscribe Now'}
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>

        {/* FAQ Section */}
        <View style={styles.faqContainer}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>

          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>Can I change my plan anytime?</Text>
            <Text style={styles.faqAnswer}>
              Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.
            </Text>
          </View>

          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>Is there a free trial?</Text>
            <Text style={styles.faqAnswer}>
              Yes, we offer a 14-day free trial for all paid plans. No credit card required to start.
            </Text>
          </View>

          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>What payment methods do you accept?</Text>
            <Text style={styles.faqAnswer}>
              We accept all major credit cards, PayPal, and bank transfers for enterprise customers.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
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
    currentPlanCard: {
      backgroundColor: theme.colors.surface,
      margin: 16,
      padding: 20,
      borderRadius: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    currentPlanHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    currentPlanTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.onSurface,
    },
    planBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
    },
    planBadgePrimary: {
      backgroundColor: theme.colors.primary,
    },
    planBadgeText: {
      color: theme.colors.onPrimary,
      fontSize: 12,
      fontWeight: '600',
    },
    daysRemaining: {
      fontSize: 14,
      color: theme.colors.onSurface,
      opacity: 0.7,
      marginBottom: 16,
    },
    cancelButton: {
      alignSelf: 'flex-start',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.error,
    },
    cancelButtonText: {
      color: theme.colors.error,
      fontSize: 14,
      fontWeight: '500',
    },
    plansContainer: {
      paddingHorizontal: 16,
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.onBackground,
      marginBottom: 16,
    },
    planCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 20,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    planSelected: {
      borderColor: theme.colors.primary,
    },
    planPopular: {
      borderColor: theme.colors.secondary,
    },
    popularBadge: {
      position: 'absolute',
      top: -10,
      right: 20,
      backgroundColor: theme.colors.secondary,
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
    },
    popularBadgeText: {
      color: theme.colors.onSecondary,
      fontSize: 12,
      fontWeight: 'bold',
    },
    planHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 16,
    },
    planInfo: {
      flex: 1,
    },
    planName: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.onSurface,
      marginBottom: 8,
    },
    priceContainer: {
      flexDirection: 'row',
      alignItems: 'baseline',
    },
    planPrice: {
      fontSize: 32,
      fontWeight: 'bold',
      color: theme.colors.primary,
    },
    planPeriod: {
      fontSize: 16,
      color: theme.colors.onSurface,
      opacity: 0.7,
      marginLeft: 4,
    },
    planIcon: {
      width: 50,
      height: 50,
      borderRadius: 25,
      justifyContent: 'center',
      alignItems: 'center',
    },
    planIconText: {
      fontSize: 24,
    },
    featuresList: {
      marginBottom: 20,
    },
    featureItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    featureBullet: {
      color: theme.colors.primary,
      fontSize: 16,
      fontWeight: 'bold',
      marginRight: 12,
      width: 20,
      textAlign: 'center',
    },
    featureText: {
      fontSize: 14,
      color: theme.colors.onSurface,
      flex: 1,
    },
    subscribeButton: {
      borderRadius: 8,
      paddingVertical: 12,
      alignItems: 'center',
    },
    subscribeButtonText: {
      color: theme.colors.onPrimary,
      fontSize: 16,
      fontWeight: 'bold',
    },
    currentPlanButton: {
      backgroundColor: theme.colors.outline,
    },
    currentPlanButtonText: {
      color: theme.colors.onSurface,
    },
    faqContainer: {
      paddingHorizontal: 16,
      marginBottom: 32,
    },
    faqItem: {
      backgroundColor: theme.colors.surface,
      borderRadius: 8,
      padding: 16,
      marginBottom: 12,
    },
    faqQuestion: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.onSurface,
      marginBottom: 8,
    },
    faqAnswer: {
      fontSize: 14,
      color: theme.colors.onSurface,
      opacity: 0.8,
      lineHeight: 20,
    },
  }));

export default SubscriptionScreen;
