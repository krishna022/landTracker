// MapScreen.tsx (updated)
import React, { useEffect, useRef, useState } from 'react';
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
import MapView, {
  Marker,
  Polygon,
  Polyline,
  PROVIDER_GOOGLE,
  MapType,
  Region,
} from 'react-native-maps';
import { useNavigation } from '@react-navigation/native';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import Geolocation from '@react-native-community/geolocation';
import simplify from 'simplify-js';
import { theme } from '../utils/theme';
import { apiService } from '../services/api';

const { width, height } = Dimensions.get('window');

LogBox.ignoreLogs([
  'Warning: componentWillMount has been renamed',
  'Warning: componentWillReceiveProps has been renamed',
]);

interface Property {
  _id: string;
  title: string;
  name: string;
  location: { coordinates: [number, number] };
  outline?: { coordinates: number[][][] };
  status: string;
  propertyType: string;
}

interface Point {
  latitude: number;
  longitude: number;
  id: string;
}

const SMOOTH_TOLERANCE = 0.00003; // lower = preserve more detail

const MapScreen: React.FC = () => {
  const navigation = useNavigation();
  const mapRef = useRef<MapView | null>(null);

  const [mapType, setMapType] = useState<MapType>('standard');
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<Region | null>(null);

  // modes & points
  const [drawingMode, setDrawingMode] = useState(false);
  const [editingMode, setEditingMode] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [boundaryPoints, setBoundaryPoints] = useState<Point[]>([]);

  // default region
  const [region, setRegion] = useState<Region>({
    latitude: 25.332247,
    longitude: 84.741501,
    latitudeDelta: 10,
    longitudeDelta: 10,
  });

  useEffect(() => {
    fetchProperties();
    getCurrentLocation();
  }, []);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const response: any = await apiService.properties.getProperties();
      if (Array.isArray(response)) setProperties(response);
      else if (response?.properties && Array.isArray(response.properties))
        setProperties(response.properties);
    } catch (err) {
      console.error('fetchProperties err', err);
      Alert.alert('Error', 'Failed to load properties');
    } finally {
      setLoading(false);
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
            setRegion(r);
            if (mapRef.current) mapRef.current.animateToRegion(r, 1000);
          },
          (err) => {
            console.warn('Geolocation error', err);
          },
          { enableHighAccuracy: true }
        );
      }
    } catch (err) {
      console.warn('getCurrentLocation err', err);
    }
  };

  // stable id generator - improved for better React key stability
