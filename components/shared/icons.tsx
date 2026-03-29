// Auto-generated icons file - managed by better-icons
// Do not edit manually - use sync_icon to add new icons

import React from 'react';
import Svg, { Path, Circle, G, SvgProps, Polyline, Rect, Defs, ClipPath } from 'react-native-svg';
import { cssInterop } from 'nativewind';
import * as LucideIcons from 'lucide-react-native';
import { useAppTheme } from '@/store/theme-store';

// 1. Enable Tailwind class support for ALL Lucide Icons
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
  <Svg {...props} width="24" height="24" viewBox="0 0 24 24">
    <Path
      fill="currentColor"
      d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2S2 6.477 2 12c0 1.6.376 3.112 1.043 4.453c.178.356.237.763.134 1.148l-.595 2.226a1.3 1.3 0 0 0 1.591 1.592l2.226-.596a1.63 1.63 0 0 1 1.149.133A9.96 9.96 0 0 0 12 22"
    />
  </Svg>
);

// solar:chat-round-linear
export const ChatRoundLinearIcon = (props: SvgProps) => (
  <Svg {...props} width="24" height="24" viewBox="0 0 24 24">
    <Path
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2S2 6.477 2 12c0 1.6.376 3.112 1.043 4.453c.178.356.237.763.134 1.148l-.595 2.226a1.3 1.3 0 0 0 1.591 1.592l2.226-.596a1.63 1.63 0 0 1 1.149.133A9.96 9.96 0 0 0 12 22Z"
    />
  </Svg>
);

// solar:camera-bold
export const CameraBoldIcon = (props: SvgProps) => (
  <Svg {...props} width="24" height="24" viewBox="0 0 24 24">
    <Path
      fill="currentColor"
      fillRule="evenodd"
      d="M9.778 21h4.444c3.121 0 4.682 0 5.803-.735a4.4 4.4 0 0 0 1.226-1.204c.749-1.1.749-2.633.749-5.697s0-4.597-.749-5.697a4.4 4.4 0 0 0-1.226-1.204c-.72-.473-1.622-.642-3.003-.702c-.659 0-1.226-.49-1.355-1.125A2.064 2.064 0 0 0 13.634 3h-3.268c-.988 0-1.839.685-2.033 1.636c-.129.635-.696 1.125-1.355 1.125c-1.38.06-2.282.23-3.003.702A4.4 4.4 0 0 0 2.75 7.667C2 8.767 2 10.299 2 13.364s0 4.596.749 5.697c.324.476.74.885 1.226 1.204C5.096 21 6.657 21 9.778 21M12 9.273c-2.301 0-4.167 1.831-4.167 4.09S9.7 17.456 12 17.456s4.167-1.832 4.167-4.091S14.3 9.273 12 9.273m0 1.636c-1.38 0-2.5 1.099-2.5 2.455c0 1.355 1.12 2.454 2.5 2.454s2.5-1.099 2.5-2.454s-1.12-2.455-2.5-2.455m4.722-.818c0-.452.373-.818.834-.818h1.11c.46 0 .834.366.834.818a.826.826 0 0 1-.833.818h-1.111a.826.826 0 0 1-.834-.818"
      clipRule="evenodd"
    />
  </Svg>
);

// solar:camera-linear
export const CameraLinearIcon = (props: SvgProps) => (
  <Svg {...props} width="24" height="24" viewBox="0 0 24 24">
    <G fill="none" stroke="currentColor" strokeWidth="1.5">
      <Circle fill="currentColor" cx="12" cy="13" r="3" />
      <Path
        fill="currentColor"
        d="M9.778 21h4.444c3.121 0 4.682 0 5.803-.735a4.4 4.4 0 0 0 1.226-1.204c.749-1.1.749-2.633.749-5.697s0-4.597-.749-5.697a4.4 4.4 0 0 0-1.226-1.204c-.72-.473-1.622-.642-3.003-.702c-.659 0-1.226-.49-1.355-1.125A2.064 2.064 0 0 0 13.634 3h-3.268c-.988 0-1.839.685-2.033 1.636c-.129.635-.696 1.125-1.355 1.125c-1.38.06-2.282.23-3.003.702A4.4 4.4 0 0 0 2.75 7.667C2 8.767 2 10.299 2 13.364s0 4.596.749 5.697c.324.476.74.885 1.226 1.204C5.096 21 6.657 21 9.778 21Z"
      />
      <Path fill="currentColor" strokeLinecap="round" d="M19 10h-1" />
    </G>
  </Svg>
);

