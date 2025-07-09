import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {PaperProvider} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {StatusBar, StyleSheet} from 'react-native';

// Import screens
import DashboardScreen from './screens/member/DashboardScreen';
import ClassesScreen from './screens/member/ClassesScreen';
import BookingsScreen from './screens/member/BookingsScreen';
import MessagesScreen from './screens/member/MessagesScreen';
import ProfileScreen from './screens/member/ProfileScreen';

// Import theme
import {theme} from './utils/theme';

const Tab = createBottomTabNavigator();
const queryClient = new QueryClient();

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <PaperProvider theme={theme}>
        <StatusBar 
          backgroundColor={theme.colors.primary} 
          barStyle="light-content" 
        />
        <NavigationContainer>
          <Tab.Navigator
            screenOptions={({route}) => ({
              tabBarIcon: ({focused, color, size}) => {
                let iconName: string;

                switch (route.name) {
                  case 'Dashboard':
                    iconName = 'dashboard';
                    break;
                  case 'Classes':
                    iconName = 'fitness-center';
                    break;
                  case 'Bookings':
                    iconName = 'event';
                    break;
                  case 'Messages':
                    iconName = 'message';
                    break;
                  case 'Profile':
                    iconName = 'person';
                    break;
                  default:
                    iconName = 'help';
                }

                return <Icon name={iconName} size={size} color={color} />;
              },
              tabBarActiveTintColor: theme.colors.primary,
              tabBarInactiveTintColor: 'gray',
              headerStyle: {
                backgroundColor: theme.colors.primary,
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            })}
          >
            <Tab.Screen 
              name="Dashboard" 
              component={DashboardScreen}
              options={{
                headerTitle: 'IH Academy',
              }}
            />
            <Tab.Screen 
              name="Classes" 
              component={ClassesScreen}
              options={{
                headerTitle: 'Browse Classes',
              }}
            />
            <Tab.Screen 
              name="Bookings" 
              component={BookingsScreen}
              options={{
                headerTitle: 'My Bookings',
              }}
            />
            <Tab.Screen 
              name="Messages" 
              component={MessagesScreen}
              options={{
                headerTitle: 'Messages',
              }}
            />
            <Tab.Screen 
              name="Profile" 
              component={ProfileScreen}
              options={{
                headerTitle: 'Profile',
              }}
            />
          </Tab.Navigator>
        </NavigationContainer>
      </PaperProvider>
    </QueryClientProvider>
  );
};

export default App;