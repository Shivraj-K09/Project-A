import * as React from 'react';
import { View, Platform } from 'react-native';
import Animated, { 
  FadeInUp, 
  FadeOutUp, 
  Layout, 
  Easing
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { cva, type VariantProps } from 'class-variance-authority';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react-native';
import { Text } from './text';
import { cn } from '@/lib/utils';
import { useColorScheme } from 'nativewind';

const toastVariants = cva(
  'flex-row items-center gap-3 rounded-xl border bg-popover px-4 py-3 shadow-sm min-w-[320px] max-w-[95%]',
  {
    variants: {
      variant: {
        default: 'border-border shadow-black/5',
        success: 'border-green-500/20 shadow-green-500/5',
        error: 'border-destructive/20 shadow-destructive/5',
        info: 'border-brand/20 shadow-brand/5',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const iconVariants = {
  default: { icon: Info, color: '#71717a' },
  success: { icon: CheckCircle2, color: '#22c55e' },
  error: { icon: AlertCircle, color: '#ef4444' },
  info: { icon: Info, color: '#6366f1' },
};

type ToastVariant = NonNullable<VariantProps<typeof toastVariants>['variant']>;

interface ToastProps extends VariantProps<typeof toastVariants> {
  id: string;
  message: string;
  onHide: (id: string) => void;
  duration?: number;
}

const AnimatedView = Animated.createAnimatedComponent(View);

/**
 * Professional Minimal Toast (Shadcn/Sonner Style)
 */
function ToastItem({ id, message, variant = 'default', onHide, duration = 3000 }: ToastProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { icon: Icon, color } = iconVariants[variant as ToastVariant] || iconVariants.default;

  React.useEffect(() => {
    // Auto-hide timer
    const timer = setTimeout(() => {
      onHide(id);
    }, duration);
    return () => clearTimeout(timer);
  }, [id, duration, onHide]);

  return (
    <AnimatedView
      entering={FadeInUp.duration(300).easing(Easing.out(Easing.quad))} 
      exiting={FadeOutUp.duration(200)}
      layout={Layout.duration(300)}
      className="mb-2.5"
    >
      <View className={cn(toastVariants({ variant }))}>
        {/* Simple Icon without distracting backgrounds */}
        <Icon size={18} color={color} strokeWidth={2.5} />
        
        {/* Subtle, Clean Text */}
        <View className="flex-1">
          <Text className="text-[14px] font-semibold text-foreground tracking-tight">
            {message}
          </Text>
        </View>
      </View>
    </AnimatedView>
  );
}

// ─── Toast Context & Hook ───────────────────────────────────

type ToastType = {
  id: string;
  message: string;
  variant?: ToastVariant;
  duration?: number;
};

type ToastContextType = {
  toast: (options: Omit<ToastType, 'id'>) => void;
};

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

/**
 * ToastProvider to manage multiple toasts
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastType[]>([]);
  const insets = useSafeAreaInsets();

  const addToast = React.useCallback(({ message, variant = 'default', duration = 3000 }: Omit<ToastType, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    
    // Maintain professional haptics
    if (variant === 'success') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if (variant === 'error') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setToasts((prev) => [...prev, { id, message, variant, duration }]);
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      {/* Toast Container Overlay */}
      <View 
        pointerEvents="box-none"
        className="absolute left-0 right-0 top-0 items-center z-[100] px-4"
        style={{ paddingTop: insets.top + (Platform.OS === 'ios' ? 8 : 16) }}
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} {...t} onHide={removeToast} />
        ))}
      </View>
    </ToastContext.Provider>
  );
}
