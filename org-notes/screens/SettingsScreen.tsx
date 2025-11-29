import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Appbar, RadioButton, Text, useTheme } from 'react-native-paper';
import { StorageManager } from '../services/StorageManager';
import { StorageType } from '../types/storage';

const storageManager = StorageManager.getInstance();

export default function SettingsScreen({ navigation }) {
  const [selectedStorage, setSelectedStorage] = useState<StorageType>('sqlite');
  const theme = useTheme();

  useEffect(() => {
    const fetchCurrentStorageType = async () => {
      try {
        await storageManager.init(); // Ensure manager is initialized to get current type
        setSelectedStorage(storageManager.getCurrentStorageType());
      } catch (error) {
        console.error('Failed to get current storage type:', error);
        Alert.alert('Ошибка', 'Не удалось получить текущий тип хранилища.');
      }
    };
    fetchCurrentStorageType();
  }, []);

  const handleStorageChange = async (newValue: StorageType) => {
    try {
      await storageManager.switchStorageType(newValue);
      setSelectedStorage(newValue);
      Alert.alert('Успех', `Тип хранилища изменен на ${newValue === 'sqlite' ? 'SQLite' : 'Файловая система'}.`);
    } catch (error) {
      console.error('Failed to switch storage type:', error);
      Alert.alert('Ошибка', 'Не удалось изменить тип хранилища.');
    }
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Настройки Хранилища" />
      </Appbar.Header>

      <View style={styles.content}>
        <Text variant="titleMedium" style={styles.sectionTitle}>Выберите тип хранилища:</Text>
        <RadioButton.Group onValueChange={handleStorageChange} value={selectedStorage}>
          <View style={styles.radioButtonContainer}>
            <RadioButton value="sqlite" />
            <Text variant="bodyLarge">SQLite (локальная база данных)</Text>
          </View>
          <View style={styles.radioButtonContainer}>
            <RadioButton value="file-system" />
            <Text variant="bodyLarge">Файловая система (файлы JSON)</Text>
          </View>
        </RadioButton.Group>
        <Text variant="bodySmall" style={styles.warningText}>
          Изменение типа хранилища не переносит существующие заметки.
          Заметки будут доступны только в выбранном типе хранилища.
        </Text>
      </View>
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
  sectionTitle: {
    marginBottom: 10,
  },
  radioButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  warningText: {
    marginTop: 20,
    color: 'gray',
    fontStyle: 'italic',
  },
});
