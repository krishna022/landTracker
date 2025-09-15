import React, { useState, useEffect, useLayoutEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    FlatList,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Image,
    Dimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { theme } from '../../utils/theme';
import { apiService } from '../../services/api';

const { width } = Dimensions.get('window');
const numColumns = 3;
const imageSize = (width - 48) / numColumns - 8;

interface RouteParams {
    propertyId: string;
    property: any;
}

const PropertyImageScreen: React.FC = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { propertyId, property } = route.params as RouteParams;

    const [images, setImages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchPropertyImages();
    }, []);

    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={handleAddImage}
                    activeOpacity={0.8}
                >
                    <Text style={styles.addButtonText}>+</Text>
                </TouchableOpacity>
            ),
        });
    }, [navigation]);

    const fetchPropertyImages = async () => {
        try {
            setLoading(true);
            // For now, we'll use the property's photos array
            // In a real implementation, you might have a separate endpoint
            if (property && property.photos) {
                setImages(property.photos);
            } else {
                setImages([]);
            }
        } catch (error: any) {
            console.error('Error fetching images:', error);
            Alert.alert('Error', 'Failed to load images');
        } finally {
            setLoading(false);
        }
    };

    const handleAddImage = () => {
        Alert.alert(
            'Add Image',
            'Choose an option',
            [
                { text: 'Camera', onPress: () => openCamera() },
                { text: 'Gallery', onPress: () => openGallery() },
                { text: 'Cancel', style: 'cancel' },
            ]
        );
    };

    const openCamera = () => {
        // TODO: Implement camera functionality
        Alert.alert('Info', 'Camera functionality will be implemented');
    };

    const openGallery = () => {
        // TODO: Implement gallery functionality
        Alert.alert('Info', 'Gallery functionality will be implemented');
    };

    const handleDeleteImage = (imageId: string) => {
        Alert.alert(
            'Delete Image',
            'Are you sure you want to delete this image?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => deleteImage(imageId) },
            ]
        );
    };

    const deleteImage = async (imageId: string) => {
        try {
            // TODO: Implement delete functionality
            Alert.alert('Info', 'Delete functionality will be implemented');
        } catch (error: any) {
            console.error('Error deleting image:', error);
            Alert.alert('Error', 'Failed to delete image');
        }
    };

    const renderImageItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.imageContainer}
            onPress={() => handleImagePress(item)}
            activeOpacity={0.8}
        >
            <Image
                source={{ uri: item.url || item.filename }}
                style={styles.image}
                resizeMode="cover"
            />
            <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteImage(item._id || item.id)}
                activeOpacity={0.8}
            >
                <Text style={styles.deleteButtonText}>×</Text>
            </TouchableOpacity>
        </TouchableOpacity>
    );

    const handleImagePress = (image: any) => {
        // TODO: Open image in full screen viewer
        Alert.alert('Info', 'Full screen image viewer will be implemented');
    };

    const renderAddImageButton = () => (
        <TouchableOpacity
            style={styles.addImageContainer}
            onPress={handleAddImage}
            activeOpacity={0.8}
        >
            <Text style={styles.addImageIcon}>+</Text>
            <Text style={styles.addImageText}>Add Image</Text>
        </TouchableOpacity>
    );

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
          <Text style={styles.title}>Property Images</Text>
          <Text style={styles.subtitle}>
            {property?.title || property?.name || 'Property'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddImage}
          activeOpacity={0.8}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View> */}

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                    <Text style={styles.loadingText}>Loading images...</Text>
                </View>
            ) : (
                <FlatList
                    data={[...images, { _id: 'add', isAddButton: true }]}
                    renderItem={({ item }) =>
                        item.isAddButton ? renderAddImageButton() : renderImageItem({ item })
                    }
                    keyExtractor={(item) => item._id || item.id || 'add'}
                    numColumns={numColumns}
                    contentContainerStyle={styles.gridContainer}
                    showsVerticalScrollIndicator={false}
                />
            )}

            {uploading && (
                <View style={styles.uploadOverlay}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                    <Text style={styles.uploadText}>Uploading image...</Text>
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
    addButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addButtonText: {
        fontSize: 20,
        color: theme.colors.onPrimary,
        fontWeight: 'bold',
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
    gridContainer: {
        padding: 16,
    },
    imageContainer: {
        width: imageSize,
        height: imageSize,
        margin: 4,
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: theme.colors.surface,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    deleteButton: {
        position: 'absolute',
        top: 4,
        right: 4,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    deleteButtonText: {
        fontSize: 16,
        color: 'white',
        fontWeight: 'bold',
    },
    addImageContainer: {
        width: imageSize,
        height: imageSize,
        margin: 4,
        borderRadius: 8,
        backgroundColor: theme.colors.primaryContainer,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: theme.colors.primary,
        borderStyle: 'dashed',
    },
    addImageIcon: {
        fontSize: 32,
        color: theme.colors.primary,
        fontWeight: 'bold',
    },
    addImageText: {
        fontSize: 12,
        color: theme.colors.primary,
        marginTop: 4,
        fontWeight: '500',
    },
    uploadOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    uploadText: {
        marginTop: 16,
        fontSize: 16,
        color: 'white',
    },
});

export default PropertyImageScreen;
