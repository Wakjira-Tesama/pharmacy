import React, { useContext, useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Dimensions, ActivityIndicator, RefreshControl, Modal, FlatList } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { AuthContext } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { X } from 'lucide-react-native';
import api from '../config/api';

const screenWidth = Dimensions.get('window').width;

const StatCard = ({ title, value, color, onPress }) => (
  <TouchableOpacity onPress={onPress} style={[styles.card, { borderLeftColor: color, borderLeftWidth: 4 }]}>
    <Text style={styles.cardTitle}>{title}</Text>
    <Text style={[styles.cardValue, { color }]}>{value}</Text>
  </TouchableOpacity>
);

export default function AdminDashboard() {
  const { user } = useContext(AuthContext);
  const navigation = useNavigation();
  const [stats, setStats] = useState(null);
  const [finance, setFinance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showSalesModal, setShowSalesModal] = useState(false);
  const [salesList, setSalesList] = useState([]);
  const [salesLoading, setSalesLoading] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, financeRes] = await Promise.all([
        api.get('/reports/dashboard'),
        api.get('/finance/daily')
      ]);
      if (statsRes.data.success) setStats(statsRes.data.data);
      if (financeRes.data.success) setFinance(financeRes.data.data);
    } catch (error) {
      console.error('Failed to load dashboard data', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const openSalesModal = async () => {
    setShowSalesModal(true);
    setSalesLoading(true);
    try {
      const response = await api.get('/finance/income');
      if (response.data.success) {
        setSalesList(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load sales list', error);
    } finally {
      setSalesLoading(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboardData();
  }, []);

  // Mock data for charts
  const financeData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        data: [1200, 1900, 1500, 2200, 1800, 2500, 2100],
        color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
        strokeWidth: 2,
      },
      {
        data: [400, 800, 600, 900, 500, 1100, 700],
        color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`,
        strokeWidth: 2,
      }
    ],
    legend: ['Income', 'Expense']
  };

  if (loading) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0ea5e9']} />
        }
      >
        <View style={styles.titleContainer}>
          <Text style={styles.mainTitle}>Beza Pharmacy</Text>
        </View>

        <Text style={styles.sectionTitle}>Today's Sales</Text>
        <View style={styles.cardContainer}>
          <StatCard title="Sales Count" value={stats?.todaySalesCount || 0} color="#10b981" onPress={openSalesModal} />
          <StatCard title="Revenue" value={`${stats?.todaysRevenue || 0} ETB`} color="#10b981" onPress={openSalesModal} />
        </View>
        
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.cardContainer}>
          <StatCard title="Total Medicines" value={stats?.totalMedicines || 0} color="#0ea5e9" onPress={() => navigation.navigate('Inventory')} />
          <StatCard title="Total Stock" value={stats?.totalStock || 0} color="#8b5cf6" onPress={() => navigation.navigate('Inventory')} />
          <StatCard title="Low Stock" value={stats?.lowStock || 0} color="#f59e0b" onPress={() => navigation.navigate('Inventory', { filter: 'lowStock' })} />
          <StatCard title="Expiring Soon" value={stats?.expiringSoon || 0} color="#f97316" onPress={() => navigation.navigate('Inventory', { filter: 'expiringSoon' })} />
          <StatCard title="Expired" value={stats?.expired || 0} color="#ef4444" onPress={() => navigation.navigate('Inventory', { filter: 'expired' })} />
        </View>

        <Text style={styles.sectionTitle}>Today's Finance</Text>
        <View style={styles.cardContainer}>
          <StatCard title="Income" value={`${finance?.income || 0} ETB`} color="#10b981" onPress={() => navigation.navigate('Finance')} />
          <StatCard title="Expense" value={`${finance?.expense || 0} ETB`} color="#ef4444" onPress={() => navigation.navigate('Finance')} />
          <StatCard title="Balance" value={`${finance?.balance || 0} ETB`} color="#3b82f6" onPress={() => navigation.navigate('Finance')} />
        </View>

        <Text style={styles.sectionTitle}>Income vs Expense (This Week)</Text>
        <View style={styles.chartContainer}>
          <LineChart
            data={financeData}
            width={Math.min(screenWidth - 32, 380)}
            height={220}
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(15, 23, 42, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
              style: { borderRadius: 16 },
              propsForDots: { r: '4', strokeWidth: '2' }
            }}
            bezier
            style={{ marginVertical: 8, borderRadius: 12 }}
          />
        </View>
        <View style={{height: 40}} />
      </ScrollView>

      {/* Sales Modal */}
      <Modal visible={showSalesModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Recent Sales</Text>
              <TouchableOpacity onPress={() => setShowSalesModal(false)}>
                <X color="#64748b" size={24} />
              </TouchableOpacity>
            </View>
            
            {salesLoading ? (
              <ActivityIndicator size="large" color="#0ea5e9" style={{marginTop: 20}} />
            ) : (
              <FlatList
                data={salesList}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={{ padding: 16 }}
                renderItem={({ item }) => (
                  <View style={styles.saleItem}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.saleDesc}>{item.description}</Text>
                      <Text style={styles.saleDate}>{new Date(item.transaction_date || item.created_at).toLocaleString()}</Text>
                    </View>
                    <Text style={styles.saleAmount}>+{item.amount} ETB</Text>
                  </View>
                )}
                ListEmptyComponent={<Text style={{textAlign: 'center', color: '#94a3b8'}}>No sales found.</Text>}
              />
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  profileButton: {
    padding: 4,
  },
  dropdownMenu: {
    position: 'absolute',
    top: 40,
    right: 0,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 8,
    width: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    zIndex: 100,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  dropdownItemText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#334155',
    marginLeft: 12,
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 4,
  },
  content: {
    padding: 16,
  },
  titleContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0ea5e9',
    textShadowColor: 'rgba(14, 165, 233, 0.3)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 8,
    letterSpacing: 1,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 12,
    marginTop: 8,
  },
  cardContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  card: {
    width: '48%',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  cardValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  chartContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '70%',
    width: '100%',
    maxWidth: 414,
    alignSelf: 'center',
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
  saleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  saleDesc: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
  },
  saleDate: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  saleAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10b981',
  }
});
