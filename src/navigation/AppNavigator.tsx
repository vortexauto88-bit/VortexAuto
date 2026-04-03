import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet } from 'react-native';

import DashboardScreen from '../screens/DashboardScreen';
import ImportScreen from '../screens/ImportScreen';
import ReportScreen from '../screens/ReportScreen';
import COGSScreen from '../screens/COGSScreen';
import ReturnScreen from '../screens/ReturnScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { COLORS } from '../theme';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function MoreStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Returns" component={ReturnScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: COLORS.textTertiary,
          tabBarLabelStyle: styles.tabLabel,
          tabBarIcon: ({ color, size, focused }) => {
            const icons: Record<string, { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }> = {
              Dashboard: { active: 'home', inactive: 'home-outline' },
              Import: { active: 'cloud-upload', inactive: 'cloud-upload-outline' },
              Laporan: { active: 'bar-chart', inactive: 'bar-chart-outline' },
              COGS: { active: 'cube', inactive: 'cube-outline' },
              Retur: { active: 'return-up-back', inactive: 'return-up-back-outline' },
              Pengaturan: { active: 'settings', inactive: 'settings-outline' },
            };
            const iconSet = icons[route.name] || { active: 'ellipse', inactive: 'ellipse-outline' };
            return <Ionicons name={focused ? iconSet.active : iconSet.inactive} size={22} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Dashboard" component={DashboardScreen} />
        <Tab.Screen name="Import" component={ImportScreen} />
        <Tab.Screen name="Laporan" component={ReportScreen} />
        <Tab.Screen name="COGS" component={COGSScreen} />
        <Tab.Screen name="Retur" component={ReturnScreen} />
        <Tab.Screen name="Pengaturan" component={SettingsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.white,
    borderTopColor: COLORS.border,
    borderTopWidth: 1,
    height: 60,
    paddingBottom: 8,
    paddingTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
});
