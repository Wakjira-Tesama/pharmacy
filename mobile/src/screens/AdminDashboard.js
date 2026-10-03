import React, { useContext, useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, ActivityIndicator, RefreshControl, Modal, FlatList } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { X } from 'lucide-react-native';
import api from '../config/api';

const formatChartValue = (value) => {
  const num = Number(value) || 0;
  const sign = num < 0 ? '-' : '';
  const abs = Math.abs(num);
  if (abs >= 1000000) return `${sign}${(abs / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
  if (abs >= 1000) return `${sign}${(abs / 1000).toFixed(abs >= 10000 ? 0 : 1).replace(/\.0$/, '')}k`;
  return `${sign}${Math.round(abs)}`;
};

const DailyFinanceChart = ({ purchase, selling, balance, net }) => {
  const bars = [
    { label: 'Purchase', value: Number(purchase) || 0, color: '#f97316' },
    { label: 'Selling', value: Number(selling) || 0, color: '#16a34a' },
    { label: 'Balance', value: Number(balance) || 0, color: '#2563eb' },
    { label: 'Net', value: Number(net) || 0, color: '#7c3aed' },
  ];
  const peak = Math.max(...bars.map((bar) => Math.abs(bar.value)), 1);
  const ticks = [peak, peak / 2, 0];
  const today = new Date();
  const dateLabel = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}-${today.getFullYear()}`;

  return (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>Purchase, selling, balance, net</Text>
      <View style={styles.chartPlot}>
        <View style={styles.yAxis}>
          {ticks.map((tick) => (
            <Text key={tick} style={styles.yLabel}>{formatChartValue(tick)}</Text>
          ))}
        </View>
        <View style={styles.plotArea}>
          <View style={styles.gridLine} />
          <View style={[styles.gridLine, styles.gridMid]} />
          <View style={[styles.gridLine, styles.gridBase]} />
          <View style={styles.barsRow}>
            {bars.map((bar) => (
              <View key={bar.label} style={styles.barColumn}>
                <Text style={[styles.barValue, { color: bar.color }]}>{formatChartValue(bar.value)}</Text>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: `${Math.max((Math.abs(bar.value) / peak) * 100, bar.value === 0 ? 0 : 4)}%`,
                        backgroundColor: bar.color,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.barLabel}>{bar.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
      <Text style={styles.chartDate}>{dateLabel}</Text>
      <View style={styles.legendRow}>
        {bars.map((bar) => (
          <View key={bar.label} style={styles.legendItem}>
            <View style={[styles.legendSwatch, { backgroundColor: bar.color }]} />
            <Text style={[styles.legendText, { color: bar.color }]}>{bar.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

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
  const [chart, setChart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showSalesModal, setShowSalesModal] = useState(false);
  const [salesList, setSalesList] = useState([]);
  const [salesLoading, setSalesLoading] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const today = new Date();
      const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const [statsRes, financeRes] = await Promise.all([
        api.get('/reports/dashboard'),
        api.get('/finance/daily')
      ]);
      if (statsRes.data.success) setStats(statsRes.data.data);
      if (financeRes.data.success) setFinance(financeRes.data.data);
      try {
        const chartRes = await api.get('/reports/period', { params: { from: todayKey, to: todayKey } });
        if (chartRes.data.success) setChart(chartRes.data.data.summary);
      } catch (chartError) {
        console.error('Failed to load chart', chartError);
      }
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
          <StatCard title="Expired" value={`${Number(finance?.expiredCost || 0).toFixed(2)} ETB`} color="#ef4444" onPress={() => navigation.navigate('Inventory', { filter: 'expired' })} />
          <StatCard title="Stock left" value={`${Number(finance?.stockValue || 0).toFixed(2)} ETB`} color="#8b5cf6" onPress={() => navigation.navigate('Inventory')} />
          <StatCard title="Expense" value={`${Number(finance?.expense || 0).toFixed(2)} ETB`} color="#f97316" onPress={() => navigation.navigate('Finance')} />
        </View>

        <DailyFinanceChart
          purchase={chart?.purchase}
          selling={chart?.selling}
          balance={chart?.balance}
          net={chart?.net}
        />
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
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
  },
  chartPlot: {
    flexDirection: 'row',
    height: 220,
  },
  yAxis: {
    width: 42,
    justifyContent: 'space-between',
    paddingBottom: 22,
  },
  yLabel: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'right',
  },
  plotArea: {
    flex: 1,
    marginLeft: 8,
    position: 'relative',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 8,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  gridMid: {
    top: '46%',
  },
  gridBase: {
    top: undefined,
    bottom: 22,
  },
  barsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    paddingBottom: 0,
  },
  barColumn: {
    alignItems: 'center',
    width: 64,
    height: '100%',
    justifyContent: 'flex-end',
  },
  barValue: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  barTrack: {
    height: 150,
    width: 28,
    justifyContent: 'flex-end',
  },
  bar: {
    width: 28,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    minHeight: 0,
  },
  barLabel: {
    marginTop: 8,
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  chartDate: {
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 8,
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 14,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
    marginBottom: 4,
  },
  legendSwatch: {
    width: 12,
    height: 12,
    borderRadius: 2,
    marginRight: 6,
  },
  legendText: {
    fontSize: 13,
    fontWeight: '700',
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
