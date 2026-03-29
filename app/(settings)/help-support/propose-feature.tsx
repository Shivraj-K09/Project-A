import { Button } from '@/components/ui/button';
import { InlinePicker } from '@/components/ui/inline-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/auth-context';
import { useUserProfile } from '@/hooks/use-user';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/toast';
import { useRouter } from 'expo-router';
import { MessageSquare, Send, Shield, Layout, Zap, Loader2 } from 'lucide-react-native';
import { useState, useCallback } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CATEGORIES = [
  { label: 'Security & Safety', value: 'Security', icon: Shield },
  { label: 'Messaging & Chats', value: 'Messaging', icon: MessageSquare },
  { label: 'User Interface', value: 'Interface', icon: Layout },
  { label: 'Core System', value: 'System', icon: Zap },
];

const TITLE_LIMIT = 50;
const DESC_LIMIT = 500;

export default function ProposeFeatureScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { data: profile } = useUserProfile();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
  });

  const handleSubmit = useCallback(async () => {
    if (!user || !profile?.id) return;

    if (
      !formData.title.trim() ||
      !formData.description.trim() ||
      !formData.category ||
      formData.title.length > TITLE_LIMIT ||
      formData.description.length > DESC_LIMIT
    ) {
      toast({ message: 'Please fill all fields correctly', variant: 'error' });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.from('feature_requests').insert({
        user_id: profile.id,
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
      });

      if (error) throw error;

      toast({ message: 'Request submitted successfully!', variant: 'success' });
      router.back();
    } catch (err: any) {
      toast({ message: err.message || 'Failed to submit request', variant: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [formData, user, profile?.id, router, toast]);

  const handleCategoryChange = useCallback((val: string) => {
    setFormData((prev) => ({ ...prev, category: val }));
  }, []);

  return (
    <View className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingTop: 32,
            paddingBottom: insets.bottom + 160,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          <View className="gap-8 px-6">
            {/* Modular Inline Picker - Now perfectly unified */}
            <InlinePicker
              label="Category"
              placeholder="Select a category"
              value={formData.category}
              onValueChange={handleCategoryChange}
              options={CATEGORIES}
            />

            {/* Title Block */}
            <View className="gap-2">
              <Label className="font-semibol ml-1 text-xs uppercase tracking-wider text-foreground">
                Feature Title
              </Label>
              <Input
                placeholder="What's on your mind?"
                value={formData.title}
                onChangeText={(text) => setFormData((prev) => ({ ...prev, title: text }))}
                maxLength={TITLE_LIMIT}
                className="h-14 rounded-lg border border-border !bg-transparent px-4 text-base text-foreground"
                placeholderClassName="text-muted-foreground"
              />
              <Text className="font-semibol mr-1 text-right text-[10px] tabular-nums text-muted-foreground">
                {formData.title.length} / {TITLE_LIMIT}
              </Text>
            </View>

            {/* Description Block */}
            <View className="gap-2">
              <Label className="font-semibol ml-1 text-xs uppercase tracking-wider text-foreground">
                Description
              </Label>
              <Textarea
                placeholder="Tell us more about this feature..."
                value={formData.description}
                onChangeText={(text) => setFormData((prev) => ({ ...prev, description: text }))}
                maxLength={DESC_LIMIT}
                className="min-h-[160px] rounded-lg border border-border !bg-transparent p-4 text-base text-foreground"
                placeholderClassName="text-muted-foreground"
              />
              <Text className="font-semibol mr-1 text-right text-[10px] tabular-nums text-muted-foreground">
                {formData.description.length} / {DESC_LIMIT}
              </Text>
            </View>

            {/* Submit Action */}
            <View className="mt-4">
              <Button
                size="lg"
                className="h-[60px] flex-row items-center justify-center rounded-lg bg-brand active:bg-brand/80"
                onPress={handleSubmit}
                disabled={
                  isLoading || !formData.title || !formData.description || !formData.category
                }>
                {isLoading ? (
                  <Loader2 size={18} color="#fff" className="animate-spin" />
                ) : (
                  <>
                    <Send size={18} color="#fff" strokeWidth={2.5} className="mr-3" />
                    <Text className="font-semibol text-lg text-white">Propose Feature</Text>
                  </>
                )}
              </Button>

              <Text className="mt-8 px-8 text-center text-xs font-medium leading-5 text-muted-foreground opacity-60">
                Each suggestion is reviewed by our community. Make it meaningful!
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
