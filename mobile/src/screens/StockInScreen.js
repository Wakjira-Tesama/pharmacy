import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, Alert } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';

export default function StockInScreen({ navigation }) {
  const [formData, setFormData] = useState({
    medicineName: '',
    batchNumber: '',
    quantity: '',
    purchasePrice: '',
    expiryDate: '',
    supplier: '',
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    const { medicineName, batchNumber, quantity, purchasePrice, expiryDate } = formData;
    if (!medicineName || !batchNumber || !quantity || !purchasePrice || !expiryDate) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }
    
    // Check for valid numbers
    if (isNaN(quantity) || Number(quantity) <= 0) {
      Alert.alert('Error', 'Quantity must be a positive number.');
      return;
    }
    
    if (isNaN(purchasePrice) || Number(purchasePrice) <= 0) {
      Alert.alert('Error', 'Purchase Price must be a positive number.');
      return;
    }

    // Since we're using mock data, just show success
    Alert.alert('Success', 'Stock received successfully!', [
      { text: 'OK', onPress: () => navigation.goBack() }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft color="#0f172a" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Receive Stock</Text>
        <View style={{width: 24}} /> 
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.formCard}>
          
          <Text style={styles.label}>Medicine Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Paracetamol 500mg"
            value={formData.medicineName}
            onChangeText={(v) => handleInputChange('medicineName', v)}
          />

          <Text style={styles.label}>Batch Number *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. B001"
            value={formData.batchNumber}
            onChangeText={(v) => handleInputChange('batchNumber', v)}
          />

          <View style={styles.row}>
            <View style={[styles.column, { marginRight: 8 }]}>
              <Text style={styles.label}>Quantity *</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                keyboardType="numeric"
                value={formData.quantity}
                onChangeText={(v) => handleInputChange('quantity', v)}
              />
            </View>
            <View style={[styles.column, { marginLeft: 8 }]}>
              <Text style={styles.label}>Purchase Price *</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                keyboardType="numeric"
                value={formData.purchasePrice}
                onChangeText={(v) => handleInputChange('purchasePrice', v)}
              />
            </View>
          </View>

          <Text style={styles.label}>Expiry Date (YYYY-MM-DD) *</Text>
          <TextInput
            style={styles.input}
            placeholder="2026-10-10"
            value={formData.expiryDate}
            onChangeText={(v) => handleInputChange('expiryDate', v)}
          />

          <Text style={styles.label}>Supplier</Text>
          <TextInput
            style={styles.input}
            placeholder="Supplier Name"
            value={formData.supplier}
            onChangeText={(v) => handleInputChange('supplier', v)}
          />

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save Stock In</Text>
          </TouchableOpacity>

        </View>
        <View style={{height: 40}} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  backButton: {
    padding: 4,
  },
  content: {
    padding: 16,
  },
  formCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  column: {
    flex: 1,
  },
  saveButton: {
    backgroundColor: '#10b981',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  }
});
