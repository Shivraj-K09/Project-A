import { Check, Clock3 } from 'lucide-react-native';
import { View } from 'react-native';

type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'error' | undefined;

type MessageStatusIconProps = {
  status: MessageStatus;
  brandColor: string;
  isDark: boolean;
  colorOnMine?: boolean;
};

/**
 * 💎 CUSTOM DUOTONE STATUS COMPONENT
 * Created by layering free Lucide icons to achieve a premium "Duo-Check" look.
 * This matches your custom Accent Colors for a unique, branded messaging experience.
 */
export function MessageStatusIcon({
  status,
  brandColor,
  isDark,
  colorOnMine = false,
}: MessageStatusIconProps) {
  if (!status || status === 'error') return null;

  const iconSize = 13.5;
  const stroke = 2.4;
  const overlap = -iconSize * 0.58; // The perfect mathematical overlap for Lucide's "Check"

  // STATE-AWARE COLOR PALETTE
  const colors = {
    // 🔘 Grays for background
    unseen: isDark ? '#475569' : '#94a3b8',
    // ⚪ Glassy Whites for colored bubbles
    bubbleUnseen: 'rgba(255, 255, 255, 0.45)',
    bubbleSeen: '#FFFFFF',
    // ✨ Your Custom Accent for "Seen" (e.g. Indigo, Rose, Sky)
    seen: brandColor,
  };

  // Helper to render the custom composite checkmarks
  const renderDuoCheck = () => {
    // Color 1: The back checkmark
    const c1 = colorOnMine ? colors.bubbleUnseen : colors.unseen;
    
    // Color 2: The front checkmark (Lights up when 'read'!)
    let c2: string | null = null;
    if (status === 'delivered') {
      c2 = colorOnMine ? colors.bubbleUnseen : colors.unseen;
    } else if (status === 'read') {
      c2 = colorOnMine ? colors.bubbleSeen : colors.seen;
    }

    return (
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {/* Base Check */}
        <Check size={iconSize} color={c1} strokeWidth={stroke} />
        
        {/* Layered Accent Check (Custom Offset) */}
        {c2 && (
          <View style={{ marginLeft: overlap }}>
            <Check size={iconSize} color={c2} strokeWidth={stroke} />
          </View>
        )}
      </View>
    );
  };

  // RENDER LOGIC
  switch (status) {
    case 'pending':
      return (
        <Clock3 
          size={iconSize - 2} 
          color={colorOnMine ? colors.bubbleUnseen : colors.unseen} 
          strokeWidth={2.4} 
        />
      );

    case 'sent':
    case 'delivered':
    case 'read':
      return renderDuoCheck();

    default:
      return null;
  }
}
