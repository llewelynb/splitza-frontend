import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '../src/components/theme';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: Colors.surface },
          headerTintColor: Colors.text,
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: Colors.background },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="session/new" options={{ title: 'New Bill' }} />
        <Stack.Screen name="session/[id]/scan" options={{ title: 'Scan Receipt' }} />
        <Stack.Screen name="session/[id]/review" options={{ title: 'Review Items' }} />
        <Stack.Screen name="session/[id]/people" options={{ title: 'Add People' }} />
        <Stack.Screen name="session/[id]/assign" options={{ title: 'Assign Items' }} />
        <Stack.Screen name="session/[id]/payment-mode" options={{ title: 'Payment Mode' }} />
        <Stack.Screen name="session/[id]/adjustments" options={{ title: 'Adjustments' }} />
        <Stack.Screen name="session/[id]/summary" options={{ title: 'Final Summary' }} />
      </Stack>
    </QueryClientProvider>
  );
}
