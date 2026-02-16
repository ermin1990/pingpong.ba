import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext.native';
import { LayoutGrid, Users, Trophy, Settings as SettingsIcon, Home as HomeIcon } from 'lucide-react-native';

import HomeScreen from './screens/HomeScreen.native';
import LoginScreen from './screens/LoginScreen.native';
import RegisterScreen from './screens/RegisterScreen.native';
import DashboardScreen from './screens/DashboardScreen.native';
import PlayersScreen from './screens/PlayersScreen.native';
import CompetitionsScreen from './screens/CompetitionsScreen.native';
import CompetitionDetailsScreen from './screens/CompetitionDetailsScreen.native';
import CreateCompetitionScreen from './screens/CreateCompetitionScreen.native';
import LeaguesScreen from './screens/LeaguesScreen.native';
import LeagueDetailsScreen from './screens/LeagueDetailsScreen.native';
import SettingsScreen from './screens/SettingsScreen.native';
import ProfileScreen from './screens/ProfileScreen.native';

const PlaceholderScreen = ({ name }) => {
  const { View, Text } = require('react-native');
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#070b14' }}>
      <Text style={{ color: 'white', fontSize: 20 }}>{name} Native Screen</Text>
      <Text style={{ color: 'gray', marginTop: 10 }}>Conversion in progress...</Text>
    </View>
  );
};

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0f172a',
          borderTopColor: '#1e293b',
          borderTopWidth: 1,
          height: 90,
          paddingBottom: 35,
          paddingTop: 5,
        },
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tab.Screen 
        name="DashboardTab" 
        component={DashboardScreen} 
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color, size }) => <LayoutGrid color={color} size={size} />,
        }}
      />
      <Tab.Screen 
        name="CompetitionsTab" 
        component={CompetitionsScreen} 
        options={{
          tabBarLabel: 'Turniri',
          tabBarIcon: ({ color, size }) => <Trophy color={color} size={size} />,
        }}
      />
      <Tab.Screen         name="LeaguesTab" 
        component={LeaguesScreen} 
        options={{
          tabBarLabel: 'Lige',
          tabBarIcon: ({ color, size }) => <LayoutGrid size={size} color={color} />,
        }}
      />
      <Tab.Screen         name="PlayersTab" 
        component={PlayersScreen} 
        options={{
          tabBarLabel: 'Igrači',
          tabBarIcon: ({ color, size }) => <Users color={color} size={size} />,
        }}
      />
      <Tab.Screen 
        name="SettingsTab" 
        component={SettingsScreen} 
        options={{
          tabBarLabel: 'Postavke',
          tabBarIcon: ({ color, size }) => <SettingsIcon color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}

const NavigationRoot = () => {
  const { user, loading } = useAuth();
  const { View, ActivityIndicator } = require('react-native');

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#070b14' }}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <Stack.Navigator 
      initialRouteName={user ? "Main" : "Home"}
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#070b14' }
      }}
    >
      {!user ? (
        <>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen name="CreateCompetition" component={CreateCompetitionScreen} />
          <Stack.Screen name="CompetitionDetails" component={CompetitionDetailsScreen} />
          <Stack.Screen name="LeagueDetails" component={LeagueDetailsScreen} />
          <Stack.Screen name="MyProfile" component={ProfileScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default function AppNative() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <NavigationContainer>
          <NavigationRoot />
        </NavigationContainer>
      </ThemeProvider>
    </AuthProvider>
  );
}
