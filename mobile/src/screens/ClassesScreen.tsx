import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../App';

type ClassesScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Classes'
>;

interface Props {
  navigation: ClassesScreenNavigationProp;
}

interface Class {
  id: string;
  name: string;
  sport: string;
  instructor: string;
  time: string;
  date: string;
  duration: string;
  spots: number;
  price: string;
  location: string;
}

const ClassesScreen: React.FC<Props> = ({navigation}) => {
  const [searchText, setSearchText] = useState('');
  const [selectedSport, setSelectedSport] = useState<string | null>(null);

  // Sample data - in production, this would come from API
  const classes: Class[] = [
    {
      id: '1',
      name: 'Morning Soccer Training',
      sport: 'Soccer',
      instructor: 'Coach Mike',
      time: '08:00',
      date: '2025-07-15',
      duration: '90 min',
      spots: 5,
      price: 'R120',
      location: 'Field A',
    },
    {
      id: '2',
      name: 'Basketball Fundamentals',
      sport: 'Basketball',
      instructor: 'Coach Sarah',
      time: '10:00',
      date: '2025-07-15',
      duration: '60 min',
      spots: 8,
      price: 'R100',
      location: 'Court 1',
    },
    {
      id: '3',
      name: 'Tennis Beginner',
      sport: 'Tennis',
      instructor: 'Coach Alex',
      time: '14:00',
      date: '2025-07-15',
      duration: '45 min',
      spots: 3,
      price: 'R80',
      location: 'Court 2',
    },
    {
      id: '4',
      name: 'Swimming Lessons',
      sport: 'Swimming',
      instructor: 'Coach Emma',
      time: '16:00',
      date: '2025-07-15',
      duration: '60 min',
      spots: 6,
      price: 'R90',
      location: 'Pool',
    },
  ];

  const sports = ['Soccer', 'Basketball', 'Tennis', 'Swimming'];

  const filteredClasses = classes.filter(cls => {
    const matchesSearch = cls.name.toLowerCase().includes(searchText.toLowerCase()) ||
                         cls.instructor.toLowerCase().includes(searchText.toLowerCase());
    const matchesSport = !selectedSport || cls.sport === selectedSport;
    return matchesSearch && matchesSport;
  });

  const handleBookClass = (classItem: Class) => {
    Alert.alert(
      'Book Class',
      `Would you like to book "${classItem.name}" for ${classItem.price}?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {text: 'Book Now', onPress: () => bookClass(classItem)},
      ]
    );
  };

  const bookClass = (classItem: Class) => {
    // TODO: Implement actual booking logic
    Alert.alert('Success', `You have successfully booked "${classItem.name}"`);
  };

  const renderClassItem = ({item}: {item: Class}) => (
    <View style={styles.classCard}>
      <View style={styles.classHeader}>
        <Text style={styles.className}>{item.name}</Text>
        <Text style={styles.classPrice}>{item.price}</Text>
      </View>
      
      <View style={styles.classInfo}>
        <Text style={styles.classDetail}>🏃‍♂️ {item.sport}</Text>
        <Text style={styles.classDetail}>👨‍🏫 {item.instructor}</Text>
        <Text style={styles.classDetail}>📅 {item.date}</Text>
        <Text style={styles.classDetail}>⏰ {item.time} ({item.duration})</Text>
        <Text style={styles.classDetail}>📍 {item.location}</Text>
        <Text style={styles.classDetail}>
          👥 {item.spots} spots available
        </Text>
      </View>

      <TouchableOpacity
        style={styles.bookButton}
        onPress={() => handleBookClass(item)}>
        <Text style={styles.bookButtonText}>Book Now</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Search Section */}
      <View style={styles.searchSection}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search classes or instructors..."
          placeholderTextColor="#666666"
          value={searchText}
          onChangeText={setSearchText}
        />
        
        {/* Sport Filter */}
        <View style={styles.filterSection}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              !selectedSport && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedSport(null)}>
            <Text style={[
              styles.filterButtonText,
              !selectedSport && styles.filterButtonTextActive,
            ]}>
              All Sports
            </Text>
          </TouchableOpacity>
          
          {sports.map(sport => (
            <TouchableOpacity
              key={sport}
              style={[
                styles.filterButton,
                selectedSport === sport && styles.filterButtonActive,
              ]}
              onPress={() => setSelectedSport(sport)}>
              <Text style={[
                styles.filterButtonText,
                selectedSport === sport && styles.filterButtonTextActive,
              ]}>
                {sport}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Classes List */}
      <FlatList
        data={filteredClasses}
        renderItem={renderClassItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  searchSection: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1A1A1A',
    backgroundColor: '#F5F7FA',
    marginBottom: 16,
  },
  filterSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F7FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterButtonActive: {
    backgroundColor: '#20366B',
    borderColor: '#20366B',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  listContainer: {
    padding: 20,
  },
  classCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  classHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  className: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    flex: 1,
  },
  classPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#20366B',
  },
  classInfo: {
    marginBottom: 16,
  },
  classDetail: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  bookButton: {
    backgroundColor: '#20366B',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ClassesScreen;