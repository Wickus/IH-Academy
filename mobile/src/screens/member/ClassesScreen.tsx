import React, {useState} from 'react';
import {View, ScrollView, StyleSheet} from 'react-native';
import {Card, Title, Paragraph, Button, Chip, Searchbar} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {theme} from '../../utils/theme';

const ClassesScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSport, setSelectedSport] = useState('All');

  const sports = ['All', 'Swimming', 'Soccer', 'Basketball', 'Tennis', 'Rugby'];
  
  const classes = [
    {
      id: 1,
      name: 'Swimming Lessons',
      instructor: 'Sarah Johnson',
      time: 'Mon, Wed, Fri - 3:00 PM',
      duration: '60 min',
      level: 'Beginner',
      price: 'R150',
      sport: 'Swimming',
      spots: 8,
      maxSpots: 12,
      icon: 'pool'
    },
    {
      id: 2,
      name: 'Soccer Training',
      instructor: 'Mike Wilson',
      time: 'Tue, Thu - 10:00 AM',
      duration: '90 min',
      level: 'Intermediate',
      price: 'R200',
      sport: 'Soccer',
      spots: 15,
      maxSpots: 20,
      icon: 'sports-soccer'
    },
    {
      id: 3,
      name: 'Basketball Skills',
      instructor: 'David Chen',
      time: 'Mon, Wed - 5:00 PM',
      duration: '75 min',
      level: 'Advanced',
      price: 'R180',
      sport: 'Basketball',
      spots: 6,
      maxSpots: 10,
      icon: 'sports-basketball'
    }
  ];

  const filteredClasses = classes.filter(cls => {
    const matchesSearch = cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         cls.instructor.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSport = selectedSport === 'All' || cls.sport === selectedSport;
    return matchesSearch && matchesSport;
  });

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchSection}>
        <Searchbar
          placeholder="Search classes or instructors..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
      </View>

      {/* Sport Filter */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterSection}
      >
        {sports.map((sport) => (
          <Chip
            key={sport}
            selected={selectedSport === sport}
            onPress={() => setSelectedSport(sport)}
            style={[
              styles.sportChip,
              selectedSport === sport && styles.selectedChip
            ]}
            textStyle={selectedSport === sport && styles.selectedChipText}
          >
            {sport}
          </Chip>
        ))}
      </ScrollView>

      {/* Classes List */}
      <ScrollView style={styles.classesSection}>
        {filteredClasses.map((cls) => (
          <Card key={cls.id} style={styles.classCard}>
            <Card.Content>
              <View style={styles.classHeader}>
                <View style={styles.classTitle}>
                  <Icon name={cls.icon} size={24} color={theme.colors.primary} />
                  <View style={styles.classTitleText}>
                    <Title style={styles.className}>{cls.name}</Title>
                    <Paragraph style={styles.instructorName}>
                      with {cls.instructor}
                    </Paragraph>
                  </View>
                </View>
                <Chip style={styles.levelChip} textStyle={styles.levelText}>
                  {cls.level}
                </Chip>
              </View>

              <View style={styles.classDetails}>
                <View style={styles.detailRow}>
                  <Icon name="schedule" size={16} color={theme.colors.placeholder} />
                  <Paragraph style={styles.detailText}>{cls.time}</Paragraph>
                </View>
                
                <View style={styles.detailRow}>
                  <Icon name="timer" size={16} color={theme.colors.placeholder} />
                  <Paragraph style={styles.detailText}>{cls.duration}</Paragraph>
                </View>
                
                <View style={styles.detailRow}>
                  <Icon name="people" size={16} color={theme.colors.placeholder} />
                  <Paragraph style={styles.detailText}>
                    {cls.spots}/{cls.maxSpots} spots available
                  </Paragraph>
                </View>
              </View>

              <View style={styles.classFooter}>
                <View style={styles.priceSection}>
                  <Title style={styles.price}>{cls.price}</Title>
                  <Paragraph style={styles.priceLabel}>per session</Paragraph>
                </View>
                
                <View style={styles.actionButtons}>
                  <Button 
                    mode="outlined" 
                    compact
                    style={styles.detailsButton}
                    textColor={theme.colors.primary}
                    onPress={() => {}}
                  >
                    Details
                  </Button>
                  <Button 
                    mode="contained" 
                    compact
                    style={styles.bookButton}
                    buttonColor={theme.colors.primary}
                    onPress={() => {}}
                  >
                    Book Now
                  </Button>
                </View>
              </View>
            </Card.Content>
          </Card>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  searchSection: {
    padding: 16,
    paddingBottom: 8,
  },
  searchBar: {
    elevation: 2,
  },
  filterSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  sportChip: {
    marginRight: 8,
    backgroundColor: theme.colors.surface,
  },
  selectedChip: {
    backgroundColor: theme.colors.primary,
  },
  selectedChipText: {
    color: 'white',
  },
  classesSection: {
    flex: 1,
    paddingHorizontal: 16,
  },
  classCard: {
    marginBottom: 16,
    elevation: 2,
  },
  classHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  classTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  classTitleText: {
    marginLeft: 12,
    flex: 1,
  },
  className: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  instructorName: {
    color: theme.colors.placeholder,
    fontSize: 14,
  },
  levelChip: {
    backgroundColor: theme.colors.accent,
  },
  levelText: {
    color: 'white',
    fontSize: 12,
  },
  classDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    marginLeft: 8,
    color: theme.colors.text,
    fontSize: 14,
  },
  classFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceSection: {
    alignItems: 'flex-start',
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  priceLabel: {
    fontSize: 12,
    color: theme.colors.placeholder,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  detailsButton: {
    borderColor: theme.colors.primary,
  },
  bookButton: {
    minWidth: 100,
  },
});

export default ClassesScreen;