const makeId = (idx?: number) =>
  `pt-${idx != null ? idx : 0}-${Math.round(Math.random() * 1e6)}`;

  // ---------- Drawing handlers (preserve your working approach) ----------
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

  // Called on long press for precise point placement
  const handleMapLongPress = (event: any) => {
    if (drawingMode && !editingMode) {
      const { coordinate } = event.nativeEvent;
      pushPoint(coordinate);
      // Provide haptic feedback for precise placement
      Alert.alert('Point Added', `Added precise point at: ${coordinate.latitude.toFixed(6)}, ${coordinate.longitude.toFixed(6)}`);
    }
  };

  // Called on map pan drag (continuous) - improved for more precision
  const handleMapDrag = (event: any) => {
    if (drawingMode && !editingMode && isDrawing) {
      const { coordinate } = event.nativeEvent;
      // Add more points for smoother boundaries by reducing distance threshold
      const lastPoint = boundaryPoints[boundaryPoints.length - 1];
      if (!lastPoint ||
          Math.abs(coordinate.latitude - lastPoint.latitude) > 0.00001 ||
          Math.abs(coordinate.longitude - lastPoint.longitude) > 0.00001) {
        pushPoint(coordinate);
      }
    }
  };

  // start drawing when touch starts
  const startDrawing = () => {
    if (drawingMode && !editingMode) {
      setIsDrawing(true);
      // when starting ensure previous points cleared (user expects a fresh draw)
      // (if you want to allow continuing existing points, remove the next line)
      // setBoundaryPoints([]);
    }
  };

  // stop drawing when touch ends
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

  // Toggle draw button behavior (same UX you had)
  const toggleDrawingMode = () => {
    if (drawingMode) {
      // finishing via button: prompt save/enter edit
      if (boundaryPoints.length >= 3) {
        Alert.alert('Save Boundary', 'Do you want to save this boundary as a new property?', [
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
              saveBoundaryAsProperty();
              setEditingMode(true);
            },
          },
        ]);
      } else {
        Alert.alert('Error', 'Please draw at least 3 points to create a boundary');
        setDrawingMode(false);
      }
    } else {
      // start drawing
      setBoundaryPoints([]);
      setDrawingMode(true);
      setEditingMode(false);
      setIsDrawing(false);
    }
  };

  // ---------- Smoothing but preserve ids mapping ----------
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
      id: nearest.id, // keep old id so drag still works
    };
  });

  setBoundaryPoints(smoothedPoints);
};

  // ---------- Editing marker drag - improved for better performance ----------
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
};

  // ---------- Save / clear / undo ----------
  const saveBoundaryAsProperty = () => {
    if (boundaryPoints.length < 3) {
      Alert.alert('Error', 'Draw at least 3 points');
      return;
    }
    const coords = boundaryPoints.map((p) => [p.longitude, p.latitude]);
    // @ts-ignore
    navigation.navigate('AddProperty', { initialBoundary: coords });
    setDrawingMode(false);
    setEditingMode(false);
  };

  const clearBoundary = () => {
    setBoundaryPoints([]);
    setEditingMode(false);
    setDrawingMode(false);
  };

  const undoLastPoint = () => {
    setBoundaryPoints((prev) => prev.slice(0, -1));
  };

  // ---------- Map helpers ----------
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

  // property rendering unchanged...
  const getPropertyColor = (status: string, propertyType: string) => {
    if (status === 'active') {
      switch (propertyType) {
        case 'owned':
          return '#4CAF50';
        case 'leased':
          return '#FF9800';
        case 'disputed':
          return '#F44336';
        default:
          return '#2196F3';
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
      ? { latitude: property.location.coordinates[1], longitude: property.location.coordinates[0] }
      : userLocation
      ? { latitude: userLocation.latitude, longitude: userLocation.longitude }
      : { latitude: 25.332247, longitude: 84.741501 };

    return (
      <Marker key={property._id} coordinate={markerCoordinate} title={property.title || property.name} description={`Status: ${property.status}`} pinColor={color} onPress={() => {
        // @ts-ignore
        navigation.navigate('PropertyDetail', { propertyId: property._id });
      }} />
    );
  };

  const renderPropertyBoundary = (property: Property) => {
    if (!property.outline || !property.outline.coordinates || !property.outline.coordinates[0]) return null;
    const coords = property.outline.coordinates[0].map((c: number[]) => ({ latitude: c[1], longitude: c[0] }));
    const color = getPropertyColor(property.status, property.propertyType || 'owned');
    return <Polygon key={`boundary-${property._id}`} coordinates={coords} strokeColor={color} fillColor={`${color}20`} strokeWidth={2} />;
  };

  // polygon coordinates for MapView (Polygon auto-closes)
  const polygonCoordinates = boundaryPoints.map((p) => ({ latitude: p.latitude, longitude: p.longitude }));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Property Map</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.mapTypeButton} onPress={() => setMapType((t) => (t === 'standard' ? 'satellite' : 'standard'))}>
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
        ) : (
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            mapType={mapType}
            initialRegion={region}
            showsUserLocation={!drawingMode} // HIDE user blue dot while drawing (prevent overlap)
            showsMyLocationButton={false}
            onPress={handleMapPress}
            onLongPress={handleMapLongPress}
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
            {properties.map(renderPropertyMarker)}
            {properties.map(renderPropertyBoundary)}

            {/* live polyline while drawing */}
            {isDrawing && polygonCoordinates.length > 1 && (
              <Polyline coordinates={polygonCoordinates} strokeColor="rgba(255,0,0,0.95)" strokeWidth={3} />
            )}

            {/* final polygon */}
            {boundaryPoints.length >= 3 && (
              <Polygon coordinates={polygonCoordinates} strokeColor="#FF0000" fillColor="rgba(255,0,0,0.18)" strokeWidth={3} />
            )}

            {/* small non-draggable red dots while drawing - REMOVED */}
            {/* {isDrawing &&
              boundaryPoints.map((p) => (
                <Marker key={p.id} coordinate={{ latitude: p.latitude, longitude: p.longitude }} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
                  <View style={styles.smallRedDot} />
                </Marker>
              ))} */}

            {/* draggable small blue dots in edit mode */}
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
                    tracksViewChanges={false} // Revert to false for compatibility
                    >
                    <View style={styles.smallBlueDot} />
                  </Marker>
                ))}
              </>
            )}

          </MapView>
        )}
      </View>

      <View style={styles.controls}>
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

        <TouchableOpacity style={[styles.controlButton, drawingMode && styles.activeControlButton]} onPress={toggleDrawingMode}>
          <Text style={styles.controlButtonText}>{drawingMode ? '✅ Finish Drawing' : '✏️ Draw Boundary'}</Text>
        </TouchableOpacity>

        {boundaryPoints.length >= 3 && (
          <TouchableOpacity style={[styles.controlButton, editingMode && styles.activeControlButton]} onPress={toggleEditMode}>
            <Text style={styles.controlButtonText}>{editingMode ? '✅ Done Editing' : '🖌️ Edit Points'}</Text>
          </TouchableOpacity>
        )}

        {drawingMode && boundaryPoints.length > 0 && (
          <TouchableOpacity style={styles.controlButton} onPress={undoLastPoint}>
            <Text style={styles.controlButtonText}>↶ Undo</Text>
          </TouchableOpacity>
        )}

        {boundaryPoints.length >= 3 && (
          <TouchableOpacity style={styles.controlButton} onPress={saveBoundaryAsProperty}>
            <Text style={styles.controlButtonText}>💾 Save</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Map Legend</Text>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#FF0000' }]} />
          <Text style={styles.legendText}>{isDrawing ? 'Drawing' : editingMode ? 'Editing' : 'Boundary'} ({boundaryPoints.length} pts)</Text>
        </View>
        {drawingMode && (
          <View style={styles.legendItem}>
            <Text style={styles.legendText}>💡 Long press for precise points</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const dotSize = 14;
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderColor: theme.colors.outline },
  title: { fontSize: 18, fontWeight: '700', color: theme.colors.onBackground },
  headerButtons: { flexDirection: 'row', gap: 8 },
  mapTypeButton: { backgroundColor: theme.colors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  mapTypeText: { color: theme.colors.onPrimary, fontSize: 12, fontWeight: '600' },
  clearButton: { backgroundColor: theme.colors.error, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  clearButtonText: { color: theme.colors.onError, fontSize: 12, fontWeight: '600' },
  mapContainer: { flex: 1, overflow: 'hidden' },
  map: { ...StyleSheet.absoluteFillObject },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.surface },
  loadingText: { marginTop: 16, fontSize: 16, color: theme.colors.onSurface, opacity: 0.8 },
  controls: { flexDirection: 'row', justifyContent: 'space-around', flexWrap: 'wrap', padding: 8, borderTopWidth: 1, borderTopColor: theme.colors.outline, backgroundColor: theme.colors.surface },
  controlButton: { backgroundColor: theme.colors.background, paddingVertical: 10, paddingHorizontal: 10, margin: 4, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.outline, minWidth: 90 },
  controlButtonText: { fontSize: 12, color: theme.colors.onBackground, fontWeight: '600' },
  activeControlButton: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  legend: { backgroundColor: theme.colors.surface, margin: 8, padding: 10, borderRadius: 8 },
  legendTitle: { fontSize: 14, fontWeight: '700', color: theme.colors.onSurface, marginBottom: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendColor: { width: 16, height: 16, borderRadius: 8, marginRight: 8 },
  legendText: { fontSize: 14, color: theme.colors.onSurface },
  smallBlueDot: { width: dotSize, height: dotSize, borderRadius: dotSize / 2, backgroundColor: 'rgba(255, 238, 0, 0.95)', borderWidth: 2, borderColor: '#fff', elevation: 3 },
});

export default MapScreen;
