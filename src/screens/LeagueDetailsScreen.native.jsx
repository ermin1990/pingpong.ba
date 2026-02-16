import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator, FlatList, ScrollView, TextInput, Alert, Modal } from 'react-native';
import { db } from '../firebase/config';
import { doc, onSnapshot, collection, query, where, updateDoc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { 
  Trophy, Users, Settings2, PlayCircle, ChevronLeft, Plus, 
  Trash2, ChevronRight, LayoutGrid, Search, Target, CheckCircle, 
  RotateCcw, Info, Clock, Save, X
} from 'lucide-react-native';
import { generateBergerMatches } from '../utils/berger';

const LeagueDetailsScreen = ({ route, navigation }) => {
  const { id } = route.params;
  const { user, userData } = useAuth();
  
  const [league, setLeague] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('standings'); // standings, matches, players, settings
  
  const [allPlayers, setAllPlayers] = useState([]);
  const [leaguePlayers, setLeaguePlayers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!id) return;

    // League info
    const unsubscribeLeague = onSnapshot(doc(db, "competitions", id), (snap) => {
      if (snap.exists()) {
        setLeague({ id: snap.id, ...snap.data() });
      }
      setLoading(false);
    });

    // Matches
    const qMatches = query(collection(db, "matches"), where("competitionId", "==", id));
    const unsubscribeMatches = onSnapshot(qMatches, (snap) => {
      setMatches(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // All available players for the owner
    const qPlayers = query(collection(db, "players"), where("ownerUid", "==", user.uid));
    const unsubscribePlayers = onSnapshot(qPlayers, (snap) => {
      setAllPlayers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubscribeLeague();
      unsubscribeMatches();
      unsubscribePlayers();
    };
  }, [id, user]);

  useEffect(() => {
    if (league && allPlayers.length > 0) {
      const pIds = league.playerIds || [];
      setLeaguePlayers(allPlayers.filter(p => pIds.includes(p.id)));
    }
  }, [league, allPlayers]);

  const calculateStandings = () => {
    const standings = leaguePlayers.map(p => ({
      id: p.id,
      name: p.name,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      points: 0,
      setsWon: 0,
      setsLost: 0,
      diff: 0
    }));

    matches.forEach(m => {
      if (m.status !== 'completed') return;
      
      const p1Id = m.player1?.id;
      const p2Id = m.player2?.id;
      
      if (!p1Id || !p2Id) return;

      const p1 = standings.find(s => s.id === p1Id);
      const p2 = standings.find(s => s.id === p2Id);
      
      if (p1 && p2) {
        p1.played++;
        p2.played++;
        p1.setsWon += m.score1 || 0;
        p1.setsLost += m.score2 || 0;
        p2.setsWon += m.score2 || 0;
        p2.setsLost += m.score1 || 0;

        if (m.score1 > m.score2) {
          p1.won++;
          p2.lost++;
          p1.points += league?.settings?.pointsWin || 2;
          p2.points += league?.settings?.pointsLoss || 0;
        } else if (m.score2 > m.score1) {
          p2.won++;
          p1.lost++;
          p2.points += league?.settings?.pointsWin || 2;
          p1.points += league?.settings?.pointsLoss || 0;
        } else {
          p1.drawn++;
          p2.drawn++;
          p1.points += league?.settings?.pointsDraw || 1;
          p2.points += league?.settings?.pointsDraw || 1;
        }
        
        p1.diff = p1.setsWon - p1.setsLost;
        p2.diff = p2.setsWon - p2.setsLost;
      }
    });

    return standings.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.diff !== a.diff) return b.diff - a.diff;
      return b.setsWon - a.setsWon;
    });
  };

  const handleGenerateMatches = async () => {
    if (leaguePlayers.length < 2) {
      Alert.alert("Greška", "Potrebno je bar 2 igrača u ligi.");
      return;
    }

    setGenerating(true);
    try {
      const rounds = generateBergerMatches(leaguePlayers);
      const batch = writeBatch(db);

      // Clean existing matches
      matches.forEach(m => {
        batch.delete(doc(db, "matches", m.id));
      });

      // Add new ones
      rounds.forEach(round => {
        round.matches.forEach(match => {
          const matchRef = doc(collection(db, "matches"));
          batch.set(matchRef, {
            ...match,
            competitionId: id,
            status: 'pending',
            createdAt: serverTimestamp()
          });
        });
      });

      batch.update(doc(db, "competitions", id), { status: 'active' });
      await batch.commit();
      Alert.alert("Uspjeh", "Raspored lige je generisan!");
    } catch (err) {
      console.error(err);
      Alert.alert("Greška", "Generisanje neuspješno.");
    }
    setGenerating(false);
  };

  const renderStandings = () => {
    const data = calculateStandings();
    return (
      <ScrollView horizontal style={styles.standingsScroll}>
        <View style={styles.standingsTable}>
          <View style={styles.tableHeader}>
            <Text style={[styles.headerText, { width: 30 }]}>#</Text>
            <Text style={[styles.headerText, { width: 140 }]}>IGRAČ</Text>
            <Text style={[styles.headerText, styles.centerCol]}>ODG</Text>
            <Text style={[styles.headerText, styles.centerCol]}>POB</Text>
            <Text style={[styles.headerText, styles.centerCol]}>IZG</Text>
            <Text style={[styles.headerText, styles.centerCol]}>BOD</Text>
          </View>
          {data.map((item, index) => (
            <View key={item.id} style={styles.tableRow}>
              <Text style={[styles.rowText, { width: 30, color: '#94a3b8' }]}>{index + 1}</Text>
              <Text style={[styles.rowText, { width: 140, fontWeight: 'bold' }]} numberOfLines={1}>{item.name}</Text>
              <Text style={[styles.rowText, styles.centerCol]}>{item.played}</Text>
              <Text style={[styles.rowText, styles.centerCol, { color: '#22c55e' }]}>{item.won}</Text>
              <Text style={[styles.rowText, styles.centerCol, { color: '#ef4444' }]}>{item.lost}</Text>
              <Text style={[styles.rowText, styles.centerCol, { fontWeight: '800', color: '#3b82f6' }]}>{item.points}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    );
  };

  const updateMatchScore = async (matchId, s1, s2) => {
    try {
      await updateDoc(doc(db, "matches", matchId), {
        score1: parseInt(s1) || 0,
        score2: parseInt(s2) || 0,
        status: 'completed',
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error(err);
    }
  };

  const renderMatches = () => (
    <FlatList
      data={matches.sort((a,b) => a.round - b.round)}
      keyExtractor={item => item.id}
      renderItem={({ item }) => (
        <View style={styles.matchCard}>
          <Text style={styles.roundLabel}>KOLO {item.round}</Text>
          <View style={styles.matchMain}>
            <View style={styles.matchPlayer}>
              <Text style={styles.matchPlayerName}>{item.player1?.name || '???'}</Text>
            </View>
            <View style={styles.scoreBox}>
              <TextInput
                style={styles.scoreInput}
                keyboardType="numeric"
                defaultValue={String(item.score1 || 0)}
                onEndEditing={(e) => updateMatchScore(item.id, e.nativeEvent.text, item.score2 || 0)}
              />
              <Text style={styles.scoreDivider}>:</Text>
              <TextInput
                style={styles.scoreInput}
                keyboardType="numeric"
                defaultValue={String(item.score2 || 0)}
                onEndEditing={(e) => updateMatchScore(item.id, item.score1 || 0, e.nativeEvent.text)}
              />
            </View>
            <View style={styles.matchPlayer}>
              <Text style={[styles.matchPlayerName, { textAlign: 'right' }]}>{item.player2?.name || '???'}</Text>
            </View>
          </View>
        </View>
      )}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Nema generisanih mečeva.</Text>
          <TouchableOpacity style={styles.generateBtn} onPress={handleGenerateMatches}>
            <PlayCircle size={20} color="white" />
            <Text style={styles.generateBtnText}>Generiši Raspored</Text>
          </TouchableOpacity>
        </View>
      }
    />
  );

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#3b82f6" /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft color="white" size={24} />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>{league?.name}</Text>
        <TouchableOpacity style={styles.backBtn}>
          <Settings2 color="white" size={20} />
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        {['standings', 'matches', 'players'].map(tab => (
          <TouchableOpacity 
            key={tab} 
            style={[styles.tabItem, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab === 'standings' ? 'Tabela' : tab === 'matches' ? 'Mečevi' : 'Igrači'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.content}>
        {activeTab === 'standings' && renderStandings()}
        {activeTab === 'matches' && renderMatches()}
        {activeTab === 'players' && (
          <View style={{ flex: 1 }}>
            <FlatList
              data={leaguePlayers}
              renderItem={({ item }) => (
                <View style={styles.playerItem}>
                  <Text style={styles.playerName}>{item.name}</Text>
                  <TouchableOpacity onPress={async () => {
                    const newIds = (league.playerIds || []).filter(pid => pid !== item.id);
                    await updateDoc(doc(db, "competitions", id), { playerIds: newIds });
                  }}>
                    <Trash2 size={18} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              )}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#070b14' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#070b14' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
  },
  backBtn: { padding: 5 },
  title: { color: 'white', fontSize: 18, fontWeight: 'bold', flex: 1, textAlign: 'center' },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  tabItem: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  activeTab: { borderBottomWidth: 2, borderBottomColor: '#3b82f6' },
  tabText: { color: '#64748b', fontSize: 14, fontWeight: '500' },
  activeTabText: { color: '#3b82f6' },
  content: { flex: 1, padding: 15 },
  standingsScroll: { flex: 1 },
  standingsTable: { backgroundColor: '#1e293b', borderRadius: 12, padding: 10 },
  tableHeader: {
    flexDirection: 'row',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    marginBottom: 5,
  },
  headerText: { color: '#64748b', fontSize: 11, fontWeight: 'bold' },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#0f172a',
  },
  rowText: { color: 'white', fontSize: 13 },
  centerCol: { width: 40, textAlign: 'center' },
  matchCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  roundLabel: { color: '#3b82f6', fontSize: 10, fontWeight: 'bold', marginBottom: 5 },
  matchMain: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  matchPlayer: { flex: 1 },
  matchPlayerName: { color: 'white', fontSize: 13, fontWeight: '500' },
  scoreBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a', borderRadius: 6, padding: 4 },
  scoreInput: { color: 'white', width: 25, textAlign: 'center', fontSize: 14, fontWeight: 'bold' },
  scoreDivider: { color: '#334155', marginHorizontal: 2 },
  playerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  playerName: { color: 'white', fontWeight: '500' },
  emptyContainer: { alignItems: 'center', marginTop: 50 },
  emptyText: { color: '#64748b', marginBottom: 20 },
  generateBtn: {
    backgroundColor: '#22c55e',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  generateBtnText: { color: 'white', fontWeight: 'bold', marginLeft: 8 },
});

export default LeagueDetailsScreen;
