import React, { useState, useEffect, useCallback } from 'react';
import { FlatList, View, StyleSheet, Alert } from 'react-native';
import { Appbar, FAB, List, Searchbar, useTheme } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { StorageManager } from '../services/StorageManager';
import { Note } from '../types/storage';

const storageManager = StorageManager.getInstance();

export default function HomeScreen({ navigation }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const theme = useTheme();

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
      fetchNotes();
      const unsubscribe = navigation.addListener('focus', fetchNotes);
      return () => unsubscribe();
    }, [fetchNotes, navigation])
  );

  useEffect(() => {
    // Initial fetch when component mounts
    fetchNotes();
  }, [fetchNotes]);

  const handleSearch = async () => {
    if (searchQuery.trim() === '') {
      fetchNotes();
      return;
    }
    try {
      const searchedNotes = await storageManager.searchNotes(searchQuery, 'all');
      setNotes(searchedNotes);
    } catch (error) {
      console.error('Failed to search notes:', error);
      Alert.alert('Ошибка', 'Не удалось выполнить поиск заметок.');
    }
  };

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
              fetchNotes(); // Refresh the list
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

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="Мои Заметки" />
        <Appbar.Action icon="cog" onPress={() => navigation.navigate('Settings')} />
      </Appbar.Header>

      <Searchbar
        placeholder="Поиск заметок..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        onIconPress={handleSearch}
        onSubmitEditing={handleSearch}
        style={styles.searchBar}
      />

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
        ListEmptyComponent={<List.Item title="Заметок пока нет" description="Нажмите '+' чтобы добавить новую" />}
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
  searchBar: {
    margin: 8,
  },
  listItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 5,
  },
  listItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#6200ee', // Example color
  },
});
