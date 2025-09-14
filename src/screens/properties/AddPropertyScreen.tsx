import React, { useState } from 'react';
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
import { theme } from '../../utils/theme';

interface PropertyFormData {
  name: string;
  description: string;
  area: string;
  location: string;
}

const AddPropertyScreen: React.FC = () => {
  const navigation = useNavigation();
  const [formData, setFormData] = useState<PropertyFormData>({
    name: '',
    description: '',
    area: '',
    location: '',
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: keyof PropertyFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const submitProperty = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Property name is required');
      return;
    }

    if (!formData.location.trim()) {
      Alert.alert('Error', 'Property location is required');
      return;
    }

    setLoading(true);
    try {
      // Here we would call the API to create the property
      // await apiService.createProperty(formData);
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
              <TextInput
                style={styles.input}
                placeholder="Enter property location"
                value={formData.location}
                onChangeText={(value) => handleInputChange('location', value)}
                autoCapitalize="words"
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

            <View style={styles.mapSection}>
              <Text style={styles.label}>Property Boundary</Text>
              <View style={styles.mapPlaceholder}>
                <Text style={styles.mapPlaceholderText}>
                  Map functionality will be added here
                </Text>
                <Text style={styles.mapPlaceholderSubtext}>
                  Draw property boundaries and add location markers
                </Text>
              </View>
            </View>

            <View style={styles.photoSection}>
              <Text style={styles.label}>Property Photos</Text>
              <TouchableOpacity style={styles.photoButton}>
                <Text style={styles.photoButtonText}>+ Add Photos</Text>
              </TouchableOpacity>
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
  mapSection: {
    gap: 8,
  },
  mapPlaceholder: {
    height: 200,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: theme.colors.outline,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  mapPlaceholderText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
    textAlign: 'center',
    marginBottom: 8,
  },
  mapPlaceholderSubtext: {
    fontSize: 14,
    color: theme.colors.onSurface,
    textAlign: 'center',
    opacity: 0.7,
  },
  photoSection: {
    gap: 8,
  },
  photoButton: {
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  photoButtonText: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '600',
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
