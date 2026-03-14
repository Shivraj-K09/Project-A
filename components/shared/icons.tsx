// Auto-generated icons file - managed by better-icons
// Do not edit manually - use sync_icon to add new icons

import React from "react";
import Svg, { Path, Circle, G, SvgProps } from "react-native-svg";
import { cssInterop } from 'nativewind';
import * as LucideIcons from 'lucide-react-native';
import { useAppTheme } from '@/store/theme-store';

// 1. Enable Tailwind class support for ALL Lucide Icons
// This allows you to use className="text-brand" instead of passing a color prop
Object.values(LucideIcons).forEach((Icon: any) => {
  if (typeof Icon === 'function' || (typeof Icon === 'object' && Icon !== null)) {
    cssInterop(Icon, {
      className: {
        target: 'style',
        nativeStyleToProp: {
          color: true,
          fill: true,
        },
      },
    });
  }
});

/**
 * A wrapper for Lucide icons that automatically uses the brand color
 * if no color or className is provided.
 */
export function ThemedIcon({ 
  icon: Icon, 
  size = 20, 
  className,
  color,
  ...props 
}: { 
  icon: any; 
  size?: number; 
  className?: string;
  color?: string;
  [key: string]: any;
}) {
  const { brandColor } = useAppTheme();
  
  return (
    <Icon 
      size={size} 
      color={color || (className ? undefined : brandColor)} 
      className={className}
      {...props} 
    />
  );
}

// solar:chat-round-bold
export const ChatRoundBoldIcon = (props: SvgProps) => (
  <Svg {...props} width="24" height="24" viewBox="0 0 24 24"><Path fill="currentColor" d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2S2 6.477 2 12c0 1.6.376 3.112 1.043 4.453c.178.356.237.763.134 1.148l-.595 2.226a1.3 1.3 0 0 0 1.591 1.592l2.226-.596a1.63 1.63 0 0 1 1.149.133A9.96 9.96 0 0 0 12 22"/></Svg>
);

// solar:chat-round-linear
export const ChatRoundLinearIcon = (props: SvgProps) => (
  <Svg {...props} width="24" height="24" viewBox="0 0 24 24"><Path fill="none" stroke="currentColor" strokeWidth="1.5" d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2S2 6.477 2 12c0 1.6.376 3.112 1.043 4.453c.178.356.237.763.134 1.148l-.595 2.226a1.3 1.3 0 0 0 1.591 1.592l2.226-.596a1.63 1.63 0 0 1 1.149.133A9.96 9.96 0 0 0 12 22Z"/></Svg>
);

// solar:camera-bold
export const CameraBoldIcon = (props: SvgProps) => (
  <Svg {...props} width="24" height="24" viewBox="0 0 24 24"><Path fill="currentColor" fillRule="evenodd" d="M9.778 21h4.444c3.121 0 4.682 0 5.803-.735a4.4 4.4 0 0 0 1.226-1.204c.749-1.1.749-2.633.749-5.697s0-4.597-.749-5.697a4.4 4.4 0 0 0-1.226-1.204c-.72-.473-1.622-.642-3.003-.702c-.659 0-1.226-.49-1.355-1.125A2.064 2.064 0 0 0 13.634 3h-3.268c-.988 0-1.839.685-2.033 1.636c-.129.635-.696 1.125-1.355 1.125c-1.38.06-2.282.23-3.003.702A4.4 4.4 0 0 0 2.75 7.667C2 8.767 2 10.299 2 13.364s0 4.596.749 5.697c.324.476.74.885 1.226 1.204C5.096 21 6.657 21 9.778 21M12 9.273c-2.301 0-4.167 1.831-4.167 4.09S9.7 17.456 12 17.456s4.167-1.832 4.167-4.091S14.3 9.273 12 9.273m0 1.636c-1.38 0-2.5 1.099-2.5 2.455c0 1.355 1.12 2.454 2.5 2.454s2.5-1.099 2.5-2.454s-1.12-2.455-2.5-2.455m4.722-.818c0-.452.373-.818.834-.818h1.11c.46 0 .834.366.834.818a.826.826 0 0 1-.833.818h-1.111a.826.826 0 0 1-.834-.818" clipRule="evenodd"/></Svg>
);

