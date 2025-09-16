import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
  Platform,
  LogBox,
} from 'react-native';
import MapView, {
  Marker,
  Polygon,
  Polyline,
  PROVIDER_GOOGLE,
  MapType,
  Region,
} from 'react-native-maps';
import { useNavigation, useRoute } from '@react-navigation/native';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import Geolocation from '@react-native-community/geolocation';
import simplify from 'simplify-js';
import { theme } from '../../utils/theme';
import { apiService } from '../../services/api';

const { width, height } = Dimensions.get('window');

LogBox.ignoreLogs([
  'Warning: componentWillMount has been renamed',
  'Warning: componentWillReceiveProps has been renamed',
]);

interface RouteParams {
  propertyId: string;
  property: any;
}

interface Point {
  latitude: number;
  longitude: number;
  id: string;
}

const SMOOTH_TOLERANCE = 0.00003;

const PropertyMapScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { propertyId, property } = route.params as RouteParams;
  const mapRef = useRef<MapView>(null);

  const [mapType, setMapType] = useState<MapType>('standard');
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<Region | null>(null);

  // Drawing and editing modes
  const [drawingMode, setDrawingMode] = useState(false);
  const [editingMode, setEditingMode] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [boundaryPoints, setBoundaryPoints] = useState<Point[]>([]);

  // Property outline coordinates
  const [coordinates, setCoordinates] = useState<any[]>([]);

  // Map region with default location
  const [region, setRegion] = useState<Region>({
    latitude: 25.332247,
    longitude: 84.741501,
    latitudeDelta: 10,
    longitudeDelta: 10,
  });

  useEffect(() => {
    initializeMap();
    getCurrentLocation();
  }, []);

      useLayoutEffect(() => {
          navigation.setOptions({
              headerRight: () => (
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.mapTypeButton}
            onPress={() => setMapType((t) => (t === 'standard' ? 'satellite' : 'standard'))}
          >
            <Text style={styles.mapTypeText}>{mapType.toUpperCase()}</Text>
          </TouchableOpacity>
          {(drawingMode || editingMode) && (
            <TouchableOpacity style={styles.clearButton} onPress={clearBoundary}>
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>
              ),
          });
      }, [navigation, mapType, drawingMode, editingMode]);

  const initializeMap = () => {
    if (property && property.location && property.location.coordinates) {
      const { coordinates } = property.location;

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
        // Also set boundary points for editing
        const boundaryPts = outlineCoords.map((coord: any, index: number) => ({
          latitude: coord.latitude,
          longitude: coord.longitude,
          id: `pt-${Date.now()}-${index}`,
        }));
        setBoundaryPoints(boundaryPts);
      }
    } else {
      // If no property location, keep the default region
      console.log('No property location available, using default region');
    }
  };

  const getCurrentLocation = async () => {
    try {
      const permission =
        Platform.OS === 'ios'
          ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
          : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;
      const result = await request(permission);
      if (result === RESULTS.GRANTED) {
        Geolocation.getCurrentPosition(
          (pos) => {
            const r = {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            };
            setUserLocation(r);
            setRegion(r); // Set region to current location
            if (mapRef.current) mapRef.current.animateToRegion(r, 1000);
          },
          (err) => {
            console.warn('Geolocation error', err);
            // Keep default region if location fails
          },
          { enableHighAccuracy: true }
        );
      }
    } catch (err) {
      console.warn('getCurrentLocation err', err);
      // Keep default region if permission/location fails
    }
  };

  // Stable id generator
  const makeId = (idx?: number) =>
    `pt-${Date.now()}-${Math.round(Math.random() * 1e6)}${idx != null ? `-${idx}` : ''}`;

  // Add a point (assign id here so every point has an id)
  const pushPoint = (coord: { latitude: number; longitude: number }) => {
    setBoundaryPoints((prev) => [...prev, { latitude: coord.latitude, longitude: coord.longitude, id: makeId(prev.length) }]);
  };

  // Called on Map press (tap) — adds a point
  const handleMapPress = (event: any) => {
    if (drawingMode && !editingMode) {
      const { coordinate } = event.nativeEvent;
      pushPoint(coordinate);
    }
  };

  // Called on map pan drag (continuous)
  const handleMapDrag = (event: any) => {
    if (drawingMode && !editingMode && isDrawing) {
      const { coordinate } = event.nativeEvent;
      pushPoint(coordinate);
    }
  };

  // Start drawing when touch starts
  const startDrawing = () => {
    if (drawingMode && !editingMode) {
      setIsDrawing(true);
    }
  };

  // Stop drawing when touch ends
  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    // If not enough points, don't go to editing
    if (boundaryPoints.length < 3) {
      setDrawingMode(false);
      setEditingMode(false);
      return;
    }

    // Always smooth & map ids -> simplified points to avoid reordering artifacts
    smoothPath();
  };

  // Toggle draw button behavior
  const toggleDrawingMode = () => {
    if (drawingMode) {
      // Finishing via button: prompt save/enter edit
      if (boundaryPoints.length >= 3) {
        Alert.alert('Save Outline', 'Do you want to save this outline?', [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => {
              setDrawingMode(false);
              setEditingMode(true); // go to edit mode if they cancel saving
            },
          },
          {
            text: 'Save',
            onPress: () => {
              handleSaveOutline();
              setEditingMode(true);
            },
          },
        ]);
      } else {
        Alert.alert('Error', 'Please draw at least 3 points to create an outline');
        setDrawingMode(false);
      }
    } else {
      // Start drawing
      setBoundaryPoints([]);
      setCoordinates([]);
      setDrawingMode(true);
      setEditingMode(false);
      setIsDrawing(false);
    }
  };

  // Smoothing but preserve ids mapping
  const smoothPath = (tolerance: number = 0.0002) => {
    if (boundaryPoints.length < 3) return;

    const points = boundaryPoints.map((p) => ({ x: p.latitude, y: p.longitude, id: p.id }));
    const simplified = simplify(points, tolerance, true);

    // Map back to nearest original point to preserve IDs
    const smoothedPoints = simplified.map((s) => {
      let nearest = points.reduce((prev, curr) => {
        const prevDist = Math.hypot(prev.x - s.x, prev.y - s.y);
        const currDist = Math.hypot(curr.x - s.x, curr.y - s.y);
        return currDist < prevDist ? curr : prev;
      });
      return {
        latitude: s.x,
        longitude: s.y,
        id: nearest.id,
      };
    });

    setBoundaryPoints(smoothedPoints);
    setCoordinates(smoothedPoints);
  };

  // Editing marker drag
  const handleMarkerDrag = (index: number, newCoordinate: { latitude: number; longitude: number }) => {
    setBoundaryPoints((prev) => {
      const updated = prev.map((p, i) =>
        i === index
          ? { ...p, latitude: newCoordinate.latitude, longitude: newCoordinate.longitude }
          : p
      );
      return [...updated];
    });
    setCoordinates((prev) => {
      const updated = prev.map((coord, i) =>
        i === index
          ? { latitude: newCoordinate.latitude, longitude: newCoordinate.longitude }
          : coord
      );
      return [...updated];
    });
  };

  const handleSaveOutline = async () => {
    if (boundaryPoints.length < 3) {
      Alert.alert('Error', 'Please add at least 3 points to create a valid outline');
      return;
    }

    try {
      setLoading(true);

      // Convert coordinates back to GeoJSON format
      const geoJsonCoordinates = boundaryPoints.map(coord => [coord.longitude, coord.latitude]);

      const updateData = {
        outline: {
          type: 'Polygon',
          coordinates: [geoJsonCoordinates],
        },
      };

      await apiService.properties.updateProperty(propertyId, updateData);

      Alert.alert('Success', 'Property outline updated successfully');
      setDrawingMode(false);
      setEditingMode(false);
    } catch (error: any) {
      console.error('Error updating outline:', error);
      Alert.alert('Error', 'Failed to update property outline');
    } finally {
      setLoading(false);
    }
  };

  const clearBoundary = () => {
    Alert.alert(
      'Clear Outline',
      'Are you sure you want to clear the current outline?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: () => {
          setBoundaryPoints([]);
          setCoordinates([]);
          setEditingMode(false);
          setDrawingMode(false);
        }},
      ]
    );
  };

  const undoLastPoint = () => {
    setBoundaryPoints((prev) => prev.slice(0, -1));
    setCoordinates((prev) => prev.slice(0, -1));
  };

  // Map helpers
  const toggleEditMode = () => {
    if (boundaryPoints.length < 3) {
      Alert.alert('Error', 'Not enough points to edit');
      return;
    }
    setEditingMode((p) => !p);
    setDrawingMode(false);
  };

  const zoomIn = () => {
    if (mapRef.current && region) {
      const newRegion = {
        ...region,
        latitudeDelta: Math.max(region.latitudeDelta * 0.5, 0.001),
        longitudeDelta: Math.max(region.longitudeDelta * 0.5, 0.001),
      };
      mapRef.current.animateToRegion(newRegion, 300);
    }
  };

  const zoomOut = () => {
    if (mapRef.current && region) {
      const newRegion = {
        ...region,
        latitudeDelta: Math.min(region.latitudeDelta * 2, 180),
        longitudeDelta: Math.min(region.longitudeDelta * 2, 360),
      };
      mapRef.current.animateToRegion(newRegion, 300);
    }
  };

  // Polygon coordinates for MapView
  const polygonCoordinates = boundaryPoints.map((p) => ({ latitude: p.latitude, longitude: p.longitude }));

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
        mapType={mapType}
        initialRegion={region}
        showsUserLocation={!drawingMode}
        showsMyLocationButton={false}
        onPress={handleMapPress}
        onPanDrag={handleMapDrag}
        onRegionChangeComplete={(r) => setRegion(r)}
        onMapReady={() => setTimeout(() => setRegion(region), 0)}
        zoomEnabled={!drawingMode && !editingMode}
        scrollEnabled={!drawingMode && !editingMode}
        rotateEnabled={!drawingMode && !editingMode}
        pitchEnabled={!drawingMode && !editingMode}
        onTouchStart={startDrawing}
        onTouchEnd={stopDrawing}
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
            pinColor="#4CAF50"
          />
        )}

        {/* Property outline polygon */}
        {coordinates.length > 2 && !drawingMode && (
          <Polygon
            coordinates={coordinates}
            strokeColor={theme.colors.primary}
            fillColor={`${theme.colors.primary}20`}
            strokeWidth={2}
          />
        )}

        {/* Live polyline while drawing */}
        {isDrawing && polygonCoordinates.length > 1 && (
          <Polyline coordinates={polygonCoordinates} strokeColor="rgba(255,0,0,0.95)" strokeWidth={3} />
        )}

        {/* Final polygon */}
        {boundaryPoints.length >= 3 && (
          <Polygon coordinates={polygonCoordinates} strokeColor="#FF0000" fillColor="rgba(255,0,0,0.18)" strokeWidth={3} />
        )}

        {/* Small non-draggable red dots while drawing */}
        {isDrawing &&
          boundaryPoints.map((p) => (
            <Marker key={p.id} coordinate={{ latitude: p.latitude, longitude: p.longitude }} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
              <View style={styles.smallRedDot} />
            </Marker>
          ))}

        {/* Draggable small blue dots in edit mode */}
        {editingMode &&
          boundaryPoints.map((p, i) => (
            <Marker
              key={p.id}
              coordinate={{ latitude: p.latitude, longitude: p.longitude }}
              draggable
              onDragEnd={(e) => handleMarkerDrag(i, e.nativeEvent.coordinate)}
              anchor={{ x: 0.5, y: 0.5 }}
              tracksViewChanges={false}
            >
              <View style={styles.smallBlueDot} />
            </Marker>
          ))}
      </MapView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mapContainer}>
        {renderMap()}

        {/* Controls overlay positioned at the top */}
        <View style={styles.controlsOverlay}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => {
              if (userLocation && mapRef.current) mapRef.current.animateToRegion(userLocation, 500);
            }}
          >
            <Text style={styles.controlButtonText}>{'📍 My Location'}</Text>
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
              {drawingMode ? '✅ Finish Drawing' : '✏️ Draw Outline'}
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

          {boundaryPoints.length >= 3 && (
            <TouchableOpacity style={styles.controlButton} onPress={handleSaveOutline}>
              <Text style={styles.controlButtonText}>💾 Save</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Property Information</Text>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#4CAF50' }]} />
          <Text style={styles.legendText}>Property Location</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#FF0000' }]} />
          <Text style={styles.legendText}>
            {isDrawing ? 'Drawing' : editingMode ? 'Editing' : 'Outline'} ({boundaryPoints.length} pts)
          </Text>
        </View>
        <Text style={styles.infoText}>
          Location: {property?.location?.coordinates ? `${property.location.coordinates[1].toFixed(6)}, ${property.location.coordinates[0].toFixed(6)}` : 'Not set'}
        </Text>
        <Text style={styles.infoText}>
          Area: {property?.area ? `${property.area.value} ${property.area.unit}` : 'Not set'}
        </Text>
      </View>
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
    justifyContent: 'space-between',
    padding: 12,
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
  },
  backButtonText: {
    fontSize: 20,
    color: theme.colors.onSurface,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.onBackground,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
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
    height: Dimensions.get('window').height * 0.9, // 90vh
    overflow: 'hidden',
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
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
  controlsOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    padding: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  controlButton: {
    backgroundColor: theme.colors.background,
    paddingVertical: 8,
    paddingHorizontal: 8,
    margin: 2,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.outline,
    minWidth: 70,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  controlButtonText: {
    fontSize: 11,
    color: theme.colors.onBackground,
    fontWeight: '600',
    textAlign: 'center',
  },
  activeControlButton: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  legend: {
    backgroundColor: theme.colors.surface,
    margin: 8,
    padding: 10,
    borderRadius: 8,
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.onSurface,
    marginBottom: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
    color: theme.colors.onSurface,
  },
  infoText: {
    fontSize: 14,
    color: theme.colors.onSurface,
    opacity: 0.8,
    marginBottom: 4,
  },
  smallRedDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(255,0,0,0.95)',
    borderWidth: 2,
    borderColor: 'rgba(255,0,0,0.95)',
  },
  smallBlueDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(255, 238, 0, 0.95)',
    borderWidth: 2,
    borderColor: '#fff',
  },
});

export default PropertyMapScreen;
