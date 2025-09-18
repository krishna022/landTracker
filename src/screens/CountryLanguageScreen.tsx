import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  FlatList,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../store/ThemeContext';
import { useThemedStyles } from '../hooks/useThemedStyles';
import { useTranslation } from '../utils/translations';
import { usePreferences } from '../store/PreferencesContext';
import { apiService } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Country {
  _id: string;
  id: number;
  name: string;
  code: string;
  flag?: string;
}

interface Language {
  code: string;
  name: string;
  nativeName: string;
}

const languages: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
];

const CountryLanguageScreen: React.FC = () => {
  const navigation = useNavigation();
  const { state: themeState } = useTheme();
  const theme = themeState.theme;
  const { t } = useTranslation();
  const { setCountry, setLanguage } = usePreferences();

  const [countries, setCountries] = useState<Country[]>([]);
  const [filteredCountries, setFilteredCountries] = useState<Country[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(languages[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [languageSearchQuery, setLanguageSearchQuery] = useState('');
  const [filteredLanguages, setFilteredLanguages] = useState<Language[]>(languages);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);

  const styles = useThemedStyles((theme: any) => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      flex: 1,
      padding: 24,
      justifyContent: 'center',
    },
    header: {
      alignItems: 'center',
      marginBottom: 40,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: theme.colors.onBackground,
      marginBottom: 8,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 16,
      color: theme.colors.onSurface,
      textAlign: 'center',
      opacity: 0.8,
      lineHeight: 22,
    },
    section: {
      marginBottom: 32,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.onSurface,
      marginBottom: 16,
    },
    countrySelector: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.colors.outline,
    },
    countryText: {
      fontSize: 16,
      color: theme.colors.onSurface,
    },
    placeholderText: {
      fontSize: 16,
      color: theme.colors.onSurfaceVariant,
    },
    languageSelector: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.colors.outline,
    },
    languageText: {
      fontSize: 16,
      color: theme.colors.onSurface,
    },
    languageItem: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outline,
    },
    languageItemLast: {
      borderBottomWidth: 0,
    },
    languageName: {
      fontSize: 16,
      color: theme.colors.onSurface,
      fontWeight: '500',
    },
    languageNative: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      marginTop: 2,
    },
    selectedLanguage: {
      backgroundColor: theme.colors.primaryContainer,
    },
    selectedLanguageText: {
      color: theme.colors.onPrimaryContainer,
    },
    continueButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: 12,
      paddingVertical: 18,
      alignItems: 'center',
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 5,
    },
    continueButtonText: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.onPrimary,
    },
    disabledButton: {
      backgroundColor: theme.colors.outline,
    },
    buttonContainer: {
      marginTop: 40,
      gap: 12,
    },
    helperText: {
      fontSize: 14,
      color: theme.colors.error || '#dc3545',
      textAlign: 'center',
      opacity: 0.8,
    },
    statusContainer: {
      marginBottom: 20,
      paddingHorizontal: 20,
    },
    statusText: {
      fontSize: 14,
      textAlign: 'center',
      fontWeight: '500',
    },
    statusReady: {
      color: theme.colors.primary,
    },
    statusPending: {
      color: theme.colors.onSurfaceVariant,
    },
    // Modal styles
    modalContainer: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outline,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.colors.onSurface,
    },
    closeButton: {
      padding: 8,
    },
    closeButtonText: {
      fontSize: 16,
      color: theme.colors.primary,
      fontWeight: '500',
    },
    searchInput: {
      margin: 20,
      padding: 12,
      borderRadius: 8,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.outline,
      fontSize: 16,
      color: theme.colors.onSurface,
    },
    countryItem: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outline,
    },
    countryItemText: {
      fontSize: 16,
      color: theme.colors.onSurface,
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
  }));

  useEffect(() => {
    loadCountries();
  }, []);

  useEffect(() => {
    if (countries.length > 0) {
      filterCountries(searchQuery);
    }
  }, [countries, searchQuery]);

  useEffect(() => {
    filterLanguages(languageSearchQuery);
  }, [languageSearchQuery]);

  const loadCountries = async () => {
    try {
      setLoading(true);
      const data = await apiService.locations.getCountries();
      if (data && Array.isArray(data)) {
        setCountries(data);
        setFilteredCountries(data);
      }
    } catch (error) {
      console.error('Error loading countries:', error);
      Alert.alert(t('error'), 'Failed to load countries');
    } finally {
      setLoading(false);
    }
  };

  const filterCountries = (query: string) => {
    if (!query.trim()) {
      setFilteredCountries(countries);
    } else {
      const filtered = countries.filter(country =>
        country.name.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredCountries(filtered);
    }
  };

  const filterLanguages = (query: string) => {
    if (!query.trim()) {
      setFilteredLanguages(languages);
    } else {
      const filtered = languages.filter(language =>
        language.name.toLowerCase().includes(query.toLowerCase()) ||
        language.nativeName.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredLanguages(filtered);
    }
  };

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    setModalVisible(false);
    setSearchQuery('');
  };

  const handleLanguageSelect = (language: Language) => {
    setSelectedLanguage(language);
    setLanguageModalVisible(false);
    setLanguageSearchQuery('');
  };

    const handleContinue = async () => {
    if (!selectedCountry) {
      Alert.alert(t('error'), t('countryRequired'));
      return;
    }

    if (!selectedLanguage) {
      Alert.alert(t('error'), 'Please select a language');
      return;
    }

    setSaving(true);
    try {
      console.log('Saving preferences:', { country: selectedCountry, language: selectedLanguage });

      // Update the context first
      await setCountry(selectedCountry);
      await setLanguage(selectedLanguage);

      // Also save to AsyncStorage for persistence
      const preferences = {
        country: selectedCountry,
        language: selectedLanguage,
        timestamp: Date.now(),
        isInitialized: true,
      };

      await AsyncStorage.setItem('user_preferences', JSON.stringify(preferences));

      Alert.alert(
        t('success'),
        `Preferences saved! Country: ${selectedCountry.name}, Language: ${selectedLanguage.nativeName}`,
        [
          {
            text: 'OK',
            onPress: () => {
              console.log('Navigating to Auth screen...');
              // Simple navigation - the AppNavigator will handle the logic based on updated preferences
              navigation.navigate('Auth' as never);
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error saving preferences:', error);
      Alert.alert(t('error'), 'Failed to save preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const renderCountryItem = ({ item }: { item: Country }) => (
    <TouchableOpacity
      style={styles.countryItem}
      onPress={() => handleCountrySelect(item)}
    >
      <Text style={styles.countryItemText}>
        {item.flag && `${item.flag} `}{item.name}
      </Text>
    </TouchableOpacity>
  );

  const renderLanguageItem = ({ item }: { item: Language }) => (
    <TouchableOpacity
      style={styles.languageItem}
      onPress={() => handleLanguageSelect(item)}
    >
      <Text style={styles.languageName}>
        {item.name}
      </Text>
      <Text style={styles.languageNative}>
        {item.nativeName}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('welcome')} to LandTracker</Text>
          <Text style={styles.subtitle}>
            Please select your country and preferred language to continue
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('selectCountry')}</Text>
          <TouchableOpacity
            style={styles.countrySelector}
            onPress={() => setModalVisible(true)}
          >
            <Text style={selectedCountry ? styles.countryText : styles.placeholderText}>
              {selectedCountry ? `${selectedCountry.flag || ''} ${selectedCountry.name}` : t('chooseCountry')}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('selectLanguage')}</Text>
          <TouchableOpacity
            style={styles.languageSelector}
            onPress={() => setLanguageModalVisible(true)}
          >
            <Text style={selectedLanguage ? styles.languageText : styles.placeholderText}>
              {selectedLanguage ? `${selectedLanguage.name} (${selectedLanguage.nativeName})` : 'Choose your language'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Continue Button - Always visible at bottom */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              (!selectedCountry || saving) && styles.disabledButton
            ]}
            onPress={handleContinue}
            disabled={!selectedCountry || saving}
          >
            <Text style={styles.continueButtonText}>
              {saving ? t('loading') : t('continue')}
            </Text>
          </TouchableOpacity>

          {/* Status indicator */}
        <View style={styles.statusContainer}>
          <Text style={[
            styles.statusText,
            selectedCountry && selectedLanguage ? styles.statusReady : styles.statusPending
          ]}>
            {selectedCountry && selectedLanguage
              ? `✅ Ready to continue with ${selectedCountry.name} and ${selectedLanguage.nativeName}`
              : '⚠️ Please select both country and language to continue'
            }
          </Text>
        </View>
        </View>
      </View>

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('selectCountry')}</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>{t('close')}</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.searchInput}
            placeholder={t('searchCountries')}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.loadingText}>{t('loading')} countries...</Text>
            </View>
          ) : (
            <FlatList
              data={filteredCountries}
              keyExtractor={(item) => item._id}
              renderItem={renderCountryItem}
            />
          )}
        </SafeAreaView>
      </Modal>

      <Modal
        visible={languageModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('selectLanguage')}</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setLanguageModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>{t('close')}</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.searchInput}
            placeholder="Search languages..."
            value={languageSearchQuery}
            onChangeText={setLanguageSearchQuery}
          />

          <FlatList
            data={filteredLanguages}
            keyExtractor={(item) => item.code}
            renderItem={renderLanguageItem}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

export default CountryLanguageScreen;
