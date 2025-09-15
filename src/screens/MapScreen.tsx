import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
  Alert,
  ActivityIndicator,
  Platform,
  LogBox,
} from 'react-native';
import MapView, { Marker, Polygon, PROVIDER_GOOGLE, MapType, Region } from 'react-native-maps';
import { useNavigation } from '@react-navigation/native';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import Geolocation from '@react-native-community/geolocation';
import simplify from 'simplify-js';
import { theme } from '../utils/theme';
import { apiService } from '../services/api';

const { width, height } = Dimensions.get('window');

// Ignore specific warnings
LogBox.ignoreLogs([
  'Warning: componentWillMount has been renamed',
  'Warning: componentWillReceiveProps has been renamed',
]);

interface Property {
  _id: string;
  title: string;
  name: string;
  location: {
    coordinates: [number, number];
  };
  outline?: {
    coordinates: number[][][];
  };
  status: string;
  propertyType: string;
}

interface Point {
  latitude: number;
  longitude: number;
  id?: string; // For editing points
}

const MapScreen: React.FC = () => {
  const navigation = useNavigation();
  const mapRef = useRef<MapView>(null);

  const [mapType, setMapType] = useState<MapType>('standard');
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<Region | null>(null);
  const [drawingMode, setDrawingMode] = useState(false);
  const [editingMode, setEditingMode] = useState(false);
  const [boundaryPoints, setBoundaryPoints] = useState<Point[]>([]);
  const [showUserLocation, setShowUserLocation] = useState(true);
  const [locationLoading, setLocationLoading] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Default region (centered on a general location, will be updated with user location)
  const [region, setRegion] = useState<Region>({
    latitude: 25.332247,
    longitude: 84.741501,
    latitudeDelta: 10,
    longitudeDelta: 10,
  });

  useEffect(() => {
    console.log('MapScreen mounted');
    fetchProperties();
    getCurrentLocation();
    
    // Cleanup on unmount
    return () => {
      setMapError(null);
    };
  }, []);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const response: any = await apiService.properties.getProperties();
      if (response && Array.isArray(response)) {
        setProperties(response);
      } else if (response && response.properties && Array.isArray(response.properties)) {
        setProperties(response.properties);
      }
    } catch (error: any) {
      console.error('Error fetching properties:', error);
      Alert.alert('Error', 'Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = async () => {
    try {
      console.log('Getting current location...');
      setLocationLoading(true);

      // Request location permission
      const permission = Platform.OS === 'ios'
        ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
        : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;

      const result = await request(permission);
      console.log('Permission result:', result);

      if (result === RESULTS.GRANTED) {
        Geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            const userRegion = {
              latitude,
              longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            };
            setUserLocation(userRegion);
            setRegion(userRegion);
            setLocationLoading(false);

            if (mapRef.current) {
              mapRef.current.animateToRegion(userRegion, 1000);
            }
          },
          (error) => {
            console.error('Geolocation error:', error);
            setLocationLoading(false);
            // Fallback to default location
            const defaultLocation = {
              latitude: 25.332247,
              longitude: 84.741501,
              latitudeDelta: 10,
              longitudeDelta: 10,
            };
            setUserLocation(defaultLocation);
            setRegion(defaultLocation);
          },
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 10000,
          }
        );
      } else {
        setLocationLoading(false);
        // Use default location
        const defaultLocation = {
          latitude: 25.332247,
          longitude: 84.741501,
          latitudeDelta: 10,
          longitudeDelta: 10,
        };
        setUserLocation(defaultLocation);
        setRegion(defaultLocation);
      }
    } catch (error) {
      console.error('Location permission error:', error);
      setLocationLoading(false);
      // Use default location as fallback
      const defaultLocation = {
        latitude: 25.332247,
        longitude: 84.741501,
        latitudeDelta: 10,
        longitudeDelta: 10,
      };
      setUserLocation(defaultLocation);
      setRegion(defaultLocation);
    }
  };

  const toggleMapType = () => {
    const types: MapType[] = ['standard', 'satellite', 'terrain', 'hybrid'];
    const currentIndex = types.indexOf(mapType);
    const nextIndex = (currentIndex + 1) % types.length;
    setMapType(types[nextIndex]);
  };

  const centerOnUserLocation = () => {
    if (locationLoading) {
      Alert.alert('Please Wait', 'Getting your location...', [{ text: 'OK' }]);
      return;
    }

    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion(userLocation, 1000);
    } else {
      getCurrentLocation();
    }
  };

  const toggleDrawingMode = () => {
    if (drawingMode) {
      if (boundaryPoints.length >= 3) {
        Alert.alert(
          'Save Boundary',
          'Do you want to save this boundary as a new property?',
          [
            { text: 'Cancel', style: 'cancel', onPress: () => {
              setDrawingMode(false);
              setEditingMode(true); // Enter edit mode after drawing
            }},
            { text: 'Save', onPress: () => {
              saveBoundaryAsProperty();
              setEditingMode(true); // Enter edit mode after saving
            }},
          ]
        );
      } else {
        Alert.alert('Error', 'Please draw at least 3 points to create a boundary');
        setDrawingMode(false);
      }
    } else {
      setDrawingMode(true);
      setEditingMode(false);
      setBoundaryPoints([]);
    }
  };

  const toggleEditMode = () => {
    if (boundaryPoints.length < 3) {
      Alert.alert('Error', 'Not enough points to edit');
      return;
    }
    
    setEditingMode(!editingMode);
    setDrawingMode(false);
  };

  const handleMapPress = (event: any) => {
    if (drawingMode && !editingMode) {
      const { coordinate } = event.nativeEvent;
      setBoundaryPoints(prev => [...prev, coordinate]);
    }
  };

  const handleMapDrag = (event: any) => {
    if (drawingMode && !editingMode && isDrawing) {
      const { coordinate } = event.nativeEvent;
      setBoundaryPoints(prev => [...prev, coordinate]);
    }
  };

  const startDrawing = () => {
    if (drawingMode && !editingMode) {
      setIsDrawing(true);
    }
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      if (boundaryPoints.length >= 10) {
        smoothPath();
      }
    }
  };

  const smoothPath = () => {
    if (boundaryPoints.length < 3) return;
    
    // Convert to format expected by simplify-js
    const points = boundaryPoints.map(point => ({
      x: point.latitude,
      y: point.longitude,
      ...point
    }));
    
    // Apply simplification (tolerance can be adjusted)
    const tolerance = 0.0005; // Adjust this value for more/less smoothing
    const simplified = simplify(points, tolerance, true);
    
    // Convert back to our format
    const smoothedPoints = simplified.map(point => ({
      latitude: point.x,
      longitude: point.y,
      id: `point-${Date.now()}-${Math.random()}` // Add unique ID for editing
    }));
    
    setBoundaryPoints(smoothedPoints);
  };

  const saveBoundaryAsProperty = () => {
    const boundaryCoordinates = boundaryPoints.map(point => [point.longitude, point.latitude]);
    // @ts-ignore - Navigation typing
    navigation.navigate('AddProperty', {
      initialBoundary: boundaryCoordinates,
    });
    setDrawingMode(false);
  };

  const clearBoundary = () => {
    setBoundaryPoints([]);
    setEditingMode(false);
  };

  const undoLastPoint = () => {
    if (boundaryPoints.length > 0) {
      setBoundaryPoints(prev => prev.slice(0, -1));
    }
  };

  const handleMarkerDrag = (index: number, newCoordinate: Point) => {
    const updatedPoints = [...boundaryPoints];
    updatedPoints[index] = newCoordinate;
    setBoundaryPoints(updatedPoints);
  };

  const zoomIn = () => {
    if (mapRef.current && region) {
      const newRegion = {
        ...region,
        latitudeDelta: Math.max(region.latitudeDelta * 0.5, 0.001), // Zoom in, minimum delta
        longitudeDelta: Math.max(region.longitudeDelta * 0.5, 0.001),
      };
      mapRef.current.animateToRegion(newRegion, 300);
      console.log('Zooming in to:', newRegion);
    }
  };

  const zoomOut = () => {
    if (mapRef.current && region) {
      const newRegion = {
        ...region,
        latitudeDelta: Math.min(region.latitudeDelta * 2, 180), // Zoom out, maximum delta
        longitudeDelta: Math.min(region.longitudeDelta * 2, 360),
      };
      mapRef.current.animateToRegion(newRegion, 300);
      console.log('Zooming out to:', newRegion);
    }
  };

  const handleMapError = (error: any) => {
    console.error('Map Error:', error.nativeEvent);
    setMapError(error.nativeEvent?.message || 'Unknown map error');
    Alert.alert('Map Error', 'Failed to load Google Maps. Please check your API key configuration.');
  };

  const getPropertyColor = (status: string, propertyType: string) => {
    if (status === 'active') {
      switch (propertyType) {
        case 'owned': return '#4CAF50';
        case 'leased': return '#FF9800';
        case 'disputed': return '#F44336';
        default: return '#2196F3';
      }
    }
    return '#9E9E9E';
  };

  const renderPropertyMarker = (property: Property) => {
    const color = getPropertyColor(property.status, property.propertyType || 'owned');

    const hasValidCoordinates =
      property?.location?.coordinates &&
      property.location.coordinates.length >= 2 &&
      property.location.coordinates[0] !== 0 &&
      property.location.coordinates[1] !== 0 &&
      !isNaN(property.location.coordinates[0]) &&
      !isNaN(property.location.coordinates[1]);

    const markerCoordinate = hasValidCoordinates
      ? {
          latitude: property.location.coordinates[1],
          longitude: property.location.coordinates[0],
        }
      : userLocation
        ? {
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
          }
        : {
            latitude: 25.332247,
            longitude: 84.741501,
          };

    return (
      <Marker
        key={property._id}
        coordinate={markerCoordinate}
        title={property.title || property.name}
        description={`Status: ${property.status}${!hasValidCoordinates ? ' (Location not available)' : ''}`}
        pinColor={color}
        onPress={() => handlePropertyPress(property)}
      />
    );
  };

  const renderPropertyBoundary = (property: Property) => {
    if (!property.outline || !property.outline.coordinates || !property.outline.coordinates[0]) {
      return null;
    }

    const coordinates = property.outline.coordinates[0].map((coord: number[]) => ({
      latitude: coord[1],
      longitude: coord[0],
    }));

    const color = getPropertyColor(property.status, property.propertyType || 'owned');

    return (
      <Polygon
        key={`boundary-${property._id}`}
        coordinates={coordinates}
        strokeColor={color}
        fillColor={`${color}20`}
        strokeWidth={2}
      />
    );
  };

  const handlePropertyPress = (property: Property) => {
    Alert.alert(
      property.title || property.name,
      `Status: ${property.status}\nType: ${property.propertyType || 'owned'}`,
      [
        { text: 'View Details', onPress: () => {
          // @ts-ignore - Navigation typing
          navigation.navigate('PropertyDetail', { propertyId: property._id });
        }},
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const DebugOverlay = () => {
    const zoomLevel = Math.log2(360 / region.longitudeDelta);
    return (
      <View style={styles.debugOverlay}>
        <Text style={styles.debugText}>🗺️ Map Status: {mapError ? '❌ Error' : '✅ Ready'}</Text>
        <Text style={styles.debugText}>📍 Region: {region.latitude.toFixed(4)}, {region.longitude.toFixed(4)}</Text>
        <Text style={styles.debugText}>🔍 Zoom: {zoomLevel.toFixed(1)}</Text>
        <Text style={styles.debugText}>🏠 Properties: {properties.length}</Text>
        {mapError && (
          <Text style={[styles.debugText, { color: '#ff4444' }]}>Error: {mapError}</Text>
        )}
      </View>
    );
  };

  // Create polygon coordinates (close the loop if we have enough points)
  const polygonCoordinates = boundaryPoints.length >= 3 
    ? [...boundaryPoints, boundaryPoints[0]] 
    : boundaryPoints;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Property Map</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.mapTypeButton} onPress={toggleMapType}>
            <Text style={styles.mapTypeText}>{mapType.toUpperCase()}</Text>
          </TouchableOpacity>
          {(drawingMode || editingMode) && (
            <TouchableOpacity style={styles.clearButton} onPress={clearBoundary}>
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.mapContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Loading map...</Text>
          </View>
        ) : locationLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Getting your location...</Text>
          </View>
        ) : (
          <>
            <MapView
              ref={mapRef}
              style={styles.map}
              provider={PROVIDER_GOOGLE}
              mapType={mapType}
              initialRegion={region}
              showsUserLocation={showUserLocation}
              showsMyLocationButton={false}
              onPress={handleMapPress}
              onPanDrag={handleMapDrag}
              onRegionChangeComplete={(newRegion) => {
                setRegion(newRegion);
              }}
              onMapReady={() => {
                console.log('Google Maps is ready!');
                setMapError(null);
              }}
              zoomEnabled={true}
              scrollEnabled={!drawingMode && !editingMode}
              rotateEnabled={true}
              onTouchStart={startDrawing}
              onTouchEnd={stopDrawing}
            >
              {properties.map(renderPropertyMarker)}
              {properties.map(renderPropertyBoundary)}
              
              {/* Draw polygon if we have at least 3 points */}
              {(drawingMode || editingMode) && boundaryPoints.length >= 3 && (
                <Polygon
                  coordinates={polygonCoordinates}
                  strokeColor="#FF0000"
                  fillColor="rgba(255, 0, 0, 0.2)"
                  strokeWidth={3}
                />
              )}
              
              {/* Show points while drawing */}
              {drawingMode && boundaryPoints.map((point, index) => (
                <Marker
                  key={`draw-point-${index}`}
                  coordinate={point}
                  pinColor="red"
                />
              ))}
              
              {/* Show draggable markers in edit mode */}
              {editingMode && boundaryPoints.map((point, index) => (
                <Marker
                  key={point.id || `edit-point-${index}`}
                  coordinate={point}
                  pinColor="blue"
                  title={`Point ${index + 1}`}
                  draggable
                  onDragEnd={(e) => handleMarkerDrag(index, e.nativeEvent.coordinate)}
                />
              ))}
            </MapView>
            {/* <DebugOverlay /> */}
          </>
        )}
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlButton} onPress={centerOnUserLocation}>
          <Text style={styles.controlButtonText}>
            {locationLoading ? '📍 Getting Location...' : '📍 My Location'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlButton} onPress={zoomIn}>
          <Text style={styles.controlButtonText}>🔍 Zoom In</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlButton} onPress={zoomOut}>
          <Text style={styles.controlButtonText}>🔎 Zoom Out</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, drawingMode && styles.activeControlButton]}
          onPress={toggleDrawingMode}
        >
          <Text style={styles.controlButtonText}>
            {drawingMode ? '✅ Finish Drawing' : '✏️ Draw Boundary'}
          </Text>
        </TouchableOpacity>

        {boundaryPoints.length >= 3 && (
          <TouchableOpacity
            style={[styles.controlButton, editingMode && styles.activeControlButton]}
            onPress={toggleEditMode}
          >
            <Text style={styles.controlButtonText}>
              {editingMode ? '✅ Done Editing' : '🖌️ Edit Points'}
            </Text>
          </TouchableOpacity>
        )}

        {drawingMode && boundaryPoints.length > 0 && (
          <TouchableOpacity style={styles.controlButton} onPress={undoLastPoint}>
            <Text style={styles.controlButtonText}>↶ Undo</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Map Legend</Text>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#4CAF50' }]} />
          <Text style={styles.legendText}>Owned Properties</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#FF9800' }]} />
          <Text style={styles.legendText}>Leased Properties</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#F44336' }]} />
          <Text style={styles.legendText}>Disputed Areas</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#2196F3' }]} />
          <Text style={styles.legendText}>Other Properties</Text>
        </View>
        {(drawingMode || editingMode) && (
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#FF0000' }]} />
            <Text style={styles.legendText}>
              {drawingMode ? 'Drawing' : 'Editing'} Boundary ({boundaryPoints.length} points)
            </Text>
          </View>
        )}
      </View>

      {mapError && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>
            ❌ Map Error: {mapError}. Please check Google Maps API configuration.
          </Text>
        </View>
      )}

      {drawingMode && (
        <View style={styles.drawingInstructions}>
          <Text style={styles.drawingInstructionsText}>
            Tap to add points or drag to draw continuously
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.onBackground,
  },
  mapTypeButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  mapTypeText: {
    color: theme.colors.onPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  clearButton: {
    backgroundColor: theme.colors.error,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  clearButtonText: {
    color: theme.colors.onError,
    fontSize: 12,
    fontWeight: '600',
  },
  mapContainer: {
    flex: 1,
    margin: 0,
    borderRadius: 0,
    overflow: 'hidden',
    minHeight: height * 0.7,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.onSurface,
    opacity: 0.8,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outline,
    backgroundColor: theme.colors.surface,
  },
  controlButton: {
    backgroundColor: theme.colors.background,
    paddingVertical: 12,
    paddingHorizontal: 8,
    margin: 4,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.outline,
    minWidth: 100,
  },
  controlButtonText: {
    fontSize: 12,
    color: theme.colors.onBackground,
    fontWeight: '500',
    textAlign: 'center',
  },
  activeControlButton: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  legend: {
    backgroundColor: theme.colors.surface,
    marginHorizontal: 8,
    marginVertical: 4,
    padding: 12,
    borderRadius: 8,
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  legendText: {
    fontSize: 14,
    color: theme.colors.onSurface,
  },
  debugOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 10,
    borderRadius: 8,
    zIndex: 1000,
  },
  debugText: {
    color: 'white',
    fontSize: 12,
    marginBottom: 4,
  },
  errorBanner: {
    backgroundColor: '#ff4444',
    padding: 10,
    margin: 8,
    borderRadius: 8,
  },
  errorBannerText: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
  },
  drawingInstructions: {
    position: 'absolute',
    bottom: 82,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 10,
    alignItems: 'center',
  },
  drawingInstructionsText: {
    color: 'white',
    fontSize: 14,
  },
});

export default MapScreen;