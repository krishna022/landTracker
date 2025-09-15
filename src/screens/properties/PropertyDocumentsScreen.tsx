import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { theme } from '../../utils/theme';
import { apiService } from '../../services/api';

interface RouteParams {
  propertyId: string;
  property: any;
}

interface Document {
  _id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedAt: string;
}

const PropertyDocumentsScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { propertyId, property } = route.params as RouteParams;

  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchPropertyDocuments();
  }, []);

  const fetchPropertyDocuments = async () => {
    try {
      setLoading(true);
      // For now, we'll use the property's documents array
      // In a real implementation, you might have a separate endpoint
      if (property && property.documents) {
        setDocuments(property.documents);
      } else {
        setDocuments([]);
      }
    } catch (error: any) {
      console.error('Error fetching documents:', error);
      Alert.alert('Error', 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDocument = () => {
    Alert.alert(
      'Add Document',
      'Choose an option',
      [
        { text: 'File Picker', onPress: () => openFilePicker() },
        { text: 'Camera', onPress: () => openCamera() },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const openFilePicker = () => {
    // TODO: Implement file picker functionality
    Alert.alert('Info', 'File picker functionality will be implemented');
  };

  const openCamera = () => {
    // TODO: Implement camera functionality for documents
    Alert.alert('Info', 'Camera functionality will be implemented');
  };

  const handleDeleteDocument = (documentId: string) => {
    Alert.alert(
      'Delete Document',
      'Are you sure you want to delete this document?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteDocument(documentId) },
      ]
    );
  };

  const deleteDocument = async (documentId: string) => {
    try {
      // TODO: Implement delete functionality
      Alert.alert('Info', 'Delete functionality will be implemented');
    } catch (error: any) {
      console.error('Error deleting document:', error);
      Alert.alert('Error', 'Failed to delete document');
    }
  };

  const handleViewDocument = async (document: Document) => {
    try {
      // Try to open the document URL
      const supported = await Linking.canOpenURL(document.url);
      if (supported) {
        await Linking.openURL(document.url);
      } else {
        Alert.alert('Error', 'Cannot open this document type');
      }
    } catch (error) {
      console.error('Error opening document:', error);
      Alert.alert('Error', 'Failed to open document');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getFileIcon = (mimeType: string): string => {
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('image')) return '🖼️';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return '📊';
    return '📄';
  };

  const renderDocumentItem = ({ item }: { item: Document }) => (
    <TouchableOpacity
      style={styles.documentItem}
      onPress={() => handleViewDocument(item)}
      activeOpacity={0.8}
    >
      <View style={styles.documentIcon}>
        <Text style={styles.documentIconText}>{getFileIcon(item.mimeType)}</Text>
      </View>

      <View style={styles.documentInfo}>
        <Text style={styles.documentName} numberOfLines={1}>
          {item.originalName || item.filename}
        </Text>
        <Text style={styles.documentDetails}>
          {formatFileSize(item.size)} • {formatDate(item.uploadedAt)}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteDocument(item._id)}
        activeOpacity={0.8}
      >
        <Text style={styles.deleteButtonText}>×</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderAddDocumentButton = () => (
    <TouchableOpacity
      style={styles.addDocumentContainer}
      onPress={handleAddDocument}
      activeOpacity={0.8}
    >
      <Text style={styles.addDocumentIcon}>+</Text>
      <Text style={styles.addDocumentText}>Add Document</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Property Documents</Text>
          <Text style={styles.subtitle}>
            {property?.title || property?.name || 'Property'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddDocument}
          activeOpacity={0.8}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading documents...</Text>
        </View>
      ) : documents.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📄</Text>
          <Text style={styles.emptyTitle}>No Documents</Text>
          <Text style={styles.emptyText}>
            Add documents related to this property
          </Text>
          {renderAddDocumentButton()}
        </View>
      ) : (
        <FlatList
          data={documents}
          renderItem={renderDocumentItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

      {uploading && (
        <View style={styles.uploadOverlay}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.uploadText}>Uploading document...</Text>
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
    color: theme.colors.primary,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.onSurface,
    opacity: 0.7,
    textAlign: 'center',
    marginBottom: 24,
  },
  listContainer: {
    padding: 16,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  documentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  documentIconText: {
    fontSize: 20,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: 4,
  },
  documentDetails: {
    fontSize: 12,
    color: theme.colors.onSurface,
    opacity: 0.7,
  },
  deleteButton: {
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
  addDocumentContainer: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: theme.colors.primaryContainer,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderStyle: 'dashed',
  },
  addDocumentIcon: {
    fontSize: 32,
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  addDocumentText: {
    fontSize: 14,
    color: theme.colors.primary,
    marginTop: 8,
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

export default PropertyDocumentsScreen;
