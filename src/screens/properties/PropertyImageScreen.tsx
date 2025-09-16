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
    Platform,
    Modal,
    StatusBar,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { launchImageLibrary, launchCamera, ImagePickerResponse, MediaType } from 'react-native-image-picker';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import Toast from 'react-native-toast-message';
import { theme } from '../../utils/theme';
import { apiService } from '../../services/api';

const { width, height } = Dimensions.get('window');
const numColumns = width >= 768 ? 2 : 1; // Tablet: 2 columns, Mobile: 1 column
const imageSize = (width - (numColumns + 1) * 16) / numColumns; // Account for padding

// API Base URL for constructing full image URLs
const API_BASE_URL = Platform.OS === 'android' 
    ? 'http://10.0.2.2:3000' 
    : 'http://localhost:3000';

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
    
    // Full screen viewer state
    const [viewerVisible, setViewerVisible] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    
    // Image loading states
    const [imageLoadingStates, setImageLoadingStates] = useState<{[key: string]: boolean}>({});
    const [imageErrorStates, setImageErrorStates] = useState<{[key: string]: boolean}>({});

    useEffect(() => {
        // Use photos from the property data passed from PropertiesScreen
        if (property && Array.isArray(property.photos)) {
            setImages(property.photos);
            console.log('Loaded images from route params:', property.photos);
        } else {
            setImages([]);
        }
        setLoading(false);
    }, [property]);

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

    // Helper function to construct full image URL
    const getFullImageUrl = (image: any) => {
        if (image.url && image.url.startsWith('http')) {
            return image.url;
        }
        if (image.url) {
            return `${API_BASE_URL}${image.url}`;
        }
        if (image.filename) {
            return `${API_BASE_URL}/uploads/properties/${image.filename}`;
        }
        return '';
    };

    // Image loading handlers
    const handleImageLoadStart = (imageId: string) => {
        setImageLoadingStates(prev => ({ ...prev, [imageId]: true }));
    };

    const handleImageLoadEnd = (imageId: string) => {
        setImageLoadingStates(prev => ({ ...prev, [imageId]: false }));
    };

    const handleImageError = (imageId: string) => {
        setImageLoadingStates(prev => ({ ...prev, [imageId]: false }));
        setImageErrorStates(prev => ({ ...prev, [imageId]: true }));
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

    const requestCameraPermission = async () => {
        try {
            const permission = Platform.OS === 'ios' 
                ? PERMISSIONS.IOS.CAMERA 
                : PERMISSIONS.ANDROID.CAMERA;
            
            const result = await request(permission);
            return result === RESULTS.GRANTED;
        } catch (error) {
            console.error('Error requesting camera permission:', error);
            return false;
        }
    };

    const requestGalleryPermission = async () => {
        try {
            const permission = Platform.OS === 'ios' 
                ? PERMISSIONS.IOS.PHOTO_LIBRARY 
                : PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE;
            
            const result = await request(permission);
            return result === RESULTS.GRANTED;
        } catch (error) {
            console.error('Error requesting gallery permission:', error);
            return false;
        }
    };

    const openCamera = async () => {
        const hasPermission = await requestCameraPermission();
        if (!hasPermission) {
            Toast.show({
                type: 'error',
                text1: 'Camera Permission Required',
                text2: 'Please enable camera permission in settings to take photos.',
            });
            return;
        }

        const options = {
            mediaType: 'photo' as MediaType,
            quality: 0.7 as any, // Better compression for smaller file size
            maxWidth: 1920, // Limit max width
            maxHeight: 1920, // Limit max height
            includeBase64: false,
            storageOptions: {
                skipBackup: true,
                path: 'images',
            },
        };

        launchCamera(options, (response: ImagePickerResponse) => {
            if (response.didCancel) {
                console.log('User cancelled camera');
            } else if (response.errorMessage) {
                console.error('Camera Error: ', response.errorMessage);
                Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: 'Failed to open camera',
                });
            } else if (response.assets && response.assets[0]) {
                handleImageSelected(response.assets[0]);
            }
        });
    };

    const openGallery = async () => {
        const hasPermission = await requestGalleryPermission();
        if (!hasPermission) {
            Toast.show({
                type: 'error',
                text1: 'Gallery Permission Required',
                text2: 'Please enable gallery permission in settings to select photos.',
            });
            return;
        }

        const options = {
            mediaType: 'photo' as MediaType,
            quality: 0.7 as any, // Better compression for smaller file size
            maxWidth: 1920, // Limit max width
            maxHeight: 1920, // Limit max height
            includeBase64: false,
            selectionLimit: 1,
        };

        launchImageLibrary(options, (response: ImagePickerResponse) => {
            if (response.didCancel) {
                console.log('User cancelled image picker');
            } else if (response.errorMessage) {
                console.error('ImagePicker Error: ', response.errorMessage);
                Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: 'Failed to open gallery',
                });
            } else if (response.assets && response.assets[0]) {
                handleImageSelected(response.assets[0]);
            }
        });
    };

    const handleImageSelected = async (asset: any) => {
        try {
            setUploading(true);
            
            // Create FormData for upload
            const formData = new FormData();
            formData.append('photos', {
                uri: asset.uri,
                type: asset.type || 'image/jpeg',
                name: asset.fileName || `image_${Date.now()}.jpg`,
            });

            // Upload to backend
            const response: any = await apiService.properties.uploadPropertyPhotos(propertyId, formData);
            
            if (response && response.uploadedPhotos) {
                // Add uploaded photos to local state
                setImages(prev => [...prev, ...response.uploadedPhotos]);
                Toast.show({
                    type: 'success',
                    text1: 'Success',
                    text2: `${response.uploadedPhotos.length} image(s) uploaded successfully`,
                });
            }
            
        } catch (error: any) {
            console.error('Error uploading image:', error);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error.message || 'Failed to upload image',
            });
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteImage = (imageId: string) => {
        console.log('handleDeleteImage called with imageId:', imageId);
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
            setUploading(true); // Using uploading state for delete operation

            console.log('Deleting image with ID:', imageId);
            console.log('Property ID:', propertyId);

            // Call backend to delete image
            const response = await apiService.properties.deletePropertyPhoto(propertyId, imageId);
            console.log('Delete response:', response);

            // Remove from local state
            setImages(prev => prev.filter(img => (img._id || img.id) !== imageId));

            Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Image deleted successfully',
            });
        } catch (error: any) {
            console.error('Error deleting image:', error);
            console.error('Error details:', error.response?.data || error.message);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: error.message || 'Failed to delete image',
            });
        } finally {
            setUploading(false);
        }
    };

    const renderImageItem = ({ item }: { item: any }) => {
        const imageId = item._id || item.id;
        const isLoading = imageLoadingStates[imageId];
        const hasError = imageErrorStates[imageId];
        const imageUrl = getFullImageUrl(item);

        return (
            <TouchableOpacity
                style={styles.imageContainer}
                onPress={() => handleImagePress(item)}
                activeOpacity={0.8}
            >
                {isLoading && (
                    <View style={styles.imageLoadingContainer}>
                        <ActivityIndicator size="small" color={theme.colors.primary} />
                    </View>
                )}
                
                {hasError ? (
                    <View style={styles.imageErrorContainer}>
                        <Text style={styles.imageErrorText}>Failed to load</Text>
                        <TouchableOpacity
                            style={styles.retryButton}
                            onPress={() => {
                                setImageErrorStates(prev => ({ ...prev, [imageId]: false }));
                                setImageLoadingStates(prev => ({ ...prev, [imageId]: true }));
                            }}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.retryButtonText}>Retry</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <Image
                        source={{ uri: imageUrl }}
                        style={styles.image}
                        resizeMode="cover"
                        onLoadStart={() => handleImageLoadStart(imageId)}
                        onLoadEnd={() => handleImageLoadEnd(imageId)}
                        onError={() => handleImageError(imageId)}
                    />
                )}
                
                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteImage(imageId)}
                    activeOpacity={0.8}
                >
                    <Text style={styles.deleteButtonText}>×</Text>
                </TouchableOpacity>
            </TouchableOpacity>
        );
    };

    const handleImagePress = (image: any) => {
        const imageIndex = images.findIndex(img => (img._id || img.id) === (image._id || image.id));
        if (imageIndex !== -1) {
            setCurrentImageIndex(imageIndex);
            setViewerVisible(true);
        }
    };

    const renderAddImageButton = () => {
        const isEmptyState = images.length === 0;
        
        return (
            <TouchableOpacity
                style={[styles.addImageContainer, isEmptyState && styles.addImageContainerEmpty]}
                onPress={handleAddImage}
                activeOpacity={0.8}
            >
                <Text style={[styles.addImageIcon, isEmptyState && styles.addImageIconEmpty]}>+</Text>
                <Text style={[styles.addImageText, isEmptyState && styles.addImageTextEmpty]}>
                    {isEmptyState ? 'Add Your First Property Image' : 'Add Image'}
                </Text>
                {isEmptyState && (
                    <Text style={styles.addImageSubtext}>
                        Tap to select from gallery or take a photo
                    </Text>
                )}
            </TouchableOpacity>
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
                    data={images.length === 0 ? [{ _id: 'add', isAddButton: true }] : [...images, { _id: 'add', isAddButton: true }]}
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

            {/* Full Screen Image Viewer Modal */}
            <Modal
                visible={viewerVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setViewerVisible(false)}
            >
                <StatusBar hidden />
                <View style={styles.viewerContainer}>
                    {/* Header */}
                    <View style={styles.viewerHeader}>
                        <TouchableOpacity
                            style={styles.viewerCloseButton}
                            onPress={() => setViewerVisible(false)}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.viewerCloseText}>✕</Text>
                        </TouchableOpacity>
                        <View style={styles.viewerTitleContainer}>
                            <Text style={styles.viewerTitle}>
                                {currentImageIndex + 1} of {images.length}
                            </Text>
                        </View>
                        <TouchableOpacity
                            style={styles.viewerDeleteButton}
                            onPress={() => {
                                const currentImage = images[currentImageIndex];
                                setViewerVisible(false);
                                handleDeleteImage(currentImage._id || currentImage.id);
                            }}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.viewerDeleteText}>🗑️</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Image */}
                    <View style={styles.viewerImageContainer}>
                        {images[currentImageIndex] && (
                            <>
                                {imageLoadingStates[images[currentImageIndex]._id || images[currentImageIndex].id] && (
                                    <View style={styles.viewerImageLoading}>
                                        <ActivityIndicator size="large" color="white" />
                                        <Text style={styles.viewerImageLoadingText}>Loading image...</Text>
                                    </View>
                                )}
                                
                                {imageErrorStates[images[currentImageIndex]._id || images[currentImageIndex].id] ? (
                                    <View style={styles.viewerImageError}>
                                        <Text style={styles.viewerImageErrorText}>Failed to load image</Text>
                                        <TouchableOpacity
                                            style={styles.viewerRetryButton}
                                            onPress={() => {
                                                const imageId = images[currentImageIndex]._id || images[currentImageIndex].id;
                                                setImageErrorStates(prev => ({ ...prev, [imageId]: false }));
                                                setImageLoadingStates(prev => ({ ...prev, [imageId]: true }));
                                            }}
                                            activeOpacity={0.8}
                                        >
                                            <Text style={styles.viewerRetryButtonText}>Retry</Text>
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <Image
                                        source={{ uri: getFullImageUrl(images[currentImageIndex]) }}
                                        style={styles.viewerImage}
                                        resizeMode="contain"
                                        onLoadStart={() => handleImageLoadStart(images[currentImageIndex]._id || images[currentImageIndex].id)}
                                        onLoadEnd={() => handleImageLoadEnd(images[currentImageIndex]._id || images[currentImageIndex].id)}
                                        onError={() => handleImageError(images[currentImageIndex]._id || images[currentImageIndex].id)}
                                    />
                                )}
                            </>
                        )}
                    </View>

                    {/* Navigation Controls */}
                    {images.length > 1 && (
                        <View style={styles.viewerNavigation}>
                            <TouchableOpacity
                                style={[styles.navButton, currentImageIndex === 0 && styles.navButtonDisabled]}
                                onPress={() => {
                                    if (currentImageIndex > 0) {
                                        setCurrentImageIndex(currentImageIndex - 1);
                                    }
                                }}
                                activeOpacity={0.8}
                                disabled={currentImageIndex === 0}
                            >
                                <Text style={[styles.navButtonText, currentImageIndex === 0 && styles.navButtonTextDisabled]}>
                                    ‹
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.navButton, currentImageIndex === images.length - 1 && styles.navButtonDisabled]}
                                onPress={() => {
                                    if (currentImageIndex < images.length - 1) {
                                        setCurrentImageIndex(currentImageIndex + 1);
                                    }
                                }}
                                activeOpacity={0.8}
                                disabled={currentImageIndex === images.length - 1}
                            >
                                <Text style={[styles.navButtonText, currentImageIndex === images.length - 1 && styles.navButtonTextDisabled]}>
                                    ›
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}
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
    imageLoadingContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
    },
    imageErrorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        borderRadius: 8,
    },
    imageErrorText: {
        fontSize: 12,
        color: theme.colors.onSurface,
        opacity: 0.7,
        marginBottom: 8,
    },
    retryButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: theme.colors.primary,
        borderRadius: 4,
    },
    retryButtonText: {
        fontSize: 12,
        color: theme.colors.onPrimary,
        fontWeight: '500',
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
    addImageContainerEmpty: {
        width: width - 32, // Full width minus padding
        height: 200, // Fixed height for empty state
        margin: 16,
        borderRadius: 12,
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
    addImageIconEmpty: {
        fontSize: 48,
        color: theme.colors.primary,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    addImageText: {
        fontSize: 12,
        color: theme.colors.primary,
        marginTop: 4,
        fontWeight: '500',
    },
    addImageTextEmpty: {
        fontSize: 18,
        color: theme.colors.primary,
        fontWeight: '600',
        textAlign: 'center',
    },
    addImageSubtext: {
        fontSize: 14,
        color: theme.colors.onSurface,
        opacity: 0.7,
        marginTop: 8,
        textAlign: 'center',
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
    // Full Screen Viewer Styles
    viewerContainer: {
        flex: 1,
        backgroundColor: 'black',
    },
    viewerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        paddingTop: Platform.OS === 'ios' ? 50 : 15,
    },
    viewerCloseButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    viewerCloseText: {
        fontSize: 20,
        color: 'white',
        fontWeight: 'bold',
    },
    viewerTitleContainer: {
        flex: 1,
        alignItems: 'center',
    },
    viewerTitle: {
        fontSize: 16,
        color: 'white',
        fontWeight: '500',
    },
    viewerDeleteButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 59, 48, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    viewerDeleteText: {
        fontSize: 16,
    },
    viewerImageContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    viewerImage: {
        width: width,
        height: height * 0.7,
    },
    viewerImageLoading: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    viewerImageLoadingText: {
        marginTop: 16,
        fontSize: 16,
        color: 'white',
    },
    viewerImageError: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    viewerImageErrorText: {
        fontSize: 18,
        color: 'white',
        marginBottom: 20,
    },
    viewerRetryButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: theme.colors.primary,
        borderRadius: 8,
    },
    viewerRetryButtonText: {
        fontSize: 16,
        color: theme.colors.onPrimary,
        fontWeight: '500',
    },
    viewerNavigation: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 30,
        paddingBottom: 40,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
    },
    navButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    navButtonDisabled: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    navButtonText: {
        fontSize: 24,
        color: 'white',
        fontWeight: 'bold',
    },
    navButtonTextDisabled: {
        color: 'rgba(255, 255, 255, 0.3)',
    },
});

export default PropertyImageScreen;
