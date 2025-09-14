import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { theme } from '../utils/theme';

const { width, height } = Dimensions.get('window');

const MapScreen: React.FC = () => {
  const [mapType, setMapType] = useState<'standard' | 'satellite' | 'hybrid'>('standard');

  const toggleMapType = () => {
    const types: ('standard' | 'satellite' | 'hybrid')[] = ['standard', 'satellite', 'hybrid'];
    const currentIndex = types.indexOf(mapType);
    const nextIndex = (currentIndex + 1) % types.length;
    setMapType(types[nextIndex]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Property Map</Text>
        <TouchableOpacity style={styles.mapTypeButton} onPress={toggleMapType}>
          <Text style={styles.mapTypeText}>{mapType.toUpperCase()}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.mapContainer}>
        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapPlaceholderTitle}>Interactive Map</Text>
          <Text style={styles.mapPlaceholderText}>
            Map functionality will be added here with:
          </Text>
          <View style={styles.featureList}>
            <Text style={styles.featureItem}>• Property boundary visualization</Text>
            <Text style={styles.featureItem}>• GPS location tracking</Text>
            <Text style={styles.featureItem}>• Satellite and terrain views</Text>
            <Text style={styles.featureItem}>• Property markers and overlays</Text>
            <Text style={styles.featureItem}>• Drawing tools for boundaries</Text>
          </View>
        </View>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlButton}>
          <Text style={styles.controlButtonText}>📍 My Location</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.controlButton}>
          <Text style={styles.controlButtonText}>✏️ Draw Boundary</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.controlButton}>
          <Text style={styles.controlButtonText}>📌 Add Marker</Text>
        </TouchableOpacity>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
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
  mapContainer: {
    flex: 1,
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.outline,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapPlaceholderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: 16,
  },
  mapPlaceholderText: {
    fontSize: 16,
    color: theme.colors.onSurface,
    textAlign: 'center',
    marginBottom: 20,
  },
  featureList: {
    alignItems: 'flex-start',
  },
  featureItem: {
    fontSize: 14,
    color: theme.colors.onSurface,
    marginBottom: 4,
    opacity: 0.8,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outline,
    backgroundColor: theme.colors.surface,
  },
  controlButton: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginHorizontal: 4,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.outline,
  },
  controlButtonText: {
    fontSize: 12,
    color: theme.colors.onBackground,
    fontWeight: '500',
    textAlign: 'center',
  },
  legend: {
    backgroundColor: theme.colors.surface,
    margin: 16,
    padding: 16,
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
});

export default MapScreen;