// solar:phone-bold
export const PhoneBoldIcon = (props: SvgProps) => (
  <Svg {...props} width="24" height="24" viewBox="0 0 24 24">
    <Path
      fill="currentColor"
      d="m16.556 12.906l-.455.453s-1.083 1.076-4.038-1.862s-1.872-4.014-1.872-4.014l.286-.286c.707-.702.774-1.83.157-2.654L9.374 2.86C8.61 1.84 7.135 1.705 6.26 2.575l-1.57 1.56c-.433.432-.723.99-.688 1.61c.09 1.587.808 5 4.812 8.982c4.247 4.222 8.232 4.39 9.861 4.238c.516-.048.964-.31 1.325-.67l1.42-1.412c.96-.953.69-2.588-.538-3.255l-1.91-1.039c-.806-.437-1.787-.309-2.417.317"
    />
  </Svg>
);

// solar:phone-linear
export const PhoneLinearIcon = (props: SvgProps) => (
  <Svg {...props} width="24" height="24" viewBox="0 0 24 24">
    <Path
      fill="currentColor"
      d="m16.1 13.359l-.528-.532zm.456-.453l.529.532zm2.417-.317l-.358.66zm1.91 1.039l-.358.659zm.539 3.255l.529.532zm-1.42 1.412l-.53-.531zm-1.326.67l.07.747zm-9.86-4.238l.528-.532zM4.002 5.746l-.749.042zm6.474 1.451l.53.532zm.157-2.654l.6-.449zM9.374 2.86l-.601.45zM6.26 2.575l.53.532zm-1.57 1.56l-.528-.531zm7.372 7.362l.529-.532zm4.567 2.394l.455-.453l-1.058-1.064l-.455.453zm1.985-.643l1.91 1.039l.716-1.318l-1.91-1.038zm2.278 3.103l-1.42 1.413l1.057 1.063l1.42-1.412zm-2.286 1.867c-1.45.136-5.201.015-9.263-4.023l-1.057 1.063c4.432 4.407 8.65 4.623 10.459 4.454zm-9.263-4.023c-3.871-3.85-4.512-7.087-4.592-8.492l-1.498.085c.1 1.768.895 5.356 5.033 9.47zm1.376-6.18l.286-.286L9.95 6.666l-.287.285zm.515-3.921L9.974 2.41l-1.201.899l1.26 1.684zM5.733 2.043l-1.57 1.56l1.058 1.064l1.57-1.56zm4.458 5.44c-.53-.532-.53-.532-.53-.53h-.002l-.003.004a1 1 0 0 0-.127.157c-.054.08-.113.185-.163.318a2.1 2.1 0 0 0-.088 1.071c.134.865.73 2.008 2.256 3.526l1.058-1.064c-1.429-1.42-1.769-2.284-1.832-2.692c-.03-.194.001-.29.01-.312q.009-.02 0-.006a.3.3 0 0 1-.03.039l-.01.01l-.01.009zm1.343 4.546c1.527 1.518 2.676 2.11 3.542 2.242c.443.068.8.014 1.071-.087a1.5 1.5 0 0 0 .42-.236l.05-.045l.007-.006l.003-.003l.001-.002s.002-.001-.527-.533c-.53-.532-.528-.533-.528-.533l.002-.002l.002-.002l.006-.005l.01-.01l.038-.03q.014-.009-.007.002c-.025.009-.123.04-.32.01c-.414-.064-1.284-.404-2.712-1.824zm-1.56-9.62C8.954 1.049 6.95.834 5.733 2.044L6.79 3.107c.532-.529 1.476-.475 1.983.202zM4.752 5.704c-.02-.346.139-.708.469-1.036L4.163 3.604c-.537.534-.96 1.29-.909 2.184zm14.72 12.06c-.274.274-.57.428-.865.455l.139 1.494c.735-.069 1.336-.44 1.784-.885zM11.006 7.73c.985-.979 1.058-2.527.229-3.635l-1.201.899c.403.539.343 1.246-.085 1.673zm9.52 6.558c.817.444.944 1.49.367 2.064l1.058 1.064c1.34-1.333.927-3.557-.71-4.446zm-3.441-.849c.384-.382 1.002-.476 1.53-.19l.716-1.317c-1.084-.59-2.428-.427-3.304.443z"
    />
  </Svg>
);

