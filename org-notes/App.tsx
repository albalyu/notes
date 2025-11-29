import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './screens/HomeScreen'; // We will create this
import NoteDetailScreen from './screens/NoteDetailScreen'; // We will create this
import SettingsScreen from './screens/SettingsScreen'; // We will create this

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <PaperProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Home">
          <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Мои Заметки' }} />
          <Stack.Screen name="NoteDetail" component={NoteDetailScreen} options={{ title: 'Заметка' }} />
          <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Настройки Хранилища' }} />
        </Stack.Navigator>
      </NavigationContainer>
      <StatusBar style="auto" />
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

