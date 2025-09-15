import React, { useState, useEffect, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../utils/theme';
import { apiService } from '../../services/api';

const { width } = Dimensions.get('window');

const PropertiesScreen: React.FC = () => {
  const navigation = useNavigation();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchProperties();
  }, []);

    useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
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
      ),
    });
  }, [navigation, viewMode]);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      console.log('Fetching properties...');
      const response: any = await apiService.properties.getProperties();
      console.log('Properties fetched:', response);
      
      if (response && Array.isArray(response)) {
        setProperties(response);
      } else if (response && response.properties && Array.isArray(response.properties)) {
        setProperties(response.properties);
      } else {
        setProperties([]);
      }
    } catch (error: any) {
      console.error('Error fetching properties:', error);
      Alert.alert('Error', 'Failed to load properties');
      setProperties([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchProperties();
  };

  const handleAddProperty = () => {
    // @ts-ignore - Navigation typing
    navigation.navigate('AddProperty');
  };

  const handlePropertyPress = (property: any) => {
    // @ts-ignore - Navigation typing
    navigation.navigate('PropertyDetail', { propertyId: property._id || property.id });
  };

  const handlePropertyImages = (property: any) => {
    // @ts-ignore - Navigation typing
    navigation.navigate('PropertyImages', { propertyId: property._id || property.id, property });
  };

  const handlePropertyMap = (property: any) => {
    // @ts-ignore - Navigation typing
    navigation.navigate('PropertyMap', { propertyId: property._id || property.id, property });
  };

  const handlePropertyDocuments = (property: any) => {
    // @ts-ignore - Navigation typing
    navigation.navigate('PropertyDocuments', { propertyId: property._id || property.id, property });
  };

  const toggleViewMode = () => {
    setViewMode(prev => prev === 'grid' ? 'list' : 'grid');
  };

  const renderPropertyItem = ({ item }: { item: any }) => {
    const propertyName = item.title || item.name || 'Unnamed Property';
    const propertyLocation = item.city && item.state ? `${item.city}, ${item.state}` : 
                           item.city ? item.city : 
                           item.state ? item.state : 'Location not specified';
    const propertyArea = item.area ? 
                        (typeof item.area === 'object' ? 
                         `${item.area.value} ${item.area.unit}` : 
                         item.area) : 
                        'Area not specified';

    const renderActionIcons = () => (
      <View style={styles.actionIconsRow}>
        <TouchableOpacity 
          style={styles.actionIcon} 
          onPress={() => handlePropertyPress(item)}
          activeOpacity={0.7}
        >
          <Text style={styles.actionIconText}>👁️</Text>
          <Text style={styles.actionIconLabel}>View</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionIcon} 
          onPress={() => handlePropertyImages(item)}
          activeOpacity={0.7}
        >
          <Text style={styles.actionIconText}>🖼️</Text>
          <Text style={styles.actionIconLabel}>Images</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionIcon} 
          onPress={() => handlePropertyMap(item)}
          activeOpacity={0.7}
        >
          <Text style={styles.actionIconText}>🗺️</Text>
          <Text style={styles.actionIconLabel}>Map</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionIcon} 
          onPress={() => handlePropertyDocuments(item)}
          activeOpacity={0.7}
        >
          <Text style={styles.actionIconText}>📄</Text>
          <Text style={styles.actionIconLabel}>Docs</Text>
        </TouchableOpacity>
      </View>
    );

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
            <Text style={styles.propertyName} numberOfLines={1}>{propertyName}</Text>
            <Text style={styles.propertyLocation} numberOfLines={1}>{propertyLocation}</Text>
            <View style={styles.propertyMeta}>
              <Text style={styles.propertyArea}>{propertyArea}</Text>
              <View style={styles.propertyStatus}>
                <Text style={styles.propertyStatusText}>Active</Text>
              </View>
            </View>
            {renderActionIcons()}
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
          <Text style={styles.propertyName}>{propertyName}</Text>
          <Text style={styles.propertyLocation}>{propertyLocation}</Text>
          <Text style={styles.propertyArea}>{propertyArea}</Text>
          {renderActionIcons()}
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
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading properties...</Text>
        </View>
      ) : properties.length > 0 ? (
        <>
          {/* <View style={styles.header}>
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
          </View> */}

          <FlatList
            data={properties}
            renderItem={renderPropertyItem}
            keyExtractor={(item) => item._id || item.id || Math.random().toString()}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            key={viewMode}
            numColumns={viewMode === 'grid' ? 2 : 1}
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        </>
      ) : (
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.onSurface,
    opacity: 0.8,
  },
  actionIconsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outline,
    opacity: 0.8,
  },
  actionIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    minWidth: 50,
  },
  actionIconText: {
    fontSize: 20,
    marginBottom: 2,
  },
  actionIconLabel: {
    fontSize: 10,
    color: theme.colors.onSurface,
    opacity: 0.7,
    fontWeight: '500',
  },
});

export default PropertiesScreen;
