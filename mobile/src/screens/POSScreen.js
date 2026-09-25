import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, Alert, FlatList, ActivityIndicator } from 'react-native';
import { ShoppingCart, Plus, Minus, Trash2 } from 'lucide-react-native';
import api from '../config/api';

export default function POSScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    const fetchInventory = async () => {
      try {
        const response = await api.get('/stock/inventory');
        if (response.data.success) {
          setInventory(response.data.data);
        }
      } catch (e) {
        console.error('Failed to load inventory for POS', e);
      }
    };
    fetchInventory();
  }, []);
  
  const filteredInventory = inventory.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addToCart = (medicine) => {
    const existing = cart.find(item => item.batch_id === medicine.batch_id);
    if (existing) {
      if (existing.quantity >= medicine.stock) {
        Alert.alert('Stock Limit', 'Cannot add more than available stock.');
        return;
      }
      setCart(cart.map(item => 
        item.batch_id === medicine.batch_id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, { ...medicine, quantity: 1 }]);
    }
  };

  const updateQuantity = (id, delta) => {
    setCart(cart.map(item => {
      if (item.batch_id === id) {
        const newQty = item.quantity + delta;
        if (newQty > 0 && newQty <= item.stock) {
          return { ...item, quantity: newQty };
        }
      }
      return item;
    }));
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.batch_id !== id));
  };

  const total = cart.reduce((sum, item) => sum + (item.selling_price * item.quantity), 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    
    setLoading(true);
    try {
      const saleItems = cart.map(item => ({
        batch_id: item.batch_id,
        quantity: item.quantity,
        unit_price: item.selling_price
      }));

      const response = await api.post('/sales', {
        items: saleItems,
        total_amount: total
      });

      if (response.data.success) {
        Alert.alert('Success', `Sale completed! Total: ${total} ETB`, [
          { text: 'OK', onPress: () => {
            setCart([]);
            setSearchQuery('');
            // Refresh inventory to get new stock counts
            const fetchInventory = async () => {
              try {
                const res = await api.get('/stock/inventory');
                if (res.data.success) {
                  setInventory(res.data.data);
                }
              } catch (e) {
                console.error('Failed to load inventory for POS', e);
              }
            };
            fetchInventory();
          }}
        ]);
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Checkout failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Point of Sale</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.searchSection}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search medicine by name..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <ScrollView 
              style={styles.searchResults} 
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled={true}
            >
              {filteredInventory.map(item => (
                <TouchableOpacity key={item.batch_id} style={styles.searchItem} onPress={() => {
                  addToCart(item);
                  setSearchQuery(''); // Clear search after adding to prevent clutter
                }}>
                  <View>
                    <Text style={styles.searchItemName}>{item.name}</Text>
                    <Text style={styles.searchItemSub}>Stock: {item.stock} | Price: {item.selling_price} ETB</Text>
                  </View>
                  <Plus color="#10b981" size={20} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        <Text style={styles.cartTitle}>Current Sale</Text>
        <FlatList
          data={cart}
          keyExtractor={item => item.batch_id.toString()}
          ListEmptyComponent={
            <Text style={styles.emptyCart}>Cart is empty. Add medicines to sell.</Text>
          }
          renderItem={({ item }) => (
            <View style={styles.cartItem}>
              <View style={styles.cartItemInfo}>
                <Text style={styles.cartItemName}>{item.name}</Text>
                <Text style={styles.cartItemPrice}>{item.selling_price} ETB x {item.quantity}</Text>
              </View>
              <View style={styles.cartItemControls}>
                <TouchableOpacity onPress={() => updateQuantity(item.batch_id, -1)} style={styles.qtyBtn}>
                  <Minus size={16} color="#475569" />
                </TouchableOpacity>
                <Text style={styles.qtyText}>{item.quantity}</Text>
                <TouchableOpacity onPress={() => updateQuantity(item.batch_id, 1)} style={styles.qtyBtn}>
                  <Plus size={16} color="#475569" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => removeFromCart(item.batch_id)} style={[styles.qtyBtn, { marginLeft: 8, backgroundColor: '#fee2e2' }]}>
                  <Trash2 size={16} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />

        <View style={styles.checkoutSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount:</Text>
            <Text style={styles.totalValue}>{total} ETB</Text>
          </View>
          <TouchableOpacity 
            style={[styles.checkoutBtn, (cart.length === 0 || loading) && styles.checkoutBtnDisabled]} 
            onPress={handleCheckout}
            disabled={cart.length === 0 || loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <ShoppingCart color="#fff" size={20} />}
            <Text style={styles.checkoutBtnText}>
              {loading ? 'Processing...' : 'Complete Sale'}
            </Text>
          </TouchableOpacity>
        </View>
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
  searchSection: {
    zIndex: 999, // High z-index
    elevation: 10,
    marginBottom: 20,
  },
  searchInput: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchResults: {
    position: 'absolute',
    top: 55,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    maxHeight: 250, // Added explicit maxHeight so it scrolls properly
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10, // Ensure shadow/elevation is high
  },
  searchItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  searchItemName: {
    fontWeight: '600',
    color: '#1e293b',
  },
  searchItemSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  cartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 12,
  },
  emptyCart: {
    textAlign: 'center',
    color: '#94a3b8',
    marginTop: 40,
    fontStyle: 'italic',
  },
  cartItem: {
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemName: {
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  cartItemPrice: {
    color: '#64748b',
    fontSize: 14,
  },
  cartItemControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qtyBtn: {
    backgroundColor: '#f1f5f9',
    padding: 6,
    borderRadius: 6,
  },
  qtyText: {
    width: 24,
    textAlign: 'center',
    fontWeight: '600',
    color: '#1e293b',
  },
  checkoutSection: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 16,
    color: '#64748b',
  },
  totalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0ea5e9',
  },
  checkoutBtn: {
    backgroundColor: '#10b981',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
  },
  checkoutBtnDisabled: {
    backgroundColor: '#94a3b8',
  },
  checkoutBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  }
});
