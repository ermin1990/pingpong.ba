import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Trophy, ChevronLeft, Calendar, MapPin, Save } from 'lucide-react-native';

const CreateCompetitionScreen = ({ navigation }) => {
  const { user, userData } = useAuth();
  const [loading, setLoading] = useState(false);

  // Essential Form State
  const [name, setName] = useState('');
  const [sport, setSport] = useState('Stoni Tenis');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [type, setType] = useState('Groups'); // Groups, Knockout, Round Robin

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert("Greška", "Naziv turnira je obavezan.");
      return;
    }

    setLoading(true);
    try {
      const docRef = await addDoc(collection(db, "competitions"), {
        name: name.trim(),
        sport,
        type,
        status: 'draft',
        ownerUid: user.uid,
        ownerName: userData.displayName || 'Organizator',
        ownerEmail: user.email,
        createdAt: serverTimestamp(),
        participantsCount: 0,
        startDate: startDate || null,
        location: location || '',
        isPublic: false
      });

      setLoading(false);
      Alert.alert("Uspjeh", "Turnir je uspješno kreiran!", [
        { text: "U redu", onPress: () => navigation.replace('CompetitionDetails', { id: docRef.id }) }
      ]);
    } catch (err) {
      console.error("Create competition error:", err);
      setLoading(false);
      Alert.alert("Greška", "Nije moguće kreirati turnir.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft color="white" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Novo Takmičenje</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.iconSection}>
          <Trophy size={64} color="#3b82f6" />
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Naziv takmičenja *</Text>
          <TextInput
            style={styles.input}
            placeholder="npr. Memorijalni Turnir 2026"
            placeholderTextColor="#94a3b8"
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>Sport</Text>
          <TextInput
            style={styles.input}
            placeholder="npr. Stoni Tenis"
            placeholderTextColor="#94a3b8"
            value={sport}
            onChangeText={setSport}
          />

          <Text style={styles.label}>Lokacija</Text>
          <View style={styles.inputWithIcon}>
            <MapPin size={18} color="#94a3b8" style={styles.inputIcon} />
            <TextInput
              style={styles.inputField}
              placeholder="npr. Sportska dvorana, Sarajevo"
              placeholderTextColor="#94a3b8"
              value={location}
              onChangeText={setLocation}
            />
          </View>

          <Text style={styles.label}>Datum početka</Text>
          <View style={styles.inputWithIcon}>
            <Calendar size={18} color="#94a3b8" style={styles.inputIcon} />
            <TextInput
              style={styles.inputField}
              placeholder="npr. 15.05.2026"
              placeholderTextColor="#94a3b8"
              value={startDate}
              onChangeText={setStartDate}
            />
          </View>

          <Text style={styles.label}>Format takmičenja</Text>
          <View style={styles.formatSelector}>
            {['Groups', 'Knockout', 'Round Robin'].map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.formatBtn, type === t && styles.activeFormatBtn]}
                onPress={() => setType(t)}
              >
                <Text style={[styles.formatBtnText, type === t && styles.activeFormatBtnText]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity 
            style={styles.submitBtn} 
            onPress={handleCreate}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Save size={20} color="white" />
                <Text style={styles.submitBtnText}>Kreiraj Takmičenje</Text>
              </>
            )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    marginTop: 10,
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  backButton: {
    padding: 5,
  },
  scrollContent: {
    padding: 20,
  },
  iconSection: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 10,
  },
  form: {
    backgroundColor: '#1e293b',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
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
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 15,
    color: '#fff',
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    paddingHorizontal: 15,
  },
  inputIcon: {
    marginRight: 10,
  },
  inputField: {
    flex: 1,
    paddingVertical: 15,
    color: '#fff',
  },
  formatSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
    marginBottom: 10,
  },
  formatBtn: {
    flex: 0.3,
    paddingVertical: 10,
    borderRadius: 10,
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
    fontSize: 11,
    fontWeight: 'bold',
  },
  activeFormatBtnText: {
    color: '#fff',
  },
  submitBtn: {
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 12,
    marginTop: 30,
    marginBottom: 10,
  },
  submitBtnText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 10,
  },
});

export default CreateCompetitionScreen;
