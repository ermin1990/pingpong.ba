import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, Dimensions } from 'react-native';
import { ShieldCheck, Trophy, Zap, ArrowRight, Activity, Users } from 'lucide-react-native';
import { db } from '../firebase/config';
import { collection, getDocs, query, where } from 'firebase/firestore';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const [stats, setStats] = useState({ tournaments: 0, leagues: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const q = query(collection(db, "competitions"), where("status", "==", "active"));
        const snap = await getDocs(q);
        const list = snap.docs.map(d => d.data());
        setStats({
          tournaments: list.filter(c => c.type !== 'League').length,
          leagues: list.filter(c => c.type === 'League').length
        });
      } catch (err) {
        console.error("Stats error:", err);
      }
    };
    fetchStats();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Trophy size={48} color="#3b82f6" />
          <Text style={styles.title}>Ping Pong BIH</Text>
          <Text style={styles.subtitle}>Sistem za upravljanje turnirima</Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Activity color="#3b82f6" size={24} />
            <Text style={styles.statValue}>{stats.tournaments}</Text>
            <Text style={styles.statLabel}>Aktivnih Turnira</Text>
          </View>
          <View style={styles.statCard}>
            <Users color="#6366f1" size={24} />
            <Text style={styles.statValue}>{stats.leagues}</Text>
            <Text style={styles.statLabel}>Aktivnih Liga</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.ctaButton}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.ctaButtonText}>Prijavi se</Text>
          <ArrowRight color="white" size={20} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.ctaButton, styles.secondaryButton]}
          onPress={() => navigation.navigate('Register')}
        >
          <Text style={styles.ctaButtonText}>Registracija</Text>
        </TouchableOpacity>

        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>Zašto izabrati nas?</Text>
          
          <View style={styles.featureItem}>
            <Zap color="#eab308" size={24} />
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Brz i Pouzdan</Text>
              <Text style={styles.featureDesc}>Live rezultati i trenutno ažurirane tabele.</Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <ShieldCheck color="#22c55e" size={24} />
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Sve na jednom mjestu</Text>
              <Text style={styles.featureDesc}>Od prijave igrača do finalnog poretka.</Text>
            </View>
          </View>
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
    alignItems: 'center',
  },
  header: {
    marginTop: 40,
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
    marginTop: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 30,
  },
  statCard: {
    backgroundColor: '#1e293b',
    padding: 20,
    borderRadius: 16,
    width: (width - 60) / 2,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginVertical: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
  },
  ctaButton: {
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
    width: '100%',
    marginBottom: 15,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#334155',
  },
  ctaButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginRight: 10,
  },
  featuresSection: {
    width: '100%',
    marginTop: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  featureText: {
    marginLeft: 15,
    flex: 1,
  },
  featureTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  featureDesc: {
    color: '#94a3b8',
    fontSize: 14,
  },
});

export default HomeScreen;
