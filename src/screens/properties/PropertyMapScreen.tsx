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
  Modal,
  ScrollView,
  Linking,
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

  const [mapType, setMapType] = useState<MapType>('satellite');
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<Region | null>(null);
  const [propertyLoading, setPropertyLoading] = useState(true); // Track property data loading

  // Drawing and editing modes
  const [drawingMode, setDrawingMode] = useState(false);
  const [editingMode, setEditingMode] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [boundaryPoints, setBoundaryPoints] = useState<Point[]>([]);

  // Property outline coordinates
  const [coordinates, setCoordinates] = useState<any[]>([]);

  // Bottom slide for property details
  const [showPropertyDetails, setShowPropertyDetails] = useState(false);

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
            style={styles.headerIconButton}
            onPress={() => setShowPropertyDetails(true)}
          >
            <Text style={styles.headerIconText}>ℹ️</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={openNavigation}
          >
            <Text style={styles.headerIconText}>🧭</Text>
          </TouchableOpacity>
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
    console.log('Initializing map with property:', property);
    console.log('Property ID:', propertyId);

    setPropertyLoading(true);

    // Check for property location (could be location or locationPoint)
    const propertyLocation = property?.location?.coordinates || property?.locationPoint?.coordinates;

    if (property && propertyLocation) {
      console.log('Found property location:', propertyLocation);

      const initialRegion = {
        latitude: propertyLocation[1], // GeoJSON: [lng, lat] so lat is index 1
        longitude: propertyLocation[0], // GeoJSON: [lng, lat] so lng is index 0
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setRegion(initialRegion);
      console.log('Set map region to property location:', initialRegion);

      // Initialize coordinates for outline if available
      if (property.outline && property.outline.coordinates && property.outline.coordinates[0]) {
        console.log('Loading existing property outline:', property.outline);
        console.log('Outline coordinates array:', property.outline.coordinates[0]);
        try {
          const outlineCoords = property.outline.coordinates[0].map((coord: number[]) => ({
            latitude: coord[1],
            longitude: coord[0],
          }));

          console.log('Raw GeoJSON coordinates sample:', property.outline.coordinates[0].slice(0, 3));
          console.log('Converted coordinates sample:', outlineCoords.slice(0, 3));

          // Remove the closing coordinate if it exists (GeoJSON often includes it)
          if (outlineCoords.length > 1 &&
              outlineCoords[0].latitude === outlineCoords[outlineCoords.length - 1].latitude &&
              outlineCoords[0].longitude === outlineCoords[outlineCoords.length - 1].longitude) {
            console.log('Removing duplicate closing coordinate');
            outlineCoords.pop();
          }

          console.log('Final converted outline coordinates:', outlineCoords.length, 'points');
          setCoordinates(outlineCoords);

          // Also set boundary points for editing
          const boundaryPts = outlineCoords.map((coord: any, index: number) => ({
            latitude: coord.latitude,
            longitude: coord.longitude,
            id: `pt-${Date.now()}-${index}`,
          }));
          setBoundaryPoints(boundaryPts);
          console.log('Set boundary points for editing:', boundaryPts.length, 'points');
        } catch (error) {
          console.error('Error loading property outline:', error);
          Alert.alert('Warning', 'Could not load existing property outline. You can draw a new one.');
        }
      } else {
        console.log('No existing outline found for property');
        // Clear any existing coordinates
        setCoordinates([]);
        setBoundaryPoints([]);
      }
    } else {
      console.log('No property location available, using default region');
      // Clear coordinates if no property
      setCoordinates([]);
      setBoundaryPoints([]);
    }

    setPropertyLoading(false);
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

  // Stable id generator - improved for better React key stability
  const makeId = (idx?: number) =>
    `pt-${idx != null ? idx : 0}-${Math.round(Math.random() * 1e6)}`;

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
      // Check if we have existing outline to edit
      if (coordinates.length > 2 && !boundaryPoints.length) {
        // Edit existing outline
        setBoundaryPoints(coordinates.map((coord: any, index: number) => ({
          latitude: coord.latitude,
          longitude: coord.longitude,
          id: `pt-${Date.now()}-${index}`,
        })));
        setEditingMode(true);
        setDrawingMode(false);
      } else {
        // Start new drawing
        setBoundaryPoints([]);
        setCoordinates([]);
        setDrawingMode(true);
        setEditingMode(false);
        setIsDrawing(false);
      }
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

  // Editing marker drag - improved for better performance
  const handleMarkerDrag = (index: number, newCoordinate: { latitude: number; longitude: number }) => {
    console.log('Drag event:', index, newCoordinate); // Debug log

    // Validate coordinate
    if (!newCoordinate || typeof newCoordinate.latitude !== 'number' || typeof newCoordinate.longitude !== 'number') {
      console.warn('Invalid coordinate received:', newCoordinate);
      return;
    }

    setBoundaryPoints((prev) => {
      const updated = [...prev];
      if (updated[index]) {
        updated[index] = {
          ...updated[index],
          latitude: newCoordinate.latitude,
          longitude: newCoordinate.longitude,
          // Ensure ID remains stable for React key consistency
          id: updated[index].id
        };
      }
      return updated;
    });
    setCoordinates((prev) => {
      const updated = [...prev];
      if (updated[index]) {
        updated[index] = {
          latitude: newCoordinate.latitude,
          longitude: newCoordinate.longitude
        };
      }
      return updated;
    });
  };  const handleSaveOutline = async () => {
    if (boundaryPoints.length < 3) {
      Alert.alert('Error', 'Please add at least 3 points to create a valid outline');
      return;
    }

    try {
      setLoading(true);

      // Convert coordinates back to GeoJSON format
      // GeoJSON requires the first and last coordinates to be the same to close the polygon
      const geoJsonCoordinates = boundaryPoints.map(coord => [coord.longitude, coord.latitude]);

      // Close the polygon by adding the first point as the last point
      if (geoJsonCoordinates.length > 0) {
        geoJsonCoordinates.push(geoJsonCoordinates[0]);
      }

      const updateData = {
        outline: {
          type: 'Polygon',
          coordinates: [geoJsonCoordinates],
        },
      };

      console.log('Saving outline for property:', propertyId);
      console.log('Update data:', updateData);

      const result = await apiService.properties.updateProperty(propertyId, updateData);

      if (result) {
        Alert.alert('Success', 'Property outline updated successfully');

        // Update local coordinates state to reflect the saved outline
        const updatedCoordinates = boundaryPoints.map(coord => ({
          latitude: coord.latitude,
          longitude: coord.longitude
        }));
        setCoordinates(updatedCoordinates);

        // Exit editing mode
        setDrawingMode(false);
        setEditingMode(false);
      } else {
        throw new Error('Update failed');
      }
    } catch (error: any) {
      console.error('Error updating outline:', error);
      Alert.alert('Error', 'Failed to update property outline. Please try again.');
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

  // Open navigation in external maps app
  const openNavigation = () => {
    const locationCoords = property?.location?.coordinates || property?.locationPoint?.coordinates;
    if (!locationCoords) {
      Alert.alert('Error', 'Property location not available for navigation');
      return;
    }

    const latitude = locationCoords[1];
    const longitude = locationCoords[0];
    const label = property?.title || property?.name || 'Property';

    const url = Platform.OS === 'ios'
      ? `maps:///?daddr=${latitude},${longitude}&dirflg=d&t=m`
      : `geo:${latitude},${longitude}?q=${latitude},${longitude}(${label})`;

    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Unable to open maps application');
    });
  };

  // Polygon coordinates for MapView
  const polygonCoordinates = boundaryPoints.map((p) => ({ latitude: p.latitude, longitude: p.longitude }));

  const renderMap = () => {
    if (!region || propertyLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>
            {propertyLoading ? 'Loading property data...' : 'Loading map...'}
          </Text>
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
        onTouchStart={editingMode ? undefined : startDrawing}
        onTouchEnd={editingMode ? undefined : stopDrawing}
      >
        {/* Property marker */}
        {property && (property.location || property.locationPoint) && (() => {
          const locationCoords = property.location?.coordinates || property.locationPoint?.coordinates;
          return locationCoords ? (
            <Marker
              coordinate={{
                latitude: locationCoords[1],
                longitude: locationCoords[0],
              }}
              title={property.title || property.name}
              description={property.description}
              pinColor="#4CAF50"
            />
          ) : null;
        })()}

        {/* Property outline polygon - existing saved outline */}
        {coordinates.length > 2 && !drawingMode && !editingMode && (() => {
          console.log('Rendering existing outline polygon with coordinates:', coordinates.length, 'points');
          console.log('First few coordinates:', coordinates.slice(0, 3));
          return (
            <Polygon
              coordinates={coordinates}
              strokeColor={theme.colors.primary}
              fillColor={`${theme.colors.primary}15`}
              strokeWidth={3}
            />
          );
        })()}

        {/* Property outline polygon - when in editing mode */}
        {coordinates.length > 2 && editingMode && (() => {
          console.log('Rendering editing mode polygon with coordinates:', coordinates.length, 'points');
          return (
            <Polygon
              coordinates={coordinates}
              strokeColor="#2196F3"
              fillColor="rgba(33, 150, 243, 0.1)"
              strokeWidth={2}
            />
          );
        })()}

        {/* Live polyline while drawing */}
        {isDrawing && polygonCoordinates.length > 1 && (
          <Polyline coordinates={polygonCoordinates} strokeColor="rgba(255,0,0,0.95)" strokeWidth={3} />
        )}

        {/* Final polygon */}
        {boundaryPoints.length >= 3 && (
          <Polygon coordinates={polygonCoordinates} strokeColor="#FF0000" fillColor="rgba(255,0,0,0.18)" strokeWidth={3} />
        )}

        {/* Small non-draggable red dots while drawing - REMOVED */}
        {/* {isDrawing &&
          boundaryPoints.map((p) => (
            <Marker key={p.id} coordinate={{ latitude: p.latitude, longitude: p.longitude }} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
              <View style={styles.smallRedDot} />
            </Marker>
          ))} */}

        {/* Draggable small blue dots in edit mode */}
        {editingMode && boundaryPoints.length > 0 && (
          <>
            {console.log('Rendering markers:', boundaryPoints.length)}
            {boundaryPoints.map((p, i) => (
              <Marker
                key={i} // Use simple index key for reliability
                coordinate={{ latitude: p.latitude, longitude: p.longitude }}
                draggable
                onDragStart={() => console.log('Drag started for marker', i)}
                onDrag={(e) => console.log('Dragging marker', i, e.nativeEvent.coordinate)}
                onDragEnd={(e) => {
                  console.log('Raw drag event:', e.nativeEvent); // Debug raw event
                  handleMarkerDrag(i, e.nativeEvent.coordinate);
                }}
                anchor={{ x: 0.5, y: 0.5 }}
                tracksViewChanges={false}
              >
                <View style={styles.smallBlueDot} />
              </Marker>
            ))}
          </>
        )}
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
              {drawingMode ? '✅ Finish Drawing' : (coordinates.length > 2 ? '🖌️ Edit Outline' : '✏️ Draw Outline')}
            </Text>
          </TouchableOpacity>

          {boundaryPoints.length >= 3 && !coordinates.length && (
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

          {boundaryPoints.length >= 3 && !coordinates.length && (
            <TouchableOpacity
              style={[styles.controlButton, loading && styles.disabledButton]}
              onPress={handleSaveOutline}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={theme.colors.onPrimary} />
              ) : (
                <Text style={styles.controlButtonText}>💾 Save</Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Compass/Directions Overlay */}
        <View style={styles.compassOverlay}>
          <View style={styles.compassContainer}>
            <Text style={styles.compassText}>N</Text>
            <View style={styles.compassLines}>
              <View style={styles.compassLine} />
              <View style={[styles.compassLine, styles.compassLineHorizontal]} />
              <View style={styles.compassLine} />
              <View style={[styles.compassLine, styles.compassLineHorizontal]} />
            </View>
            <Text style={[styles.compassText, styles.compassTextS]}>S</Text>
          </View>
          <View style={styles.compassLabels}>
            <Text style={[styles.compassLabel, styles.compassLabelW]}>W</Text>
            <Text style={[styles.compassLabel, styles.compassLabelE]}>E</Text>
          </View>
        </View>
      </View>

      {/* Property Details Bottom Slide */}
      <Modal
        visible={showPropertyDetails}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPropertyDetails(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Property Details</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowPropertyDetails(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Name:</Text>
                <Text style={styles.detailValue}>{property?.title || property?.name || 'Not specified'}</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Description:</Text>
                <Text style={styles.detailValue}>{property?.description || 'No description available'}</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Location:</Text>
                <Text style={styles.detailValue}>
                  {(() => {
                    const locationCoords = property?.location?.coordinates || property?.locationPoint?.coordinates;
                    return locationCoords ? `${locationCoords[1].toFixed(6)}, ${locationCoords[0].toFixed(6)}` : 'Not set';
                  })()}
                </Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Area:</Text>
                <Text style={styles.detailValue}>
                  {property?.area ? `${property.area.value} ${property.area.unit}` : 'Not set'}
                </Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Status:</Text>
                <Text style={styles.detailValue}>{property?.status || 'Unknown'}</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Type:</Text>
                <Text style={styles.detailValue}>{property?.type || 'Not specified'}</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Price:</Text>
                <Text style={styles.detailValue}>
                  {property?.price ? `${property.price.currency} ${property.price.amount}` : 'Not set'}
                </Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Outline Points:</Text>
                <Text style={styles.detailValue}>
                  {coordinates.length > 0 ? `${coordinates.length} points` : 'No outline available'}
                </Text>
              </View>

              {property?.neighbors && property.neighbors.length > 0 && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Neighbors:</Text>
                  {property.neighbors.map((neighbor: any, index: number) => (
                    <Text key={index} style={styles.detailValue}>
                      {neighbor.name || neighbor.title || `Neighbor ${index + 1}`} ({neighbor.direction || 'Unknown direction'})
                    </Text>
                  ))}
                </View>
              )}

              {property?.createdAt && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Created:</Text>
                  <Text style={styles.detailValue}>
                    {new Date(property.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              )}

              {property?.updatedAt && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Last Updated:</Text>
                  <Text style={styles.detailValue}>
                    {new Date(property.updatedAt).toLocaleDateString()}
                  </Text>
                </View>
              )}
            </ScrollView>
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
  headerIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  headerIconText: {
    fontSize: 18,
    color: theme.colors.onSurface,
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
    top: 3,
    left: 3,
    right: 3,
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    padding: 3,
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
  smallBlueDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(255, 238, 0, 0.95)',
    borderWidth: 2,
    borderColor: '#fff',
  },
  disabledButton: {
    opacity: 0.6,
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
    maxHeight: Dimensions.get('window').height * 0.7,
    minHeight: Dimensions.get('window').height * 0.4,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.onSurface,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: theme.colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
    fontWeight: 'bold',
  },
  modalBody: {
    padding: 20,
  },
  detailSection: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
    lineHeight: 22,
  },
  compassOverlay: {
    position: 'absolute',
    bottom: 70,
    right: 2,
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
  compassContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  compassText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    textAlign: 'center',
  },
  compassTextS: {
    marginTop: 2,
  },
  compassLines: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  compassLine: {
    width: 20,
    height: 2,
    backgroundColor: theme.colors.onSurface,
    marginHorizontal: 2,
  },
  compassLineHorizontal: {
    width: 2,
    height: 20,
    position: 'absolute',
  },
  compassLabels: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: 60,
    marginTop: 4,
    position: 'relative',
  },
  compassLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.onSurface,
    position: 'absolute',
  },
  compassLabelW: {
    left: 0,
  },
  compassLabelE: {
    right: 0,
  },
});

export default PropertyMapScreen;
