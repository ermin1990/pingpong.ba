import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, SafeAreaView, Dimensions } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';
import { collection, query, where, onSnapshot, or } from 'firebase/firestore';
import { Trophy, Plus, Calendar, MapPin, ChevronRight } from 'lucide-react-native';

const CompetitionsScreen = ({ navigation }) => {
  const { user, userData } = useAuth();
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    let q;
    const userRole = userData?.role;
    
    if (userRole === 'super_admin') {
      q = query(collection(db, "competitions"));
    } else {
      const filters = [];
      if (user.uid) filters.push(where("ownerUid", "==", user.uid));
      if (user.email) filters.push(where("collaborators", "array-contains", user.email));

      if (filters.length === 0) {
        setLoading(false);
        return;
      }
      q = query(collection(db, "competitions"), or(...filters));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Filtriraj da ne prikazuje Lige ovdje (kao u web verziji)
      list = list.filter(comp => comp.type !== 'League');
      
      setCompetitions(list);
      setLoading(false);
    }, (error) => {
      console.error("Snapshot error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, userData]);

  const renderCompetition = ({ item }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => navigation.navigate('CompetitionDetails', { id: item.id })}
    >
      <View style={styles.cardHeader}>
        <View style={styles.iconContainer}>
          <Trophy size={20} color="#eab308" />
        </View>
        <View style={styles.statusBadge}>
          <Text style={[styles.statusText, item.status === 'active' ? styles.statusActive : styles.statusDraft]}>
            {item.status === 'active' ? 'Aktivan' : 'Draft'}
          </Text>
        </View>
      </View>
      
      <Text style={styles.cardName}>{item.name}</Text>
      
      <View style={styles.detailsRow}>
        <Calendar size={14} color="#94a3b8" />
        <Text style={styles.detailText}>{item.startDate || 'Datum nije postavljen'}</Text>
      </View>
      
      <View style={styles.detailsRow}>
        <MapPin size={14} color="#94a3b8" />
        <Text style={styles.detailText}>{item.location || 'Lokacija nije postavljena'}</Text>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.participantsText}>{item.participantsCount || 0} igrača</Text>
        <ChevronRight size={18} color="#3b82f6" />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Turniri</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate('CreateCompetition')}
        >
          <Plus color="white" size={24} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={competitions}
          renderItem={renderCompetition}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Trophy size={48} color="#1e293b" />
              <Text style={styles.emptyText}>Nema pronađenih turnira.</Text>
            </View>
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
  listContent: {
    padding: 20,
    paddingTop: 0,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconContainer: {
    backgroundColor: '#0f172a',
    padding: 8,
    borderRadius: 10,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(51, 65, 85, 0.5)',
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  statusActive: {
    color: '#22c55e',
  },
  statusDraft: {
    color: '#94a3b8',
  },
  cardName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  detailText: {
    color: '#94a3b8',
    fontSize: 13,
    marginLeft: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  participantsText: {
    color: '#94a3b8',
    fontSize: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    color: '#94a3b8',
    marginTop: 15,
  }
});

export default CompetitionsScreen;
