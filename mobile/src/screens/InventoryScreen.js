import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, SafeAreaView } from 'react-native';
import { Package, AlertTriangle } from 'lucide-react-native';

const MOCK_INVENTORY = [
  { id: '1', name: 'Paracetamol 500mg', batch: 'B001', stock: 150, minStock: 50, expiry: '2026-10-10' },
  { id: '2', name: 'Amoxicillin 500mg', batch: 'B004', stock: 20, minStock: 30, expiry: '2026-10-20' }, // Low stock
  { id: '3', name: 'Ibuprofen 400mg', batch: 'B008', stock: 45, minStock: 40, expiry: '2026-10-01' }, // Expiring soon
  { id: '4', name: 'Omeprazole 20mg', batch: 'B012', stock: 0, minStock: 20, expiry: '2025-01-01' }, // Expired & Out of stock
];

export default function InventoryScreen() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredInventory = MOCK_INVENTORY.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.batch.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatus = (item) => {
    const today = new Date('2026-09-22');
    const expiryDate = new Date(item.expiry);
    const timeDiff = expiryDate.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

    if (daysDiff < 0) return { label: 'Expired', color: '#ef4444' };
    if (item.stock === 0) return { label: 'Out of Stock', color: '#ef4444' };
    if (daysDiff <= 30) return { label: 'Expiring Soon', color: '#f97316' };
    if (item.stock <= item.minStock) return { label: 'Low Stock', color: '#f59e0b' };
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
            <Text style={styles.infoValue}>{item.batch}</Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Stock</Text>
            <Text style={[styles.infoValue, item.stock <= item.minStock && { color: '#f59e0b' }]}>
              {item.stock}
            </Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Expiry</Text>
            <Text style={styles.infoValue}>{item.expiry}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Inventory & Stock</Text>
      </View>

      <View style={styles.content}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or batch..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        <FlatList
          data={filteredInventory}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No medicines found.</Text>
          }
        />
      </View>
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
    marginBottom: 16,
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
  }
});
