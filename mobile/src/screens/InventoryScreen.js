import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, SafeAreaView, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import { Package, AlertTriangle } from 'lucide-react-native';
import api from '../config/api';

export default function InventoryScreen({ route }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');

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
  }
});
