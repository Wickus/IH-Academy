import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { CoachTabParamList } from '@/types';

// Coach screens
import CoachDashboard from '@/screens/coach/Dashboard';
import ScheduleScreen from '@/screens/coach/Schedule';
import AvailabilityScreen from '@/screens/coach/Availability';
import CoachProfile from '@/screens/coach/Profile';

const Tab = createBottomTabNavigator<CoachTabParamList>();

const CoachTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          switch (route.name) {
            case 'Dashboard':
              iconName = 'dashboard';
              break;
            case 'Schedule':
              iconName = 'schedule';
              break;
            case 'Availability':
              iconName = 'access-time';
              break;
            case 'Profile':
              iconName = 'person';
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
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={CoachDashboard}
        options={{ title: 'Coach Dashboard' }}
      />
      <Tab.Screen 
        name="Schedule" 
        component={ScheduleScreen}
        options={{ title: 'My Schedule' }}
      />
      <Tab.Screen 
        name="Availability" 
        component={AvailabilityScreen}
        options={{ title: 'Availability' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={CoachProfile}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

export default CoachTabNavigator;