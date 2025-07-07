import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAppDispatch, useAppSelector } from '@/store';
import { loadUserSession } from '@/store/authSlice';
import { RootStackParamList } from '@/types';

// Navigation stacks
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import OrganizationSelector from '@/screens/OrganizationSelector';

// Loading screen
import LoadingScreen from '@/screens/LoadingScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, isLoading, organizations, currentOrganization } = useAppSelector(
    (state) => state.auth
  );

  useEffect(() => {
    // Try to load existing session on app start
    dispatch(loadUserSession());
  }, [dispatch]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  const shouldShowOrganizationSelector = isAuthenticated && 
    organizations.length > 0 && 
    !currentOrganization;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          // User is not authenticated
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : shouldShowOrganizationSelector ? (
          // User is authenticated but needs to select organization
          <Stack.Screen name="OrganizationSelector" component={OrganizationSelector} />
        ) : (
          // User is authenticated and has organization context
          <Stack.Screen name="Main" component={MainNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;