// solar:user-bold
export const UserBoldIcon = (props: SvgProps) => (
  <Svg {...props} width="24" height="24" viewBox="0 0 24 24">
    <Circle cx="12" cy="6" r="4" fill="currentColor" />
    <Path
      fill="currentColor"
      d="M20 17.5c0 2.485 0 4.5-8 4.5s-8-2.015-8-4.5S7.582 13 12 13s8 2.015 8 4.5"
    />
  </Svg>
);

// solar:user-linear
export const UserLinearIcon = (props: SvgProps) => (
  <Svg {...props} width="24" height="24" viewBox="0 0 24 24">
    <G fill="none" stroke="currentColor" strokeWidth="1.5">
      <Circle fill="currentColor" cx="12" cy="6" r="4" />
      <Path
        fill="currentColor"
        d="M20 17.5c0 2.485 0 4.5-8 4.5s-8-2.015-8-4.5S7.582 13 12 13s8 2.015 8 4.5Z"
      />
    </G>
  </Svg>
);

export const ChatActiveIcon = (props: SvgProps) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" {...props}>
    <Path
      d="M8.5 19H8C4 19 2 18 2 13V8C2 4 4 2 8 2H16C20 2 22 4 22 8V13C22 17 20 19 16 19H15.5C15.19 19 14.89 19.15 14.7 19.4L13.2 21.4C12.54 22.28 11.46 22.28 10.8 21.4L9.3 19.4C9.14 19.18 8.77 19 8.5 19Z"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeMiterlimit="10"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx="16.0054" cy="11" r="1.1" fill="white" />
    <Circle cx="12.0045" cy="11" r="1.1" fill="white" />
    <Circle cx="8.00349" cy="11" r="1.1" fill="white" />
  </Svg>
);

