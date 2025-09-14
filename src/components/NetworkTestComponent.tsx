import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import axios from 'axios';

const NetworkTestComponent: React.FC = () => {
  const testNetworkRequest = async () => {
    try {
      console.log('🧪 Testing network request...');
      
      // Test GET request
      const response = await axios.get('http://10.0.2.2:3000/api/test', {
        timeout: 5000,
      });
      
      console.log('✅ Test request successful:', response.data);
    } catch (error: any) {
      console.error('❌ Test request failed:', error.message);
      
      // Also test a simple fetch to see if it's an axios issue
      try {
        const fetchResponse = await fetch('http://10.0.2.2:3000/api/test');
        const fetchData = await fetchResponse.text();
        console.log('✅ Fetch test successful:', fetchData);
      } catch (fetchError: any) {
        console.error('❌ Fetch test also failed:', fetchError.message);
      }
    }
  };

  const testLocalRequest = async () => {
    try {
      console.log('🧪 Testing local API request...');
      
      // Test with a known endpoint
      const response = await axios.post('http://10.0.2.2:3000/api/auth/test', {
        test: 'data'
      });
      
      console.log('✅ Local test successful:', response.data);
    } catch (error: any) {
      console.error('❌ Local test failed:', error.message);
      console.error('Error details:', error.response?.data || error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Network Test</Text>
      <TouchableOpacity style={styles.button} onPress={testNetworkRequest}>
        <Text style={styles.buttonText}>Test GET Request</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={testLocalRequest}>
        <Text style={styles.buttonText}>Test POST Request</Text>
      </TouchableOpacity>
      <Text style={styles.instructions}>
        Open Chrome DevTools Console to see network logs
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginVertical: 5,
    minWidth: 200,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  instructions: {
    marginTop: 20,
    textAlign: 'center',
    fontSize: 12,
    color: '#666',
  },
});

export default NetworkTestComponent;
