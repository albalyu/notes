import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { Appbar, TextInput, Button, useTheme } from 'react-native-paper';
import { StorageManager } from '../services/StorageManager';
import { Note } from '../types/storage';
import 'react-native-get-random-values'; // Required for uuid
import { v4 as uuidv4 } from 'uuid';

const storageManager = StorageManager.getInstance();

export default function NoteDetailScreen({ route, navigation }) {
  const { noteId } = route.params || {};
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isNewNote, setIsNewNote] = useState(true);
  const theme = useTheme();

  useEffect(() => {
    if (noteId) {
      setIsNewNote(false);
      const fetchNote = async () => {
        try {
          const note = await storageManager.getNoteById(noteId);
          if (note) {
            setTitle(note.title);
            setContent(note.content);
          } else {
            Alert.alert('Ошибка', 'Заметка не найдена.');
            navigation.goBack();
          }
        } catch (error) {
          console.error('Failed to fetch note:', error);
          Alert.alert('Ошибка', 'Не удалось загрузить заметку.');
          navigation.goBack();
        }
      };
      fetchNote();
    } else {
      setIsNewNote(true);
      setTitle('');
      setContent('');
    }
  }, [noteId, navigation]);

  const saveNote = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Ошибка', 'Заголовок и содержание заметки не могут быть пустыми.');
      return;
    }

    const now = new Date();
    const date = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const time = now.toTimeString().split(' ')[0].substring(0, 5); // HH:MM

    const newOrUpdatedNote: Note = {
      id: noteId || uuidv4(),
      title,
      content,
      date,
      time,
    };

    try {
      await storageManager.saveNote(newOrUpdatedNote);
      Alert.alert('Успех', isNewNote ? 'Заметка успешно создана!' : 'Заметка успешно обновлена!', [
        { text: 'ОК', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('Failed to save note:', error);
      Alert.alert('Ошибка', 'Не удалось сохранить заметку.');
    }
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={isNewNote ? 'Новая Заметка' : 'Редактировать Заметку'} />
        <Appbar.Action icon="content-save" onPress={saveNote} />
      </Appbar.Header>

      <ScrollView style={styles.content}>
        <TextInput
          label="Заголовок"
          value={title}
          onChangeText={setTitle}
          mode="outlined"
          style={styles.input}
          maxLength={100}
        />
        <TextInput
          label="Содержание"
          value={content}
          onChangeText={setContent}
          mode="outlined"
          multiline
          numberOfLines={10}
          style={styles.input}
        />
        <Button mode="contained" onPress={saveNote} style={styles.button}>
          {isNewNote ? 'Создать Заметку' : 'Сохранить Изменения'}
        </Button>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
    backgroundColor: '#6200ee', // Example color
  },
});
