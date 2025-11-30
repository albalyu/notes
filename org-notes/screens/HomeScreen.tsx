import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FlatList, View, StyleSheet, Alert, ScrollView } from 'react-native';
import { Appbar, FAB, List, Searchbar, useTheme, Chip } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { StorageManager } from '../services/StorageManager';
import { Note } from '../types/storage';

const storageManager = StorageManager.getInstance();

type SearchCategory = 'all' | 'title' | 'content' | 'date';

export default function HomeScreen({ navigation }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCategory, setSearchCategory] = useState<SearchCategory>('all');
  const theme = useTheme();
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  const fetchNotes = useCallback(async () => {
    try {
      const fetchedNotes = await storageManager.getNotes();
      setNotes(fetchedNotes);
    } catch (error) {
      console.error('Failed to fetch notes:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить заметки.');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      // Если поиск пуст, обновляем список. Если нет - поиск сам обновит (через useEffect)
      if (searchQuery.trim() === '') {
        fetchNotes();
      } else {
         performSearch(searchQuery, searchCategory);
      }
      const unsubscribe = navigation.addListener('focus', fetchNotes);
      return () => unsubscribe();
    }, [fetchNotes, navigation]) // Removed searchQuery dependency to avoid loop reset on return
  );

  const performSearch = async (query: string, category: SearchCategory) => {
    if (query.trim() === '') {
      fetchNotes();
      return;
    }
    try {
      const searchedNotes = await storageManager.searchNotes(query, category);
      setNotes(searchedNotes);
    } catch (error) {
      console.error('Failed to search notes:', error);
    }
  };

  // Live search effect with debounce
  useEffect(() => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    searchTimeout.current = setTimeout(() => {
      performSearch(searchQuery, searchCategory);
    }, 500); // 500ms delay

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [searchQuery, searchCategory]);

  const deleteNote = async (id: string) => {
    Alert.alert(
      'Удалить заметку',
      'Вы уверены, что хотите удалить эту заметку?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          onPress: async () => {
            try {
              await storageManager.deleteNote(id);
              // Refresh based on current context
              if (searchQuery.trim() !== '') {
                performSearch(searchQuery, searchCategory);
              } else {
                fetchNotes();
              }
            } catch (error) {
              console.error('Failed to delete note:', error);
              Alert.alert('Ошибка', 'Не удалось удалить заметку.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const renderCategoryChip = (label: string, value: SearchCategory) => (
    <Chip
      selected={searchCategory === value}
      onPress={() => setSearchCategory(value)}
      style={styles.chip}
      showSelectedOverlay
    >
      {label}
    </Chip>
  );

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="Мои Заметки" />
        <Appbar.Action icon="cog" onPress={() => navigation.navigate('Settings')} />
      </Appbar.Header>

      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Поиск..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          onIconPress={() => performSearch(searchQuery, searchCategory)}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsContainer}>
          {renderCategoryChip('Везде', 'all')}
          {renderCategoryChip('Заголовок', 'title')}
          {renderCategoryChip('Текст', 'content')}
          {renderCategoryChip('Дата', 'date')}
        </ScrollView>
      </View>

      <FlatList
        data={notes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <List.Item
            title={item.title}
            description={`${item.date} ${item.time}`}
            left={(props) => <List.Icon {...props} icon="notebook" />}
            right={(props) => (
              <View style={styles.listItemActions}>
                <Appbar.Action icon="pencil" onPress={() => navigation.navigate('NoteDetail', { noteId: item.id })} />
                <Appbar.Action icon="delete" onPress={() => deleteNote(item.id)} />
              </View>
            )}
            onPress={() => navigation.navigate('NoteDetail', { noteId: item.id })}
            style={styles.listItem}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
             <List.Item title="Заметок не найдено" description={searchQuery ? "Попробуйте изменить запрос" : "Нажмите '+' чтобы добавить"} />
          </View>
        }
      />

      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => navigation.navigate('NoteDetail')}
        color={theme.colors.onPrimary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    paddingBottom: 8,
    backgroundColor: '#f5f5f5',
  },
  searchBar: {
    margin: 8,
  },
  chipsContainer: {
    paddingHorizontal: 8,
    flexDirection: 'row',
  },
  chip: {
    marginRight: 8,
  },
  listItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 5,
    backgroundColor: 'white',
  },
  listItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyContainer: {
    marginTop: 50,
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#6200ee',
  },
});

