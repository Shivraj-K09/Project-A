import { CameraView, useCameraPermissions, type CameraType } from 'expo-camera';
import { useRouter } from 'expo-router';
import { FlipHorizontal as FlipIcon, X } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cssInterop } from 'nativewind';
import { cn } from '@/lib/utils';

cssInterop(CameraView, { className: 'style' });

export default function CameraScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [type, setType] = useState<CameraType>('back');
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const cameraRef = useRef<CameraView | null>(null);

  const handleCapture = async () => {
    if (!cameraRef.current || isCapturing) return;

    setIsCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.85 });
      if (photo?.uri) {
        setCapturedUri(photo.uri);
      }
    } catch (error) {
      Alert.alert('Capture failed', 'Unable to take photo right now. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  };

  if (!permission) {
    return <View className="flex-1 bg-black" />;
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 items-center justify-center bg-black p-6">
        <Text className="mb-6 text-center text-xl text-white">We need camera access</Text>
        <Pressable onPress={requestPermission} className="rounded-full bg-white px-8 py-4">
          <Text className="font-semibol text-black">Grant Permission</Text>
        </Pressable>
      </View>
    );
  }

  if (capturedUri) {
    return (
      <View className="flex-1 bg-black">
        <Image source={{ uri: capturedUri }} className="flex-1" resizeMode="cover" />

        <View
          className="absolute inset-x-0 bottom-0 flex-row items-center justify-between p-6"
          style={{ paddingBottom: insets.bottom + 28 }}>
          <Pressable
            onPress={() => setCapturedUri(null)}
            className="rounded-full bg-black/50 px-6 py-3">
            <Text className="font-semibol text-white">Retake</Text>
          </Pressable>

          <Pressable onPress={() => router.back()} className="rounded-full bg-white px-6 py-3">
            <Text className="font-semibol text-black">Use Photo</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <CameraView ref={cameraRef} className="flex-1" facing={type}>
        <View
          className="flex-1 justify-between p-6"
          style={{ paddingTop: insets.top + 20, paddingBottom: insets.bottom + 40 }}>
          <View className="flex-row justify-between">
            <Pressable onPress={() => router.back()} className="rounded-full bg-black/40 p-2">
              <X color="white" size={28} />
            </Pressable>
          </View>

          <View className="flex-row items-center justify-around">
            <View className="w-10" />
            <Pressable
              className={cn(
                'h-20 w-20 items-center justify-center rounded-full border-4 border-white',
                isCapturing && 'opacity-50'
              )}
              onPress={() => void handleCapture()}
              disabled={isCapturing}>
              {isCapturing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View className="h-16 w-16 rounded-full bg-white" />
              )}
            </Pressable>
            <Pressable
              onPress={() => setType((t) => (t === 'back' ? 'front' : 'back'))}
              className="rounded-full bg-black/40 p-2"
              disabled={isCapturing}>
              <FlipIcon color="white" size={28} />
            </Pressable>
          </View>
        </View>
      </CameraView>
    </View>
  );
}
