import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, SafeAreaView, Modal, TextInput, ScrollView, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { Trophy, Plus, Calendar, Target, ChevronRight, List, Info, Users, Save, X } from 'lucide-react-native';

const LeaguesScreen = ({ navigation }) => {
  const { user, userData } = useAuth();
  const [leagues, setLeagues] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Create Modal State
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [sport, setSport] = useState('Stoni Tenis');
  const [pointsWin, setPointsWin] = useState('2');
  const [pointsDraw, setPointsDraw] = useState('1');
  const [pointsLoss, setPointsLoss] = useState('0');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!user) return;

    const userRole = userData?.role;
    let q;
    
    if (userRole === 'super_admin') {
      q = query(collection(db, "competitions"), where("type", "==", "League"));
    } else {
      // In mobile we simplify: fetch all and filter client side if needed, 
      // but let's try proper owner filtering if possible
      q = query(collection(db, "competitions"), where("type", "==", "League"), where("ownerUid", "==", user.uid));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setLeagues(list);
      setLoading(false);
    }, (err) => {
      console.error("Leagues fetch error:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, userData]);

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert("Greška", "Naziv lige je obavezan.");
      return;
    }

    setCreating(true);
    try {
      await addDoc(collection(db, "competitions"), {
        name: name.trim(),
        sport,
        type: 'League',
        status: 'draft',
        ownerUid: user.uid,
        ownerName: userData?.displayName || 'Organizator',
        ownerEmail: user.email,
        createdAt: serverTimestamp(),
        participantsCount: 0,
        settings: {
          pointsWin: parseInt(pointsWin) || 2,
          pointsDraw: parseInt(pointsDraw) || 1,
          pointsLoss: parseInt(pointsLoss) || 0,
        }
      });
      
      setCreating(false);
      setShowModal(false);
      setName('');
      Alert.alert("Uspjeh", "Liga je uspješno kreirana!");
    } catch (err) {
      console.error("Create league error:", err);
      setCreating(false);
      Alert.alert("Greška", "Nije moguće kreirati ligu.");
    }
  };

  const renderLeague = ({ item }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => navigation.navigate('LeagueDetails', { id: item.id })}
    >
      <View style={styles.cardHeader}>
        <View style={styles.iconContainer}>
          <Target size={20} color="#3b82f6" />
        </View>
        <Text style={styles.cardStatus}>{item.status === 'active' ? 'AKTIVNA' : 'DRAFT'}</Text>
      </View>
      
      <Text style={styles.cardName}>{item.name}</Text>
      
      <View style={styles.cardDetails}>
        <View style={styles.detailItem}>
          <Users size={14} color="#94a3b8" />
          <Text style={styles.detailText}>{item.playerIds?.length || 0} igrača</Text>
        </View>
        <View style={styles.detailItem}>
          <Calendar size={14} color="#94a3b8" />
          <Text style={styles.detailText}>{item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString() : 'Nedavno'}</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
         <Text style={styles.sportText}>{item.sport || 'Stoni Tenis'}</Text>
         <ChevronRight size={18} color="#3b82f6" />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Lige</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowModal(true)}>
          <Plus color="white" size={24} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={leagues}
          renderItem={renderLeague}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Trophy size={64} color="#1e293b" />
              <Text style={styles.emptyText}>Nema kreiranih liga.</Text>
              <Text style={styles.emptySubtext}>Kliknite na + da kreirate svoju prvu ligu.</Text>
            </View>
          }
        />
      )}

      {/* Create Modal */}
      <Modal visible={showModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nova Liga</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <X color="white" size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              <Text style={styles.label}>Naziv Lige</Text>
              <TextInput
                style={styles.input}
                placeholder="npr. Zimska Liga 2026"
                placeholderTextColor="#64748b"
                value={name}
                onChangeText={setName}
              />

              <Text style={styles.label}>Sport</Text>
              <TextInput
                style={styles.input}
                value={sport}
                onChangeText={setSport}
                placeholderTextColor="#64748b"
              />

              <View style={styles.row}>
                <View style={styles.col}>
                  <Text style={styles.label}>Pobijeda (Bodovi)</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={pointsWin}
                    onChangeText={setPointsWin}
                  />
                </View>
                <View style={[styles.col, { marginLeft: 10 }]}>
                  <Text style={styles.label}>Neriješeno</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={pointsDraw}
                    onChangeText={setPointsDraw}
                  />
                </View>
              </View>

              <TouchableOpacity 
                style={styles.submitBtn} 
                onPress={handleCreate}
                disabled={creating}
              >
                {creating ? <ActivityIndicator color="white" /> : (
                  <>
                    <Save size={20} color="white" />
                    <Text style={styles.submitBtnText}>Kreiraj Ligu</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070b14',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    marginTop: 10,
  },
  title: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#3b82f6',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  list: {
    padding: 20,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardStatus: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '800',
    backgroundColor: '#0f172a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  cardName: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  cardDetails: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  detailText: {
    color: '#94a3b8',
    fontSize: 12,
    marginLeft: 6,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  sportText: {
    color: '#3b82f6',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  emptyText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
  },
  emptySubtext: {
    color: '#94a3b8',
    fontSize: 14,
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    height: '80%',
    padding: 25,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  modalTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
  },
  modalForm: {
    flex: 1,
  },
  label: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    marginTop: 15,
  },
  input: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 15,
    color: 'white',
    borderWidth: 1,
    borderColor: '#334155',
  },
  row: {
    flexDirection: 'row',
  },
  col: {
    flex: 1,
  },
  submitBtn: {
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 15,
    marginTop: 30,
    marginBottom: 30,
  },
  submitBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  }
});

export default LeaguesScreen;
