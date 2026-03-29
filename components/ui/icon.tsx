import { cn } from '@/lib/utils';
import type { LucideIcon, LucideProps } from 'lucide-react-native';
import { Svg, Path, SvgProps } from 'react-native-svg';
import { cssInterop } from 'nativewind';

type IconProps = LucideProps & {
  as: LucideIcon | React.ComponentType<any>;
};

const UserIcon = ({ size = 24, color = 'currentColor', ...props }: any) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
    <Path
      d="M12.1601 10.87C12.0601 10.86 11.9401 10.86 11.8301 10.87C9.45006 10.79 7.56006 8.84 7.56006 6.44C7.56006 3.99 9.54006 2 12.0001 2C14.4501 2 16.4401 3.99 16.4401 6.44C16.4301 8.84 14.5401 10.79 12.1601 10.87Z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M7.16021 14.56C4.74021 16.18 4.74021 18.82 7.16021 20.43C9.91021 22.27 14.4202 22.27 17.1702 20.43C19.5902 18.81 19.5902 16.17 17.1702 14.56C14.4302 12.73 9.92021 12.73 7.16021 14.56Z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

function IconImpl({ as: IconComponent, ...props }: IconProps) {
  return <IconComponent {...props} />;
}

cssInterop(IconImpl, {
  className: {
    target: 'style',
    nativeStyleToProp: {
      height: 'size',
      width: 'size',
      color: true,
    },
  },
});

/**
 * A wrapper component for Lucide icons with Nativewind `className` support via `cssInterop`.
 *
 * This component allows you to render any Lucide icon while applying utility classes
 * using `nativewind`. It avoids the need to wrap or configure each icon individually.
 *
 * @component
 * @example
 * ```tsx
 * import { ArrowRight } from 'lucide-react-native';
 * import { Icon } from '@/registry/components/ui/icon';
 *
 * <Icon as={ArrowRight} className="text-red-500" size={16} />
 * ```
 *
 * @param {LucideIcon} as - The Lucide icon component to render.
 * @param {string} className - Utility classes to style the icon using Nativewind.
 * @param {number} size - Icon size (defaults to 14).
 * @param {...LucideProps} ...props - Additional Lucide icon props passed to the "as" icon.
 */
function Icon({ as: IconComponent, className, size = 14, color, ...props }: IconProps) {
  return (
    <IconImpl
      as={IconComponent}
      className={cn(!color && 'text-foreground', className)}
      size={size}
      color={color}
      {...props}
    />
  );
}

export { Icon, UserIcon };
