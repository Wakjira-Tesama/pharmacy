import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, SafeAreaView, ActivityIndicator, ScrollView, TouchableOpacity, Modal, Alert, Platform } from 'react-native';
import { Package } from 'lucide-react-native';
import api from '../config/api';
import { AuthContext } from '../context/AuthContext';
import CustomDatePicker from '../components/CustomDatePicker';

const toDay = (value) => {
  if (!value) return '';
  const text = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
};

export default function InventoryScreen({ route }) {
  const { user } = useContext(AuthContext);
  const isAdmin = user?.role === 'ADMIN';
  const [searchQuery, setSearchQuery] = useState('');
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const fetchInventory = async () => {
    try {
      const response = await api.get('/stock/inventory');
      if (response.data.success) {
        setInventory(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load inventory', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const startEdit = (item) => {
    setEditing(item);
    setEditForm({
      name: item.name || '',
      category: item.category || '',
      batch_number: item.batch_number || '',
      quantity: String(item.stock ?? ''),
      purchase_price: String(item.purchase_price ?? ''),
      selling_price: String(item.selling_price ?? ''),
      expiry_date: toDay(item.expiry_date),
    });
  };

  const saveEdit = async () => {
    if (!editForm?.name.trim() || !editForm.batch_number.trim() || !editForm.expiry_date) {
      Alert.alert('Missing details', 'Enter the name, batch, and expiry date.');
      return;
    }
    const quantity = Number(editForm.quantity);
    const purchase = Number(editForm.purchase_price);
    const selling = Number(editForm.selling_price);
    if (!(quantity >= 0) || !(purchase > 0) || !(selling > 0)) {
      Alert.alert('Missing details', 'Enter a stock quantity and prices greater than zero.');
      return;
    }
    setSaving(true);
    try {
      const response = await api.put(`/stock/batches/${editing.batch_id}`, {
        name: editForm.name.trim(),
        category: editForm.category.trim(),
        batch_number: editForm.batch_number.trim(),
        quantity,
        purchase_price: purchase,
        selling_price: selling,
        expiry_date: editForm.expiry_date,
      });
      if (response.data.success) {
        setEditing(null);
        setEditForm(null);
        await fetchInventory();
      }
    } catch (error) {
      Alert.alert('Could not save', error.response?.data?.message || 'Failed to update this medicine.');
    } finally {
      setSaving(false);
    }
  };

  const removeItem = (item) => {
    const run = async () => {
      try {
        const response = await api.delete(`/stock/batches/${item.batch_id}`);
        if (response.data.success) await fetchInventory();
      } catch (error) {
        Alert.alert('Could not delete', error.response?.data?.message || 'Failed to remove this medicine.');
      }
    };
    const message = `Remove ${item.name} from the store?`;
    if (Platform.OS === 'web') {
      if (window.confirm(message)) run();
      return;
    }
    Alert.alert('Delete medicine', message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: run },
    ]);
  };

  const categoriesCount = inventory.reduce((acc, item) => {
    const cat = item.category || 'Uncategorized';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});
  const categoriesList = ['All', ...Object.keys(categoriesCount)];

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.batch_number.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || (item.category || 'Uncategorized') === selectedCategory;
    
    let matchesStatus = true;
    if (route?.params?.filter === 'lowStock') {
      matchesStatus = item.stock <= item.minimum_stock;
    } else if (route?.params?.filter === 'expiringSoon') {
      const today = new Date();
      const expiryDate = new Date(item.expiry_date);
      const timeDiff = expiryDate.getTime() - today.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
      matchesStatus = daysDiff >= 0 && daysDiff <= 30;
    } else if (route?.params?.filter === 'expired') {
      const today = new Date();
      const expiryDate = new Date(item.expiry_date);
      matchesStatus = expiryDate < today;
    }

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStatus = (item) => {
    const today = new Date(); // Use actual today
    const expiryDate = new Date(item.expiry_date);
    const timeDiff = expiryDate.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

    if (daysDiff < 0) return { label: 'Expired', color: '#ef4444' };
    if (item.stock === 0) return { label: 'Out of Stock', color: '#ef4444' };
    if (daysDiff <= 30) return { label: 'Expiring Soon', color: '#f97316' };
    if (item.stock <= item.minimum_stock) return { label: 'Low Stock', color: '#f59e0b' };
    return { label: 'In Stock', color: '#10b981' };
  };

  const renderItem = ({ item }) => {
    const status = getStatus(item);
    
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.titleContainer}>
            <Package color="#64748b" size={20} style={{marginRight: 8}}/>
            <Text style={styles.itemName}>{item.name}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: status.color + '20' }]}>
            <Text style={[styles.badgeText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>
        
        <View style={styles.cardBody}>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Batch</Text>
            <Text style={styles.infoValue}>{item.batch_number}</Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Stock</Text>
            <Text style={[styles.infoValue, item.stock <= item.minimum_stock && { color: '#f59e0b' }]}>
              {item.stock}
            </Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Expiry</Text>
            <Text style={styles.infoValue}>{new Date(item.expiry_date).toLocaleDateString()}</Text>
          </View>
        </View>
        {isAdmin ? (
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.editBtn} onPress={() => startEdit(item)}>
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteBtn} onPress={() => removeItem(item)}>
              <Text style={styles.deleteBtnText}>Delete</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Inventory & Stock</Text>
        {route?.params?.filter && (
          <View style={styles.filterBadge}>
            <Text style={styles.filterBadgeText}>
              {route.params.filter === 'lowStock' ? '⚠️ Low Stock' : 
               route.params.filter === 'expiringSoon' ? '⏰ Expiring Soon' : 
               route.params.filter === 'expired' ? '❌ Expired' : 'Filtered'}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or batch..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        <View style={styles.categoryMenu}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
            {categoriesList.map(cat => (
              <TouchableOpacity 
                key={cat} 
                style={[styles.categoryChip, selectedCategory === cat && styles.categoryChipSelected]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text style={[styles.categoryChipText, selectedCategory === cat && styles.categoryChipTextSelected]}>
                  {cat} {cat !== 'All' ? `(${categoriesCount[cat]})` : `(${inventory.length})`}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <FlatList
          data={filteredInventory}
          keyExtractor={item => item.batch_id ? item.batch_id.toString() : Math.random().toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No medicines found.</Text>
          }
        />
      </View>

      <Modal visible={!!editing} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit medicine</Text>
            <ScrollView>
              <Text style={styles.fieldLabel}>Name</Text>
              <TextInput style={styles.fieldInput} value={editForm?.name} onChangeText={(value) => setEditForm((prev) => ({ ...prev, name: value }))} />
              <Text style={styles.fieldLabel}>Category</Text>
              <TextInput style={styles.fieldInput} value={editForm?.category} onChangeText={(value) => setEditForm((prev) => ({ ...prev, category: value }))} />
              <Text style={styles.fieldLabel}>Batch</Text>
              <TextInput style={styles.fieldInput} value={editForm?.batch_number} onChangeText={(value) => setEditForm((prev) => ({ ...prev, batch_number: value }))} />
              <Text style={styles.fieldLabel}>Stock</Text>
              <TextInput style={styles.fieldInput} keyboardType="numeric" value={editForm?.quantity} onChangeText={(value) => setEditForm((prev) => ({ ...prev, quantity: value }))} />
              <Text style={styles.fieldLabel}>Purchase price</Text>
              <TextInput style={styles.fieldInput} keyboardType="decimal-pad" value={editForm?.purchase_price} onChangeText={(value) => setEditForm((prev) => ({ ...prev, purchase_price: value }))} />
              <Text style={styles.fieldLabel}>Selling price</Text>
              <TextInput style={styles.fieldInput} keyboardType="decimal-pad" value={editForm?.selling_price} onChangeText={(value) => setEditForm((prev) => ({ ...prev, selling_price: value }))} />
              <Text style={styles.fieldLabel}>Expiry date</Text>
              <TouchableOpacity style={styles.fieldInput} onPress={() => setShowDatePicker(true)}>
                <Text style={styles.infoValue}>{editForm?.expiry_date || 'Select date'}</Text>
              </TouchableOpacity>
            </ScrollView>
            <TouchableOpacity style={styles.saveBtn} onPress={saveEdit} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => { setEditing(null); setEditForm(null); }}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <CustomDatePicker
        visible={showDatePicker}
        date={editForm?.expiry_date ? new Date(`${editForm.expiry_date}T12:00:00`) : new Date()}
        onConfirm={(selectedDate) => {
          setShowDatePicker(false);
          if (!selectedDate) return;
          const localDate = new Date(selectedDate.getTime() - (selectedDate.getTimezoneOffset() * 60000));
          setEditForm((prev) => ({ ...prev, expiry_date: localDate.toISOString().split('T')[0] }));
        }}
        onCancel={() => setShowDatePicker(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  filterBadge: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  filterBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#92400e',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  searchInput: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
  },
  categoryMenu: {
    marginBottom: 16,
  },
  categoryScroll: {
    paddingRight: 16,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  categoryChipSelected: {
    backgroundColor: '#0ea5e9',
    borderColor: '#0ea5e9',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  categoryChipTextSelected: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    flexShrink: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoCol: {
    alignItems: 'flex-start',
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  emptyText: {
    textAlign: 'center',
    color: '#94a3b8',
    marginTop: 40,
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: 14,
  },
  editBtn: {
    backgroundColor: '#e0f2fe',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginRight: 8,
  },
  editBtnText: {
    color: '#0369a1',
    fontWeight: '700',
  },
  deleteBtn: {
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  deleteBtnText: {
    color: '#b91c1c',
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modalCard: {
    width: '100%',
    maxWidth: 414,
    maxHeight: '88%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 6,
  },
  fieldInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    color: '#0f172a',
  },
  saveBtn: {
    backgroundColor: '#0ea5e9',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: '800',
  },
  cancelBtn: {
    alignItems: 'center',
    padding: 12,
  },
  cancelBtnText: {
    color: '#64748b',
    fontWeight: '700',
  },
});
