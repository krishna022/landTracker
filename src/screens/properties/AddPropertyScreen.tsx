import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TextInput,
  Alert,
  Modal,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../store/ThemeContext';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { apiService } from '../../services/api';

// You need to replace this with your actual API key from Google Cloud Console
const GOOGLE_PLACES_API_KEY = 'AIzaSyBEINmUz_guyOKSx82wp0s2pAf5pWziDuQ';

// Define the shape of a place prediction object
interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

interface PropertyFormData {
  name: string;
  propertyType: string;
  areaValue: string;
  areaUnit: string;
  country: string;
  state: string;
  city: string;
  khata: string;
  plot: string;
  description: string;
  location: string;
}

interface LocationData {
  _id: string;
  id: number;
  name: string;
  iso3?: string;
  emoji?: string;
  state_code?: string;
}

const PROPERTY_TYPES = [
  { label: 'Agricultural', value: 'agricultural' },
  { label: 'Residential', value: 'residential' },
  { label: 'Commercial', value: 'commercial' },
  { label: 'Industrial', value: 'industrial' },
  { label: 'Ancestral', value: 'ancestral' },
  { label: 'Other', value: 'other' },
];

const AREA_UNITS = [
  { label: 'Square Feet', value: 'sqft' },
  { label: 'Square Meters', value: 'sqm' },
  { label: 'Acres', value: 'acres' },
  { label: 'Hectares', value: 'hectares' },
  { label: 'Bigha', value: 'bigha' },
  { label: 'Kanal', value: 'kanal' },
  { label: 'Marla', value: 'marla' },
];

// Helper function for safe filtering
const safeFilterLocations = (data: any, query: string): LocationData[] => {
  if (!data || !Array.isArray(data)) {
    return [];
  }
  
  return data.filter((item: any) => 
    item && item.name && item.name.toLowerCase().includes((query || '').toLowerCase())
  );
};

