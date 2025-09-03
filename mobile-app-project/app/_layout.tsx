import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';
import { QueryClient, QueryClientProvider } from 'react-query';

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <PaperProvider>
        <SafeAreaProvider>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <Stack>
              <Stack.Screen name="index" options={{ title: 'Home' }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="login" options={{ title: 'Login' }} />
              <Stack.Screen name="camera" options={{ title: 'Camera' }} />
              <Stack.Screen name="profile" options={{ title: 'Profile' }} />
            </Stack>
            <StatusBar style="auto" />
          </GestureHandlerRootView>
        </SafeAreaProvider>
      </PaperProvider>
    </QueryClientProvider>
  );
}