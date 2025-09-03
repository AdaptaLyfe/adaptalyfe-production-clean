import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Card } from 'react-native-paper';

export default function DashboardScreen() {
  const stats = [
    { title: 'Total Users', value: '1,234', icon: 'people' as const, color: '#667eea' },
    { title: 'Active Sessions', value: '89', icon: 'pulse' as const, color: '#f093fb' },
    { title: 'Revenue', value: '$12,345', icon: 'trending-up' as const, color: '#4facfe' },
    { title: 'Tasks Done', value: '156', icon: 'checkmark-circle' as const, color: '#43e97b' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Dashboard</Text>
          <Text style={styles.subtitle}>Welcome back! Here's your overview</Text>
        </View>

        <View style={styles.statsContainer}>
          {stats.map((stat, index) => (
            <TouchableOpacity key={index} style={styles.statCard}>
              <Card style={[styles.card, { borderLeftColor: stat.color }]}>
                <View style={styles.cardContent}>
                  <View style={styles.statInfo}>
                    <Text style={styles.statValue}>{stat.value}</Text>
                    <Text style={styles.statTitle}>{stat.title}</Text>
                  </View>
                  <View style={[styles.iconContainer, { backgroundColor: stat.color }]}>
                    <Ionicons name={stat.icon} size={24} color="white" />
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsContainer}>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="add-circle" size={24} color="#667eea" />
              <Text style={styles.actionText}>Add New Item</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="analytics" size={24} color="#667eea" />
              <Text style={styles.actionText}>View Analytics</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="notifications" size={24} color="#667eea" />
              <Text style={styles.actionText}>Notifications</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <Card style={styles.activityCard}>
            <View style={styles.activityItem}>
              <Ionicons name="person-add" size={20} color="#4facfe" />
              <Text style={styles.activityText}>New user registered</Text>
              <Text style={styles.activityTime}>2h ago</Text>
            </View>
            <View style={styles.activityItem}>
              <Ionicons name="checkmark-circle" size={20} color="#43e97b" />
              <Text style={styles.activityText}>Task completed</Text>
              <Text style={styles.activityTime}>4h ago</Text>
            </View>
            <View style={styles.activityItem}>
              <Ionicons name="trending-up" size={20} color="#f093fb" />
              <Text style={styles.activityText}>Revenue increased</Text>
              <Text style={styles.activityTime}>1d ago</Text>
            </View>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
    gap: 10,
  },
  statCard: {
    width: '48%',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    borderLeftWidth: 4,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  statInfo: {
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statTitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    padding: 20,
    paddingTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionText: {
    fontSize: 12,
    color: '#333',
    marginTop: 8,
    textAlign: 'center',
  },
  activityCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activityText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    marginLeft: 12,
  },
  activityTime: {
    fontSize: 12,
    color: '#666',
  },
});