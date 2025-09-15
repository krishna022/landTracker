import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../utils/theme';

const { width } = Dimensions.get('window');

const PropertiesScreen: React.FC = () => {
  const navigation = useNavigation();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const properties: any[] = []; // This will come from API later

  const handleAddProperty = () => {
    // @ts-ignore - Navigation typing
    navigation.navigate('AddProperty');
  };

  const handlePropertyPress = (property: any) => {
    // @ts-ignore - Navigation typing
    navigation.navigate('PropertyDetail', { propertyId: property.id });
  };

  const toggleViewMode = () => {
    setViewMode(prev => prev === 'grid' ? 'list' : 'grid');
  };

  const renderPropertyItem = ({ item }: { item: any }) => {
    if (viewMode === 'grid') {
      return (
        <TouchableOpacity 
          style={styles.gridPropertyCard}
          onPress={() => handlePropertyPress(item)}
          activeOpacity={0.8}
        >
          <View style={styles.propertyImagePlaceholder}>
            <Text style={styles.propertyImageIcon}>🏞️</Text>
          </View>
          <View style={styles.propertyInfo}>
            <Text style={styles.propertyName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.propertyLocation} numberOfLines={1}>{item.location}</Text>
            <View style={styles.propertyMeta}>
              <Text style={styles.propertyArea}>{item.area} sq ft</Text>
              <View style={styles.propertyStatus}>
                <Text style={styles.propertyStatusText}>Active</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity 
        style={styles.listPropertyCard}
        onPress={() => handlePropertyPress(item)}
        activeOpacity={0.8}
      >
        <View style={styles.listPropertyImagePlaceholder}>
          <Text style={styles.propertyImageIcon}>🏞️</Text>
        </View>
        <View style={styles.listPropertyInfo}>
          <Text style={styles.propertyName}>{item.name}</Text>
          <Text style={styles.propertyLocation}>{item.location}</Text>
          <Text style={styles.propertyArea}>{item.area} sq ft</Text>
        </View>
        <View style={styles.propertyActions}>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>⋯</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {properties.length > 0 ? (
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>My Properties</Text>
          <Text style={styles.subtitle}>{properties.length} properties</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.viewToggle} onPress={toggleViewMode}>
            <Text style={styles.viewToggleIcon}>
              {viewMode === 'grid' ? '☰' : '▦'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addButton} onPress={handleAddProperty}>
            <Text style={styles.addButtonIcon}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
      ): null}

      {properties.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIllustration}>
            <Text style={styles.emptyIcon}>🏞️</Text>
          </View>
          <Text style={styles.emptyTitle}>No Properties Yet</Text>
          <Text style={styles.emptySubtitle}>
            Start building your property portfolio by adding your first property
          </Text>
          <TouchableOpacity style={styles.primaryButton} onPress={handleAddProperty}>
            <Text style={styles.primaryButtonText}>Add Your First Property</Text>
            <Text style={styles.primaryButtonIcon}>→</Text>
          </TouchableOpacity>
          
          <View style={styles.featuresContainer}>
            <Text style={styles.featuresTitle}>What you can track:</Text>
            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>📍</Text>
                <Text style={styles.featureText}>Property location & boundaries</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>📄</Text>
                <Text style={styles.featureText}>Important documents</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>💰</Text>
                <Text style={styles.featureText}>Value tracking & analytics</Text>
              </View>
            </View>
          </View>
        </View>
      ) : (
        <FlatList
          data={properties}
          renderItem={renderPropertyItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          key={viewMode}
          numColumns={viewMode === 'grid' ? 2 : 1}
        />
      )}
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
    padding: 24,
    paddingBottom: 16,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.onBackground,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.onSurface,
    opacity: 0.8,
  },
  viewToggle: {
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
  viewToggleIcon: {
    fontSize: 18,
    color: theme.colors.onSurface,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  addButtonIcon: {
    fontSize: 24,
    color: theme.colors.onPrimary,
    fontWeight: 'bold',
  },
  emptyContainer: {
    marginTop: 80,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIllustration: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.onBackground,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: theme.colors.onSurface,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
    opacity: 0.8,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    marginBottom: 40,
  },
  primaryButtonText: {
    color: theme.colors.onPrimary,
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  primaryButtonIcon: {
    color: theme.colors.onPrimary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  featuresContainer: {
    width: '100%',
    maxWidth: 300,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onBackground,
    marginBottom: 16,
    textAlign: 'center',
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 12,
  },
  featureIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.onSurface,
    opacity: 0.8,
  },
  listContainer: {
    padding: 16,
  },
  gridPropertyCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    margin: 6,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  listPropertyCard: {
    backgroundColor: theme.colors.surface,
    marginVertical: 6,
    borderRadius: 16,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  propertyImagePlaceholder: {
    height: 120,
    backgroundColor: theme.colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listPropertyImagePlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: theme.colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 12,
    borderRadius: 12,
  },
  propertyImageIcon: {
    fontSize: 32,
  },
  propertyInfo: {
    padding: 16,
  },
  listPropertyInfo: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  propertyName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: 4,
  },
  propertyLocation: {
    fontSize: 14,
    color: theme.colors.onSurface,
    opacity: 0.8,
    marginBottom: 8,
  },
  propertyMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  propertyArea: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  propertyStatus: {
    backgroundColor: theme.colors.primaryContainer,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  propertyStatusText: {
    fontSize: 10,
    color: theme.colors.onPrimaryContainer,
    fontWeight: '600',
  },
  propertyActions: {
    padding: 16,
    justifyContent: 'center',
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    color: theme.colors.onSurface,
    fontWeight: 'bold',
  },
});

export default PropertiesScreen;
