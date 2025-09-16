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
  TextInput,
  Modal,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { theme } from '../../utils/theme';
import { apiService } from '../../services/api';

const { width } = Dimensions.get('window');

const PropertiesScreen: React.FC = () => {
  const navigation = useNavigation();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [filteredProperties, setFilteredProperties] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    state: '',
    propertyType: '',
    status: '',
  });
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);

  // Detect if device is tablet (width >= 768)
  const isTablet = () => {
    return screenWidth >= 768;
  };

  // Get number of columns based on device type and view mode
  const getNumColumns = () => {
    if (viewMode === 'list') return 1;
    const columns = isTablet() ? 2 : 1;
    console.log(`Device width: ${screenWidth}, isTablet: ${isTablet()}, viewMode: ${viewMode}, columns: ${columns}`);
    return columns; // 2 columns for tablet, 1 for mobile in grid view
  };

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenWidth(window.width);
    });

    return () => subscription?.remove();
  }, []);

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [properties, searchText, filters]);

  // Refresh properties when screen comes into focus (e.g., returning from PropertyNeighborsScreen)
  useFocusEffect(
    React.useCallback(() => {
      fetchProperties();
    }, [])
  );

  useEffect(() => {
    console.log('showSearch changed:', showSearch);
  }, [showSearch]);

  useEffect(() => {
    if (showSearch) {
      console.log('Search container should be visible now');
    } else {
      console.log('Search container should be hidden now');
    }
  }, [showSearch]);

    useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerRight}>
              <TouchableOpacity style={styles.viewToggle} onPress={toggleViewMode}>
                <Text style={styles.viewToggleIcon}>
                  {viewMode === 'grid' ? `▦` : '☰'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.searchButton} onPress={toggleSearch}>
                <Text style={styles.searchButtonIcon}>🔍</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.filterButton} onPress={toggleFilter}>
                <Text style={styles.filterButtonIcon}>⚙️</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.addButton} onPress={handleAddProperty}>
                <Text style={styles.addButtonIcon}>+</Text>
              </TouchableOpacity>
      </View>
      ),
    });
  }, [navigation, viewMode, showSearch, showFilter, screenWidth]);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      console.log('Fetching properties...');
      const response: any = await apiService.properties.getProperties();
      console.log('Properties fetched:', response);
      
      if (response && Array.isArray(response)) {
        setProperties(response);
        setFilteredProperties(response);
      } else if (response && response.properties && Array.isArray(response.properties)) {
        setProperties(response.properties);
        setFilteredProperties(response.properties);
      } else {
        setProperties([]);
        setFilteredProperties([]);
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

  const handlePropertyNeighbors = (property: any) => {
    // @ts-ignore - Navigation typing
    navigation.navigate('PropertyNeighbors', { propertyId: property._id || property.id, property });
  };

  const toggleViewMode = () => {
    setViewMode(prev => prev === 'grid' ? 'list' : 'grid');
  };

  const toggleSearch = () => {
    const newShowSearch = !showSearch;
    console.log('toggleSearch called, current showSearch:', showSearch, 'new showSearch:', newShowSearch);
    setShowSearch(newShowSearch);
    if (!newShowSearch) {
      setSearchText('');
    }
  };

  const toggleFilter = () => {
    setShowFilter(!showFilter);
  };

  const handleSearch = (text: string) => {
    setSearchText(text);
  };

  const applyFilters = () => {
    let filtered = [...properties];

    // Apply search filter
    if (searchText.trim()) {
      filtered = filtered.filter(property =>
        (property.title || property.name || '').toLowerCase().includes(searchText.toLowerCase()) ||
        (property.city || '').toLowerCase().includes(searchText.toLowerCase()) ||
        (property.state || '').toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Apply state filter
    if (filters.state) {
      filtered = filtered.filter(property => property.state === filters.state);
    }

    // Apply property type filter
    if (filters.propertyType) {
      filtered = filtered.filter(property => property.propertyType === filters.propertyType);
    }

    // Apply status filter
    if (filters.status) {
      filtered = filtered.filter(property => property.status === filters.status);
    }

    setFilteredProperties(filtered);
    setShowFilter(false);
  };

  const clearFilters = () => {
    setFilters({ state: '', propertyType: '', status: '' });
    setSearchText('');
    setFilteredProperties(properties);
    setShowFilter(false);
  };

  const getUniqueValues = (key: string) => {
    const values = properties.map(property => property[key]).filter(Boolean);
    return [...new Set(values)];
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

        <TouchableOpacity 
          style={styles.actionIcon} 
          onPress={() => handlePropertyNeighbors(item)}
          activeOpacity={0.7}
        >
          <Text style={styles.actionIconText}>🏘️</Text>
          <Text style={styles.actionIconLabel}>Neighbors</Text>
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
      ) : (filteredProperties.length > 0 ? filteredProperties : properties).length > 0 ? (
        <View style={[styles.mainContent, showSearch && styles.mainContentWithSearch]}>
          {showSearch && (
            <View style={styles.searchContainer}>
              <Text style={styles.debugText}>🔍 SEARCH BAR VISIBLE - showSearch: {showSearch ? 'TRUE' : 'FALSE'}</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search properties by name, city, or state..."
                value={searchText}
                onChangeText={handleSearch}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          )}

          <FlatList
            style={styles.flatList}
            data={filteredProperties.length > 0 ? filteredProperties : properties}
            renderItem={renderPropertyItem}
            keyExtractor={(item) => item._id || item.id || Math.random().toString()}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            key={viewMode}
            numColumns={getNumColumns()}
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIllustration}>
            <Text style={styles.emptyIcon}>🏞️</Text>
          </View>
          <Text style={styles.emptyTitle}>
            {properties.length === 0 ? 'No Properties Yet' : 'No Properties Match Filters'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {properties.length === 0 
              ? 'Start building your property portfolio by adding your first property'
              : 'Try adjusting your search or filter criteria'
            }
          </Text>
          {properties.length === 0 ? (
            <TouchableOpacity style={styles.primaryButton} onPress={handleAddProperty}>
              <Text style={styles.primaryButtonText}>Add Your First Property</Text>
              <Text style={styles.primaryButtonIcon}>→</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.primaryButton} onPress={clearFilters}>
              <Text style={styles.primaryButtonText}>Clear Filters</Text>
              <Text style={styles.primaryButtonIcon}>↻</Text>
            </TouchableOpacity>
          )}
          
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
      
      <Modal
        visible={showFilter}
        animationType="slide"
        transparent={true}
        onRequestClose={toggleFilter}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Properties</Text>
              <TouchableOpacity onPress={toggleFilter}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>State</Text>
              <View style={styles.filterOptions}>
                <TouchableOpacity
                  style={[styles.filterOption, !filters.state && styles.filterOptionActive]}
                  onPress={() => setFilters({...filters, state: ''})}
                >
                  <Text style={[styles.filterOptionText, !filters.state && styles.filterOptionTextActive]}>All States</Text>
                </TouchableOpacity>
                {getUniqueValues('state').map(state => (
                  <TouchableOpacity
                    key={state}
                    style={[styles.filterOption, filters.state === state && styles.filterOptionActive]}
                    onPress={() => setFilters({...filters, state})}
                  >
                    <Text style={[styles.filterOptionText, filters.state === state && styles.filterOptionTextActive]}>{state}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Property Type</Text>
              <View style={styles.filterOptions}>
                <TouchableOpacity
                  style={[styles.filterOption, !filters.propertyType && styles.filterOptionActive]}
                  onPress={() => setFilters({...filters, propertyType: ''})}
                >
                  <Text style={[styles.filterOptionText, !filters.propertyType && styles.filterOptionTextActive]}>All Types</Text>
                </TouchableOpacity>
                {getUniqueValues('propertyType').map(type => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.filterOption, filters.propertyType === type && styles.filterOptionActive]}
                    onPress={() => setFilters({...filters, propertyType: type})}
                  >
                    <Text style={[styles.filterOptionText, filters.propertyType === type && styles.filterOptionTextActive]}>{type}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Status</Text>
              <View style={styles.filterOptions}>
                <TouchableOpacity
                  style={[styles.filterOption, !filters.status && styles.filterOptionActive]}
                  onPress={() => setFilters({...filters, status: ''})}
                >
                  <Text style={[styles.filterOptionText, !filters.status && styles.filterOptionTextActive]}>All Status</Text>
                </TouchableOpacity>
                {getUniqueValues('status').map(status => (
                  <TouchableOpacity
                    key={status}
                    style={[styles.filterOption, filters.status === status && styles.filterOptionActive]}
                    onPress={() => setFilters({...filters, status})}
                  >
                    <Text style={[styles.filterOptionText, filters.status === status && styles.filterOptionTextActive]}>{status}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
                <Text style={styles.clearButtonText}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyButton} onPress={applyFilters}>
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  mainContent: {
    flex: 1,
  },
  mainContentWithSearch: {
    paddingTop: 120, // Add padding to account for absolute positioned search container
  },
  flatList: {
    flex: 1,
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
  searchButton: {
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
  searchButtonIcon: {
    fontSize: 18,
    color: theme.colors.onSurface,
  },
  filterButton: {
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
  filterButtonIcon: {
    fontSize: 18,
    color: theme.colors.onSurface,
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
  searchContainer: {
    position: 'absolute',
    top: 60, // Position below the header
    left: 0,
    right: 0,
    height: 100, // Fixed height to ensure visibility
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFE4B5', // Temporary bright color to make it visible
    borderBottomWidth: 2,
    borderBottomColor: '#FF6B35', // Temporary bright border
    zIndex: 1000, // Ensure it's on top
  },
  searchInput: {
    height: 44,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    borderRadius: 22,
    paddingHorizontal: 16,
    backgroundColor: theme.colors.background,
    color: theme.colors.onSurface,
    fontSize: 16,
  },
  debugText: {
    color: 'red',
    fontSize: 16,
    marginBottom: 8,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
  },
  closeButton: {
    fontSize: 24,
    color: theme.colors.onSurface,
    opacity: 0.7,
  },
  filterSection: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: 12,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    backgroundColor: theme.colors.surface,
  },
  filterOptionActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterOptionText: {
    fontSize: 14,
    color: theme.colors.onSurface,
  },
  filterOptionTextActive: {
    color: theme.colors.onPrimary,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 12,
    marginRight: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 16,
    color: theme.colors.onSurface,
  },
  applyButton: {
    flex: 1,
    paddingVertical: 12,
    marginLeft: 10,
    borderRadius: 8,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    color: theme.colors.onPrimary,
    fontWeight: '600',
  },
});

export default PropertiesScreen;
