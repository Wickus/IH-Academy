import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Button, Switch, TextInput, Chip, Snackbar } from 'react-native-paper';
import { useAppSelector } from '@/store';
import { apiClient } from '@/services/api';

interface DayAvailability {
  day: string;
  isAvailable: boolean;
  startTime: string;
  endTime: string;
  breakStartTime?: string;
  breakEndTime?: string;
  notes?: string;
}

const AvailabilityScreen: React.FC = () => {
  const { user, currentOrganization } = useAppSelector((state) => state.auth);
  const [availability, setAvailability] = useState<DayAvailability[]>([
    { day: 'Monday', isAvailable: true, startTime: '09:00', endTime: '17:00' },
    { day: 'Tuesday', isAvailable: true, startTime: '09:00', endTime: '17:00' },
    { day: 'Wednesday', isAvailable: true, startTime: '09:00', endTime: '17:00' },
    { day: 'Thursday', isAvailable: true, startTime: '09:00', endTime: '17:00' },
    { day: 'Friday', isAvailable: true, startTime: '09:00', endTime: '17:00' },
    { day: 'Saturday', isAvailable: false, startTime: '10:00', endTime: '14:00' },
    { day: 'Sunday', isAvailable: false, startTime: '10:00', endTime: '14:00' },
  ]);
  const [generalNotes, setGeneralNotes] = useState('');
  const [preferredSports, setPreferredSports] = useState<number[]>([]);
  const [maxClassesPerDay, setMaxClassesPerDay] = useState('4');
  const [sports, setSports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      const [availabilityResponse, sportsResponse] = await Promise.all([
        apiClient.getCoachAvailability(user?.id),
        apiClient.getSports()
      ]);

      if (availabilityResponse.data) {
        setAvailability(availabilityResponse.data.availability || availability);
        setGeneralNotes(availabilityResponse.data.notes || '');
        setPreferredSports(availabilityResponse.data.preferredSports || []);
        setMaxClassesPerDay(availabilityResponse.data.maxClassesPerDay?.toString() || '4');
      }

      setSports(sportsResponse.data);
    } catch (err: any) {
      console.error('Failed to load availability data:', err);
      // Continue with default values if loading fails
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.id]);

  const updateDayAvailability = (dayIndex: number, field: keyof DayAvailability, value: any) => {
    setAvailability(prev => prev.map((day, index) => 
      index === dayIndex ? { ...day, [field]: value } : day
    ));
  };

  const toggleSportPreference = (sportId: number) => {
    setPreferredSports(prev => 
      prev.includes(sportId) 
        ? prev.filter(id => id !== sportId)
        : [...prev, sportId]
    );
  };

  const handleSaveAvailability = async () => {
    try {
      setIsSaving(true);
      
      await apiClient.updateCoachAvailability({
        coachId: user?.id,
        organizationId: currentOrganization?.id,
        availability,
        notes: generalNotes,
        preferredSports,
        maxClassesPerDay: parseInt(maxClassesPerDay) || 4,
      });

      setSuccess('Availability updated successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to update availability');
    } finally {
      setIsSaving(false);
    }
  };

  const renderDayCard = (dayAvailability: DayAvailability, index: number) => (
    <Card key={dayAvailability.day} style={styles.dayCard}>
      <Card.Content>
        <View style={styles.dayHeader}>
          <Text variant="titleMedium" style={styles.dayTitle}>
            {dayAvailability.day}
          </Text>
          <Switch
            value={dayAvailability.isAvailable}
            onValueChange={(value) => updateDayAvailability(index, 'isAvailable', value)}
          />
        </View>

        {dayAvailability.isAvailable && (
          <View style={styles.timeInputs}>
            <View style={styles.timeRow}>
              <Text variant="bodyMedium" style={styles.timeLabel}>Working Hours:</Text>
            </View>
            <View style={styles.timeInputRow}>
              <TextInput
                label="Start Time"
                value={dayAvailability.startTime}
                onChangeText={(value) => updateDayAvailability(index, 'startTime', value)}
                mode="outlined"
                style={styles.timeInput}
                placeholder="09:00"
              />
              <TextInput
                label="End Time"
                value={dayAvailability.endTime}
                onChangeText={(value) => updateDayAvailability(index, 'endTime', value)}
                mode="outlined"
                style={styles.timeInput}
                placeholder="17:00"
              />
            </View>

            <View style={styles.timeRow}>
              <Text variant="bodyMedium" style={styles.timeLabel}>Break Time (Optional):</Text>
            </View>
            <View style={styles.timeInputRow}>
              <TextInput
                label="Break Start"
                value={dayAvailability.breakStartTime || ''}
                onChangeText={(value) => updateDayAvailability(index, 'breakStartTime', value)}
                mode="outlined"
                style={styles.timeInput}
                placeholder="12:00"
              />
              <TextInput
                label="Break End"
                value={dayAvailability.breakEndTime || ''}
                onChangeText={(value) => updateDayAvailability(index, 'breakEndTime', value)}
                mode="outlined"
                style={styles.timeInput}
                placeholder="13:00"
              />
            </View>

            <TextInput
              label="Notes for this day"
              value={dayAvailability.notes || ''}
              onChangeText={(value) => updateDayAvailability(index, 'notes', value)}
              mode="outlined"
              style={styles.notesInput}
              multiline
              numberOfLines={2}
              placeholder="Any special notes for this day..."
            />
          </View>
        )}
      </Card.Content>
    </Card>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading your availability settings...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <Card style={styles.headerCard}>
        <Card.Content>
          <Text variant="headlineSmall" style={styles.headerTitle}>
            Set Your Availability
          </Text>
          <Text variant="bodyMedium" style={styles.headerSubtitle}>
            Configure when you're available to teach classes
          </Text>
        </Card.Content>
      </Card>

      {/* General Settings */}
      <Card style={styles.settingsCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            General Settings
          </Text>

          <TextInput
            label="Maximum Classes Per Day"
            value={maxClassesPerDay}
            onChangeText={setMaxClassesPerDay}
            mode="outlined"
            style={styles.input}
            keyboardType="numeric"
            placeholder="4"
          />

          <TextInput
            label="General Notes"
            value={generalNotes}
            onChangeText={setGeneralNotes}
            mode="outlined"
            style={styles.input}
            multiline
            numberOfLines={3}
            placeholder="Any general notes about your availability, preferences, or special requirements..."
          />
        </Card.Content>
      </Card>

      {/* Preferred Sports */}
      <Card style={styles.settingsCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Preferred Sports
          </Text>
          <Text variant="bodyMedium" style={styles.sectionSubtitle}>
            Select the sports you prefer to coach
          </Text>

          <View style={styles.sportsContainer}>
            {sports.map(sport => (
              <Chip
                key={sport.id}
                selected={preferredSports.includes(sport.id)}
                onPress={() => toggleSportPreference(sport.id)}
                style={[
                  styles.sportChip,
                  { backgroundColor: preferredSports.includes(sport.id) ? sport.color + '20' : undefined }
                ]}
                textStyle={{
                  color: preferredSports.includes(sport.id) ? sport.color : undefined
                }}
              >
                {sport.name}
              </Chip>
            ))}
          </View>
        </Card.Content>
      </Card>

      {/* Weekly Schedule */}
      <Text variant="titleLarge" style={styles.scheduleTitle}>
        Weekly Schedule
      </Text>

      {availability.map((dayAvailability, index) => 
        renderDayCard(dayAvailability, index)
      )}

      {/* Save Button */}
      <Button
        mode="contained"
        onPress={handleSaveAvailability}
        loading={isSaving}
        disabled={isSaving}
        style={[styles.saveButton, { backgroundColor: currentOrganization?.primaryColor || '#20366B' }]}
        icon="check"
      >
        Save Availability
      </Button>

      <Snackbar
        visible={!!error}
        onDismiss={() => setError(null)}
        duration={4000}
      >
        {error}
      </Snackbar>

      <Snackbar
        visible={!!success}
        onDismiss={() => setSuccess(null)}
        duration={3000}
      >
        {success}
      </Snackbar>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCard: {
    marginBottom: 16,
    elevation: 2,
  },
  headerTitle: {
    color: '#20366B',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    color: '#666',
  },
  settingsCard: {
    marginBottom: 16,
    elevation: 1,
  },
  sectionTitle: {
    color: '#20366B',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sectionSubtitle: {
    color: '#666',
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  sportsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sportChip: {
    marginBottom: 8,
  },
  scheduleTitle: {
    color: '#20366B',
    fontWeight: 'bold',
    marginBottom: 16,
    marginTop: 8,
  },
  dayCard: {
    marginBottom: 12,
    elevation: 1,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dayTitle: {
    color: '#20366B',
    fontWeight: 'bold',
  },
  timeInputs: {
    marginTop: 8,
  },
  timeRow: {
    marginBottom: 8,
  },
  timeLabel: {
    color: '#666',
    fontWeight: '500',
  },
  timeInputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  timeInput: {
    flex: 1,
  },
  notesInput: {
    marginTop: 8,
  },
  saveButton: {
    marginTop: 24,
    paddingVertical: 4,
  },
});

export default AvailabilityScreen;