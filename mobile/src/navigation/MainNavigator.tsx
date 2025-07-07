import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAppSelector } from '@/store';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Tab navigators for different roles
import MemberTabNavigator from './MemberTabNavigator';
import CoachTabNavigator from './CoachTabNavigator';
import AdminTabNavigator from './AdminTabNavigator';

const Tab = createBottomTabNavigator();

const MainNavigator: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);

  if (!user) {
    return null;
  }

  // Route to appropriate interface based on user role
  switch (user.role) {
    case 'member':
      return <MemberTabNavigator />;
    case 'coach':
      return <CoachTabNavigator />;
    case 'organization_admin':
    case 'global_admin':
      return <AdminTabNavigator />;
    default:
      return <MemberTabNavigator />;
  }
};

export default MainNavigator;