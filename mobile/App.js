import React from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <View style={styles.container}>
      <View style={Platform.OS === 'web' ? styles.webContainer : styles.mobileContainer}>
        <AuthProvider>
          <AppNavigator />
        </AuthProvider>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e5e7eb', // gray background for the laptop screen
    alignItems: 'center',
    justifyContent: 'center',
  },
  webContainer: {
    width: '100%',
    maxWidth: 414, // iPhone 11 Pro Max width
    height: '100%',
    maxHeight: 896,
    backgroundColor: '#fff',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  mobileContainer: {
    flex: 1,
    width: '100%',
  }
});