export const ChatInactiveIcon = (props: SvgProps) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" {...props}>
    <Path
      d="M8.5 19H8C4 19 2 18 2 13V8C2 4 4 2 8 2H16C20 2 22 4 22 8V13C22 17 20 19 16 19H15.5C15.19 19 14.89 19.15 14.7 19.4L13.2 21.4C12.54 22.28 11.46 22.28 10.8 21.4L9.3 19.4C9.14 19.18 8.77 19 8.5 19Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeMiterlimit="10"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M15.9965 11H16.0054"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M11.9955 11H12.0045"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M7.99451 11H8.00349"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const MomentsActiveIcon = (props: SvgProps) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" {...props}>
    <Path
      d="M9 22H15C20 22 22 20 22 15V9C22 4 20 2 15 2H9C4 2 2 4 2 9V15C2 20 4 22 9 22Z"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx="9" cy="8" r="2" fill="white" />
    <Path
      d="M2.66992 18.95L7.59992 15.64C8.38992 15.11 9.52992 15.17 10.2399 15.78L10.5699 16.07C11.3499 16.74 12.6099 16.74 13.3899 16.07L17.5499 12.5C18.3299 11.83 19.5899 11.83 20.3699 12.5L21.9999 13.9"
      stroke="white"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const MomentsInactiveIcon = (props: SvgProps) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" {...props}>
    <Path
      d="M9 22H15C20 22 22 20 22 15V9C22 4 20 2 15 2H9C4 2 2 4 2 9V15C2 20 4 22 9 22Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M9 10C10.1046 10 11 9.10457 11 8C11 6.89543 10.1046 6 9 6C7.89543 6 7 6.89543 7 8C7 9.10457 7.89543 10 9 10Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M2.66992 18.95L7.59992 15.64C8.38992 15.11 9.52992 15.17 10.2399 15.78L10.5699 16.07C11.3499 16.74 12.6099 16.74 13.3899 16.07L17.5499 12.5C18.3299 11.83 19.5899 11.83 20.3699 12.5L21.9999 13.9"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const CameraActiveIcon = (props: SvgProps) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" {...props}>
    <Path
      d="M6.76017 22H17.2402C20.0002 22 21.1002 20.31 21.2302 18.25L21.7502 9.99C21.8902 7.83 20.1702 6 18.0002 6C17.3902 6 16.8302 5.65 16.5502 5.11L15.8302 3.66C15.3702 2.75 14.1702 2 13.1502 2H10.8602C9.83017 2 8.63017 2.75 8.17017 3.66L7.45017 5.11C7.17017 5.65 6.61017 6 6.00017 6C3.83017 6 2.11017 7.83 2.25017 9.99L2.77017 18.25C2.89017 20.31 4.00017 22 6.76017 22Z"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M10.5 8H13.5"
      stroke="white"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle
      cx="12"
      cy="14.75"
      r="3.25"
      stroke="white"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const CameraInactiveIcon = (props: SvgProps) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" {...props}>
    <Path
      d="M6.76017 22H17.2402C20.0002 22 21.1002 20.31 21.2302 18.25L21.7502 9.99C21.8902 7.83 20.1702 6 18.0002 6C17.3902 6 16.8302 5.65 16.5502 5.11L15.8302 3.66C15.3702 2.75 14.1702 2 13.1502 2H10.8602C9.83017 2 8.63017 2.75 8.17017 3.66L7.45017 5.11C7.17017 5.65 6.61017 6 6.00017 6C3.83017 6 2.11017 7.83 2.25017 9.99L2.77017 18.25C2.89017 20.31 4.00017 22 6.76017 22Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M10.5 8H13.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12 18C13.79 18 15.25 16.54 15.25 14.75C15.25 12.96 13.79 11.5 12 11.5C10.21 11.5 8.75 12.96 8.75 14.75C8.75 16.54 10.21 18 12 18Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Custom Phone (User Provided)
export const PhoneActiveIcon = (props: SvgProps) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" {...props}>
    <Path
      d="M21.97 18.33C21.97 18.69 21.89 19.06 21.72 19.42C21.55 19.78 21.33 20.12 21.04 20.44C20.55 20.98 20.01 21.37 19.4 21.62C18.8 21.87 18.15 22 17.45 22C16.43 22 15.34 21.76 14.19 21.27C13.04 20.78 11.89 20.12 10.75 19.29C9.6 18.45 8.51 17.52 7.47 16.49C6.44 15.45 5.51 14.36 4.68 13.22C3.86 12.08 3.2 10.94 2.72 9.81C2.24 8.67 2 7.58 2 6.54C2 5.86 2.12 5.21 2.36 4.61C2.6 4 2.98 3.44 3.51 2.94C4.15 2.31 4.85 2 5.59 2C5.87 2 6.15 2.06 6.4 2.18C6.66 2.3 6.89 2.48 7.07 2.74L9.39 6.01C9.57 6.26 9.7 6.49 9.79 6.71C9.88 6.92 9.93 7.13 9.93 7.32C9.93 7.56 9.86 7.8 9.72 8.03C9.59 8.26 9.4 8.5 9.16 8.74L8.4 9.53C8.29 9.64 8.24 9.77 8.24 9.93C8.24 10.01 8.25 10.08 8.27 10.16C8.3 10.24 8.33 10.3 8.35 10.36C8.53 10.69 8.84 11.12 9.28 11.64C9.73 12.16 10.21 12.69 10.73 13.22C11.27 13.75 11.79 14.24 12.32 14.69C12.84 15.13 13.27 15.43 13.61 15.61C13.66 15.63 13.72 15.66 13.79 15.69C13.87 15.72 13.95 15.73 14.04 15.73C14.21 15.73 14.34 15.67 14.45 15.56L15.21 14.81C15.46 14.56 15.7 14.37 15.93 14.25C16.16 14.11 16.39 14.04 16.64 14.04C16.83 14.04 17.03 14.08 17.25 14.17C17.47 14.26 17.7 14.39 17.95 14.56L21.26 16.91C21.52 17.09 21.7 17.3 21.81 17.55C21.91 17.8 21.97 18.05 21.97 18.33Z"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeMiterlimit="10"
    />
  </Svg>
);

