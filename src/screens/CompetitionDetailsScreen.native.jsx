import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator, ScrollView, TextInput, Alert, FlatList, Modal } from 'react-native';
import { doc, getDoc, collection, query, where, onSnapshot, addDoc, deleteDoc, updateDoc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { 
  Trophy, 
  Users, 
  Settings2, 
  PlayCircle, 
  ChevronLeft, 
  Plus, 
  Trash2, 
  ChevronRight,
  Search,
  Zap,
  Save,
  RotateCcw,
  CheckCircle,
  Clock,
  LayoutGrid
} from 'lucide-react-native';
import { generateBergerMatches } from '../utils/berger';

const CompetitionDetailsScreen = ({ route, navigation }) => {
  const { id } = route.params;
  const { user, userData } = useAuth();
  const [competition, setCompetition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info'); // info, players, categories, matches
  
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [activeCategory, setActiveCategory] = useState(null);
  const [categoryMatches, setCategoryMatches] = useState([]);
  const [categoryPlayers, setCategoryPlayers] = useState([]);
  const [allPlayers, setAllPlayers] = useState([]);
  
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryFormat, setNewCategoryFormat] = useState('round_robin');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!id) return;

    const compRef = doc(db, "competitions", id);
    const unsubComp = onSnapshot(compRef, (snap) => {
      if (snap.exists()) {
        setCompetition({ id: snap.id, ...snap.data() });
      }
      setLoading(false);
    });

    const categoriesRef = collection(db, "competitions", id, "categories");
    const unsubCats = onSnapshot(categoriesRef, (snap) => {
      const catsList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCategories(catsList);
    });

    return () => {
      unsubComp();
      unsubCats();
    };
  }, [id]);

  useEffect(() => {
    if (!id || !selectedCategoryId) {
      setActiveCategory(null);
      setCategoryMatches([]);
      setCategoryPlayers([]);
      return;
    }

    const catRef = doc(db, "competitions", id, "categories", selectedCategoryId);
    const unsubCat = onSnapshot(catRef, (snap) => {
      if (snap.exists()) {
        const catData = { id: snap.id, ...snap.data() };
        setActiveCategory(catData);
      }
    });

    const matchesRef = collection(db, "competitions", id, "categories", selectedCategoryId, "matches");
    const unsubMatches = onSnapshot(matchesRef, (snap) => {
      const matchesList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCategoryMatches(matchesList);
    });

    // Fetch all players to link names to category.playerIds
    const playersRef = collection(db, "players");
    const unsubAllPlayers = onSnapshot(playersRef, (snap) => {
      const pList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllPlayers(pList);
    });

    return () => {
      unsubCat();
      unsubMatches();
      unsubAllPlayers();
    };
  }, [id, selectedCategoryId]);

  useEffect(() => {
    if (activeCategory && allPlayers.length > 0) {
      const pIds = activeCategory.playerIds || [];
      const filtered = allPlayers.filter(p => pIds.includes(p.id));
      setCategoryPlayers(filtered);
    } else {
      setCategoryPlayers([]);
    }
  }, [activeCategory, allPlayers]);

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      Alert.alert("Greška", "Naziv kategorije je obavezan.");
      return;
    }

    try {
      await addDoc(collection(db, "competitions", id, "categories"), {
        name: newCategoryName.trim(),
        format: newCategoryFormat,
        status: 'draft',
        playerIds: [],
        createdAt: serverTimestamp()
      });
      setNewCategoryName('');
      setIsAddingCategory(false);
    } catch (err) {
      console.error("Add category error:", err);
      Alert.alert("Greška", "Nije moguće dodati kategoriju.");
    }
  };

  const handleDeleteCategory = (catId) => {
    Alert.alert(
      "Brisanje",
      "Da li ste sigurni da želite obrisati ovu kategoriju?",
      [
        { text: "Odustani", style: "cancel" },
        { 
          text: "Obriši", 
          style: "destructive", 
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "competitions", id, "categories", catId));
              if (selectedCategoryId === catId) setSelectedCategoryId('');
            } catch (err) {
              console.error("Delete category error:", err);
            }
          } 
        }
      ]
    );
  };

  const handleGenerateMatches = async () => {
    if (!activeCategory || categoryPlayers.length < 2) {
      Alert.alert("Greška", "Potrebno je bar 2 igrača u kategoriji.");
      return;
    }

    setGenerating(true);
    try {
      const rounds = generateBergerMatches(categoryPlayers);
      const batch = writeBatch(db);

      // Delete existing matches first
      for (const m of categoryMatches) {
        batch.delete(doc(db, "competitions", id, "categories", selectedCategoryId, "matches", m.id));
      }

      // Add new matches
      rounds.forEach(round => {
        round.matches.forEach(match => {
          const matchRef = doc(collection(db, "competitions", id, "categories", selectedCategoryId, "matches"));
          batch.set(matchRef, {
            ...match,
            categoryId: selectedCategoryId,
            competitionId: id,
            createdAt: serverTimestamp()
          });
        });
      });

      // Update category status
      const catRef = doc(db, "competitions", id, "categories", selectedCategoryId);
      batch.update(catRef, { status: 'active' });

      await batch.commit();
      Alert.alert("Uspjeh", "Mečevi su uspješno generisani!");
    } catch (err) {
      console.error("Generate matches error:", err);
      Alert.alert("Greška", "Nije moguće generisati mečeve.");
    }
    setGenerating(false);
  };

  const handleUpdateScore = async (matchId, score1, score2) => {
    try {
      const matchRef = doc(db, "competitions", id, "categories", selectedCategoryId, "matches", matchId);
      await updateDoc(matchRef, {
        score1: parseInt(score1) || 0,
        score2: parseInt(score2) || 0,
        status: 'completed'
      });
    } catch (err) {
      console.error("Update score error:", err);
      // Alert matches results
    }
  };

  const renderInfoTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Detalji Takmičenja</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Status:</Text>
          <Text style={[styles.infoValue, competition.status === 'active' ? {color: '#22c55e'} : {color: '#94a3b8'}]}>
            {competition.status === 'active' ? 'Aktivan' : 'Draft'}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Datum:</Text>
          <Text style={styles.infoValue}>{competition.startDate || '-'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Lokacija:</Text>
          <Text style={styles.infoValue}>{competition.location || '-'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Tip:</Text>
          <Text style={styles.infoValue}>{competition.type || '-'}</Text>
        </View>
      </View>
    </ScrollView>
  );

  const renderPlayersTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Igrači u kategoriji</Text>
      </View>
      {selectedCategoryId ? (
        <FlatList
          data={categoryPlayers}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.playerCard}>
              <View>
                <Text style={styles.playerName}>{item.name}</Text>
                <Text style={styles.playerClub}>{item.club || 'Bez kluba'}</Text>
              </View>
              <TouchableOpacity 
                  onPress={async () => {
                    const newIds = activeCategory.playerIds.filter(pid => pid !== item.id);
                    await updateDoc(doc(db, "competitions", id, "categories", selectedCategoryId), {
                      playerIds: newIds
                    });
                  }}
              >
                <Trash2 size={18} color="#ef4444" />
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Users size={48} color="#334155" />
              <Text style={styles.emptyText}>Nema igrača u ovoj kategoriji.</Text>
              <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => setActiveTab('categories')}
              >
                <Text style={styles.actionButtonText}>Upravljaj kategorijama</Text>
              </TouchableOpacity>
            </View>
          }
        />
      ) : (
        <Text style={styles.emptyText}>Odaberite kategoriju prvo.</Text>
      )}
    </View>
  );

  const renderMatchesTab = () => {
    if (!selectedCategoryId) {
      return (
        <View style={styles.tabContent}>
          <Text style={styles.emptyText}>Odaberite kategoriju da vidite mečeve.</Text>
        </View>
      );
    }

    if (activeCategory?.status === 'draft') {
      return (
        <View style={styles.tabContent}>
          <View style={styles.generatePreview}>
            <Trophy size={48} color="#eab308" style={{ marginBottom: 15 }} />
            <Text style={styles.previewTitle}>Spremni za generisanje?</Text>
            <Text style={styles.previewText}>
                Kategorija: {activeCategory?.name || 'Nepoznato'}{"\n"}
                Broj igrača: {categoryPlayers?.length || 0}
            </Text>
            
            <TouchableOpacity 
              style={[styles.generateBtn, (categoryPlayers?.length < 2 || generating) && { opacity: 0.5 }]}
              onPress={handleGenerateMatches}
              disabled={categoryPlayers?.length < 2 || generating}
            >
              {generating ? <ActivityIndicator color="white" /> : (
                <>
                  <PlayCircle size={20} color="white" />
                  <Text style={styles.generateBtnText}>Generiši Raspored</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.tabContent}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Raspored mečeva</Text>
          <TouchableOpacity onPress={handleGenerateMatches}>
              <RotateCcw size={18} color="#94a3b8" />
          </TouchableOpacity>
        </View>
        
        <FlatList
          data={categoryMatches.sort((a,b) => a.round - b.round)}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.matchCard}>
              <Text style={styles.roundLabel}>KOLO {item.round}</Text>
              <View style={styles.matchMain}>
                <View style={styles.matchPlayer}>
                  <Text style={styles.matchPlayerName} numberOfLines={1}>{item.player1?.name || '???'}</Text>
                </View>
                
                <View style={styles.matchScore}>
                  <TextInput
                    style={styles.scoreInput}
                    keyboardType="numeric"
                    defaultValue={String(item.score1 || 0)}
                    onEndEditing={(e) => handleUpdateScore(item.id, e.nativeEvent.text, item.score2 || 0)}
                  />
                  <Text style={styles.scoreDivider}>:</Text>
                  <TextInput
                    style={styles.scoreInput}
                    keyboardType="numeric"
                    defaultValue={String(item.score2 || 0)}
                    onEndEditing={(e) => handleUpdateScore(item.id, item.score1 || 0, e.nativeEvent.text)}
                  />
                </View>

                <View style={styles.matchPlayer}>
                  <Text style={[styles.matchPlayerName, {textAlign: 'right'}]} numberOfLines={1}>{item.player2?.name || '???'}</Text>
                </View>
              </View>
              {item.status === 'completed' && (
                <View style={styles.completedBadge}>
                  <CheckCircle size={10} color="#22c55e" />
                  <Text style={styles.completedText}> Završeno</Text>
                </View>
              )}
            </View>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>Nema generisanih mečeva.</Text>}
        />
      </View>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'info': return renderInfoTab();
      case 'players': return renderPlayersTab();
      case 'matches': return renderMatchesTab();
      case 'categories':
        return (
          <View style={styles.tabContent}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Kategorije ({categories.length})</Text>
              <TouchableOpacity 
                style={styles.smallAddBtn}
                onPress={() => setIsAddingCategory(!isAddingCategory)}
              >
                <Plus size={20} color="white" />
              </TouchableOpacity>
            </View>

            {isAddingCategory && (
              <View style={styles.addForm}>
                <TextInput
                  style={styles.input}
                  placeholder="Naziv kategorije (npr. Seniori)"
                  placeholderTextColor="#94a3b8"
                  value={newCategoryName}
                  onChangeText={setNewCategoryName}
                />
                <View style={styles.formatSelector}>
                  <TouchableOpacity 
                    style={[styles.formatBtn, newCategoryFormat === 'round_robin' && styles.activeFormatBtn]}
                    onPress={() => setNewCategoryFormat('round_robin')}
                  >
                    <Text style={[styles.formatBtnText, newCategoryFormat === 'round_robin' && styles.activeFormatBtnText]}>Liga</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.formatBtn, newCategoryFormat === 'groups_knockout' && styles.activeFormatBtn]}
                    onPress={() => setNewCategoryFormat('groups_knockout')}
                  >
                    <Text style={[styles.formatBtnText, newCategoryFormat === 'groups_knockout' && styles.activeFormatBtnText]}>Grupe+KO</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.saveBtn} onPress={handleAddCategory}>
                  <Text style={styles.saveBtnText}>Dodaj Kategoriju</Text>
                </TouchableOpacity>
              </View>
            )}

            <FlatList
              data={categories}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[styles.catCard, selectedCategoryId === item.id && styles.activeCatCard]}
                  onPress={() => setSelectedCategoryId(item.id)}
                >
                  <View style={styles.catHeader}>
                    <Text style={styles.catName}>{item.name}</Text>
                    <View style={styles.catBadge}>
                      <Text style={styles.catBadgeText}>{item.format === 'round_robin' ? 'Liga' : 'Grupe+KO'}</Text>
                    </View>
                  </View>
                  <View style={styles.catFooter}>
                    <Text style={styles.catPlayers}>{item.playerIds?.length || 0} igrača</Text>
                    {selectedCategoryId === item.id && (
                      <View style={styles.catActions}>
                        <TouchableOpacity onPress={() => handleDeleteCategory(item.id)}>
                          <Trash2 size={18} color="#ef4444" />
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.manageBtn}
                          onPress={() => setActiveTab('players')}
                        >
                          <Text style={styles.manageBtnText}>Upravljaj</Text>
                          <ChevronRight size={14} color="white" />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={styles.emptyText}>Nema dodanih kategorija.</Text>}
            />
          </View>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (!competition) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: 'white' }}>Takmičenje nije pronađeno.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ color: '#3b82f6', marginTop: 10 }}>Nazad</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft color="white" size={24} />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>{competition.name}</Text>
        <TouchableOpacity style={styles.settingsButton}>
          <Settings2 color="white" size={20} />
        </TouchableOpacity>
      </View>

      {/* Mini Dashboard / Quick Stats */}
      <View style={styles.statsRow}>
        <View style={styles.miniStat}>
          <Users size={16} color="#3b82f6" />
          <Text style={styles.miniStatText}>{competition.participantsCount || 0} igrača</Text>
        </View>
        <View style={styles.miniStat}>
          <Trophy size={16} color="#eab308" />
          <Text style={styles.miniStatText}>{competition.sport || 'Sport'}</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tabItem, activeTab === 'info' && styles.activeTabItem]} 
          onPress={() => setActiveTab('info')}
        >
          <Text style={[styles.tabText, activeTab === 'info' && styles.activeTabText]}>Info</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabItem, activeTab === 'categories' && styles.activeTabItem]} 
          onPress={() => setActiveTab('categories')}
        >
          <Text style={[styles.tabText, activeTab === 'categories' && styles.activeTabText]}>Kategorije</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabItem, activeTab === 'players' && styles.activeTabItem]} 
          onPress={() => setActiveTab('players')}
        >
          <Text style={[styles.tabText, activeTab === 'players' && styles.activeTabText]}>Igrači</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabItem, activeTab === 'matches' && styles.activeTabItem]} 
          onPress={() => setActiveTab('matches')}
        >
          <Text style={[styles.tabText, activeTab === 'matches' && styles.activeTabText]}>Mečevi</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={{ flex: 1 }}>
        {renderContent()}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070b14',
  },
  center: {
    flex: 1,
    backgroundColor: '#070b14',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginTop: 10,
  },
  backButton: {
    padding: 5,
  },
  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  settingsButton: {
    padding: 5,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 15,
  },
  miniStat: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#334155',
  },
  miniStatText: {
    color: '#94a3b8',
    fontSize: 12,
    marginLeft: 5,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  tabItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTabItem: {
    borderBottomWidth: 2,
    borderBottomColor: '#3b82f6',
  },
  tabText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#3b82f6',
  },
  tabContent: {
    flex: 1,
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  smallAddBtn: {
    backgroundColor: '#2563eb',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  addForm: {
    backgroundColor: '#1e293b',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  input: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    padding: 10,
    color: '#fff',
    marginBottom: 10,
  },
  formatSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  formatBtn: {
    flex: 0.48,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
  activeFormatBtn: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  formatBtnText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: 'bold',
  },
  activeFormatBtnText: {
    color: '#fff',
  },
  saveBtn: {
    backgroundColor: '#2563eb',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  catCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  activeCatCard: {
    borderColor: '#3b82f6',
    borderWidth: 2,
  },
  catHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  catName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  catBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  catBadgeText: {
    color: '#3b82f6',
    fontSize: 10,
    fontWeight: 'bold',
  },
  catFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  catPlayers: {
    color: '#94a3b8',
    fontSize: 13,
  },
  catActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  manageBtn: {
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 15,
  },
  manageBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 4,
  },
  noSelection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  goBtn: {
    marginTop: 20,
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  goBtnText: {
    color: '#white',
    fontWeight: 'bold',
  },
  infoCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  infoTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  infoLabel: {
    color: '#94a3b8',
    fontSize: 14,
  },
  infoValue: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  placeholderText: {
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 50,
    fontStyle: 'italic',
  },
  playerCard: {
    backgroundColor: '#1e293b',
    padding: 15,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  playerName: {
    color: 'white',
    fontSize: 15,
    fontWeight: 'bold',
  },
  playerClub: {
    color: '#94a3b8',
    fontSize: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    color: '#64748b',
    marginTop: 10,
    textAlign: 'center',
  },
  actionButton: {
    marginTop: 20,
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  generatePreview: {
    backgroundColor: '#1e293b',
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  previewTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  previewText: {
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 20,
  },
  generateBtn: {
    backgroundColor: '#22c55e',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  generateBtnText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 10,
  },
  matchCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  roundLabel: {
    color: '#3b82f6',
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 8,
    letterSpacing: 1,
  },
  matchMain: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  matchPlayer: {
    flex: 1,
  },
  matchPlayerName: {
    color: 'white',
    fontSize: 13,
    fontWeight: '500',
  },
  matchScore: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    padding: 5,
    borderRadius: 8,
    marginHorizontal: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  scoreInput: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    width: 30,
    textAlign: 'center',
    padding: 0,
  },
  scoreDivider: {
    color: '#475569',
    fontWeight: 'bold',
    marginHorizontal: 2,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    alignSelf: 'flex-end',
  },
  completedText: {
    color: '#22c55e',
    fontSize: 10,
    fontWeight: 'bold',
  }
});

export default CompetitionDetailsScreen;
