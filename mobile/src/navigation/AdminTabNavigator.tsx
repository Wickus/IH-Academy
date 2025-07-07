import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { AdminTabParamList } from '@/types';

// Admin screens
import AdminDashboard from '@/screens/admin/Dashboard';
import AdminClasses from '@/screens/admin/Classes';
import MembersScreen from '@/screens/admin/Members';
import CoachesScreen from '@/screens/admin/Coaches';
import ReportsScreen from '@/screens/admin/Reports';
import AdminSettings from '@/screens/admin/Settings';

const Tab = createBottomTabNavigator<AdminTabParamList>();

const AdminTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          switch (route.name) {
            case 'Dashboard':
              iconName = 'dashboard';
              break;
            case 'Classes':
              iconName = 'fitness-center';
              break;
            case 'Members':
              iconName = 'group';
              break;
            case 'Coaches':
              iconName = 'sports';
              break;
            case 'Reports':
              iconName = 'assessment';
              break;
            case 'Settings':
              iconName = 'settings';
              break;
            default:
              iconName = 'dashboard';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#20366B',
        tabBarInactiveTintColor: 'gray',
        headerShown: true,
        headerStyle: {
          backgroundColor: '#20366B',
        },
        headerTintColor: 'white',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        tabBarLabelStyle: {
          fontSize: 10,
        },
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={AdminDashboard}
        options={{ title: 'Admin Dashboard' }}
      />
      <Tab.Screen 
        name="Classes" 
        component={AdminClasses}
        options={{ title: 'Classes' }}
      />
      <Tab.Screen 
        name="Members" 
        component={MembersScreen}
        options={{ title: 'Members' }}
      />
      <Tab.Screen 
        name="Coaches" 
        component={CoachesScreen}
        options={{ title: 'Coaches' }}
      />
      <Tab.Screen 
        name="Reports" 
        component={ReportsScreen}
        options={{ title: 'Reports' }}
      />
      <Tab.Screen 
        name="Settings" 
        component={AdminSettings}
        options={{ title: 'Settings' }}
      />
    </Tab.Navigator>
  );
};

export default AdminTabNavigator;