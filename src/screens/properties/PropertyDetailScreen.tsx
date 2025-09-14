import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { theme } from '../../utils/theme';

const { width } = Dimensions.get('window');

const PropertyDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [selectedTab, setSelectedTab] = useState('overview');

  // Mock property data - in real app this would come from route params or API
  const property = {
    id: '1',
    name: 'Sunset Valley Ranch',
    location: 'Austin, Texas',
    area: '125.5 acres',
    price: '$2,500,000',
    type: 'Agricultural Land',
    status: 'Available',
    description: 'Beautiful ranch property with rolling hills, mature oak trees, and seasonal creek. Perfect for cattle grazing or development. Located just 30 minutes from downtown Austin.',
    coordinates: { lat: 30.2672, lng: -97.7431 },
    features: [
      { icon: '🌊', label: 'Water Access', description: 'Seasonal creek runs through property' },
      { icon: '🌳', label: 'Mature Trees', description: 'Over 200 oak trees' },
      { icon: '🚜', label: 'Agricultural', description: 'Currently used for cattle grazing' },
      { icon: '🛣️', label: 'Road Access', description: 'Direct highway access' },
      { icon: '⚡', label: 'Utilities', description: 'Power lines at property edge' },
      { icon: '🏠', label: 'Building Sites', description: 'Multiple suitable building locations' },
    ],
    documents: [
      { name: 'Property Survey', date: '2024-01-15', type: 'PDF' },
      { name: 'Soil Report', date: '2024-01-10', type: 'PDF' },
      { name: 'Environmental Study', date: '2023-12-20', type: 'PDF' },
    ],
    images: [
      'https://via.placeholder.com/400x300/4CAF50/white?text=Property+View+1',
      'https://via.placeholder.com/400x300/2196F3/white?text=Property+View+2',
      'https://via.placeholder.com/400x300/FF9800/white?text=Property+View+3',
    ],
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📋' },
    { id: 'features', label: 'Features', icon: '✨' },
    { id: 'documents', label: 'Documents', icon: '📄' },
    { id: 'map', label: 'Map', icon: '🗺️' },
  ];

  const renderTabContent = () => {
    switch (selectedTab) {
      case 'overview':
        return (
          <View style={styles.tabContent}>
            <View style={styles.detailCard}>
              <Text style={styles.cardTitle}>📍 Property Information</Text>
              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Type</Text>
                  <Text style={styles.infoValue}>{property.type}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Area</Text>
                  <Text style={styles.infoValue}>{property.area}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Status</Text>
                  <View style={[styles.statusBadge, { backgroundColor: '#4CAF50' }]}>
                    <Text style={styles.statusText}>{property.status}</Text>
                  </View>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Price</Text>
                  <Text style={[styles.infoValue, styles.priceText]}>{property.price}</Text>
                </View>
              </View>
            </View>

            <View style={styles.detailCard}>
              <Text style={styles.cardTitle}>📝 Description</Text>
              <Text style={styles.description}>{property.description}</Text>
            </View>

            <View style={styles.detailCard}>
              <Text style={styles.cardTitle}>📷 Property Photos</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
                {property.images.map((image, index) => (
                  <View key={index} style={styles.imageContainer}>
                    <View style={styles.imagePlaceholder}>
                      <Text style={styles.imagePlaceholderText}>Photo {index + 1}</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>
        );

      case 'features':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>🏞️ Property Features</Text>
            {property.features.map((feature, index) => (
              <View key={index} style={styles.featureCard}>
                <View style={styles.featureIcon}>
                  <Text style={styles.featureIconText}>{feature.icon}</Text>
                </View>
                <View style={styles.featureContent}>
                  <Text style={styles.featureLabel}>{feature.label}</Text>
                  <Text style={styles.featureDescription}>{feature.description}</Text>
                </View>
              </View>
            ))}
          </View>
        );

      case 'documents':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>📂 Property Documents</Text>
            {property.documents.map((doc, index) => (
              <TouchableOpacity key={index} style={styles.documentCard}>
                <View style={styles.documentIcon}>
                  <Text style={styles.documentIconText}>📄</Text>
                </View>
                <View style={styles.documentContent}>
                  <Text style={styles.documentName}>{doc.name}</Text>
                  <Text style={styles.documentDate}>Updated: {doc.date}</Text>
                </View>
                <Text style={styles.documentArrow}>→</Text>
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity style={styles.addDocumentButton}>
              <Text style={styles.addDocumentIcon}>+</Text>
              <Text style={styles.addDocumentText}>Add Document</Text>
            </TouchableOpacity>
          </View>
        );

      case 'map':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>🗺️ Property Location</Text>
            <View style={styles.mapContainer}>
              <View style={styles.mapPlaceholder}>
                <Text style={styles.mapTitle}>Interactive Property Map</Text>
                <Text style={styles.mapSubtitle}>Lat: {property.coordinates.lat}</Text>
                <Text style={styles.mapSubtitle}>Lng: {property.coordinates.lng}</Text>
                <View style={styles.mapFeatures}>
                  <Text style={styles.mapFeature}>• Property boundaries</Text>
                  <Text style={styles.mapFeature}>• Aerial view available</Text>
                  <Text style={styles.mapFeature}>• Nearby amenities</Text>
                  <Text style={styles.mapFeature}>• Road access points</Text>
                </View>
              </View>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.favoriteButton}>
          <Text style={styles.favoriteIcon}>♡</Text>
        </TouchableOpacity>
      </View>

      {/* Property Header */}
      <View style={styles.propertyHeader}>
        <Text style={styles.propertyName}>{property.name}</Text>
        <Text style={styles.propertyLocation}>📍 {property.location}</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, selectedTab === tab.id && styles.activeTab]}
              onPress={() => setSelectedTab(tab.id)}
            >
              <Text style={styles.tabIcon}>{tab.icon}</Text>
              <Text style={[styles.tabLabel, selectedTab === tab.id && styles.activeTabLabel]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Tab Content */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderTabContent()}
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.contactButton}>
          <Text style={styles.contactButtonText}>📞 Contact Owner</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.scheduleButton}>
          <Text style={styles.scheduleButtonText}>📅 Schedule Visit</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.surface,
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
  favoriteButton: {
    padding: 8,
  },
  favoriteIcon: {
    fontSize: 24,
    color: theme.colors.primary,
  },
  propertyHeader: {
    padding: 20,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  propertyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: 8,
  },
  propertyLocation: {
    fontSize: 16,
    color: theme.colors.onSurface,
    opacity: 0.7,
  },
  tabsContainer: {
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  activeTab: {
    backgroundColor: theme.colors.primary + '20',
  },
  tabIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.onSurface,
  },
  activeTabLabel: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.onBackground,
    marginBottom: 16,
  },
  detailCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: 16,
  },
  infoGrid: {
    gap: 16,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  infoLabel: {
    fontSize: 16,
    color: theme.colors.onSurface,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    color: theme.colors.onSurface,
    fontWeight: '400',
  },
  priceText: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  description: {
    fontSize: 16,
    color: theme.colors.onSurface,
    lineHeight: 24,
  },
  imageScroll: {
    marginTop: 8,
  },
  imageContainer: {
    marginRight: 12,
  },
  imagePlaceholder: {
    width: 150,
    height: 100,
    backgroundColor: theme.colors.primary + '20',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderStyle: 'dashed',
  },
  imagePlaceholderText: {
    color: theme.colors.primary,
    fontWeight: '500',
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  featureIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureIconText: {
    fontSize: 20,
  },
  featureContent: {
    flex: 1,
  },
  featureLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: theme.colors.onSurface,
    opacity: 0.7,
  },
  documentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  documentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.secondary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  documentIconText: {
    fontSize: 18,
  },
  documentContent: {
    flex: 1,
  },
  documentName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: 4,
  },
  documentDate: {
    fontSize: 14,
    color: theme.colors.onSurface,
    opacity: 0.6,
  },
  documentArrow: {
    fontSize: 18,
    color: theme.colors.onSurface,
    opacity: 0.5,
  },
  addDocumentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary + '20',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderStyle: 'dashed',
  },
  addDocumentIcon: {
    fontSize: 20,
    color: theme.colors.primary,
    marginRight: 8,
  },
  addDocumentText: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  mapContainer: {
    marginTop: 8,
  },
  mapPlaceholder: {
    height: 250,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.outline,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  mapTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: 12,
  },
  mapSubtitle: {
    fontSize: 14,
    color: theme.colors.onSurface,
    opacity: 0.7,
    marginBottom: 4,
  },
  mapFeatures: {
    marginTop: 16,
    alignItems: 'flex-start',
  },
  mapFeature: {
    fontSize: 14,
    color: theme.colors.onSurface,
    opacity: 0.8,
    marginBottom: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outline,
    backgroundColor: theme.colors.surface,
  },
  contactButton: {
    flex: 1,
    backgroundColor: theme.colors.secondary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  contactButtonText: {
    color: theme.colors.onSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  scheduleButton: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  scheduleButtonText: {
    color: theme.colors.onPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PropertyDetailScreen;
