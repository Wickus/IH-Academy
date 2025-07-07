import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { UserSession, AuthTokens, MobileUser, Organization } from '@/types';
import { apiClient } from '@/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthState {
  user: MobileUser | null;
  organizations: Organization[];
  currentOrganization: Organization | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  organizations: [],
  currentOrganization: null,
  tokens: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

// Async thunks
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: { username: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await apiClient.login(credentials);
      
      // Save session to AsyncStorage
      const session: UserSession = {
        user: response.data.user,
        organizations: response.data.organizations || [],
        tokens: response.data.tokens,
        role: response.data.user.role,
      };
      
      await AsyncStorage.setItem('user_session', JSON.stringify(session));
      
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Login failed');
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData: {
    username: string;
    password: string;
    email: string;
    firstName?: string;
    lastName?: string;
  }, { rejectWithValue }) => {
    try {
      const response = await apiClient.register(userData);
      
      // Save session to AsyncStorage
      const session: UserSession = {
        user: response.data.user,
        organizations: response.data.organizations || [],
        tokens: response.data.tokens,
        role: response.data.user.role,
      };
      
      await AsyncStorage.setItem('user_session', JSON.stringify(session));
      
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Registration failed');
    }
  }
);

export const loadUserSession = createAsyncThunk(
  'auth/loadSession',
  async (_, { rejectWithValue }) => {
    try {
      const sessionJson = await AsyncStorage.getItem('user_session');
      if (!sessionJson) {
        throw new Error('No session found');
      }
      
      const session: UserSession = JSON.parse(sessionJson);
      
      // Verify session is still valid
      const currentUser = await apiClient.getCurrentUser();
      
      return {
        user: currentUser.data,
        organizations: session.organizations,
        tokens: session.tokens,
      };
    } catch (error: any) {
      // Clear invalid session
      await AsyncStorage.removeItem('user_session');
      return rejectWithValue(error.message || 'Session invalid');
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await apiClient.logout();
      await AsyncStorage.removeItem('user_session');
      await AsyncStorage.removeItem('current_organization');
      return null;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Logout failed');
    }
  }
);

export const loadMyOrganizations = createAsyncThunk(
  'auth/loadOrganizations',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.getMyOrganizations();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to load organizations');
    }
  }
);

export const setCurrentOrganization = createAsyncThunk(
  'auth/setCurrentOrganization',
  async (organization: Organization, { rejectWithValue }) => {
    try {
      await AsyncStorage.setItem('current_organization', JSON.stringify(organization));
      return organization;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to set current organization');
    }
  }
);

export const joinOrganization = createAsyncThunk(
  'auth/joinOrganization',
  async (inviteCode: string, { rejectWithValue, dispatch }) => {
    try {
      const response = await apiClient.joinOrganization(inviteCode);
      
      // Reload organizations after joining
      dispatch(loadMyOrganizations());
      
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to join organization');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateUser: (state, action: PayloadAction<Partial<MobileUser>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    updateBiometricSetting: (state, action: PayloadAction<boolean>) => {
      if (state.user) {
        state.user.biometricEnabled = action.payload;
      }
    },
    updatePushToken: (state, action: PayloadAction<string>) => {
      if (state.user) {
        state.user.pushToken = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.organizations = action.payload.organizations || [];
        state.tokens = action.payload.tokens;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      });

    // Register
    builder
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.organizations = action.payload.organizations || [];
        state.tokens = action.payload.tokens;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      });

    // Load session
    builder
      .addCase(loadUserSession.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadUserSession.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.organizations = action.payload.organizations;
        state.tokens = action.payload.tokens;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loadUserSession.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
        state.user = null;
        state.organizations = [];
        state.tokens = null;
      });

    // Logout
    builder
      .addCase(logoutUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.isLoading = false;
        state.user = null;
        state.organizations = [];
        state.currentOrganization = null;
        state.tokens = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Load organizations
    builder
      .addCase(loadMyOrganizations.fulfilled, (state, action) => {
        state.organizations = action.payload;
      })
      .addCase(loadMyOrganizations.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Set current organization
    builder
      .addCase(setCurrentOrganization.fulfilled, (state, action) => {
        state.currentOrganization = action.payload;
      })
      .addCase(setCurrentOrganization.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Join organization
    builder
      .addCase(joinOrganization.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(joinOrganization.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(joinOrganization.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearError,
  updateUser,
  updateBiometricSetting,
  updatePushToken,
} = authSlice.actions;

export default authSlice.reducer;