// solar:camera-linear
export const CameraLinearIcon = (props: SvgProps) => (
  <Svg {...props} width="24" height="24" viewBox="0 0 24 24"><G fill="none" stroke="currentColor" strokeWidth="1.5"><Circle fill="currentColor" cx="12" cy="13" r="3"/><Path fill="currentColor" d="M9.778 21h4.444c3.121 0 4.682 0 5.803-.735a4.4 4.4 0 0 0 1.226-1.204c.749-1.1.749-2.633.749-5.697s0-4.597-.749-5.697a4.4 4.4 0 0 0-1.226-1.204c-.72-.473-1.622-.642-3.003-.702c-.659 0-1.226-.49-1.355-1.125A2.064 2.064 0 0 0 13.634 3h-3.268c-.988 0-1.839.685-2.033 1.636c-.129.635-.696 1.125-1.355 1.125c-1.38.06-2.282.23-3.003.702A4.4 4.4 0 0 0 2.75 7.667C2 8.767 2 10.299 2 13.364s0 4.596.749 5.697c.324.476.74.885 1.226 1.204C5.096 21 6.657 21 9.778 21Z"/><Path fill="currentColor" strokeLinecap="round" d="M19 10h-1"/></G></Svg>
);

// solar:phone-bold
export const PhoneBoldIcon = (props: SvgProps) => (
  <Svg {...props} width="24" height="24" viewBox="0 0 24 24"><Path fill="currentColor" d="m16.556 12.906l-.455.453s-1.083 1.076-4.038-1.862s-1.872-4.014-1.872-4.014l.286-.286c.707-.702.774-1.83.157-2.654L9.374 2.86C8.61 1.84 7.135 1.705 6.26 2.575l-1.57 1.56c-.433.432-.723.99-.688 1.61c.09 1.587.808 5 4.812 8.982c4.247 4.222 8.232 4.39 9.861 4.238c.516-.048.964-.31 1.325-.67l1.42-1.412c.96-.953.69-2.588-.538-3.255l-1.91-1.039c-.806-.437-1.787-.309-2.417.317"/></Svg>
);

// solar:phone-linear
export const PhoneLinearIcon = (props: SvgProps) => (
  <Svg {...props} width="24" height="24" viewBox="0 0 24 24"><Path fill="currentColor" d="m16.1 13.359l-.528-.532zm.456-.453l.529.532zm2.417-.317l-.358.66zm1.91 1.039l-.358.659zm.539 3.255l.529.532zm-1.42 1.412l-.53-.531zm-1.326.67l.07.747zm-9.86-4.238l.528-.532zM4.002 5.746l-.749.042zm6.474 1.451l.53.532zm.157-2.654l.6-.449zM9.374 2.86l-.601.45zM6.26 2.575l.53.532zm-1.57 1.56l-.528-.531zm7.372 7.362l.529-.532zm4.567 2.394l.455-.453l-1.058-1.064l-.455.453zm1.985-.643l1.91 1.039l.716-1.318l-1.91-1.038zm2.278 3.103l-1.42 1.413l1.057 1.063l1.42-1.412zm-2.286 1.867c-1.45.136-5.201.015-9.263-4.023l-1.057 1.063c4.432 4.407 8.65 4.623 10.459 4.454zm-9.263-4.023c-3.871-3.85-4.512-7.087-4.592-8.492l-1.498.085c.1 1.768.895 5.356 5.033 9.47zm1.376-6.18l.286-.286L9.95 6.666l-.287.285zm.515-3.921L9.974 2.41l-1.201.899l1.26 1.684zM5.733 2.043l-1.57 1.56l1.058 1.064l1.57-1.56zm4.458 5.44c-.53-.532-.53-.532-.53-.53h-.002l-.003.004a1 1 0 0 0-.127.157c-.054.08-.113.185-.163.318a2.1 2.1 0 0 0-.088 1.071c.134.865.73 2.008 2.256 3.526l1.058-1.064c-1.429-1.42-1.769-2.284-1.832-2.692c-.03-.194.001-.29.01-.312q.009-.02 0-.006a.3.3 0 0 1-.03.039l-.01.01l-.01.009zm1.343 4.546c1.527 1.518 2.676 2.11 3.542 2.242c.443.068.8.014 1.071-.087a1.5 1.5 0 0 0 .42-.236l.05-.045l.007-.006l.003-.003l.001-.002s.002-.001-.527-.533c-.53-.532-.528-.533-.528-.533l.002-.002l.002-.002l.006-.005l.01-.01l.038-.03q.014-.009-.007.002c-.025.009-.123.04-.32.01c-.414-.064-1.284-.404-2.712-1.824zm-1.56-9.62C8.954 1.049 6.95.834 5.733 2.044L6.79 3.107c.532-.529 1.476-.475 1.983.202zM4.752 5.704c-.02-.346.139-.708.469-1.036L4.163 3.604c-.537.534-.96 1.29-.909 2.184zm14.72 12.06c-.274.274-.57.428-.865.455l.139 1.494c.735-.069 1.336-.44 1.784-.885zM11.006 7.73c.985-.979 1.058-2.527.229-3.635l-1.201.899c.403.539.343 1.246-.085 1.673zm9.52 6.558c.817.444.944 1.49.367 2.064l1.058 1.064c1.34-1.333.927-3.557-.71-4.446zm-3.441-.849c.384-.382 1.002-.476 1.53-.19l.716-1.317c-1.084-.59-2.428-.427-3.304.443z"/></Svg>
);

