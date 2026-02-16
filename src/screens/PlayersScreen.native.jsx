import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, SafeAreaView, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { Users, Search, Plus, Trash2, Edit2, X } from 'lucide-react-native';

const PlayersScreen = ({ navigation }) => {
  const { userData, user } = useAuth();
  const [players, setPlayers] = useState([]);
  const [name, setName] = useState('');
  const [club, setClub] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);

  useEffect(() => {
    if (!user) return;

    let q;
    const userRole = userData?.role;
    
    if (userRole === 'super_admin') {
      q = query(collection(db, "players"));
    } else {
      q = query(collection(db, "players"), where("ownerUid", "==", user.uid));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const playerList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPlayers(playerList);
      setLoading(false);
    }, (error) => {
      console.error("Snapshot error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, userData]);

  const handleSavePlayer = async () => {
    if (!name.trim()) {
      Alert.alert("Greška", "Ime igrača je obavezno.");
      return;
    }

    try {
      if (editingPlayer) {
        await updateDoc(doc(db, "players", editingPlayer.id), {
          name: name.trim(),
          club: club.trim(),
          updatedAt: new Date()
        });
        setEditingPlayer(null);
      } else {
        await addDoc(collection(db, "players"), {
          name: name.trim(),
          club: club.trim(),
          ownerUid: user.uid,
          ownerEmail: user.email,
          createdAt: new Date(),
          matchesPlayed: 0,
          wins: 0
        });
      }
      setName('');
      setClub('');
      setShowAddForm(false);
    } catch (err) {
      console.error("Save error:", err);
      Alert.alert("Greška", "Nije moguće spasiti podatke.");
    }
  };

  const deletePlayer = (id) => {
    Alert.alert(
      "Brisanje",
      "Da li ste sigurni da želite obrisati igrača?",
      [
        { text: "Odustani", style: "cancel" },
        { 
          text: "Obriši", 
          style: "destructive", 
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "players", id));
            } catch (err) {
              console.error("Delete error:", err);
            }
          } 
        }
      ]
    );
  };

  const filteredPlayers = players.filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.club?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderPlayer = ({ item }) => (
    <View style={styles.playerCard}>
      <View style={styles.playerInfo}>
        <Text style={styles.playerName}>{item.name}</Text>
        <Text style={styles.playerClub}>{item.club || 'Nema kluba'}</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity 
          onPress={() => {
            setEditingPlayer(item);
            setName(item.name);
            setClub(item.club || '');
            setShowAddForm(true);
          }}
          style={styles.actionBtn}
        >
          <Edit2 size={18} color="#3b82f6" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => deletePlayer(item.id)} style={styles.actionBtn}>
          <Trash2 size={18} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Igrači</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => {
            setShowAddForm(!showAddForm);
            if (showAddForm) setEditingPlayer(null);
          }}
        >
          {showAddForm ? <X color="white" size={24} /> : <Plus color="white" size={24} />}
        </TouchableOpacity>
      </View>

      {showAddForm && (
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>{editingPlayer ? 'Uredi igrača' : 'Novi igrač'}</Text>
          <TextInput
            style={styles.input}
            placeholder="Ime i prezime"
            placeholderTextColor="#94a3b8"
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={styles.input}
            placeholder="Klub (opcionalno)"
            placeholderTextColor="#94a3b8"
            value={club}
            onChangeText={setClub}
          />
          <TouchableOpacity style={styles.saveButton} onPress={handleSavePlayer}>
            <Text style={styles.saveButtonText}>{editingPlayer ? 'Ažuriraj' : 'Dodaj'}</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.searchBar}>
        <Search size={20} color="#94a3b8" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Pretraži igrače..."
          placeholderTextColor="#94a3b8"
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={filteredPlayers}
          renderItem={renderPlayer}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Nema pronađenih igrača.</Text>
          }
        />
      )}
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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  addButton: {
    backgroundColor: '#2563eb',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formContainer: {
    backgroundColor: '#1e293b',
    margin: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  formTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  input: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    padding: 12,
    color: '#fff',
    marginBottom: 12,
  },
  saveButton: {
    backgroundColor: '#2563eb',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    marginHorizontal: 20,
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#334155',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    color: '#fff',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  playerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  playerClub: {
    color: '#94a3b8',
    fontSize: 13,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
  },
  actionBtn: {
    marginLeft: 15,
    padding: 5,
  },
  emptyText: {
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 50,
  }
});

export default PlayersScreen;
