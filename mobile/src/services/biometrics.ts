import AsyncStorage from '@react-native-async-storage/async-storage';
import TouchID from 'react-native-touch-id';
import ReactNativeBiometrics, { BiometryTypes } from 'react-native-biometrics';
import { Platform } from 'react-native';

export interface BiometricConfig {
  title: string;
  subtitle?: string;
  description?: string;
  fallbackLabel?: string;
  cancelLabel?: string;
  disableDeviceFallback?: boolean;
  showConfirmationOverride?: boolean;
}

export interface BiometricCapabilities {
  available: boolean;
  biometryType: BiometryTypes | null;
  error?: string;
}

class BiometricService {
  private biometrics = new ReactNativeBiometrics();
  private isInitialized = false;
  private capabilities: BiometricCapabilities = {
    available: false,
    biometryType: null,
  };

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Check biometric capabilities
      const { available, biometryType, error } = await this.biometrics.isSensorAvailable();
      
      this.capabilities = {
        available,
        biometryType,
        error,
      };

      this.isInitialized = true;
      console.log('Biometric capabilities:', this.capabilities);
    } catch (error) {
      console.error('Failed to initialize biometrics:', error);
      this.capabilities = {
        available: false,
        biometryType: null,
        error: error.message,
      };
    }
  }

  async isAvailable(): Promise<boolean> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    return this.capabilities.available;
  }

  async getBiometryType(): Promise<BiometryTypes | null> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    return this.capabilities.biometryType;
  }

  async authenticate(config: BiometricConfig = {}): Promise<{ success: boolean; error?: string }> {
    try {
      if (!await this.isAvailable()) {
        return {
          success: false,
          error: 'Biometric authentication is not available on this device',
        };
      }

      const defaultConfig: BiometricConfig = {
        title: 'Authenticate',
        subtitle: 'Use your biometric to authenticate',
        description: 'Place your finger on the sensor or look at the camera',
        fallbackLabel: 'Use Password',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      };

      const authConfig = { ...defaultConfig, ...config };

      if (Platform.OS === 'ios') {
        // Use TouchID for iOS
        const result = await TouchID.authenticate(authConfig.description || '', {
          title: authConfig.title,
          fallbackLabel: authConfig.fallbackLabel,
          cancelLabel: authConfig.cancelLabel,
          disableDeviceFallback: authConfig.disableDeviceFallback,
        });

        return { success: true };
      } else {
        // Use ReactNativeBiometrics for Android
        const { success, error } = await this.biometrics.simplePrompt({
          promptMessage: authConfig.description || 'Authenticate with biometrics',
          cancelButtonText: authConfig.cancelLabel || 'Cancel',
        });

        return { success, error };
      }
    } catch (error) {
      console.error('Biometric authentication failed:', error);
      return {
        success: false,
        error: this.getErrorMessage(error),
      };
    }
  }

  private getErrorMessage(error: any): string {
    if (Platform.OS === 'ios') {
      switch (error.name) {
        case 'LAErrorUserCancel':
          return 'Authentication was cancelled by user';
        case 'LAErrorUserFallback':
          return 'User selected fallback authentication';
        case 'LAErrorSystemCancel':
          return 'Authentication was cancelled by system';
        case 'LAErrorPasscodeNotSet':
          return 'Passcode is not set on the device';
        case 'LAErrorBiometryNotAvailable':
          return 'Biometry is not available on the device';
        case 'LAErrorBiometryNotEnrolled':
          return 'Biometry is not enrolled on the device';
        case 'LAErrorBiometryLockout':
          return 'Biometry is locked out';
        default:
          return error.message || 'Authentication failed';
      }
    } else {
      // Android error handling
      switch (error.code) {
        case 'UserCancel':
          return 'Authentication was cancelled by user';
        case 'UserFallback':
          return 'User selected fallback authentication';
        case 'SystemCancel':
          return 'Authentication was cancelled by system';
        case 'PasscodeNotSet':
          return 'No passcode set on device';
        case 'BiometryNotAvailable':
          return 'Biometric authentication is not available';
        case 'BiometryNotEnrolled':
          return 'No biometric authentication enrolled';
        case 'BiometryLockout':
          return 'Biometric authentication is temporarily locked';
        default:
          return error.message || 'Authentication failed';
      }
    }
  }

  async createKeys(): Promise<{ publicKey: string } | null> {
    try {
      if (!await this.isAvailable()) {
        return null;
      }

      const { keysExist } = await this.biometrics.biometricKeysExist();
      
      if (!keysExist) {
        const { publicKey } = await this.biometrics.createKeys();
        await AsyncStorage.setItem('biometric_public_key', publicKey);
        return { publicKey };
      }

      const storedKey = await AsyncStorage.getItem('biometric_public_key');
      return storedKey ? { publicKey: storedKey } : null;
    } catch (error) {
      console.error('Failed to create biometric keys:', error);
      return null;
    }
  }

  async deleteKeys(): Promise<boolean> {
    try {
      const { keysDeleted } = await this.biometrics.deleteKeys();
      if (keysDeleted) {
        await AsyncStorage.removeItem('biometric_public_key');
      }
      return keysDeleted;
    } catch (error) {
      console.error('Failed to delete biometric keys:', error);
      return false;
    }
  }

  async createSignature(payload: string): Promise<{ signature: string } | null> {
    try {
      if (!await this.isAvailable()) {
        return null;
      }

      const { success, signature } = await this.biometrics.createSignature({
        promptMessage: 'Sign in with biometrics',
        payload: payload,
        cancelButtonText: 'Cancel',
      });

      return success ? { signature } : null;
    } catch (error) {
      console.error('Failed to create signature:', error);
      return null;
    }
  }

  // Convenience methods for common authentication scenarios

  async authenticateForLogin(): Promise<{ success: boolean; error?: string }> {
    return this.authenticate({
      title: 'Sign In',
      subtitle: 'IH Academy',
      description: 'Use your biometric to sign in securely',
      fallbackLabel: 'Use Password',
      cancelLabel: 'Cancel',
    });
  }

  async authenticateForPayment(): Promise<{ success: boolean; error?: string }> {
    return this.authenticate({
      title: 'Confirm Payment',
      subtitle: 'Secure Payment Authorization',
      description: 'Authenticate to confirm your payment',
      fallbackLabel: 'Use PIN',
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
    });
  }

  async authenticateForSensitiveAction(): Promise<{ success: boolean; error?: string }> {
    return this.authenticate({
      title: 'Secure Action',
      subtitle: 'Authentication Required',
      description: 'This action requires biometric verification',
      fallbackLabel: 'Use Password',
      cancelLabel: 'Cancel',
    });
  }

  // Settings and preferences
  async isBiometricLoginEnabled(): Promise<boolean> {
    try {
      const enabled = await AsyncStorage.getItem('biometric_login_enabled');
      return enabled === 'true';
    } catch (error) {
      console.error('Failed to check biometric login setting:', error);
      return false;
    }
  }

  async setBiometricLoginEnabled(enabled: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem('biometric_login_enabled', enabled.toString());
      
      if (enabled) {
        // Create keys when enabling
        await this.createKeys();
      } else {
        // Delete keys when disabling
        await this.deleteKeys();
      }
    } catch (error) {
      console.error('Failed to set biometric login setting:', error);
    }
  }

  async isBiometricPaymentEnabled(): Promise<boolean> {
    try {
      const enabled = await AsyncStorage.getItem('biometric_payment_enabled');
      return enabled === 'true';
    } catch (error) {
      console.error('Failed to check biometric payment setting:', error);
      return false;
    }
  }

  async setBiometricPaymentEnabled(enabled: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem('biometric_payment_enabled', enabled.toString());
    } catch (error) {
      console.error('Failed to set biometric payment setting:', error);
    }
  }

  // Security validation
  async validateBiometricIntegrity(): Promise<boolean> {
    try {
      if (!await this.isAvailable()) {
        return false;
      }

      const { keysExist } = await this.biometrics.biometricKeysExist();
      const storedKey = await AsyncStorage.getItem('biometric_public_key');
      
      return keysExist && !!storedKey;
    } catch (error) {
      console.error('Failed to validate biometric integrity:', error);
      return false;
    }
  }

  async resetBiometricSetup(): Promise<void> {
    try {
      await this.deleteKeys();
      await AsyncStorage.removeItem('biometric_login_enabled');
      await AsyncStorage.removeItem('biometric_payment_enabled');
      await AsyncStorage.removeItem('biometric_public_key');
    } catch (error) {
      console.error('Failed to reset biometric setup:', error);
    }
  }

  // Information methods
  getBiometricTypeName(): string {
    switch (this.capabilities.biometryType) {
      case BiometryTypes.TouchID:
        return 'Touch ID';
      case BiometryTypes.FaceID:
        return 'Face ID';
      case BiometryTypes.Biometrics:
        return 'Biometric Authentication';
      default:
        return 'Biometric Authentication';
    }
  }

  getCapabilities(): BiometricCapabilities {
    return { ...this.capabilities };
  }

  // Quick setup helper
  async quickSetup(): Promise<{
    success: boolean;
    biometryType: string;
    error?: string;
  }> {
    try {
      if (!await this.isAvailable()) {
        return {
          success: false,
          biometryType: 'None',
          error: 'Biometric authentication is not available',
        };
      }

      // Test authentication
      const authResult = await this.authenticate({
        title: 'Setup Biometric Authentication',
        description: 'Authenticate to enable biometric login',
      });

      if (!authResult.success) {
        return {
          success: false,
          biometryType: this.getBiometricTypeName(),
          error: authResult.error,
        };
      }

      // Create keys and enable
      await this.createKeys();
      await this.setBiometricLoginEnabled(true);

      return {
        success: true,
        biometryType: this.getBiometricTypeName(),
      };
    } catch (error) {
      return {
        success: false,
        biometryType: this.getBiometricTypeName(),
        error: error.message,
      };
    }
  }
}

export const biometricService = new BiometricService();