// solar:user-bold
export const UserBoldIcon = (props: SvgProps) => (
  <Svg {...props} width="24" height="24" viewBox="0 0 24 24"><Circle cx="12" cy="6" r="4" fill="currentColor"/><Path fill="currentColor" d="M20 17.5c0 2.485 0 4.5-8 4.5s-8-2.015-8-4.5S7.582 13 12 13s8 2.015 8 4.5"/></Svg>
);

// solar:user-linear
export const UserLinearIcon = (props: SvgProps) => (
  <Svg {...props} width="24" height="24" viewBox="0 0 24 24"><G fill="none" stroke="currentColor" strokeWidth="1.5"><Circle fill="currentColor" cx="12" cy="6" r="4"/><Path fill="currentColor" d="M20 17.5c0 2.485 0 4.5-8 4.5s-8-2.015-8-4.5S7.582 13 12 13s8 2.015 8 4.5Z"/></G></Svg>
);

// solar:leaf-bold
export const LeafBoldIcon = (props: SvgProps) => (
  <Svg {...props} width="24" height="24" viewBox="0 0 24 24"><Path fill="currentColor" d="M11.25 2.083a3.5 3.5 0 0 0-.713.243C6.553 4.188 4 9.395 4 13.856c0 4.24 3.183 7.724 7.25 8.109zm1.5 19.882c4.067-.385 7.25-3.868 7.25-8.108q0-.61-.063-1.234l-7.187 7.188zM18.26 7.18a13.4 13.4 0 0 0-1.34-2.04l-4.17 4.17v3.38zm-2.352-3.15a9.2 9.2 0 0 0-2.445-1.704a3.5 3.5 0 0 0-.713-.243v5.106zm3.028 4.594l-6.186 6.187v2.878l6.75-6.75l.132-.132a15 15 0 0 0-.696-2.183"/></Svg>
);

// solar:leaf-linear
export const LeafLinearIcon = (props: SvgProps) => (
  <Svg {...props} width="24" height="24" viewBox="0 0 24 24"><Path fill="none" stroke="currentColor" strokeWidth="1.5" d="m12 9l4.5-4.5m-4.5 10L18.5 8M12 19.5l7.5-7.5M12 22c4.418 0 8-3.646 8-8.143c0-4.462-2.553-9.67-6.537-11.531A3.45 3.45 0 0 0 12 2m0 20c-4.418 0-8-3.646-8-8.143c0-4.462 2.553-9.67 6.537-11.531A3.45 3.45 0 0 1 12 2m0 20V2"/></Svg>
);

export * from "./tab-bar-icons";