export const PhoneInactiveIcon = (props: SvgProps) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" {...props}>
    <Path
      d="M21.97 18.33C21.97 18.69 21.89 19.06 21.72 19.42C21.55 19.78 21.33 20.12 21.04 20.44C20.55 20.98 20.01 21.37 19.4 21.62C18.8 21.87 18.15 22 17.45 22C16.43 22 15.34 21.76 14.19 21.27C13.04 20.78 11.89 20.12 10.75 19.29C9.6 18.45 8.51 17.52 7.47 16.49C6.44 15.45 5.51 14.36 4.68 13.22C3.86 12.08 3.2 10.94 2.72 9.81C2.24 8.67 2 7.58 2 6.54C2 5.86 2.12 5.21 2.36 4.61C2.6 4 2.98 3.44 3.51 2.94C4.15 2.31 4.85 2 5.59 2C5.87 2 6.15 2.06 6.4 2.18C6.66 2.3 6.89 2.48 7.07 2.74L9.39 6.01C9.57 6.26 9.7 6.49 9.79 6.71C9.88 6.92 9.93 7.13 9.93 7.32C9.93 7.56 9.86 7.8 9.72 8.03C9.59 8.26 9.4 8.5 9.16 8.74L8.4 9.53C8.29 9.64 8.24 9.77 8.24 9.93C8.24 10.01 8.25 10.08 8.27 10.16C8.3 10.24 8.33 10.3 8.35 10.36C8.53 10.69 8.84 11.12 9.28 11.64C9.73 12.16 10.21 12.69 10.73 13.22C11.27 13.75 11.79 14.24 12.32 14.69C12.84 15.13 13.27 15.43 13.61 15.61C13.66 15.63 13.72 15.66 13.79 15.69C13.87 15.72 13.95 15.73 14.04 15.73C14.21 15.73 14.34 15.67 14.45 15.56L15.21 14.81C15.46 14.56 15.7 14.37 15.93 14.25C16.16 14.11 16.39 14.04 16.64 14.04C16.83 14.04 17.03 14.08 17.25 14.17C17.47 14.26 17.7 14.39 17.95 14.56L21.26 16.91C21.52 17.09 21.7 17.3 21.81 17.55C21.91 17.8 21.97 18.05 21.97 18.33Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeMiterlimit="10"
    />
  </Svg>
);

export const UserActiveIcon = (props: SvgProps) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" {...props}>
    <Path
      d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const UserInactiveIcon = (props: SvgProps) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" {...props}>
    <Path
      d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// solar:leaf-bold
export const LeafBoldIcon = (props: SvgProps) => (
  <Svg {...props} width="24" height="24" viewBox="0 0 24 24">
    <Path
      fill="currentColor"
      d="M11.25 2.083a3.5 3.5 0 0 0-.713.243C6.553 4.188 4 9.395 4 13.856c0 4.24 3.183 7.724 7.25 8.109zm1.5 19.882c4.067-.385 7.25-3.868 7.25-8.108q0-.61-.063-1.234l-7.187 7.188zM18.26 7.18a13.4 13.4 0 0 0-1.34-2.04l-4.17 4.17v3.38zm-2.352-3.15a9.2 9.2 0 0 0-2.445-1.704a3.5 3.5 0 0 0-.713-.243v5.106zm3.028 4.594l-6.186 6.187v2.878l6.75-6.75l.132-.132a15 15 0 0 0-.696-2.183"
    />
  </Svg>
);

