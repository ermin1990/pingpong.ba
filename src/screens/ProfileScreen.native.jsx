import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { User, CreditCard, Check, Clock, AlertCircle, ArrowLeft } from 'lucide-react-native';

const ProfileScreen = ({ navigation }) => {
  const { user, userData } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const q = query(collection(db, 'plans'), where('active', '==', true));
        const snapshot = await getDocs(q);
        const plansData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Sort by price
        setPlans(plansData.sort((a, b) => (a.price || 0) - (b.price || 0)));
      } catch (err) {
        console.error("Error fetching plans:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  const handleUpgradeRequest = async (plan) => {
    if (userData?.subscriptionPlanId === plan.id) {
      Alert.alert("Obaveštenje", "Već ste na ovom planu.");
      return;
    }

    Alert.alert(
      "Zahtev za nadogradnju",
      `Da li želite poslati zahtev za nadogradnju na ${plan.name}?`,
      [
        { text: "Odustani", style: "cancel" },
        { 
          text: "Pošalji", 
          onPress: async () => {
            try {
              setRequesting(true);
              await addDoc(collection(db, 'access_requests'), {
                userId: user.uid,
                userEmail: user.email,
                userName: userData?.displayName || 'Bez imena',
                requestedPlanId: plan.id,
                requestedPlanName: plan.name,
                status: 'pending',
                createdAt: serverTimestamp(),
              });
              Alert.alert("Uspeh", "Vaš zahtev je uspešno poslat. Super administrator će ga pregledati.");
            } catch (err) {
              Alert.alert("Greška", "Nismo uspeli poslati zahtev.");
              console.error(err);
            } finally {
              setRequesting(false);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.title}>Moj Profil i Pretplata</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>Trenutni Plan</Text>
          <Text style={styles.planName}>{userData?.subscriptionPlan || 'Basic Plan'}</Text>
          <View style={styles.statusBadge}>
            <Check size={14} color="#10b981" />
            <Text style={styles.statusText}>Aktivan</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Dostupni Planovi</Text>
        
        {plans.map((plan) => (
          <View key={plan.id} style={[
            styles.planCard, 
            userData?.subscriptionPlanId === plan.id && styles.activePlanCard
          ]}>
            <View style={styles.planHeader}>
              <View>
                <Text style={styles.planTitle}>{plan.name}</Text>
                <Text style={styles.planPrice}>{plan.price} KM<Text style={styles.planPeriod}> / mesečno</Text></Text>
              </View>
              {userData?.subscriptionPlanId === plan.id && (
                <View style={styles.currentBadge}>
                  <Text style={styles.currentBadgeText}>TRENUTNI</Text>
                </View>
              )}
            </View>

            <View style={styles.features}>
              {plan.features?.map((feature, idx) => (
                <View key={idx} style={styles.featureItem}>
                  <Check size={16} color="#3b82f6" />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity 
              style={[
                styles.upgradeBtn, 
                userData?.subscriptionPlanId === plan.id && styles.disabledBtn
              ]} 
              disabled={userData?.subscriptionPlanId === plan.id || requesting}
              onPress={() => handleUpgradeRequest(plan)}
            >
              <Text style={styles.upgradeBtnText}>
                {userData?.subscriptionPlanId === plan.id ? 'Aktivno' : 'Nadogradi'}
              </Text>
            </TouchableOpacity>
          </View>
        ))}

        <View style={styles.infoBox}>
          <AlertCircle size={20} color="#3b82f6" />
          <Text style={styles.infoText}>
            Nakon slanja zahteva, administrator će odobriti vašu pretplatu u najkraćem mogućem roku.
          </Text>
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
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    marginTop: 10,
  },
  title: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 15,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  statusCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 20,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#334155',
  },
  statusLabel: {
    color: '#94a3b8',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  planName: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  statusText: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  planCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  activePlanCard: {
    borderColor: '#3b82f6',
    borderWidth: 2,
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  planTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  planPrice: {
    color: '#3b82f6',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 2,
  },
  planPeriod: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: 'normal',
  },
  currentBadge: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  currentBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  features: {
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureText: {
    color: '#94a3b8',
    fontSize: 14,
    marginLeft: 10,
  },
  upgradeBtn: {
    backgroundColor: '#3b82f6',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabledBtn: {
    backgroundColor: '#334155',
  },
  upgradeBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    padding: 15,
    borderRadius: 15,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  infoText: {
    color: '#94a3b8',
    fontSize: 12,
    marginLeft: 10,
    flex: 1,
    lineHeight: 18,
  }
});

export default ProfileScreen;
