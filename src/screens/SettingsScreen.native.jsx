import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, TextInput, Alert, Switch } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext.native';
import { User, Shield, Palette, LogOut, ChevronRight, Mail, UserPlus, Info } from 'lucide-react-native';

const SettingsScreen = ({ navigation }) => {
  const { user, userData, isSuperAdmin, logout } = useAuth();
  const { currentTheme, availableThemes, setTheme } = useTheme();
  const [showThemeSelector, setShowThemeSelector] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      "Odjava",
      "Da li ste sigurni da želite da se odjavite?",
      [
        { text: "Odustani", style: "cancel" },
        { text: "Odjavi se", style: "destructive", onPress: logout }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Postavke</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* User Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarPlaceholder}>
            <User size={32} color="#3b82f6" />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{userData?.displayName || user?.email}</Text>
            <Text style={styles.profileRole}>{userData?.role === 'super_admin' ? 'Super Administrator' : 'Administrator'}</Text>
          </View>
        </View>

        {/* Section: Account */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>PROFIL</Text>
          <View style={styles.item}>
            <Mail size={20} color="#94a3b8" />
            <View style={styles.itemContent}>
              <Text style={styles.itemLabel}>Email Adresa</Text>
              <Text style={styles.itemValue}>{user?.email}</Text>
            </View>
          </View>
          
          <TouchableOpacity style={styles.item} onPress={() => navigation.navigate('MyProfile')}>
            <Info size={20} color="#94a3b8" />
            <View style={styles.itemContent}>
              <Text style={styles.itemLabel}>Pretplata i Plan i Program</Text>
              <Text style={styles.itemValue}>{userData?.subscriptionPlan || 'Basic Plan'}</Text>
            </View>
            <ChevronRight size={18} color="#475569" />
          </TouchableOpacity>
        </View>

        {/* Section: Appearance (Super Admin only in this app's logic) */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>IZGLED</Text>
          {isSuperAdmin ? (
            <>
              <TouchableOpacity 
                style={styles.item} 
                onPress={() => setShowThemeSelector(!showThemeSelector)}
              >
                <Palette size={20} color="#94a3b8" />
                <View style={styles.itemContent}>
                  <Text style={styles.itemLabel}>Tema Aplikacije</Text>
                  <Text style={styles.itemValue}>Trenutno: {currentTheme.name}</Text>
                </View>
                <ChevronRight size={18} color="#475569" />
              </TouchableOpacity>
              
              {showThemeSelector && (
                <View style={styles.themeSelector}>
                  {Object.values(availableThemes).map((t) => (
                    <TouchableOpacity 
                      key={t.id} 
                      style={[styles.themeOption, currentTheme.id === t.id && styles.activeThemeOption]}
                      onPress={() => setTheme(t.id)}
                    >
                      <View style={[styles.colorPreview, { backgroundColor: t.colors.primary }]} />
                      <Text style={[styles.themeName, currentTheme.id === t.id && styles.activeThemeName]}>{t.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </>
          ) : (
            <View style={styles.itemDisabled}>
              <Shield size={20} color="#334155" />
              <View style={styles.itemContent}>
                <Text style={styles.itemLabelDisabled}>Administrator Podešavanja</Text>
                <Text style={styles.itemValueDisabled}>Samo super admin može menjati teme</Text>
              </View>
            </View>
          )}
        </View>

        {/* Section: Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <LogOut size={20} color="#ef4444" />
          <Text style={styles.logoutText}>Odjavi se</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.versionText}>Versija 1.0.0 (Native Beta)</Text>
          <Text style={styles.copyText}>© 2026 PingPong BIH</Text>
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
    padding: 20,
    marginTop: 10,
  },
  title: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  profileCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#334155',
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  profileRole: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  section: {
    marginBottom: 25,
  },
  sectionHeader: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 10,
    marginLeft: 5,
    letterSpacing: 2,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    padding: 15,
    borderRadius: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  itemDisabled: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    padding: 15,
    borderRadius: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
    opacity: 0.6,
  },
  itemContent: {
    flex: 1,
    marginLeft: 15,
  },
  itemLabel: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  itemValue: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
  itemLabelDisabled: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '600',
  },
  itemValueDisabled: {
    color: '#334155',
    fontSize: 10,
    marginTop: 2,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 18,
    borderRadius: 15,
    marginTop: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  logoutText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  themeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 5,
    paddingHorizontal: 5,
  },
  themeOption: {
    width: '48%',
    backgroundColor: '#0f172a',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  activeThemeOption: {
    borderColor: '#3b82f6',
    backgroundColor: '#1e293b',
  },
  colorPreview: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 10,
  },
  themeName: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  activeThemeName: {
    color: 'white',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  versionText: {
    color: '#334155',
    fontSize: 12,
  },
  copyText: {
    color: '#1e293b',
    fontSize: 10,
    marginTop: 5,
  }
});

export default SettingsScreen;
