import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { theme } from '../../utils/theme';
import { apiService } from '../../services/api';

const PropertyNeighborsScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { propertyId, property } = route.params as any || {};

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [neighbors, setNeighbors] = useState({
    south: '',
    north: '',
    east: '',
    west: '',
    top: '',
    bottom: '',
  });

  useEffect(() => {
    if (property && property.neighbors && Array.isArray(property.neighbors)) {
      const neighborsData: any = {};
      property.neighbors.forEach((neighbor: any) => {
        if (neighbor.direction && neighbor.name) {
          neighborsData[neighbor.direction.toLowerCase()] = neighbor.name;
        }
      });
      setNeighbors(neighborsData);
    }
  }, [property]);

  const handleSave = async () => {
    if (!propertyId) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Property ID is missing',
      });
      return;
    }

    try {
      setSaving(true);

      // Convert flat neighbors object to array format expected by API
      const neighborsArray = Object.entries(neighbors)
        .filter(([direction, name]) => name.trim() !== '')
        .map(([direction, name]) => ({
          name: name.trim(),
          direction: direction
        }));

      const updateData = {
        neighbors: neighborsArray
      };

      await apiService.properties.updateProperty(propertyId, updateData);

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Neighbor information updated successfully',
      });

      // Navigate back after a short delay to allow toast to be visible
      setTimeout(() => {
        navigation.goBack();
      }, 1500);
    } catch (error: any) {
      console.error('Error updating neighbors:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to update neighbor information',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (direction: keyof typeof neighbors, value: string) => {
    setNeighbors(prev => ({
      ...prev,
      [direction]: value
    }));
  };

  const renderDirectionInput = (direction: keyof typeof neighbors, label: string, placeholder: string) => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        value={neighbors[direction]}
        onChangeText={(value) => handleInputChange(direction, value)}
        multiline
        numberOfLines={2}
        maxLength={200}
      />
      <Text style={styles.charCount}>
        {(neighbors[direction] || '').length}/200
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading neighbor information...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {/* <Text style={styles.title}>Property Neighbors</Text> */}
        <Text style={styles.subtitle}>
          {property?.title || property?.name || 'Property'}
        </Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            Enter information about the neighbors surrounding this property.
            This helps in boundary identification and dispute resolution.
          </Text>
        </View>

        <View style={styles.formContainer}>
          {renderDirectionInput('north', 'North Neighbor', 'Enter north neighbor details...')}
          {renderDirectionInput('south', 'South Neighbor', 'Enter south neighbor details...')}
          {renderDirectionInput('east', 'East Neighbor', 'Enter east neighbor details...')}
          {renderDirectionInput('west', 'West Neighbor', 'Enter west neighbor details...')}
          {renderDirectionInput('top', 'Top Neighbor', 'Enter top neighbor details...')}
          {renderDirectionInput('bottom', 'Bottom Neighbor', 'Enter bottom neighbor details...')}
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={() => navigation.goBack()}
            disabled={saving}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.saveButton, saving && styles.disabledButton]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color={theme.colors.onPrimary} />
            ) : (
              <Text style={styles.saveButtonText}>Save Neighbors</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: 10,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  infoContainer: {
    backgroundColor: theme.colors.primaryContainer,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  infoText: {
    fontSize: 14,
    color: theme.colors.onPrimaryContainer,
    lineHeight: 20,
  },
  formContainer: {
    gap: 16,
  },
  inputContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.outline,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.outline,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: theme.colors.onSurface,
    backgroundColor: theme.colors.background,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'right',
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 32,
    marginBottom: 20,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.outline,
  },
  cancelButtonText: {
    fontSize: 16,
    color: theme.colors.onSurface,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
  },
  saveButtonText: {
    fontSize: 16,
    color: theme.colors.onPrimary,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.onSurface,
    opacity: 0.8,
  },
});

export default PropertyNeighborsScreen;
