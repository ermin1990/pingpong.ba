import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Trophy, Users, Plus, LogOut } from 'lucide-react-native';
import { db } from '../firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';

const StatCard = ({ label, value, icon: Icon, color, onPress }) => (
  <TouchableOpacity style={styles.statCard} onPress={onPress}>
    <View style={styles.statIconContainer}>
      <Icon color={color} size={24} />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </TouchableOpacity>
);

const DashboardScreen = ({ navigation }) => {
  const { userData, user, logout } = useAuth();
  const [stats, setStats] = useState({ players: 0, competitions: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!userData || !user) return;

      try {
        let playersQ, compsQ;
        
        if (userData.role === 'super_admin') {
          playersQ = query(collection(db, "players"));
          compsQ = query(collection(db, "competitions"));
        } else {
          playersQ = query(collection(db, "players"), where("ownerUid", "==", user.uid));
          compsQ = query(collection(db, "competitions"), where("ownerUid", "==", user.uid));
        }
        
        const [playersSnap, compsSnap] = await Promise.all([
          getDocs(playersQ),
          getDocs(compsQ)
        ]);

        setStats({
          players: playersSnap.size,
          competitions: compsSnap.size,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [userData, user]);

  const handleLogout = async () => {
    await logout();
    navigation.replace('Home');
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Zdravo, {userData?.displayName || 'Korisnik'}</Text>
            <Text style={styles.roleText}>
              Uloga: {userData?.role === 'super_admin' ? 'Super Admin' : 'Organizator'}
            </Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <LogOut color="#ef4444" size={20} />
          </TouchableOpacity>
        </View>

        <View style={styles.statsGrid}>
          <StatCard 
            label="Ukupno Igrača" 
            value={stats.players} 
            icon={Users} 
            color="#3b82f6" 
            onPress={() => navigation.navigate('Players')}
          />
          <StatCard 
            label="Takmičenja" 
            value={stats.competitions} 
            icon={Trophy} 
            color="#eab308" 
            onPress={() => navigation.navigate('Competitions')}
          />
        </View>

        <View style={styles.actionSection}>
          <Text style={styles.sectionTitle}>Brze Akcije</Text>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('CreateCompetition')}
          >
            <Plus color="white" size={20} />
            <Text style={styles.actionButtonText}>Novo Takmičenje</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.secondaryAction]}>
            <Plus color="white" size={20} />
            <Text style={styles.actionButtonText}>Nova Liga</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070b14',
  },
  scrollContent: {
    padding: 20,
  },
  center: {
    flex: 1,
    backgroundColor: '#070b14',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  roleText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  logoutButton: {
    padding: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  statCard: {
    backgroundColor: '#1e293b',
    padding: 20,
    borderRadius: 16,
    width: '48%',
    borderWidth: 1,
    borderColor: '#334155',
  },
  statIconContainer: {
    backgroundColor: '#0f172a',
    padding: 10,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 15,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    color: '#94a3b8',
    fontSize: 12,
  },
  actionSection: {
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  actionButton: {
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  secondaryAction: {
    backgroundColor: '#059669',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 10,
    fontSize: 16,
  }
});

export default DashboardScreen;
