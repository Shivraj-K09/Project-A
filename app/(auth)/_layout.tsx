import { PortalHost } from '@rn-primitives/portal';
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <>
      <Stack
        initialRouteName="onboarding"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}>
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="login" />
        <Stack.Screen name="phone-setup" options={{ gestureEnabled: false }} />
      </Stack>
      <PortalHost />
    </>
  );
}
