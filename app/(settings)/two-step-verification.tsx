import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { Text } from '@/components/ui/text';
import { useToast } from '@/components/ui/toast';
import { useDisableSecurity2FA, useEnableSecurityPin, useSecuritySettings } from '@/hooks/use-user';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { AlertTriangle, Check, Copy, Shield, ArrowLeft } from 'lucide-react-native';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useThemeStore } from '@/store/theme-store';

const EMPTY_PIN = ['', '', '', '', '', ''];

export default function TwoStepVerificationScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { toast } = useToast();
  const brandColor = useThemeStore((state) => state.accentColor);

  const { data: settings, isLoading } = useSecuritySettings();
  const enablePin2FA = useEnableSecurityPin();
  const disable2FA = useDisableSecurity2FA();

  const [wizardStep, setWizardStep] = useState<'none' | 'pin' | 'backup'>('none');
  const [pin, setPin] = useState([...EMPTY_PIN]);
  const pinRefs = useRef<Array<TextInput | null>>([]);
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);
  const [isDisableAlertOpen, setIsDisableAlertOpen] = useState(false);

  const isEnabled = settings?.two_step_verification ?? false;

  const resetWizard = () => {
    setWizardStep('none');
    setPin([...EMPTY_PIN]);
    setGeneratedCodes([]);
  };

  const handleToggle = async (value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (value) {
      setWizardStep('pin');
      return;
    }

    if (isEnabled) {
      setIsDisableAlertOpen(true);
      return;
    }

    resetWizard();
  };

  const confirmDisable = async () => {
    try {
      await disable2FA.mutateAsync();
      toast({ message: 'Verification disabled', variant: 'success' });
      setIsDisableAlertOpen(false);
      resetWizard();
    } catch {
      Alert.alert('Error', 'Failed to disable verification.');
    }
  };

  const handleSetupPin = async () => {
    const pinString = pin.join('');
    if (pinString.length !== 6) return;

    try {
      const result = await enablePin2FA.mutateAsync(pinString);
      setGeneratedCodes(result.backup_codes);
      setWizardStep('backup');
      toast({ message: 'PIN enabled', variant: 'success' });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      console.error(e);
      Alert.alert('Security Error', 'Could not establish PIN. Please try again.');
    }
  };

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <View className="border-b border-border/5 px-6 py-6">
          <Text className="mb-4 text-[12px] font-bold uppercase tracking-wider text-brand">
            Privacy & Protection
          </Text>

          <View className="flex-row items-center justify-between py-3">
            <View className="flex-1 flex-row items-center">
              <View className="mr-4 h-9 w-9 items-center justify-center rounded-xl bg-brand/5">
                <Shield size={18} color={brandColor} strokeWidth={2} />
              </View>
              <View className="flex-1">
                <Text className="text-[16px] font-semibold text-foreground">
                  Two-Step Verification
                </Text>
                <Text className="mt-0.5 text-[12px] text-muted-foreground">
                  Protect your account with an extra layer of security.
                </Text>
              </View>
            </View>
            <Switch checked={isEnabled || wizardStep !== 'none'} onCheckedChange={handleToggle} />
          </View>

          {isEnabled && wizardStep === 'none' && (
            <View className="mt-6 flex-row items-center rounded-2xl border border-emerald-500/10 bg-emerald-500/5 p-4">
              <View className="mr-3 h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20">
                <Check size={12} color="#10b981" strokeWidth={4} />
              </View>
              <Text className="text-[13.5px] font-bold text-emerald-600">Verification Active</Text>
            </View>
          )}
        </View>

        {wizardStep === 'pin' && (
          <View className="px-6 py-6">
            <Text className="mb-6 text-[12px] font-extrabold uppercase tracking-widest text-brand">
              Enter New 6-Digit PIN
            </Text>

            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              className="items-center">
              <View className="mb-8 w-full flex-row justify-between">
                {pin.map((digit, idx) => (
                  <View
                    key={idx}
                    className={`aspect-[2/3] w-[14%] items-center justify-center rounded-2xl border-2 bg-card ${
                      digit ? 'border-brand' : 'border-border/10'
                    }`}>
                    <TextInput
                      ref={(el) => {
                        pinRefs.current[idx] = el;
                      }}
                      className="h-full w-full text-center text-2xl font-black text-foreground"
                      maxLength={1}
                      keyboardType="number-pad"
                      secureTextEntry
                      value={digit}
                      autoFocus={idx === 0}
                      onChangeText={(text) => {
                        const nextPin = [...pin];
                        nextPin[idx] = text.slice(-1);
                        setPin(nextPin);
                        if (text && idx < 5) pinRefs.current[idx + 1]?.focus();
                      }}
                      onKeyPress={({ nativeEvent }) => {
                        if (nativeEvent.key === 'Backspace' && !pin[idx] && idx > 0) {
                          pinRefs.current[idx - 1]?.focus();
                        }
                      }}
                    />
                  </View>
                ))}
              </View>

              <TouchableOpacity
                onPress={handleSetupPin}
                disabled={pin.join('').length !== 6 || enablePin2FA.isPending}
                className={`w-full items-center rounded-2xl py-5 ${
                  pin.join('').length === 6 ? 'bg-brand' : 'bg-brand/30'
                }`}>
                {enablePin2FA.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-[15px] font-black uppercase tracking-widest text-white">
                    Enable PIN
                  </Text>
                )}
              </TouchableOpacity>
            </KeyboardAvoidingView>
          </View>
        )}

        {wizardStep === 'backup' && (
          <View className="px-6 py-6">
            <Text className="mb-4 text-[12px] font-bold uppercase tracking-wider text-brand">
              Backup Codes
            </Text>

            <View className="mb-6 h-[80px] flex-row items-center rounded-[24px] border border-amber-500/20 bg-amber-500/10 px-6">
              <View className="mr-4 h-10 w-10 items-center justify-center rounded-full bg-amber-500/20">
                <AlertTriangle size={20} color="#f59e0b" strokeWidth={2.5} />
              </View>
              <View className="flex-1 justify-center">
                <Text className="text-[14px] font-bold leading-5 text-amber-700">
                  Save these codes. We cannot reset your PIN for you if you lose them.
                </Text>
              </View>
            </View>

            <View className="mb-8 flex-row flex-wrap justify-between rounded-3xl border border-border bg-card p-5">
              {generatedCodes.map((code, index) => (
                <Text
                  key={index}
                  className="w-[48%] py-2 text-center font-mono text-[15px] font-black text-foreground">
                  {code}
                </Text>
              ))}
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                Clipboard.setStringAsync(generatedCodes.join('\n'));
                toast({ message: 'Codes copied', variant: 'success' });
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              className="mb-4 w-full flex-row items-center justify-center rounded-2xl border border-brand/20 bg-brand/5 py-4">
              <Copy size={16} color={brandColor} strokeWidth={2.5} />
              <Text className="ml-2 font-bold text-brand">Copy Codes to Clipboard</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={resetWizard}
              className="w-full items-center rounded-2xl bg-brand py-4">
              <Text className="font-bold uppercase tracking-widest text-white">Complete Setup</Text>
            </TouchableOpacity>
          </View>
        )}

        <View className="mb-10 mt-6 px-10">
          <Text className="text-center text-[11px] font-medium leading-5 text-muted-foreground/50">
            Advanced encryption keeps your account protected.
          </Text>
        </View>
      </ScrollView>

      <AlertDialog open={isDisableAlertOpen} onOpenChange={setIsDisableAlertOpen}>
        <AlertDialogContent className="w-[92%] max-w-[380px] rounded-[32px] bg-card p-8">
          <AlertDialogHeader className="items-start">
            <Text className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-red-500">
              Security Warning
            </Text>
            <AlertDialogTitle className="text-xl font-bold text-foreground">
              Disable 2-Step Verification?
            </AlertDialogTitle>
            <AlertDialogDescription className="mt-2 text-[14px] leading-6 text-muted-foreground/80">
              Your account will be less secure. Your PIN will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <View className="mt-10 flex-row gap-3">
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setIsDisableAlertOpen(false)}
              className="h-14 flex-1 items-center justify-center rounded-2xl border border-border bg-muted/10">
              <Text className="text-[15px] font-semibold text-muted-foreground">Keep Enabled</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={confirmDisable}
              disabled={disable2FA.isPending}
              className="h-14 flex-1 items-center justify-center rounded-2xl bg-red-500">
              {disable2FA.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-[15px] font-bold text-white">Disable</Text>
              )}
            </TouchableOpacity>
          </View>
        </AlertDialogContent>
      </AlertDialog>
    </View>
  );
}