// solar:leaf-linear
export const LeafLinearIcon = (props: SvgProps) => (
  <Svg {...props} width="24" height="24" viewBox="0 0 24 24">
    <Path
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      d="m12 9l4.5-4.5m-4.5 10L18.5 8M12 19.5l7.5-7.5M12 22c4.418 0 8-3.646 8-8.143c0-4.462-2.553-9.67-6.537-11.531A3.45 3.45 0 0 0 12 2m0 20c-4.418 0-8-3.646-8-8.143c0-4.462 2.553-9.67 6.537-11.531A3.45 3.45 0 0 1 12 2m0 20V2"
    />
  </Svg>
);

// google icon
export const GoogleIcon = ({ size = 20 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <Path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <Path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <Path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </Svg>
);

export * from './tab-bar-icons';

// solar:gallery-bold
export const GalleryBoldIcon = (props: SvgProps) => (
  <Svg {...props} width="24" height="24" viewBox="0 0 24 24">
    <Path fill="currentColor" d="M18 8a2 2 0 1 1-4 0a2 2 0 0 1 4 0" />
    <Path
      fill="currentColor"
      fillRule="evenodd"
      d="M11.943 1.25h.114c2.309 0 4.118 0 5.53.19c1.444.194 2.584.6 3.479 1.494c.895.895 1.3 2.035 1.494 3.48c.19 1.411.19 3.22.19 5.529v.088c0 1.909 0 3.471-.104 4.743c-.104 1.28-.317 2.347-.795 3.235q-.314.586-.785 1.057c-.895.895-2.035 1.3-3.48 1.494c-1.411.19-3.22.19-5.529.19h-.114c-2.309 0-4.118 0-5.53-.19c-1.444-.194-2.584-.6-3.479-1.494c-.793-.793-1.203-1.78-1.42-3.006c-.215-1.203-.254-2.7-.262-4.558Q1.25 12.792 1.25 12v-.058c0-2.309 0-4.118.19-5.53c.194-1.444.6-2.584 1.494-3.479c.895-.895 2.035-1.3 3.48-1.494c1.411-.19 3.22-.19 5.529-.19m-5.33 1.676c-1.278.172-2.049.5-2.618 1.069c-.57.57-.897 1.34-1.069 2.619c-.174 1.3-.176 3.008-.176 5.386v.844l1.001-.876a2.3 2.3 0 0 1 3.141.104l4.29 4.29a2 2 0 0 0 2.564.222l.298-.21a3 3 0 0 1 3.732.225l2.83 2.547c.286-.598.455-1.384.545-2.493c.098-1.205.099-2.707.099-4.653c0-2.378-.002-4.086-.176-5.386c-.172-1.279-.5-2.05-1.069-2.62c-.57-.569-1.34-.896-2.619-1.068c-1.3-.174-3.008-.176-5.386-.176s-4.086.002-5.386.176"
      clipRule="evenodd"
    />
  </Svg>
);

// solar:gallery-linear
export const GalleryLinearIcon = (props: SvgProps) => (
  <Svg {...props} width="24" height="24" viewBox="0 0 24 24">
    <G fill="none" stroke="currentColor" strokeWidth="1.5">
      <Path
        fill="currentColor"
        d="M2 12c0-4.714 0-7.071 1.464-8.536C4.93 2 7.286 2 12 2s7.071 0 8.535 1.464C22 4.93 22 7.286 22 12s0 7.071-1.465 8.535C19.072 22 16.714 22 12 22s-7.071 0-8.536-1.465C2 19.072 2 16.714 2 12Z"
      />
      <Circle fill="currentColor" cx="16" cy="8" r="2" />
      <Path
        fill="currentColor"
        strokeLinecap="round"
        d="m2 12.5l1.752-1.533a2.3 2.3 0 0 1 3.14.105l4.29 4.29a2 2 0 0 0 2.564.222l.299-.21a3 3 0 0 1 3.731.225L21 18.5"
      />
    </G>
  </Svg>
);

export const ChatPlusIcon = (props: SvgProps) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" {...props}>
    <Path
      d="M6 12H18"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12 18V6"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const ScanCodeIcon = (props: SvgProps) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" {...props}>
    <Path
      opacity="0.4"
      d="M2 9.75C1.59 9.75 1.25 9.41 1.25 9V6.5C1.25 3.6 3.61 1.25 6.5 1.25H9C9.41 1.25 9.75 1.59 9.75 2C9.75 2.41 9.41 2.75 9 2.75H6.5C4.43 2.75 2.75 4.43 2.75 6.5V9C2.75 9.41 2.41 9.75 2 9.75Z"
      fill="currentColor"
    />
    <Path
      d="M22 9.75C21.59 9.75 21.25 9.41 21.25 9V6.5C21.25 4.43 19.57 2.75 17.5 2.75H15C14.59 2.75 14.25 2.41 14.25 2C14.25 1.59 14.59 1.25 15 1.25H17.5C20.39 1.25 22.75 3.6 22.75 6.5V9C22.75 9.41 22.41 9.75 22 9.75Z"
      fill="currentColor"
    />
    <Path
      opacity="0.4"
      d="M17.5 22.75H16C15.59 22.75 15.25 22.41 15.25 22C15.25 21.59 15.59 21.25 16 21.25H17.5C19.57 21.25 21.25 19.57 21.25 17.5V16C21.25 15.59 21.59 15.25 22 15.25C22.41 15.25 22.75 15.59 22.75 16V17.5C22.75 20.4 20.39 22.75 17.5 22.75Z"
      fill="currentColor"
    />
    <Path
      d="M9 22.75H6.5C3.61 22.75 1.25 20.4 1.25 17.5V15C1.25 14.59 1.59 14.25 2 14.25C2.41 14.25 2.75 14.59 2.75 15V17.5C2.75 19.57 4.43 21.25 6.5 21.25H9C9.41 21.25 9.75 21.59 9.75 22C9.75 22.41 9.41 22.75 9 22.75Z"
      fill="currentColor"
    />
    <Path
      d="M8.50012 11.3801C10.0907 11.3801 11.3801 10.0907 11.3801 8.50012C11.3801 6.90954 10.0907 5.62012 8.50012 5.62012C6.90954 5.62012 5.62012 6.90954 5.62012 8.50012C5.62012 10.0907 6.90954 11.3801 8.50012 11.3801Z"
      fill="currentColor"
    />
    <Path
      opacity="0.4"
      d="M7.50012 18.3801C8.53841 18.3801 9.38012 17.5384 9.38012 16.5001C9.38012 15.4618 8.53841 14.6201 7.50012 14.6201C6.46182 14.6201 5.62012 15.4618 5.62012 16.5001C5.62012 17.5384 6.46182 18.3801 7.50012 18.3801Z"
      fill="currentColor"
    />
    <Path
      opacity="0.4"
      d="M16.5001 9.38012C17.5384 9.38012 18.3801 8.53841 18.3801 7.50012C18.3801 6.46182 17.5384 5.62012 16.5001 5.62012C15.4618 5.62012 14.6201 6.46182 14.6201 7.50012C14.6201 8.53841 15.4618 9.38012 16.5001 9.38012Z"
      fill="currentColor"
    />
    <Path
      d="M15.5001 18.3801C17.0907 18.3801 18.3801 17.0907 18.3801 15.5001C18.3801 13.9095 17.0907 12.6201 15.5001 12.6201C13.9095 12.6201 12.6201 13.9095 12.6201 15.5001C12.6201 17.0907 13.9095 18.3801 15.5001 18.3801Z"
      fill="currentColor"
    />
  </Svg>
);
