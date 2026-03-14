import { View, Text, TouchableOpacity, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useMemo } from 'react';
import { Check, Search, Globe } from 'lucide-react-native';
import { router } from 'expo-router';
import { cn } from '@/lib/utils';
import { useThemeStore, useAppTheme } from '@/store/theme-store';
import * as Haptics from 'expo-haptics';
import { Input } from '@/components/ui/input';

const LANGUAGE_OPTIONS = [
  { id: 'en', title: 'English', subtitle: 'English' },
  { id: 'hi', title: 'Hindi', subtitle: 'हिन्दी' },
  { id: 'bn', title: 'Bengali', subtitle: 'বাংলা' },
  { id: 'te', title: 'Telugu', subtitle: 'తెలుగు' },
  { id: 'mr', title: 'Marathi', subtitle: 'मराठी' },
  { id: 'ta', title: 'Tamil', subtitle: 'தமிழ்' },
  { id: 'ur', title: 'Urdu', subtitle: 'اردو' },
  { id: 'gu', title: 'Gujarati', subtitle: 'ગુજરાતી' },
  { id: 'kn', title: 'Kannada', subtitle: 'ಕನ್ನಡ' },
  { id: 'ml', title: 'Malayalam', subtitle: 'മലയാളം' },
  { id: 'or', title: 'Odia', subtitle: 'ଓଡ଼ିଆ' },
  { id: 'pa', title: 'Punjabi', subtitle: 'ਪੰਜਾਬੀ' },
  { id: 'as', title: 'Assamese', subtitle: 'অসমীয়া' },
  { id: 'ma', title: 'Manipuri', subtitle: 'মৈতৈলোন' },
  { id: 'ks', title: 'Kashmiri', subtitle: 'کأشُر' },
  { id: 'sa', title: 'Sanskrit', subtitle: 'संस्कृतम्' },
  { id: 'sd', title: 'Sindhi', subtitle: 'سنڌي' },
  { id: 'ne', title: 'Nepali', subtitle: 'नेपाली' },
  { id: 'ko', title: 'Konkani', subtitle: 'कोंकणी' },
  { id: 'do', title: 'Dogri', subtitle: 'डोगरी' },
  { id: 'mai', title: 'Maithili', subtitle: 'मैथिली' },
  { id: 'bod', title: 'Bodo', subtitle: 'बड़ो' },
  { id: 'sat', title: 'Santali', subtitle: 'সংताली' },
];

export default function LanguageSettingsScreen() {
  const insets = useSafeAreaInsets();
  const { brandColor, isDark } = useAppTheme();
  const currentLanguage = useThemeStore((state) => state.language);
  const setLanguage = useThemeStore((state) => state.setLanguage);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLanguages = useMemo(() => {
    return LANGUAGE_OPTIONS.filter(
      (lang) =>
        lang.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lang.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const handleSelectLanguage = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLanguage(id);
    router.back();
  };

  return (
    <View className="flex-1 bg-background">
      {/* Premium Search Bar using UI Input Component */}
      <View className="px-5 py-4">
        <View className="flex-row items-center bg-muted/40 rounded-2xl px-4 h-11 border border-border/10">
          <Search size={16} color={isDark ? '#71717a' : '#a1a1aa'} strokeWidth={2.5} />
          <Input
            placeholder="Search language..."
            className="flex-1 ml-1 h-10 border-0 !bg-transparent text-[15px] font-semibold shadow-none"
            placeholderTextColor={isDark ? '#52525b' : '#a1a1aa'}
            value={searchQuery}
            onChangeText={setSearchQuery}
            cursorColor={brandColor}
            autoFocus={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity 
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSearchQuery('');
              }}
              className="bg-muted/60 h-5 w-5 rounded-full items-center justify-center"
            >
              <Text className="text-[9px] font-bold text-muted-foreground">✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Language List */}
      <FlatList
        data={filteredLanguages}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ 
          paddingHorizontal: 20, 
          paddingBottom: insets.bottom + 40 
        }}
        renderItem={({ item }) => {
          const isSelected = currentLanguage === item.id;
          return (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => handleSelectLanguage(item.id)}
              className={cn(
                "flex-row items-center py-4 px-6 rounded-3xl mb-3 border",
                isSelected 
                  ? "bg-brand/5 border-brand/20 shadow-sm shadow-brand/10" 
                  : "bg-muted/5 border-transparent"
              )}
            >
              <View className="flex-1">
                <Text className={cn(
                  "text-[17px] font-bold tracking-tight",
                  isSelected ? "text-brand" : "text-foreground"
                )}>
                  {item.title}
                </Text>
                <Text className={cn(
                  "text-[13px] font-semibold mt-0.5",
                  isSelected ? "text-brand/60" : "text-muted-foreground/40"
                )}>
                  {item.subtitle}
                </Text>
              </View>
              
              <View className={cn(
                "h-6 w-6 rounded-full items-center justify-center border-2",
                isSelected 
                  ? "bg-brand border-brand" 
                  : "border-muted-foreground/10"
              )}>
                {isSelected && <Check size={14} color="#fff" strokeWidth={4} />}
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View className="items-center justify-center py-24 px-10">
            <View className="h-20 w-20 rounded-full bg-muted/10 items-center justify-center mb-6">
              <Globe size={40} color={isDark ? '#27272a' : '#e4e4e7'} strokeWidth={1.2} />
            </View>
            <Text className="text-foreground text-lg font-bold text-center">
              No languages found
            </Text>
            <Text className="text-muted-foreground mt-2 text-[14px] font-medium text-center leading-5">
              We couldn't find any language matching "{searchQuery}"
            </Text>
          </View>
        }
      />
    </View>
  );
}
