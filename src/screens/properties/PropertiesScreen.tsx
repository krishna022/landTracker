import React, { useState, useEffect } from 'react';
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
    navigation.navigate('PropertyDocuments', { 
      propertyId: property._id || property.id, 
      property: {
        ...property,
        name: property.title || property.name || 'Property'
      }
    });
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
      {/* Header with Stats */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>My Properties</Text>
          <Text style={styles.subtitle}>
            {filteredProperties.length > 0 ? filteredProperties.length : properties.length} properties
          </Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.viewToggle} onPress={toggleViewMode}>
            <Text style={styles.viewToggleIcon}>
              {viewMode === 'grid' ? '▦' : '☰'}
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
      </View>

      {/* Search Bar */}
      {showSearch && (
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search properties by name, city, or state..."
              value={searchText}
              onChangeText={handleSearch}
              autoCapitalize="none"
              autoCorrect={false}
              placeholderTextColor={theme.colors.onSurface + '60'}
            />
            {searchText.length > 0 && (
              <TouchableOpacity
                style={styles.clearSearchButton}
                onPress={() => setSearchText('')}
              >
                <Text style={styles.clearSearchIcon}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <View style={styles.loadingAnimation}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
          <Text style={styles.loadingText}>Loading your properties...</Text>
        </View>
      ) : (filteredProperties.length > 0 ? filteredProperties : properties).length > 0 ? (
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
          ListHeaderComponent={
            properties.length > 0 ? (
              <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>{properties.length}</Text>
                  <Text style={styles.statLabel}>Total Properties</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>
                    {properties.filter(p => p.status === 'active').length}
                  </Text>
                  <Text style={styles.statLabel}>Active</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>
                    {new Set(properties.map(p => p.state).filter(Boolean)).size}
                  </Text>
                  <Text style={styles.statLabel}>States</Text>
                </View>
              </View>
            ) : null
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIllustration}>
            <Text style={styles.emptyIcon}>�</Text>
            <View style={styles.emptyDecoration}>
              <Text style={styles.emptyDecorationIcon}>✨</Text>
            </View>
          </View>
          <Text style={styles.emptyTitle}>
            {properties.length === 0 ? 'Welcome to Land Tracker!' : 'No Properties Found'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {properties.length === 0
              ? 'Start building your property portfolio by adding your first property. Track locations, documents, and values all in one place.'
              : 'Try adjusting your search criteria or clear filters to see all your properties.'
            }
          </Text>

          <View style={styles.emptyActions}>
            {properties.length === 0 ? (
              <TouchableOpacity style={styles.primaryButton} onPress={handleAddProperty}>
                <Text style={styles.primaryButtonText}>Add Your First Property</Text>
                <Text style={styles.primaryButtonIcon}>→</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.secondaryButton} onPress={clearFilters}>
                <Text style={styles.secondaryButtonText}>Clear Filters</Text>
                <Text style={styles.secondaryButtonIcon}>↻</Text>
              </TouchableOpacity>
            )}
          </View>

          {properties.length === 0 && (
            <View style={styles.featuresContainer}>
              <Text style={styles.featuresTitle}>What you can track:</Text>
              <View style={styles.featuresGrid}>
                <View style={styles.featureCard}>
                  <Text style={styles.featureIcon}>📍</Text>
                  <Text style={styles.featureText}>Property locations & boundaries</Text>
                </View>
                <View style={styles.featureCard}>
                  <Text style={styles.featureIcon}>📄</Text>
                  <Text style={styles.featureText}>Important documents & deeds</Text>
                </View>
                <View style={styles.featureCard}>
                  <Text style={styles.featureIcon}>💰</Text>
                  <Text style={styles.featureText}>Value tracking & market insights</Text>
                </View>
                <View style={styles.featureCard}>
                  <Text style={styles.featureIcon}>🏘️</Text>
                  <Text style={styles.featureText}>Nearby properties & neighbors</Text>
                </View>
              </View>
            </View>
          )}
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
                    onPress={() => setFilters({...filters, state: state})}
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
                    onPress={() => setFilters({...filters, status: status})}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline + '20',
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    opacity: 0.8,
  },
  viewToggle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  viewToggleIcon: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
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
    elevation: 6,
  },
  addButtonIcon: {
    fontSize: 20,
    color: theme.colors.onPrimary,
    fontWeight: 'bold',
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchButtonIcon: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  filterButtonIcon: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
  },
  searchContainer: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline + '20',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 24,
    paddingHorizontal: 16,
    height: 48,
  },
  searchIcon: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.onSurface,
    paddingVertical: 0,
  },
  clearSearchButton: {
    padding: 4,
  },
  clearSearchIcon: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '600',
  },
  flatList: {
    flex: 1,
  },
  listContainer: {
    padding: 20,
    paddingTop: 0,
  },
  gridPropertyCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    margin: 6,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: theme.colors.outline + '10',
  },
  listPropertyCard: {
    backgroundColor: theme.colors.surface,
    marginVertical: 6,
    borderRadius: 16,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: theme.colors.outline + '10',
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
    margin: 16,
    borderRadius: 12,
  },
  propertyImageIcon: {
    fontSize: 32,
    opacity: 0.7,
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
    marginBottom: 6,
  },
  propertyLocation: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 8,
  },
  propertyMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  propertyArea: {
    fontSize: 13,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  propertyStatus: {
    backgroundColor: theme.colors.primaryContainer,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  propertyStatusText: {
    fontSize: 11,
    color: theme.colors.onPrimaryContainer,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
  actionIconsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outline + '30',
  },
  actionIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    minWidth: 50,
  },
  actionIconText: {
    fontSize: 18,
    marginBottom: 2,
  },
  actionIconLabel: {
    fontSize: 10,
    color: theme.colors.onSurfaceVariant,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingAnimation: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.onSurface,
    opacity: 0.8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: theme.colors.background,
  },
  emptyIllustration: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: theme.colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
    position: 'relative',
  },
  emptyIcon: {
    fontSize: 56,
  },
  emptyDecoration: {
    position: 'absolute',
    top: -10,
    right: -10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyDecorationIcon: {
    fontSize: 20,
    color: theme.colors.onPrimary,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
    opacity: 0.8,
  },
  emptyActions: {
    width: '100%',
    maxWidth: 280,
    marginBottom: 40,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
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
  secondaryButton: {
    backgroundColor: theme.colors.secondaryContainer,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  secondaryButtonText: {
    color: theme.colors.onSecondaryContainer,
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  secondaryButtonIcon: {
    color: theme.colors.onSecondaryContainer,
    fontSize: 18,
    fontWeight: 'bold',
  },
  featuresContainer: {
    width: '100%',
    maxWidth: 320,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: 16,
    textAlign: 'center',
  },
  featuresGrid: {
    gap: 12,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 12,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.onSurface,
    opacity: 0.8,
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
