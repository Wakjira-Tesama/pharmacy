import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, ActivityIndicator } from 'react-native';
import api from '../config/api';
import CustomDatePicker from '../components/CustomDatePicker';

const PERIODS = [
  { id: 'DAILY', label: 'Daily' },
  { id: 'WEEKLY', label: 'Weekly' },
  { id: 'MONTHLY', label: 'Monthly' },
];

const formatDay = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const displayDay = (value) => {
  const [y, m, d] = String(value).split('-');
  return `${m}/${d}/${y}`;
};

const shortRange = (from, to) => {
  const left = String(from).slice(5).replace('-', '-');
  const right = String(to).slice(5);
  return `${left} – ${right}`;
};

const compact = (value) => {
  const num = Number(value) || 0;
  const sign = num < 0 ? '-' : '';
  const abs = Math.abs(num);
  if (abs >= 1000000) return `${sign}${(abs / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
  if (abs >= 1000) return `${sign}${(abs / 1000).toFixed(abs >= 10000 ? 0 : 1).replace(/\.0$/, '')}k`;
  return `${sign}${Math.round(abs)}`;
};

const money = (value) => {
  const num = Number(value) || 0;
  return num.toLocaleString('en-US', { maximumFractionDigits: 2 });
};

const rangeFor = (period) => {
  const to = new Date();
  to.setHours(0, 0, 0, 0);
  if (period === 'WEEKLY') {
    const from = new Date(to);
    from.setDate(from.getDate() - 6);
    return { from, to };
  }
  if (period === 'MONTHLY') {
    return { from: new Date(to.getFullYear(), to.getMonth(), 1), to };
  }
  return { from: new Date(to), to };
};

const ReportChart = ({ purchase, selling, balance, net, from, to }) => {
  const bars = [
    { label: 'Purchase', value: Number(purchase) || 0, color: '#f97316' },
    { label: 'Selling', value: Number(selling) || 0, color: '#16a34a' },
    { label: 'Balance', value: Number(balance) || 0, color: '#2563eb' },
    { label: 'Net', value: Number(net) || 0, color: '#7c3aed' },
  ];
  const peak = Math.max(...bars.map((bar) => Math.abs(bar.value)), 1);
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Purchase, selling, balance, net</Text>
      <View style={styles.chartPlot}>
        <View style={styles.yAxis}>
          {[peak, peak / 2, 0].map((tick) => (
            <Text key={tick} style={styles.yLabel}>{compact(tick)}</Text>
          ))}
        </View>
        <View style={styles.plotArea}>
          <View style={styles.barsRow}>
            {bars.map((bar) => (
              <View key={bar.label} style={styles.barColumn}>
                <Text style={[styles.barValue, { color: bar.color }]}>{compact(bar.value)}</Text>
                <View style={styles.barTrack}>
                  <View style={[styles.bar, { height: `${(Math.abs(bar.value) / peak) * 100}%`, backgroundColor: bar.color }]} />
                </View>
                <Text style={styles.barLabel}>{bar.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
      <Text style={styles.rangeLabel}>{shortRange(from, to)}</Text>
      <View style={styles.legendRow}>
        {bars.map((bar) => (
          <View key={bar.label} style={styles.legendItem}>
            <View style={[styles.swatch, { backgroundColor: bar.color }]} />
            <Text style={[styles.legendText, { color: bar.color }]}>{bar.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

export default function ReportScreen() {
  const initial = rangeFor('DAILY');
  const [period, setPeriod] = useState('DAILY');
  const [fromDate, setFromDate] = useState(initial.from);
  const [toDate, setToDate] = useState(initial.to);
  const [picker, setPicker] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadReport = async (from, to) => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/reports/period', {
        params: { from: formatDay(from), to: formatDay(to) },
      });
      if (response.data.success) setReport(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load the report.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport(fromDate, toDate);
  }, []);

  const selectPeriod = (next) => {
    const range = rangeFor(next);
    setPeriod(next);
    setFromDate(range.from);
    setToDate(range.to);
    loadReport(range.from, range.to);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.kicker}>BEZA PHARMACY</Text>
        <Text style={styles.title}>Reports</Text>
        <Text style={styles.subtitle}>Sales, stock sold, and money spent</Text>

        <View style={styles.tabs}>
          {PERIODS.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.tab, period === item.id && styles.tabActive]}
              onPress={() => selectPeriod(item.id)}
            >
              <Text style={[styles.tabText, period === item.id && styles.tabTextActive]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.card}>
          <View style={styles.dateRow}>
            <TouchableOpacity style={styles.dateBox} onPress={() => setPicker('from')}>
              <Text style={styles.dateCaption}>From</Text>
              <Text style={styles.dateValue}>{displayDay(formatDay(fromDate))}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dateBox} onPress={() => setPicker('to')}>
              <Text style={styles.dateCaption}>To</Text>
              <Text style={styles.dateValue}>{displayDay(formatDay(toDate))}</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.applyBtn} onPress={() => loadReport(fromDate, toDate)}>
            <Text style={styles.applyText}>Apply</Text>
          </TouchableOpacity>
        </View>

        {loading ? <ActivityIndicator color="#ef4444" style={{ marginTop: 24 }} /> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {report && !loading ? (
          <>
            <ReportChart
              purchase={report.summary.purchase}
              selling={report.summary.selling}
              balance={report.summary.balance}
              net={report.summary.net}
              from={report.from}
              to={report.to}
            />

            <Text style={styles.section}>Period summary</Text>
            <View style={styles.card}>
              <View style={styles.tableRow}>
                <Text style={styles.th}>Purchase</Text>
                <Text style={styles.th}>Selling</Text>
                <Text style={styles.th}>Balance</Text>
                <Text style={styles.th}>Net</Text>
              </View>
              <View style={[styles.tableRow, styles.totalRow]}>
                <Text style={[styles.td, { color: '#f97316' }]}>{money(report.summary.purchase)}</Text>
                <Text style={[styles.td, { color: '#16a34a' }]}>{money(report.summary.selling)}</Text>
                <Text style={[styles.td, { color: '#2563eb' }]}>{money(report.summary.balance)}</Text>
                <Text style={[styles.td, { color: '#7c3aed' }]}>{money(report.summary.net)}</Text>
              </View>
            </View>

            <Text style={styles.section}>Daily records</Text>
            <View style={styles.card}>
              <ScrollView horizontal showsHorizontalScrollIndicator nestedScrollEnabled>
                <View style={styles.dailyTable}>
                  <View style={styles.dailyRow}>
                    <View style={styles.dateCell}><Text style={styles.th} numberOfLines={1}>Date</Text></View>
                    <View style={styles.dayCell}><Text style={styles.th} numberOfLines={1}>Purchase</Text></View>
                    <View style={styles.dayCell}><Text style={styles.th} numberOfLines={1}>Selling</Text></View>
                    <View style={styles.dayCell}><Text style={styles.th} numberOfLines={1}>Balance</Text></View>
                    <View style={styles.dayCell}><Text style={styles.th} numberOfLines={1}>Expense</Text></View>
                    <View style={styles.dayCell}><Text style={styles.th} numberOfLines={1}>Expired</Text></View>
                    <View style={styles.dayCell}><Text style={styles.th} numberOfLines={1}>Net</Text></View>
                  </View>
                  {report.days.map((row) => (
                    <View key={row.date} style={styles.dailyRow}>
                      <View style={styles.dateCell}><Text style={styles.td} numberOfLines={1}>{row.date.slice(5)}</Text></View>
                      <View style={styles.dayCell}><Text style={[styles.td, { color: '#f97316' }]} numberOfLines={1}>{compact(row.purchase)}</Text></View>
                      <View style={styles.dayCell}><Text style={[styles.td, { color: '#16a34a' }]} numberOfLines={1}>{compact(row.selling)}</Text></View>
                      <View style={styles.dayCell}><Text style={[styles.td, { color: '#2563eb' }]} numberOfLines={1}>{compact(row.balance)}</Text></View>
                      <View style={styles.dayCell}><Text style={[styles.td, { color: '#ef4444' }]} numberOfLines={1}>{compact(row.expense)}</Text></View>
                      <View style={styles.dayCell}><Text style={[styles.td, { color: '#b45309' }]} numberOfLines={1}>{compact(row.expiredCost)}</Text></View>
                      <View style={styles.dayCell}><Text style={[styles.td, { color: '#7c3aed' }]} numberOfLines={1}>{compact(row.net)}</Text></View>
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>

            <Text style={styles.section}>What was sold</Text>
            <View style={styles.card}>
              {report.sold.length === 0 ? <Text style={styles.empty}>Nothing was sold in this period.</Text> : report.sold.map((item) => (
                <View key={item.name} style={styles.line}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.lineTitle}>{item.name}</Text>
                    <Text style={styles.lineMeta}>{item.quantity} sold</Text>
                  </View>
                  <Text style={styles.lineAmount}>{money(item.total)} ETB</Text>
                </View>
              ))}
            </View>

            <Text style={styles.section}>What was spent</Text>
            <View style={styles.card}>
              {report.spent.length === 0 ? <Text style={styles.empty}>No expenses in this period.</Text> : report.spent.map((item, index) => (
                <View key={`${item.type}-${item.date}-${index}`} style={styles.line}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.lineTitle}>{item.type}</Text>
                    <Text style={styles.lineMeta}>{item.frequency} · {item.date}{item.description ? ` · ${item.description}` : ''}</Text>
                  </View>
                  <Text style={[styles.lineAmount, { color: '#ef4444' }]}>{money(item.applied)} ETB</Text>
                </View>
              ))}
            </View>
          </>
        ) : null}
      </ScrollView>

      <CustomDatePicker
        visible={picker !== null}
        date={picker === 'to' ? toDate : fromDate}
        onCancel={() => setPicker(null)}
        onConfirm={(date) => {
          if (picker === 'to') setToDate(date);
          else setFromDate(date);
          setPicker(null);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingBottom: 40 },
  kicker: { color: '#ef4444', fontWeight: '800', fontSize: 12, letterSpacing: 0.6 },
  title: { fontSize: 28, fontWeight: '800', color: '#0f172a', marginTop: 4 },
  subtitle: { color: '#64748b', marginTop: 4, marginBottom: 16 },
  tabs: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, padding: 6, marginBottom: 12 },
  tab: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  tabActive: { backgroundColor: '#ef4444' },
  tabText: { color: '#334155', fontWeight: '700' },
  tabTextActive: { color: '#fff' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12 },
  dateRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dateBox: { width: '48%', backgroundColor: '#f8fafc', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  dateCaption: { color: '#94a3b8', fontSize: 12, marginBottom: 4 },
  dateValue: { color: '#0f172a', fontWeight: '700' },
  applyBtn: { marginTop: 12, alignSelf: 'flex-start', backgroundColor: '#ef4444', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 28 },
  applyText: { color: '#fff', fontWeight: '800' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 12 },
  chartPlot: { flexDirection: 'row', height: 210 },
  yAxis: { width: 42, justifyContent: 'space-between', paddingBottom: 22 },
  yLabel: { fontSize: 11, color: '#94a3b8', textAlign: 'right' },
  plotArea: { flex: 1, marginLeft: 8 },
  barsRow: { flex: 1, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end' },
  barColumn: { alignItems: 'center', width: 64, height: '100%', justifyContent: 'flex-end' },
  barValue: { fontSize: 12, fontWeight: '700', marginBottom: 6 },
  barTrack: { height: 140, width: 28, justifyContent: 'flex-end' },
  bar: { width: 28, borderTopLeftRadius: 6, borderTopRightRadius: 6 },
  barLabel: { marginTop: 8, fontSize: 12, color: '#64748b', fontWeight: '600' },
  rangeLabel: { textAlign: 'center', color: '#94a3b8', marginTop: 8 },
  legendRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 8 },
  swatch: { width: 12, height: 12, borderRadius: 2, marginRight: 6 },
  legendText: { fontWeight: '700', fontSize: 13 },
  section: { fontSize: 18, fontWeight: '800', color: '#0f172a', marginTop: 8, marginBottom: 8 },
  tableRow: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  totalRow: { backgroundColor: '#f0fdf4', borderRadius: 8, paddingHorizontal: 6 },
  th: { flex: 1, fontSize: 11, color: '#94a3b8', fontWeight: '700' },
  td: { flex: 1, fontSize: 12, color: '#334155', fontWeight: '600' },
  dailyTable: { width: 640 },
  dailyRow: { flexDirection: 'row', width: 640, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  dateCell: { width: 72, flexGrow: 0, flexShrink: 0 },
  dayCell: { width: 94, flexGrow: 0, flexShrink: 0, paddingRight: 8 },
  line: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  lineTitle: { fontWeight: '700', color: '#0f172a' },
  lineMeta: { color: '#64748b', fontSize: 12, marginTop: 2 },
  lineAmount: { fontWeight: '800', color: '#16a34a' },
  empty: { color: '#94a3b8', textAlign: 'center', paddingVertical: 8 },
  error: { color: '#ef4444', marginVertical: 8 },
});
