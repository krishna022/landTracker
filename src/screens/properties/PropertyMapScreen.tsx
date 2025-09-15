import React, { useState, useEffect, useRef,useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import MapView, { Marker, Polygon, PROVIDER_GOOGLE } from 'react-native-maps';
import { theme } from '../../utils/theme';
import { apiService } from '../../services/api';

const { width, height } = Dimensions.get('window');

interface RouteParams {
  propertyId: string;
  property: any;
}

const PropertyMapScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { propertyId, property } = route.params as RouteParams;
  const mapRef = useRef<MapView>(null);

  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [coordinates, setCoordinates] = useState<any[]>([]);
  const [region, setRegion] = useState<any>(null);

  useEffect(() => {
    initializeMap();
  }, []);

    useLayoutEffect(() => {
      navigation.setOptions({
        headerRight: () => (
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => setEditing(!editing)}
          activeOpacity={0.8}
        >
          <Text style={styles.editButtonText}>
            {editing ? 'Done' : 'Edit'}
          </Text>
        </TouchableOpacity>
        ),
      });
    }, [navigation]);

  const initializeMap = () => {
    if (property && property.location) {
      const { coordinates } = property.location;

      // Set initial region based on property location
      const initialRegion = {
        latitude: coordinates[1],
        longitude: coordinates[0],
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setRegion(initialRegion);

      // Initialize coordinates for outline if available
      if (property.outline && property.outline.coordinates && property.outline.coordinates[0]) {
        const outlineCoords = property.outline.coordinates[0].map((coord: number[]) => ({
          latitude: coord[1],
          longitude: coord[0],
        }));
        setCoordinates(outlineCoords);
      }
    }
  };

  const handleSaveOutline = async () => {
    if (coordinates.length < 3) {
      Alert.alert('Error', 'Please add at least 3 points to create a valid outline');
      return;
    }

    try {
      setLoading(true);

      // Convert coordinates back to GeoJSON format
      const geoJsonCoordinates = coordinates.map(coord => [coord.longitude, coord.latitude]);

      const updateData = {
        outline: {
          type: 'Polygon',
          coordinates: [geoJsonCoordinates],
        },
      };

      await apiService.properties.updateProperty(propertyId, updateData);

      Alert.alert('Success', 'Property outline updated successfully');
      setEditing(false);
    } catch (error: any) {
      console.error('Error updating outline:', error);
      Alert.alert('Error', 'Failed to update property outline');
    } finally {
      setLoading(false);
    }
  };

  const handleMapPress = (event: any) => {
    if (!editing) return;

    const { coordinate } = event.nativeEvent;
    setCoordinates(prev => [...prev, coordinate]);
  };

  const handleClearOutline = () => {
    Alert.alert(
      'Clear Outline',
      'Are you sure you want to clear the current outline?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: () => setCoordinates([]) },
      ]
    );
  };

  const handleUndoLastPoint = () => {
    if (coordinates.length > 0) {
      setCoordinates(prev => prev.slice(0, -1));
    }
  };

  const renderMap = () => {
    if (!region) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading map...</Text>
        </View>
      );
    }

    return (
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={region}
        onPress={handleMapPress}
        showsUserLocation={true}
        showsMyLocationButton={true}
        zoomEnabled={true}
        scrollEnabled={true}
      >
        {/* Property marker */}
        {property && property.location && (
          <Marker
            coordinate={{
              latitude: property.location.coordinates[1],
              longitude: property.location.coordinates[0],
            }}
            title={property.title || property.name}
            description={property.description}
          />
        )}

        {/* Property outline polygon */}
        {coordinates.length > 2 && (
          <Polygon
            coordinates={coordinates}
            strokeColor={theme.colors.primary}
            fillColor={`${theme.colors.primary}20`}
            strokeWidth={2}
          />
        )}

        {/* Outline points when editing */}
        {editing && coordinates.map((coord, index) => (
          <Marker
            key={index}
            coordinate={coord}
            pinColor="red"
            title={`Point ${index + 1}`}
          />
        ))}
      </MapView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Property Map</Text>
          <Text style={styles.subtitle}>
            {property?.title || property?.name || 'Property'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => setEditing(!editing)}
          activeOpacity={0.8}
        >
          <Text style={styles.editButtonText}>
            {editing ? 'Done' : 'Edit'}
          </Text>
        </TouchableOpacity>
      </View> */}

      <View style={styles.mapContainer}>
        {renderMap()}
      </View>

      {editing && (
        <View style={styles.editingControls}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={handleUndoLastPoint}
            activeOpacity={0.8}
          >
            <Text style={styles.controlButtonText}>Undo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={handleClearOutline}
            activeOpacity={0.8}
          >
            <Text style={styles.controlButtonText}>Clear</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, styles.saveButton]}
            onPress={handleSaveOutline}
            activeOpacity={0.8}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={theme.colors.onPrimary} />
            ) : (
              <Text style={styles.saveButtonText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {!editing && (
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>Property Information</Text>
          <Text style={styles.infoText}>
            Location: {property?.location?.coordinates ? `${property.location.coordinates[1].toFixed(6)}, ${property.location.coordinates[0].toFixed(6)}` : 'Not set'}
          </Text>
          <Text style={styles.infoText}>
            Area: {property?.area ? `${property.area.value} ${property.area.unit}` : 'Not set'}
          </Text>
          <Text style={styles.infoText}>
            Outline Points: {coordinates.length}
          </Text>
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
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  backButtonText: {
    fontSize: 20,
    color: theme.colors.onSurface,
    fontWeight: 'bold',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.onBackground,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.onSurface,
    opacity: 0.8,
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
  },
  editButtonText: {
    fontSize: 14,
    color: theme.colors.onPrimary,
    fontWeight: '600',
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
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
  editingControls: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outline,
  },
  controlButton: {
    flex: 1,
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: theme.colors.surfaceVariant,
    alignItems: 'center',
  },
  controlButtonText: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
  },
  saveButtonText: {
    color: theme.colors.onPrimary,
  },
  infoContainer: {
    padding: 16,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outline,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: theme.colors.onSurface,
    opacity: 0.8,
    marginBottom: 4,
  },
});

export default PropertyMapScreen;
