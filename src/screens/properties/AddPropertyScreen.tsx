import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { theme } from '../../utils/theme';
import { apiService } from '../../services/api';
import { config } from '../../config';

interface PropertyFormData {
  name: string;
  description: string;
  area: string;
  location: string;
  locationDetails?: any; // Store full Google Places details
}

const AddPropertyScreen: React.FC = () => {
  const navigation = useNavigation();
  const [formData, setFormData] = useState<PropertyFormData>({
    name: '',
    description: '',
    area: '',
    location: '',
    locationDetails: null,
  });
  const [loading, setLoading] = useState(false);

  // Hide tab bar when screen is focused
  useEffect(() => {
    const parentNavigation = navigation.getParent();
    if (parentNavigation) {
      parentNavigation.setOptions({
        tabBarStyle: { display: 'none' }
      });
    }

    return () => {
      // Show tab bar when screen is unfocused
      if (parentNavigation) {
        parentNavigation.setOptions({
          tabBarStyle: { display: 'flex' }
        });
      }
    };
  }, [navigation]);

  const handleInputChange = (field: keyof PropertyFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const submitProperty = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Property name is required');
      return;
    }

    if (!formData.locationDetails) {
      Alert.alert('Error', 'Property location is required');
      return;
    }

    setLoading(true);
    try {
      // Call the API to create the property
      await apiService.properties.createProperty({
        title: formData.name,
        description: formData.description,
        addressText: formData.location,
        area: formData.area ? { value: parseFloat(formData.area), unit: 'sqm' } : undefined,
        locationPoint: formData.locationDetails.geometry ? {
          type: 'Point',
          coordinates: [
            formData.locationDetails.geometry.location.lng,
            formData.locationDetails.geometry.location.lat
          ]
        } : undefined,
      });

      Alert.alert('Success', 'Property added successfully!');
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add property');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.title}>Add New Property</Text>
          
          <View style={styles.form}>
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

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Location *</Text>
              <GooglePlacesAutocomplete
                placeholder="Search for a location"
                onPress={(data, details = null) => {
                  setFormData(prev => ({
                    ...prev,
                    location: data.description,
                    locationDetails: details,
                  }));
                }}
                query={{
                  key: config.GOOGLE_PLACES_API_KEY,
                  language: 'en',
                  components: 'country:in', // Restrict to India, change as needed
                }}
                fetchDetails={true}
                styles={{
                  textInput: {
                    borderWidth: 1,
                    borderColor: theme.colors.outline,
                    borderRadius: 8,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    fontSize: 16,
                    backgroundColor: theme.colors.surface,
                    color: theme.colors.onSurface,
                  },
                  container: {
                    flex: 0,
                  },
                  listView: {
                    backgroundColor: theme.colors.surface,
                    borderWidth: 1,
                    borderColor: theme.colors.outline,
                    borderTopWidth: 0,
                    borderBottomLeftRadius: 8,
                    borderBottomRightRadius: 8,
                  },
                  row: {
                    backgroundColor: theme.colors.surface,
                    padding: 13,
                    height: 44,
                    flexDirection: 'row',
                  },
                  separator: {
                    height: 0.5,
                    backgroundColor: theme.colors.outline,
                  },
                  description: {
                    color: theme.colors.onSurface,
                  },
                  predefinedPlacesDescription: {
                    color: theme.colors.primary,
                  },
                }}
                textInputProps={{
                  placeholderTextColor: theme.colors.onSurface,
                  value: formData.location,
                  onChangeText: (text) => {
                    setFormData(prev => ({ ...prev, location: text }));
                  },
                }}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Area (sq ft)</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter area in square feet"
                value={formData.area}
                onChangeText={(value) => handleInputChange('area', value)}
                keyboardType="numeric"
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
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={submitProperty}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Adding...' : 'Add Property'}
          </Text>
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.onBackground,
    marginBottom: 24,
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onBackground,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.outline,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: theme.colors.surface,
    color: theme.colors.onSurface,
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outline,
    backgroundColor: theme.colors.surface,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.outline,
  },
  cancelButtonText: {
    color: theme.colors.onSurface,
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 8,
  },
  submitButtonDisabled: {
    backgroundColor: theme.colors.outline,
  },
  submitButtonText: {
    color: theme.colors.onPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AddPropertyScreen;
