import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../store/AuthContext';
import { useTheme } from '../store/ThemeContext';
import { useThemedStyles } from '../hooks/useThemedStyles';

const HelpSupportScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { state: themeState } = useTheme();
  const theme = themeState.theme;

  const [supportMessage, setSupportMessage] = useState('');
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

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
    quickActionsContainer: {
      paddingHorizontal: 16,
      paddingVertical: 20,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.onBackground,
      marginBottom: 16,
    },
    quickActionsGrid: {
      gap: 12,
    },
    quickAction: {
      backgroundColor: theme.colors.surface,
      borderRadius: 8,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    quickActionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.onSurface,
      marginBottom: 4,
    },
    quickActionDescription: {
      fontSize: 14,
      color: theme.colors.onSurface,
      opacity: 0.7,
    },
    faqContainer: {
      paddingHorizontal: 16,
      marginBottom: 24,
    },
    faqItem: {
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
    faqHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    faqQuestion: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.colors.onSurface,
      flex: 1,
      marginRight: 12,
    },
    faqToggle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.primary,
    },
    faqAnswer: {
      fontSize: 14,
      color: theme.colors.onSurface,
      opacity: 0.8,
      marginTop: 12,
      lineHeight: 20,
    },
    contactContainer: {
      paddingHorizontal: 16,
      marginBottom: 24,
    },
    contactInfo: {
      backgroundColor: theme.colors.surface,
      borderRadius: 8,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    contactText: {
      fontSize: 14,
      color: theme.colors.onSurface,
      opacity: 0.8,
      marginBottom: 16,
      lineHeight: 20,
    },
    messageInput: {
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.outline,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: theme.colors.onSurface,
      marginBottom: 16,
      minHeight: 100,
    },
    submitButton: {
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
    submitButtonText: {
      color: theme.colors.onPrimary,
      fontSize: 16,
      fontWeight: 'bold',
    },
    appInfoContainer: {
      paddingHorizontal: 16,
      marginBottom: 24,
    },
    appInfoCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 8,
      padding: 16,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    appInfoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
    },
    appInfoLabel: {
      fontSize: 14,
      color: theme.colors.onSurface,
      opacity: 0.7,
    },
    appInfoValue: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.onSurface,
    },
    rateButton: {
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
    rateButtonText: {
      color: theme.colors.onSecondary,
      fontSize: 16,
      fontWeight: 'bold',
    },
    legalContainer: {
      paddingHorizontal: 16,
      marginBottom: 32,
    },
    legalLink: {
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
    legalLinkText: {
      fontSize: 16,
      color: theme.colors.primary,
      fontWeight: '500',
    },
  }));

  const faqs = [
    {
      id: 1,
      question: 'How do I add a new property?',
      answer: 'To add a new property, go to the Properties tab and tap the "+" button. Fill in the property details including location, type, and price. You can also upload photos and documents.',
    },
    {
      id: 2,
      question: 'How do I update property information?',
      answer: 'Navigate to your property list, select the property you want to update, and tap the edit icon. You can modify any details including price, description, and upload new documents.',
    },
    {
      id: 3,
      question: 'How do I track property value changes?',
      answer: 'The app automatically tracks value changes based on market data. You can view historical data in the Analytics section and set up price alerts in Notifications.',
    },
    {
      id: 4,
      question: 'How do I export my property data?',
      answer: 'Go to Analytics and tap "Export Analytics Report". You can also export individual property details from the property details screen.',
    },
    {
      id: 5,
      question: 'How do I manage my subscription?',
      answer: 'Visit the Subscription section in your profile to view your current plan, upgrade, or manage billing information.',
    },
    {
      id: 6,
      question: 'How do I contact support?',
      answer: 'You can contact us through the support form below, email us at support@landtracker.com, or call our helpline at 1-800-LANDTRACK.',
    },
  ];

  const quickActions = [
    {
      id: 1,
      title: '📞 Call Support',
      description: 'Speak with our support team',
      action: () => Linking.openURL('tel:1-800-LANDTRACK'),
    },
    {
      id: 2,
      title: '📧 Email Support',
      description: 'Send us an email',
      action: () => Linking.openURL('mailto:support@landtracker.com'),
    },
    {
      id: 3,
      title: '📱 Live Chat',
      description: 'Chat with support online',
      action: () => Alert.alert('Coming Soon', 'Live chat feature will be available soon!'),
    },
    {
      id: 4,
      title: '📖 User Guide',
      description: 'Read our detailed guide',
      action: () => Linking.openURL('https://landtracker.com/guide'),
    },
  ];

  const submitSupportRequest = () => {
    if (!supportMessage.trim()) {
      Alert.alert('Error', 'Please enter your message before submitting.');
      return;
    }

    // In a real app, this would send the support request to the server
    Alert.alert(
      'Support Request Submitted',
      'Thank you for contacting us. We\'ll get back to you within 24 hours.',
      [
        {
          text: 'OK',
          onPress: () => {
            setSupportMessage('');
            navigation.goBack();
          },
        },
      ]
    );
  };

  const toggleFAQ = (id: number) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  const FAQItem = ({ faq }: { faq: typeof faqs[0] }) => (
    <TouchableOpacity
      style={styles.faqItem}
      onPress={() => toggleFAQ(faq.id)}
    >
      <View style={styles.faqHeader}>
        <Text style={styles.faqQuestion}>{faq.question}</Text>
        <Text style={styles.faqToggle}>
          {expandedFAQ === faq.id ? '−' : '+'}
        </Text>
      </View>
      {expandedFAQ === faq.id && (
        <Text style={styles.faqAnswer}>{faq.answer}</Text>
      )}
    </TouchableOpacity>
  );

  const QuickAction = ({ action }: { action: typeof quickActions[0] }) => (
    <TouchableOpacity
      style={styles.quickAction}
      onPress={action.action}
    >
      <Text style={styles.quickActionTitle}>{action.title}</Text>
      <Text style={styles.quickActionDescription}>{action.description}</Text>
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
          <Text style={styles.headerTitle}>Help & Support</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <Text style={styles.sectionTitle}>🚀 Quick Actions</Text>

          <View style={styles.quickActionsGrid}>
            {quickActions.map((action) => (
              <QuickAction key={action.id} action={action} />
            ))}
          </View>
        </View>

        {/* FAQ Section */}
        <View style={styles.faqContainer}>
          <Text style={styles.sectionTitle}>❓ Frequently Asked Questions</Text>

          {faqs.map((faq) => (
            <FAQItem key={faq.id} faq={faq} />
          ))}
        </View>

        {/* Contact Support */}
        <View style={styles.contactContainer}>
          <Text style={styles.sectionTitle}>💬 Contact Support</Text>

          <View style={styles.contactInfo}>
            <Text style={styles.contactText}>
              Can't find what you're looking for? Send us a message and we'll get back to you as soon as possible.
            </Text>

            <TextInput
              style={styles.messageInput}
              placeholder="Describe your issue or question..."
              placeholderTextColor={theme.colors.onSurface + '60'}
              value={supportMessage}
              onChangeText={setSupportMessage}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={styles.submitButton}
              onPress={submitSupportRequest}
            >
              <Text style={styles.submitButtonText}>📤 Submit Support Request</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* App Information */}
        <View style={styles.appInfoContainer}>
          <Text style={styles.sectionTitle}>📱 App Information</Text>

          <View style={styles.appInfoCard}>
            <View style={styles.appInfoRow}>
              <Text style={styles.appInfoLabel}>Version:</Text>
              <Text style={styles.appInfoValue}>1.0.0</Text>
            </View>

            <View style={styles.appInfoRow}>
              <Text style={styles.appInfoLabel}>Build:</Text>
              <Text style={styles.appInfoValue}>2024.01.15</Text>
            </View>

            <View style={styles.appInfoRow}>
              <Text style={styles.appInfoLabel}>Platform:</Text>
              <Text style={styles.appInfoValue}>iOS & Android</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.rateButton}
            onPress={() => Linking.openURL('https://apps.apple.com/app/land-tracker')}
          >
            <Text style={styles.rateButtonText}>⭐ Rate Our App</Text>
          </TouchableOpacity>
        </View>

        {/* Legal Links */}
        <View style={styles.legalContainer}>
          <Text style={styles.sectionTitle}>📋 Legal & Policies</Text>

          <TouchableOpacity
            style={styles.legalLink}
            onPress={() => Linking.openURL('https://landtracker.com/privacy')}
          >
            <Text style={styles.legalLinkText}>🔒 Privacy Policy</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.legalLink}
            onPress={() => Linking.openURL('https://landtracker.com/terms')}
          >
            <Text style={styles.legalLinkText}>📜 Terms of Service</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.legalLink}
            onPress={() => Linking.openURL('https://landtracker.com/licenses')}
          >
            <Text style={styles.legalLinkText}>📄 Open Source Licenses</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HelpSupportScreen;
