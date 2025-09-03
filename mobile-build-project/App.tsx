import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TextInput,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

type Screen = 'home' | 'dashboard' | 'camera' | 'profile' | 'settings' | 'login';

interface User {
  id: string;
  name: string;
  email: string;
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [user, setUser] = useState<User | null>(null);

  // Home Screen
  const HomeScreen = () => (
    <ScrollView style={styles.screen}>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Mobile Builder Pro</Text>
        <Text style={styles.heroSubtitle}>Build amazing cross-platform mobile apps</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>50+</Text>
          <Text style={styles.statLabel}>Features</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>iOS</Text>
          <Text style={styles.statLabel}>& Android</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>100%</Text>
          <Text style={styles.statLabel}>Native</Text>
        </View>
      </View>

      <View style={styles.featuresGrid}>
        <TouchableOpacity style={styles.featureCard} onPress={() => setCurrentScreen('dashboard')}>
          <Ionicons name="analytics" size={32} color="#667eea" />
          <Text style={styles.featureTitle}>Dashboard</Text>
          <Text style={styles.featureDesc}>View analytics and metrics</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.featureCard} onPress={() => setCurrentScreen('camera')}>
          <Ionicons name="camera" size={32} color="#f093fb" />
          <Text style={styles.featureTitle}>Camera</Text>
          <Text style={styles.featureDesc}>Capture photos and videos</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.featureCard} onPress={() => setCurrentScreen('profile')}>
          <Ionicons name="person" size={32} color="#4facfe" />
          <Text style={styles.featureTitle}>Profile</Text>
          <Text style={styles.featureDesc}>Manage your account</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.featureCard} onPress={() => setCurrentScreen('settings')}>
          <Ionicons name="settings" size={32} color="#43e97b" />
          <Text style={styles.featureTitle}>Settings</Text>
          <Text style={styles.featureDesc}>Configure preferences</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  // Dashboard Screen
  const DashboardScreen = () => (
    <ScrollView style={styles.screen}>
      <Text style={styles.screenTitle}>Dashboard</Text>
      
      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <Ionicons name="people" size={24} color="#667eea" />
          <Text style={styles.metricNumber}>12,453</Text>
          <Text style={styles.metricLabel}>Total Users</Text>
          <Text style={styles.metricChange}>+12%</Text>
        </View>
        
        <View style={styles.metricCard}>
          <Ionicons name="pulse" size={24} color="#f093fb" />
          <Text style={styles.metricNumber}>8,921</Text>
          <Text style={styles.metricLabel}>Active Sessions</Text>
          <Text style={styles.metricChange}>+8%</Text>
        </View>
        
        <View style={styles.metricCard}>
          <Ionicons name="trending-up" size={24} color="#4facfe" />
          <Text style={styles.metricNumber}>$45,210</Text>
          <Text style={styles.metricLabel}>Revenue</Text>
          <Text style={styles.metricChange}>+15%</Text>
        </View>
        
        <View style={styles.metricCard}>
          <Ionicons name="analytics" size={24} color="#43e97b" />
          <Text style={styles.metricNumber}>3.2%</Text>
          <Text style={styles.metricLabel}>Conversion</Text>
          <Text style={styles.metricChange}>-2%</Text>
        </View>
      </View>

      <View style={styles.chartPlaceholder}>
        <Ionicons name="bar-chart" size={48} color="#ccc" />
        <Text style={styles.placeholderText}>Interactive Charts</Text>
        <Text style={styles.placeholderSubtext}>Real charts available with react-native-chart-kit</Text>
      </View>
    </ScrollView>
  );

  // Camera Screen
  const CameraScreen = () => (
    <View style={styles.screen}>
      <Text style={styles.screenTitle}>Camera</Text>
      
      <View style={styles.cameraPlaceholder}>
        <Ionicons name="camera" size={80} color="#ccc" />
        <Text style={styles.placeholderText}>Camera View</Text>
        <Text style={styles.placeholderSubtext}>Full camera functionality with expo-camera</Text>
      </View>

      <View style={styles.cameraControls}>
        <TouchableOpacity style={styles.cameraButton}>
          <Ionicons name="camera" size={24} color="white" />
          <Text style={styles.cameraButtonText}>Take Photo</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.cameraButton}>
          <Ionicons name="videocam" size={24} color="white" />
          <Text style={styles.cameraButtonText}>Record Video</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.cameraButton}>
          <Ionicons name="images" size={24} color="white" />
          <Text style={styles.cameraButtonText}>Gallery</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Profile Screen  
  const ProfileScreen = () => (
    <ScrollView style={styles.screen}>
      <Text style={styles.screenTitle}>Profile</Text>
      
      <View style={styles.profileHeader}>
        <View style={styles.avatarPlaceholder}>
          <Ionicons name="person" size={40} color="white" />
        </View>
        <Text style={styles.profileName}>{user?.name || 'John Doe'}</Text>
        <Text style={styles.profileEmail}>{user?.email || 'john.doe@example.com'}</Text>
      </View>

      <View style={styles.profileStats}>
        <View style={styles.profileStat}>
          <Text style={styles.profileStatNumber}>12</Text>
          <Text style={styles.profileStatLabel}>Projects</Text>
        </View>
        <View style={styles.profileStat}>
          <Text style={styles.profileStatNumber}>1.2K</Text>
          <Text style={styles.profileStatLabel}>Followers</Text>
        </View>
        <View style={styles.profileStat}>
          <Text style={styles.profileStatNumber}>456</Text>
          <Text style={styles.profileStatLabel}>Following</Text>
        </View>
      </View>
    </ScrollView>
  );

  // Settings Screen
  const SettingsScreen = () => (
    <ScrollView style={styles.screen}>
      <Text style={styles.screenTitle}>Settings</Text>
      
      <View style={styles.settingsSection}>
        <Text style={styles.settingsSectionTitle}>App Preferences</Text>
        
        <TouchableOpacity style={styles.settingsItem}>
          <Ionicons name="notifications" size={20} color="#667eea" />
          <Text style={styles.settingsItemText}>Notifications</Text>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.settingsItem}>
          <Ionicons name="moon" size={20} color="#667eea" />
          <Text style={styles.settingsItemText}>Dark Mode</Text>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={styles.logoutButton}
        onPress={() => {
          setUser(null);
          Alert.alert('Logged Out', 'You have been logged out successfully');
        }}
      >
        <Ionicons name="log-out" size={20} color="#ff4444" />
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  // Login Screen
  const LoginScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = () => {
      if (email && password) {
        setUser({ id: '1', name: 'John Doe', email: email });
        setCurrentScreen('home');
        Alert.alert('Success', 'Welcome back!');
      } else {
        Alert.alert('Error', 'Please fill in all fields');
      }
    };

    return (
      <ScrollView style={styles.screen}>
        <View style={styles.loginHeader}>
          <Text style={styles.loginTitle}>Welcome Back</Text>
          <Text style={styles.loginSubtitle}>Sign in to continue</Text>
        </View>

        <View style={styles.loginForm}>
          <View style={styles.inputContainer}>
            <Ionicons name="mail" size={20} color="#666" />
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed" size={20} color="#666" />
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };

  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 'home': return <HomeScreen />;
      case 'dashboard': return <DashboardScreen />;
      case 'camera': return <CameraScreen />;
      case 'profile': return <ProfileScreen />;
      case 'settings': return <SettingsScreen />;
      case 'login': return <LoginScreen />;
      default: return <HomeScreen />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      
      <View style={styles.header}>
        {currentScreen !== 'home' && (
          <TouchableOpacity style={styles.backButton} onPress={() => setCurrentScreen('home')}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
        )}
        
        <Text style={styles.headerTitle}>
          {currentScreen === 'home' ? 'Mobile Builder Pro' : 
           currentScreen.charAt(0).toUpperCase() + currentScreen.slice(1)}
        </Text>

        {currentScreen === 'home' && (
          <TouchableOpacity style={styles.loginHeaderButton} onPress={() => setCurrentScreen('login')}>
            <Ionicons name="person-circle" size={24} color="#333" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.content}>
        {renderCurrentScreen()}
      </View>

      {currentScreen !== 'home' && currentScreen !== 'login' && (
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem} onPress={() => setCurrentScreen('dashboard')}>
            <Ionicons name="analytics" size={24} color={currentScreen === 'dashboard' ? '#667eea' : '#ccc'} />
            <Text style={[styles.navText, currentScreen === 'dashboard' && styles.navTextActive]}>Dashboard</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.navItem} onPress={() => setCurrentScreen('camera')}>
            <Ionicons name="camera" size={24} color={currentScreen === 'camera' ? '#667eea' : '#ccc'} />
            <Text style={[styles.navText, currentScreen === 'camera' && styles.navTextActive]}>Camera</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.navItem} onPress={() => setCurrentScreen('profile')}>
            <Ionicons name="person" size={24} color={currentScreen === 'profile' ? '#667eea' : '#ccc'} />
            <Text style={[styles.navText, currentScreen === 'profile' && styles.navTextActive]}>Profile</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.navItem} onPress={() => setCurrentScreen('settings')}>
            <Ionicons name="settings" size={24} color={currentScreen === 'settings' ? '#667eea' : '#ccc'} />
            <Text style={[styles.navText, currentScreen === 'settings' && styles.navTextActive]}>Settings</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', flex: 1, textAlign: 'center' },
  loginHeaderButton: { padding: 8 },
  content: { flex: 1 },
  screen: { flex: 1, padding: 20 },
  screenTitle: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 20 },
  hero: { alignItems: 'center', paddingVertical: 40 },
  heroTitle: { fontSize: 32, fontWeight: 'bold', color: '#333', textAlign: 'center', marginBottom: 10 },
  heroSubtitle: { fontSize: 18, color: '#666', textAlign: 'center' },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 30 },
  statCard: { backgroundColor: 'white', padding: 20, borderRadius: 12, alignItems: 'center', flex: 1, marginHorizontal: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  statNumber: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  statLabel: { fontSize: 12, color: '#666', marginTop: 4 },
  featuresGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  featureCard: { backgroundColor: 'white', padding: 20, borderRadius: 12, alignItems: 'center', width: (width - 56) / 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  featureTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginTop: 12, marginBottom: 8 },
  featureDesc: { fontSize: 12, color: '#666', textAlign: 'center' },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  metricCard: { backgroundColor: 'white', padding: 16, borderRadius: 12, width: (width - 56) / 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  metricNumber: { fontSize: 20, fontWeight: 'bold', color: '#333', marginTop: 8 },
  metricLabel: { fontSize: 12, color: '#666', marginTop: 4 },
  metricChange: { fontSize: 12, color: '#43e97b', marginTop: 4, fontWeight: '600' },
  chartPlaceholder: { backgroundColor: 'white', padding: 40, borderRadius: 12, alignItems: 'center', marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  placeholderText: { fontSize: 18, color: '#666', marginTop: 16 },
  placeholderSubtext: { fontSize: 14, color: '#999', textAlign: 'center', marginTop: 8 },
  cameraPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white', borderRadius: 12, margin: 20 },
  cameraControls: { flexDirection: 'row', gap: 12, padding: 20 },
  cameraButton: { flex: 1, backgroundColor: '#667eea', padding: 16, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  cameraButtonText: { color: 'white', fontSize: 14, fontWeight: '600' },
  profileHeader: { alignItems: 'center', marginBottom: 30 },
  avatarPlaceholder: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#667eea', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  profileName: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  profileEmail: { fontSize: 16, color: '#666' },
  profileStats: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: 'white', padding: 20, borderRadius: 12, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  profileStat: { alignItems: 'center' },
  profileStatNumber: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  profileStatLabel: { fontSize: 12, color: '#666', marginTop: 4 },
  settingsSection: { backgroundColor: 'white', borderRadius: 12, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  settingsSectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  settingsItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  settingsItemText: { flex: 1, fontSize: 16, color: '#333', marginLeft: 12 },
  logoutButton: { backgroundColor: 'white', padding: 16, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  logoutButtonText: { fontSize: 16, color: '#ff4444', fontWeight: '600' },
  loginHeader: { alignItems: 'center', paddingVertical: 40 },
  loginTitle: { fontSize: 28, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  loginSubtitle: { fontSize: 16, color: '#666' },
  loginForm: { gap: 16 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 16, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  input: { flex: 1, fontSize: 16, marginLeft: 12, color: '#333' },
  loginButton: { backgroundColor: '#667eea', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  loginButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  bottomNav: { flexDirection: 'row', backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#e0e0e0', paddingBottom: 20, paddingTop: 10 },
  navItem: { flex: 1, alignItems: 'center', paddingTop: 8 },
  navText: { fontSize: 12, color: '#ccc', marginTop: 4 },
  navTextActive: { color: '#667eea' },
});