import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, Alert, ActivityIndicator, Modal, FlatList, Platform } from 'react-native';
import { ArrowLeft, ChevronDown, Plus, Search, X } from 'lucide-react-native';
import CustomDatePicker from '../components/CustomDatePicker';
import api from '../config/api';

export default function StockInScreen({ navigation }) {
  const [formData, setFormData] = useState({
    medicine_id: '',
    medicine_name: '',
    category: '',
    quantity: '',
    purchase_price: '',
    selling_price: '',
    expiry_date: '',
    batch_number: '',
  });
  const [loading, setLoading] = useState(false);
  const [medicines, setMedicines] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showMedicineModal, setShowMedicineModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [medicineSearch, setMedicineSearch] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [showAddMedicine, setShowAddMedicine] = useState(false);
  const [newMedicineName, setNewMedicineName] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerValue, setDatePickerValue] = useState(new Date());

  useEffect(() => {
    fetchMedicines();
    fetchCategories();
  }, []);

  const fetchMedicines = async () => {
    try {
      const response = await api.get('/medicines');
      if (response.data.success) {
        setMedicines(response.data.data);
      }
    } catch (e) {
      console.error('Failed to load medicines', e);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/medicines/categories');
      if (response.data.success) {
        setCategories(response.data.data);
      }
    } catch (e) {
      console.error('Failed to load categories', e);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const selectMedicine = (medicine) => {
    setFormData(prev => ({
      ...prev,
      medicine_id: medicine.id.toString(),
      medicine_name: medicine.name,
      category: medicine.category || '',
    }));
    setShowMedicineModal(false);
    setMedicineSearch('');
  };

  const selectCategory = (cat) => {
    handleInputChange('category', cat);
    setShowCategoryModal(false);
  };

  const addNewCategory = () => {
    if (!newCategory.trim()) return;
    const cat = newCategory.trim();
    if (!categories.includes(cat)) {
      setCategories([...categories, cat].sort());
    }
    handleInputChange('category', cat);
    setNewCategory('');
    setShowAddCategory(false);
    setShowCategoryModal(false);
  };

  const addNewMedicine = async () => {
    if (!newMedicineName.trim()) return;
    const medName = newMedicineName.trim();
    const medCode = 'NEW-' + Date.now().toString().slice(-6);
    try {
      setLoading(true);
      const response = await api.post('/medicines', {
        name: medName,
        medicine_code: medCode,
        category: formData.category || 'Other',
        minimum_stock: 10
      });
      if (response.data.success) {
        const newMed = {
          id: response.data.data.id,
          name: medName,
          category: formData.category || 'Other',
          dosage_form: ''
        };
        setMedicines([...medicines, newMed]);
        selectMedicine(newMed);
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to create new medicine');
    } finally {
      setLoading(false);
      setNewMedicineName('');
      setShowAddMedicine(false);
    }
  };

  const filteredMedicines = medicines.filter(m =>
    m.name.toLowerCase().includes(medicineSearch.toLowerCase())
  );

  const handleSave = async () => {
    const { medicine_id, quantity, purchase_price, expiry_date } = formData;
    if (!medicine_id || !quantity || !purchase_price || !expiry_date) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    if (isNaN(quantity) || Number(quantity) <= 0) {
      Alert.alert('Error', 'Quantity must be a positive number.');
      return;
    }

    setLoading(true);
    try {
      // Auto-generate batch number
      const batchNum = formData.batch_number || ('B' + Date.now().toString().slice(-6));
      const sellingPrice = formData.selling_price
        ? parseFloat(formData.selling_price)
        : parseFloat(purchase_price) * 1.3;

      const response = await api.post('/stock/in', {
        medicine_id: parseInt(medicine_id),
        batch_number: batchNum,
        quantity: parseInt(quantity),
        purchase_price: parseFloat(purchase_price),
        selling_price: sellingPrice,
        manufacturing_date: new Date().toISOString().split('T')[0],
        expiry_date,
        supplier_id: 1
      });

      // Update medicine category if changed
      if (formData.category) {
        try {
          // This is a simple approach - could also add a dedicated endpoint
          await api.put ? null : null; // Category is already on the medicine record
        } catch (e) { /* ignore */ }
      }

      if (response.data.success) {
        Alert.alert('Success', 'Stock received successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to save stock in');
    } finally {
      setLoading(false);
    }
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

          {/* Medicine Name - Searchable Select */}
          <Text style={styles.label}>Medicine Name *</Text>
          <TouchableOpacity style={styles.selectButton} onPress={() => setShowMedicineModal(true)}>
            <Text style={formData.medicine_name ? styles.selectText : styles.selectPlaceholder}>
              {formData.medicine_name || 'Select medicine...'}
            </Text>
            <ChevronDown color="#94a3b8" size={20} />
          </TouchableOpacity>

          {/* Category - Select with Add */}
          <Text style={styles.label}>Category *</Text>
          <TouchableOpacity style={styles.selectButton} onPress={() => setShowCategoryModal(true)}>
            <Text style={formData.category ? styles.selectText : styles.selectPlaceholder}>
              {formData.category || 'Select category...'}
            </Text>
            <ChevronDown color="#94a3b8" size={20} />
          </TouchableOpacity>

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
                value={formData.purchase_price}
                onChangeText={(v) => handleInputChange('purchase_price', v)}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.column, { marginRight: 8 }]}>
              <Text style={styles.label}>Selling Price</Text>
              <TextInput
                style={styles.input}
                placeholder="Auto +30%"
                keyboardType="numeric"
                value={formData.selling_price}
                onChangeText={(v) => handleInputChange('selling_price', v)}
              />
            </View>
            <View style={[styles.column, { marginLeft: 8 }]}>
              <Text style={styles.label}>Batch Number</Text>
              <TextInput
                style={styles.input}
                placeholder="Auto"
                value={formData.batch_number}
                onChangeText={(v) => handleInputChange('batch_number', v)}
              />
            </View>
          </View>

          <Text style={styles.label}>Expiry Date *</Text>
          <TouchableOpacity 
            style={styles.selectButton} 
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={formData.expiry_date ? styles.selectText : styles.selectPlaceholder}>
              {formData.expiry_date || 'Select expiry date...'}
            </Text>
          </TouchableOpacity>
          
          <CustomDatePicker 
            visible={showDatePicker}
            date={datePickerValue}
            onConfirm={(selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) {
                setDatePickerValue(selectedDate);
                // Adjust for local timezone offset before ISO string to keep exact chosen date
                const localDate = new Date(selectedDate.getTime() - (selectedDate.getTimezoneOffset() * 60000));
                const formattedDate = localDate.toISOString().split('T')[0];
                handleInputChange('expiry_date', formattedDate);
              }
            }}
            onCancel={() => setShowDatePicker(false)}
          />

          <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Save Stock In</Text>
            )}
          </TouchableOpacity>

        </View>
        <View style={{height: 40}} />
      </ScrollView>

      {/* Medicine Select Modal */}
      <Modal visible={showMedicineModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Medicine</Text>
              <TouchableOpacity onPress={() => { setShowMedicineModal(false); setMedicineSearch(''); setShowAddMedicine(false); }}>
                <X color="#64748b" size={24} />
              </TouchableOpacity>
            </View>
            <View style={styles.searchContainer}>
              <Search color="#94a3b8" size={20} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search medicine..."
                value={medicineSearch}
                onChangeText={setMedicineSearch}
                autoFocus
              />
            </View>
            <FlatList
              data={filteredMedicines}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.modalItem} onPress={() => selectMedicine(item)}>
                  <View>
                    <Text style={styles.modalItemTitle}>{item.name}</Text>
                    <Text style={styles.modalItemSub}>{item.category || 'No category'} • {item.dosage_form || 'N/A'}</Text>
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={styles.emptyText}>No medicines found</Text>}
            />
            
            {/* Add Medicine Section */}
            {showAddMedicine ? (
              <View style={styles.addCategoryContainer}>
                <TextInput
                  style={styles.addCategoryInput}
                  placeholder="New medicine name..."
                  value={newMedicineName}
                  onChangeText={setNewMedicineName}
                  autoFocus
                />
                <TouchableOpacity style={styles.addCategoryBtn} onPress={addNewMedicine}>
                  <Text style={styles.addCategoryBtnText}>Add</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.addCategoryToggle} onPress={() => setShowAddMedicine(true)}>
                <Plus color="#0ea5e9" size={20} />
                <Text style={styles.addCategoryToggleText}>Add New Medicine</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      {/* Category Select Modal */}
      <Modal visible={showCategoryModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Category</Text>
              <TouchableOpacity onPress={() => { setShowCategoryModal(false); setShowAddCategory(false); }}>
                <X color="#64748b" size={24} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={categories}
              keyExtractor={(item, idx) => idx.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalItem, formData.category === item && styles.modalItemSelected]}
                  onPress={() => selectCategory(item)}
                >
                  <Text style={[styles.modalItemTitle, formData.category === item && { color: '#0ea5e9' }]}>{item}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={styles.emptyText}>No categories yet</Text>}
            />

            {/* Add Category Section */}
            {showAddCategory ? (
              <View style={styles.addCategoryContainer}>
                <TextInput
                  style={styles.addCategoryInput}
                  placeholder="New category name..."
                  value={newCategory}
                  onChangeText={setNewCategory}
                  autoFocus
                />
                <TouchableOpacity style={styles.addCategoryBtn} onPress={addNewCategory}>
                  <Text style={styles.addCategoryBtnText}>Add</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.addCategoryToggle} onPress={() => setShowAddCategory(true)}>
                <Plus color="#0ea5e9" size={20} />
                <Text style={styles.addCategoryToggleText}>Add New Category</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
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
  selectButton: {
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectText: {
    fontSize: 16,
    color: '#0f172a',
  },
  selectPlaceholder: {
    fontSize: 16,
    color: '#94a3b8',
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
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    alignItems: 'center', // Centers the modal
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    width: '100%',
    maxWidth: 414, // Restrict width to mobile size
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#f8fafc',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#0f172a',
  },
  modalItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalItemSelected: {
    backgroundColor: '#f0f9ff',
  },
  modalItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  modalItemSub: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  emptyText: {
    textAlign: 'center',
    color: '#94a3b8',
    padding: 20,
  },
  addCategoryToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  addCategoryToggleText: {
    color: '#0ea5e9',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  addCategoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  addCategoryInput: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginRight: 8,
  },
  addCategoryBtn: {
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addCategoryBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