const AddPropertyScreen: React.FC = () => {
  const navigation = useNavigation();
  const { state: themeState } = useTheme();
  const theme = themeState.theme;
  const [formData, setFormData] = useState<PropertyFormData>({
    name: '',
    propertyType: '',
    areaValue: '',
    areaUnit: 'sqft',
    country: '',
    state: '',
    city: '',
    khata: '',
    plot: '',
    description: '',
    location: '',
  });
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'country' | 'state' | 'city'>('country');
  const [searchQuery, setSearchQuery] = useState('');
  const [locationData, setLocationData] = useState<LocationData[]>([]);
  const [countries, setCountries] = useState<LocationData[]>([]);
  const [states, setStates] = useState<LocationData[]>([]);
  const [cities, setCities] = useState<LocationData[]>([]);
  const [selectedCountryId, setSelectedCountryId] = useState<string>('');
  const [selectedStateId, setSelectedStateId] = useState<string>('');
  const [locationLoading, setLocationLoading] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  
  // New state variables for custom autocomplete
  const [locationQuery, setLocationQuery] = useState('');
  const [placePredictions, setPlacePredictions] = useState<PlacePrediction[]>([]);
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);

  // New function to fetch Google Places predictions
  const fetchPlacesPredictions = async (input: string) => {
    if (input.length < 3) {
      setPlacePredictions([]);
      return;
    }

    setIsSearchingPlaces(true);
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${GOOGLE_PLACES_API_KEY}&components=country:in`
      );
      const data = await response.json();
      if (data.status === 'OK') {
        setPlacePredictions(data.predictions);
      } else {
        console.error('Google Places API Error:', data.status, data.error_message);
        setPlacePredictions([]);
      }
    } catch (error) {
      console.error('Network error fetching places:', error);
      Alert.alert('Error', 'Failed to fetch location suggestions.');
      setPlacePredictions([]);
    } finally {
      setIsSearchingPlaces(false);
    }
  };

  // New function to handle selection of a place prediction
  const handlePlaceSelection = async (description: string, placeId: string) => {
    // You can optionally fetch details for the selected place
    // For this implementation, we will just use the description
    handleInputChange('location', description);
    setLocationQuery(description);
    setPlacePredictions([]); // Clear predictions after selection
  };

  // New useEffect hook to debounce the autocomplete search
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchPlacesPredictions(locationQuery);
    }, 500); // Debounce time in ms

    return () => {
      clearTimeout(handler);
    };
  }, [locationQuery]);


  // Test API on component mount
  useEffect(() => {
    // This part is good for verifying your API key is correct
    // and doesn't need to be tied to the component
    // testGooglePlacesAPI(); // you can keep this for debugging
  }, []);

  // Monitor locationData changes for debugging
  useEffect(() => {
    console.log('locationData changed:', locationData);
    console.log('Is array:', Array.isArray(locationData));
    console.log('Type:', typeof locationData);
  }, [locationData]);

  // Hide tab bar when component mounts
  useEffect(() => {
    navigation.setOptions({
      tabBarStyle: { display: 'none' }
    });

    // Load countries on mount
    loadCountries();

    // Show tab bar when component unmounts
    return () => {
      navigation.setOptions({
        tabBarStyle: { display: 'flex' }
      });
    };
  }, [navigation]);

  const handleInputChange = (field: keyof PropertyFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const loadCountries = async () => {
    try {
      setLocationLoading(true);
      console.log('Loading countries...');
      const data = await apiService.locations.getCountries();
      console.log('Countries loaded:', data);
      if (data && Array.isArray(data)) {
        setCountries(data);
        console.log(`Loaded ${data.length} countries`);
      }
    } catch (error) {
      console.error('Error loading countries:', error);
      Alert.alert('Error', 'Failed to load countries');
    } finally {
      setLocationLoading(false);
    }
  };

  const openLocationModal = (type: 'country' | 'state' | 'city') => {
    setModalType(type);
    setModalVisible(true);
    setSearchQuery('');

    if (type === 'country') {
      setLocationData(countries || []);
    } else {
      loadLocationData(type);
    }
  };

  const loadLocationData = async (type: 'country' | 'state' | 'city') => {
    try {
      setLocationLoading(true);
      console.log(`Loading ${type} data...`);
      let data;
      
      switch (type) {
        case 'country':
          data = await apiService.locations.getCountries();
          break;
        case 'state':
          if (!selectedCountryId) {
            console.log('No country selected for states');
            setLocationData([]);
            return;
          }
          console.log(`Loading states for country: ${selectedCountryId}`);
          data = await apiService.locations.getStatesByCountry(selectedCountryId);
          break;
        case 'city':
          if (!selectedStateId) {
            console.log('No state selected for cities');
            setLocationData([]);
            return;
          }
          console.log(`Loading cities for state: ${selectedStateId}`);
          data = await apiService.locations.getCitiesByState(selectedStateId);
          break;
      }

      console.log(`${type} data loaded:`, data);
      
      if (data && Array.isArray(data)) {
        setLocationData(data);
        console.log(`Set ${data.length} ${type} items`);
      } else {
        console.log(`No valid ${type} data received, setting empty array`);
        setLocationData([]);
      }
    } catch (error) {
      console.error(`Error loading ${type} data:`, error);
      Alert.alert('Error', `Failed to load ${type} data`);
      setLocationData([]);
    } finally {
      setLocationLoading(false);
    }
  };

  const submitProperty = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Property name is required');
      return;
    }

    if (!formData.propertyType.trim()) {
      Alert.alert('Error', 'Property type is required');
      return;
    }

    if (!formData.areaValue.trim()) {
      Alert.alert('Error', 'Property area is required');
      return;
    }

    if (!formData.country.trim()) {
      Alert.alert('Error', 'Country is required');
      return;
    }

    if (!formData.state.trim()) {
      Alert.alert('Error', 'State is required');
      return;
    }

    if (!formData.city.trim()) {
      Alert.alert('Error', 'City is required');
      return;
    }

    setLoading(true);
    try {
      const propertyData = {
        title: formData.name, 
        propertyType: formData.propertyType,
        area: {
          value: parseFloat(formData.areaValue),
          unit: formData.areaUnit
        },
        country: formData.country,
        state: formData.state,
        city: formData.city,
        khata: formData.khata,
        plot: formData.plot,
        description: formData.description,
        addressText: formData.location,
        locationPoint: {
          type: 'Point',
          coordinates: [0, 0] 
        }
      };

      await apiService.properties.createProperty(propertyData);
      Alert.alert('Success', 'Property added successfully!');
      navigation.goBack();
    } catch (error: any) {
      console.error('Error creating property:', error);
      Alert.alert('Error', error.message || 'Failed to add property');
    } finally {
      setLoading(false);
    }
  };

  const validateStep1 = () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Property name is required');
      return false;
    }

    if (!formData.propertyType.trim()) {
      Alert.alert('Error', 'Property type is required');
      return false;
    }

    if (!formData.country.trim()) {
      Alert.alert('Error', 'Country is required');
      return false;
    }

    if (!formData.state.trim()) {
      Alert.alert('Error', 'State is required');
      return false;
    }

    if (!formData.city.trim()) {
      Alert.alert('Error', 'City is required');
      return false;
    }

    return true;
  };

  const validateStep2 = () => {
    if (!formData.areaValue.trim()) {
      Alert.alert('Error', 'Property area is required');
      return false;
    }

    return true;
  };

  const handleNextStep = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
    }
  };

  const handleSubmit = async () => {
    if (currentStep === 2 && validateStep2()) {
      await submitProperty();
    }
  };

  const EmptyListComponent = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>
        {locationLoading ? 'Loading...' : 'No locations found'}
      </Text>
    </View>
  );

  const styles = useThemedStyles((theme) => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    scrollView: { flex: 1 },
    content: { padding: 16 },
    stepIndicator: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 5, paddingHorizontal: 32 },
    step: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.surface, borderWidth: 2, borderColor: theme.colors.outline, alignItems: 'center', justifyContent: 'center' },
    stepActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
    stepText: { fontSize: 16, fontWeight: '600', color: theme.colors.onSurfaceVariant },
    stepTextActive: { color: theme.colors.onPrimary },
    stepLine: { flex: 1, height: 2, backgroundColor: theme.colors.outline, marginHorizontal: 16 },
    stepLineActive: { backgroundColor: theme.colors.primary },
    stepTitle: { fontSize: 20, fontWeight: 'bold', color: theme.colors.onBackground, textAlign: 'center', marginBottom: 10 },
    title: { fontSize: 24, fontWeight: 'bold', color: theme.colors.onBackground, marginBottom: 24 },
    form: { gap: 20 },
    inputGroup: { gap: 8 },
    label: { fontSize: 16, fontWeight: '600', color: theme.colors.onBackground },
    input: { borderWidth: 1, borderColor: theme.colors.outline, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, backgroundColor: theme.colors.surface, color: theme.colors.onSurface },
    textArea: { height: 100, paddingTop: 12 },
    mapSection: { gap: 8 },
    mapPlaceholder: { height: 200, backgroundColor: theme.colors.surface, borderRadius: 8, borderWidth: 2, borderColor: theme.colors.outline, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', padding: 20 },
    mapPlaceholderText: { fontSize: 16, fontWeight: '600', color: theme.colors.onSurface, textAlign: 'center', marginBottom: 8 },
    mapPlaceholderSubtext: { fontSize: 14, color: theme.colors.onSurface, textAlign: 'center', opacity: 0.7 },
    photoSection: { gap: 8 },
    photoButton: { backgroundColor: theme.colors.surface, borderWidth: 2, borderColor: theme.colors.primary, borderStyle: 'dashed', borderRadius: 8, paddingVertical: 16, alignItems: 'center' },
    photoButtonText: { color: theme.colors.primary, fontSize: 16, fontWeight: '600' },
    footer: { flexDirection: 'row', padding: 16, gap: 12, borderTopWidth: 1, borderTopColor: theme.colors.outline, backgroundColor: theme.colors.surface },
    cancelButton: { flex: 1, paddingVertical: 16, alignItems: 'center', borderRadius: 8, borderWidth: 1, borderColor: theme.colors.outline },
    cancelButtonText: { color: theme.colors.onSurface, fontSize: 16, fontWeight: '600' },
    submitButton: { flex: 1, backgroundColor: theme.colors.primary, paddingVertical: 16, alignItems: 'center', borderRadius: 8 },
    submitButtonDisabled: { backgroundColor: theme.colors.outline },
    submitButtonText: { color: theme.colors.onPrimary, fontSize: 16, fontWeight: '600' },
    areaContainer: { flexDirection: 'row', gap: 8 },
    areaValueInput: { flex: 2 },
    areaUnitInput: { flex: 1 },
    areaUnitPicker: { flex: 1 },
    inputText: { color: theme.colors.onSurface, fontSize: 16 },
    placeholderText: { color: theme.colors.onSurfaceVariant, fontSize: 16 },
    modalContainer: { flex: 1, backgroundColor: theme.colors.surface },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.outline },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: theme.colors.onSurface },
    closeButton: { padding: 8 },
    closeButtonText: { color: theme.colors.primary, fontSize: 16 },
    searchInput: { margin: 16, padding: 12, borderWidth: 1, borderColor: theme.colors.outline, borderRadius: 8, fontSize: 16, backgroundColor: theme.colors.surface },
    locationList: { flex: 1 },
    locationItem: { padding: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.outline },
    locationItemText: { fontSize: 16, color: theme.colors.onSurface },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    loadingText: { fontSize: 16, color: theme.colors.onSurface, opacity: 0.7 },
    pickerContainer: { borderWidth: 1, borderColor: theme.colors.outline, borderRadius: 8, backgroundColor: theme.colors.surface, overflow: 'hidden' },
    loadingIndicator: {
      position: 'absolute',
      right: 16,
      top: 50,
    },
    autocompleteContainer: {
      position: 'absolute',
      top: 90,
      left: 16,
      right: 16,
      zIndex: 1000,
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.outline,
      borderWidth: 1,
      borderRadius: 8,
      maxHeight: 200,
    },
    autocompleteItem: {
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outline,
    },
    autocompleteText: {
      fontSize: 16,
      color: theme.colors.onSurface,
    },
    emptyContainer: { padding: 20, alignItems: 'center' },
    emptyText: { fontSize: 16, color: theme.colors.onSurface, opacity: 0.7 },
    picker: { height: 50, width: '100%' },
  }));

  return (
    <>
      <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.stepIndicator}>
            <View style={[styles.step, currentStep >= 1 && styles.stepActive]}>
              <Text style={[styles.stepText, currentStep >= 1 && styles.stepTextActive]}>1</Text>
            </View>
            <View style={[styles.stepLine, currentStep >= 2 && styles.stepLineActive]} />
            <View style={[styles.step, currentStep >= 2 && styles.stepActive]}>
              <Text style={[styles.stepText, currentStep >= 2 && styles.stepTextActive]}>2</Text>
            </View>
          </View>

          <Text style={styles.stepTitle}>
            {currentStep === 1 ? 'Basic Information' : 'Property Details'}
          </Text>
          
          <View style={styles.form}>
            {currentStep === 1 ? (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Property Name *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter property name"
                    value={formData.name}
                    onChangeText={(value) => handleInputChange('name', value)}
                    autoCapitalize="words"
                  />
                </View>

                {/* --- START OF NEW AUTOCLOMPLETE CODE --- */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Property Location</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Search for a location"
                    value={locationQuery}
                    onChangeText={setLocationQuery}
                    autoCapitalize="words"
                  />
                  {isSearchingPlaces && <ActivityIndicator size="small" style={styles.loadingIndicator} />}
                  {locationQuery.length > 2 && placePredictions.length > 0 && (
                    <View style={styles.autocompleteContainer}>
                      <FlatList
                        data={placePredictions}
                        keyExtractor={(item) => item.place_id}
                        renderItem={({ item }) => (
                          <TouchableOpacity 
                            style={styles.autocompleteItem}
                            onPress={() => handlePlaceSelection(item.description, item.place_id)}
                          >
                            <Text style={styles.autocompleteText}>{item.description}</Text>
                          </TouchableOpacity>
                        )}
                        keyboardShouldPersistTaps="always"
                      />
                    </View>
                  )}
                </View>
                {/* --- END OF NEW AUTOCLOMPLETE CODE --- */}

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Property Type *</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={formData.propertyType}
                      onValueChange={(itemValue) => handleInputChange('propertyType', itemValue)}
                      style={styles.picker}
                    >
                      <Picker.Item label="Select property type" value="" />
                      {PROPERTY_TYPES.map((type) => (
                        <Picker.Item key={type.value} label={type.label} value={type.value} />
                      ))}
                    </Picker>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Country *</Text>
                  <TouchableOpacity
                    style={styles.input}
                    onPress={() => openLocationModal('country')}
                  >
                    <Text style={formData.country ? styles.inputText : styles.placeholderText}>
                      {formData.country || 'Select country'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>State *</Text>
                  <TouchableOpacity
                    style={styles.input}
                    onPress={() => openLocationModal('state')}
                    disabled={!formData.country}
                  >
                    <Text style={formData.state ? styles.inputText : styles.placeholderText}>
                      {formData.state || 'Select state'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>City *</Text>
                  <TouchableOpacity
                    style={styles.input}
                    onPress={() => openLocationModal('city')}
                    disabled={!formData.state}
                  >
                    <Text style={formData.city ? styles.inputText : styles.placeholderText}>
                      {formData.city || 'Select city'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Area *</Text>
                  <View style={styles.areaContainer}>
                    <TextInput
                      style={[styles.input, styles.areaValueInput]}
                      placeholder="Enter area"
                      value={formData.areaValue}
                      onChangeText={(value) => handleInputChange('areaValue', value)}
                      keyboardType="numeric"
                    />
                    <View style={[styles.pickerContainer, styles.areaUnitPicker]}>
                      <Picker
                        selectedValue={formData.areaUnit}
                        onValueChange={(itemValue) => handleInputChange('areaUnit', itemValue)}
                        style={styles.picker}
                      >
                        {AREA_UNITS.map((unit) => (
                          <Picker.Item key={unit.value} label={unit.label} value={unit.value} />
                        ))}
                      </Picker>
                    </View>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Khata</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter khata number"
                    value={formData.khata}
                    onChangeText={(value) => handleInputChange('khata', value)}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Plot</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter plot number"
                    value={formData.plot}
                    onChangeText={(value) => handleInputChange('plot', value)}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Description</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Enter property description"
                    value={formData.description}
                    onChangeText={(value) => handleInputChange('description', value)}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>
              </>
            )}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={currentStep === 1 ? () => navigation.goBack() : handlePreviousStep}
        >
          <Text style={styles.cancelButtonText}>
            {currentStep === 1 ? 'Cancel' : 'Previous'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={currentStep === 1 ? handleNextStep : handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Adding...' : currentStep === 1 ? 'Next' : 'Add Property'}
          </Text>
        </TouchableOpacity>
      </View>
      </SafeAreaView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Select {modalType.charAt(0).toUpperCase() + modalType.slice(1)}
            </Text>
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.searchInput}
            placeholder={`Search ${modalType}...`}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />

          {locationLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          ) : (
            <FlatList
              data={safeFilterLocations(locationData, searchQuery)}
              keyExtractor={(item) => item._id || Math.random().toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.locationItem}
                  onPress={() => {
                    if (item && item.name) {
                      handleInputChange(modalType, item.name);
                      if (modalType === 'country') {
                        setSelectedCountryId(item._id);
                        setSelectedStateId('');
                        setFormData(prev => ({ ...prev, state: '', city: '' }));
                      } else if (modalType === 'state') {
                        setSelectedStateId(item._id);
                        setFormData(prev => ({ ...prev, city: '' }));
                      }
                      setModalVisible(false);
                      setSearchQuery('');
                    }
                  }}
                >
                  <Text style={styles.locationItemText}>{item?.name || 'Unknown'}</Text>
                </TouchableOpacity>
              )}
              style={styles.locationList}
              ListEmptyComponent={EmptyListComponent}
            />
          )}
        </SafeAreaView>
      </Modal>
    </>
  );
};

export default AddPropertyScreen;