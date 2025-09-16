import React, { useState, useEffect, useRef } from 'react';
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
  Keyboard,
  TouchableWithoutFeedback,
  Animated,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../utils/theme';
import { apiService } from '../../services/api';

const GOOGLE_PLACES_API_KEY = 'AIzaSyBEINmUz_guyOKSx82wp0s2pAf5pWziDuQ';

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
  
  // Autocomplete state
  const [locationQuery, setLocationQuery] = useState('');
  const [placePredictions, setPlacePredictions] = useState<PlacePrediction[]>([]);
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const locationInputRef = useRef<TextInput>(null);

  // Debounced search with improved logic
  useEffect(() => {
    const handler = setTimeout(() => {
      if (locationQuery.trim().length >= 2) {
        fetchPlacesPredictions(locationQuery.trim());
      } else {
        setPlacePredictions([]);
        setShowAutocomplete(false);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [locationQuery]);

  // Animation for autocomplete
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: showAutocomplete ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [showAutocomplete]);

  const fetchPlacesPredictions = async (input: string) => {
    if (input.length < 2) {
      setPlacePredictions([]);
      setShowAutocomplete(false);
      return;
    }

    setIsSearchingPlaces(true);
    setShowAutocomplete(true);
    
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${GOOGLE_PLACES_API_KEY}&components=country:in&types=geocode`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.status === 'OK') {
        setPlacePredictions(data.predictions.slice(0, 5)); // Limit to 5 results
      } else if (data.status === 'ZERO_RESULTS') {
        setPlacePredictions([]);
      } else {
        console.error('Google Places API Error:', data.status, data.error_message);
        setPlacePredictions([]);
      }
    } catch (error) {
      console.error('Network error fetching places:', error);
      setPlacePredictions([]);
    } finally {
      setIsSearchingPlaces(false);
    }
  };

  const handlePlaceSelection = (description: string) => {
    handleInputChange('location', description);
    setLocationQuery(description);
    setPlacePredictions([]);
    setShowAutocomplete(false);
    Keyboard.dismiss();
  };

  const handleInputChange = (field: keyof PropertyFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLocationInputFocus = () => {
    if (locationQuery.length >= 2 && placePredictions.length > 0) {
      setShowAutocomplete(true);
    }
  };

  const handleLocationInputBlur = () => {
    // Small delay to allow for selection
    setTimeout(() => {
      setShowAutocomplete(false);
    }, 200);
  };

  // Monitor locationData changes
  useEffect(() => {
    console.log('locationData changed:', locationData);
  }, [locationData]);

  // Hide tab bar when component mounts
  useEffect(() => {
    navigation.setOptions({
      tabBarStyle: { display: 'none' }
    });

    loadCountries();

    return () => {
      navigation.setOptions({
        tabBarStyle: { display: 'flex' }
      });
    };
  }, [navigation]);

  const loadCountries = async () => {
    try {
      setLocationLoading(true);
      const data = await apiService.locations.getCountries();
      if (data && Array.isArray(data)) {
        setCountries(data);
      }
    } catch (error) {
      console.error('Error loading countries:', error);
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
      let data;
      
      switch (type) {
        case 'country':
          data = await apiService.locations.getCountries();
          break;
        case 'state':
          if (!selectedCountryId) {
            setLocationData([]);
            return;
          }
          data = await apiService.locations.getStatesByCountry(selectedCountryId);
          break;
        case 'city':
          if (!selectedStateId) {
            setLocationData([]);
            return;
          }
          data = await apiService.locations.getCitiesByState(selectedStateId);
          break;
      }

      if (data && Array.isArray(data)) {
        setLocationData(data);
      } else {
        setLocationData([]);
      }
    } catch (error) {
      console.error(`Error loading ${type} data:`, error);
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
    return formData.name.trim() && formData.propertyType.trim() && 
           formData.country.trim() && formData.state.trim() && formData.city.trim();
  };

  const validateStep2 = () => {
    return formData.areaValue.trim();
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

  return (
    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
      <SafeAreaView style={styles.container}>
        <ScrollView 
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
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

                  {/* Improved Autocomplete Implementation */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Property Location</Text>
                    <View style={styles.autocompleteWrapper}>
                      <TextInput
                        ref={locationInputRef}
                        style={styles.input}
                        placeholder="Search for a location"
                        value={locationQuery}
                        onChangeText={setLocationQuery}
                        onFocus={handleLocationInputFocus}
                        onBlur={handleLocationInputBlur}
                        autoCapitalize="words"
                        autoCorrect={false}
                      />
                      {isSearchingPlaces && (
                        <ActivityIndicator 
                          size="small" 
                          style={styles.loadingIndicator} 
                          color={theme.colors.primary}
                        />
                      )}
                    </View>

                    {showAutocomplete && (
                      <Animated.View 
                        style={[
                          styles.autocompleteContainer,
                          { opacity: fadeAnim, transform: [{ scale: fadeAnim }] }
                        ]}
                      >
                        {placePredictions.length > 0 ? (
                          <FlatList
                            data={placePredictions}
                            keyExtractor={(item) => item.place_id}
                            renderItem={({ item }) => (
                              <TouchableOpacity 
                                style={styles.autocompleteItem}
                                onPress={() => handlePlaceSelection(item.description)}
                              >
                                <Text style={styles.autocompleteMainText}>
                                  {item.structured_formatting.main_text}
                                </Text>
                                <Text style={styles.autocompleteSecondaryText}>
                                  {item.structured_formatting.secondary_text}
                                </Text>
                              </TouchableOpacity>
                            )}
                            keyboardShouldPersistTaps="always"
                            style={styles.autocompleteList}
                          />
                        ) : locationQuery.length >= 2 && !isSearchingPlaces ? (
                          <View style={styles.noResultsContainer}>
                            <Text style={styles.noResultsText}>No locations found</Text>
                          </View>
                        ) : null}
                      </Animated.View>
                    )}
                  </View>

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
                // Step 2 content remains the same
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

        <Modal
          visible={modalVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setModalVisible(false)}
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
                <ActivityIndicator size="large" color={theme.colors.primary} />
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
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
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
  form: { gap: 20 },
  inputGroup: { gap: 8, zIndex: 1 },
  label: { fontSize: 16, fontWeight: '600', color: theme.colors.onBackground },
  input: { borderWidth: 1, borderColor: theme.colors.outline, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, backgroundColor: theme.colors.surface, color: theme.colors.onSurface },
  textArea: { height: 100, paddingTop: 12 },
  footer: { flexDirection: 'row', padding: 16, gap: 12, borderTopWidth: 1, borderTopColor: theme.colors.outline, backgroundColor: theme.colors.surface },
  cancelButton: { flex: 1, paddingVertical: 16, alignItems: 'center', borderRadius: 8, borderWidth: 1, borderColor: theme.colors.outline },
  cancelButtonText: { color: theme.colors.onSurface, fontSize: 16, fontWeight: '600' },
  submitButton: { flex: 1, backgroundColor: theme.colors.primary, paddingVertical: 16, alignItems: 'center', borderRadius: 8 },
  submitButtonDisabled: { backgroundColor: theme.colors.outline },
  submitButtonText: { color: theme.colors.onPrimary, fontSize: 16, fontWeight: '600' },
  areaContainer: { flexDirection: 'row', gap: 8 },
  areaValueInput: { flex: 2 },
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
  loadingText: { fontSize: 16, color: theme.colors.onSurface, opacity: 0.7, marginTop: 10 },
  pickerContainer: { borderWidth: 1, borderColor: theme.colors.outline, borderRadius: 8, backgroundColor: theme.colors.surface, overflow: 'hidden' },
  picker: { height: 50, width: '100%' },

  // Improved autocomplete styles
  autocompleteWrapper: {
    position: 'relative',
  },
  loadingIndicator: {
    position: 'absolute',
    right: 16,
    top: 14,
  },
  autocompleteContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
  },
  autocompleteList: {
    flex: 1,
  },
  autocompleteItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline + '20',
  },
  autocompleteMainText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.onSurface,
  },
  autocompleteSecondaryText: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  noResultsContainer: {
    padding: 16,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
  },
  emptyContainer: { padding: 20, alignItems: 'center' },
  emptyText: { fontSize: 16, color: theme.colors.onSurface, opacity: 0.7 },
});

export default AddPropertyScreen;