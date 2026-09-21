import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { AuthContext } from '../context/AuthContext';

const screenWidth = Dimensions.get('window').width;

const StatCard = ({ title, value, color }) => (
  <View style={[styles.card, { borderLeftColor: color, borderLeftWidth: 4 }]}>
    <Text style={styles.cardTitle}>{title}</Text>
    <Text style={[styles.cardValue, { color }]}>{value}</Text>
  </View>
);

export default function AdminDashboard() {
  const { logout, user } = useContext(AuthContext);

  // Mock data for charts
  const financeData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        data: [1200, 1900, 1500, 2200, 1800, 2500, 2100],
        color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`, // Income (Green)
        strokeWidth: 2,
      },
      {
        data: [400, 800, 600, 900, 500, 1100, 700],
        color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`, // Expense (Red)
        strokeWidth: 2,
      }
    ],
    legend: ['Income', 'Expense']
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <TouchableOpacity onPress={logout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.welcomeText}>Hello, {user?.name}</Text>
        
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.cardContainer}>
          <StatCard title="Total Medicines" value="124" color="#0ea5e9" />
          <StatCard title="Total Stock" value="4,520" color="#8b5cf6" />
          <StatCard title="Low Stock" value="8" color="#f59e0b" />
          <StatCard title="Expiring Soon" value="3" color="#f97316" />
          <StatCard title="Expired" value="1" color="#ef4444" />
        </View>

        <Text style={styles.sectionTitle}>Today's Finance</Text>
        <View style={styles.cardContainer}>
          <StatCard title="Income" value="2,100 ETB" color="#10b981" />
          <StatCard title="Expense" value="700 ETB" color="#ef4444" />
          <StatCard title="Balance" value="1,400 ETB" color="#3b82f6" />
        </View>

        <Text style={styles.sectionTitle}>Income vs Expense (This Week)</Text>
        <View style={styles.chartContainer}>
          <LineChart
            data={financeData}
            width={screenWidth - 32}
            height={220}
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(15, 23, 42, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
              style: {
                borderRadius: 16
              },
              propsForDots: {
                r: '4',
                strokeWidth: '2',
              }
            }}
            bezier
            style={{
              marginVertical: 8,
              borderRadius: 12
            }}
          />
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  logoutButton: {
    padding: 8,
  },
  logoutText: {
    color: '#ef4444',
    fontWeight: '600',
  },
  content: {
    padding: 16,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
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
  }
});
