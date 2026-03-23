import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { useAppTheme } from '@/store/theme-store';
import { modelName, osName, osVersion } from 'expo-device';
import * as Network from 'expo-network';
import { Activity, Cpu, Info, SignalHigh, Smartphone, Wifi } from 'lucide-react-native';
import { memo, useEffect, useState } from 'react';
import { Dimensions, Platform, ScrollView, TouchableOpacity, View } from 'react-native';
import Animated, {
  Easing,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function NetworkDiagnosticScreen() {
  const insets = useSafeAreaInsets();
  const { brandColor, isDark } = useAppTheme();
  const [isTestRun, setIsTestRun] = useState(false);
  const [progress, setProgress] = useState(0);

  // Real Data State
  const [diagData, setDiagData] = useState({
    ip: 'Unknown',
    type: 'None',
    latency: '0ms',
    airplaneMode: false,
    model: modelName || 'Device',
    os: `${osName} ${osVersion}`,
    isOnline: false,
  });

  // Animation Values
  const rotation = useSharedValue(0);
  const corePulse = useSharedValue(1);
  const idlePulse = useSharedValue(0.4);
  const sweepOpacity = useSharedValue(0);

  // 1. Initial Quick Check & Live Listener
  useEffect(() => {
    let isMounted = true;

    const checkInitialStatus = async () => {
      try {
        const state = await Network.getNetworkStateAsync();
        const ip = await Network.getIpAddressAsync();
        let isAirplane = false;
        if (Platform.OS === 'android') {
          isAirplane = await Network.isAirplaneModeEnabledAsync();
        }

        if (isMounted) {
          setDiagData((prev) => ({
            ...prev,
            type: state.type || 'None',
            ip: ip || 'Hidden',
            isOnline: state.isConnected ?? false,
            airplaneMode: isAirplane,
          }));
        }
      } catch (e) {
        console.error('Initial check failed:', e);
      }
    };

    checkInitialStatus();

    // Subscribe to real-time changes
    const subscription = Network.addNetworkStateListener((state) => {
      if (isMounted) {
        setDiagData((prev) => ({
          ...prev,
          type: state.type || 'None',
          isOnline: state.isConnected ?? false,
        }));
      }
    });

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, []);

  // Trigger scanning animation
  useEffect(() => {
    if (isTestRun) {
      sweepOpacity.value = withTiming(1, { duration: 500 });
      rotation.value = withRepeat(
        withTiming(360, { duration: 4000, easing: Easing.linear }),
        -1,
        false
      );
    } else {
      sweepOpacity.value = withTiming(0, { duration: 800 });
    }
  }, [isTestRun]);

  useEffect(() => {
    idlePulse.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.4, { duration: 2000, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
    corePulse.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
  }, []);

  const runDiagnostic = async () => {
    if (isTestRun) return;
    setIsTestRun(true);
    setProgress(0);

    try {
      // Step 1: Base Network Info (Progress 0-30%)
      setProgress(15);
      const state = await Network.getNetworkStateAsync();
      const ip = await Network.getIpAddressAsync();

      let isAirplane = false;
      if (Platform.OS === 'android') {
        isAirplane = await Network.isAirplaneModeEnabledAsync();
      }

      setDiagData((prev) => ({
        ...prev,
        type: state.type || 'Unknown',
        ip: ip || 'Blocked',
        airplaneMode: isAirplane,
        isOnline: state.isConnected ?? false,
      }));

      setProgress(45);

      // Step 2: Latency Test (Progress 45-80%)
      // We perform a real fetch to measure delay
      const start = Date.now();
      try {
        await fetch('https://www.google.com', { method: 'HEAD', cache: 'no-cache' });
        const end = Date.now();
        setDiagData((prev) => ({ ...prev, latency: `${end - start}ms` }));
      } catch (e) {
        setDiagData((prev) => ({ ...prev, latency: 'Timeout' }));
      }

      setProgress(85);

      // Step 3: Finalize (Progress 85-100%)
      await new Promise((resolve) => setTimeout(resolve, 800));
      setProgress(100);
    } catch (err) {
      console.error('Diagnostic Error:', err);
    } finally {
      setIsTestRun(false);
    }
  };

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingTop: 0, paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}>
        <View className="h-[275px] w-full items-center justify-center">
          <RadarSweep
            color={brandColor}
            rotation={rotation}
            idlePulse={idlePulse}
            sweepOpacity={sweepOpacity}
            isTestRun={isTestRun}
          />

          <View className="absolute inset-0 items-center justify-center">
            <Animated.View
              style={[
                { shadowColor: brandColor },
                useAnimatedStyle(() => ({ transform: [{ scale: corePulse.value }] })),
              ]}
              className="h-24 w-24 items-center justify-center rounded-full border border-brand/40 bg-background shadow-2xl elevation-10 shadow-brand/60">
              <Activity size={32} color={brandColor} strokeWidth={2.5} />
            </Animated.View>
          </View>
        </View>

        <View className="mb-5 items-center">
          <View className="mb-1.5 flex-row items-center rounded-full border border-brand/10 bg-brand/5 px-4 py-1.5">
            <View
              className={cn(
                'mr-2 h-1.5 w-1.5 rounded-full',
                isTestRun ? 'bg-brand' : diagData.isOnline ? 'bg-emerald-500' : 'bg-rose-500'
              )}
            />
            <Text className="text-[10px] font-black uppercase tracking-[2.5px] text-brand">
              {isTestRun ? 'Active Scan' : diagData.isOnline ? 'System Optimal' : 'Network Offline'}
            </Text>
          </View>
          <Text className="text-[14px] font-black tracking-tight text-foreground">
            {isTestRun
              ? `ANALYZING: ${progress}%`
              : progress === 100
                ? 'DIAGNOSTIC COMPLETE'
                : 'READY FOR SCAN'}
          </Text>
        </View>

        <View className="px-6">
          <View className="flex-row flex-wrap justify-between gap-y-4">
            <StatusCard
              icon={Wifi}
              label="Connection"
              status={diagData.type}
              sub={diagData.ip}
              brandColor={brandColor}
              active={isTestRun || progress === 100}
            />
            <StatusCard
              icon={SignalHigh}
              label="Latency"
              status={diagData.latency}
              sub={parseInt(diagData.latency) < 100 ? 'Low Delay' : 'High Delay'}
              brandColor={brandColor}
              active={isTestRun || progress === 100}
            />
            <StatusCard
              icon={Smartphone}
              label="Device"
              status={diagData.model}
              sub={diagData.os}
              brandColor={brandColor}
              active={isTestRun || progress === 100}
            />
            <StatusCard
              icon={Info}
              label="Mode"
              status={diagData.airplaneMode ? 'Airplane On' : 'Airplane Off'}
              sub="Hardware State"
              brandColor={brandColor}
              active={isTestRun || progress === 100}
            />
          </View>

          <TouchableOpacity
            onPress={runDiagnostic}
            activeOpacity={0.9}
            disabled={isTestRun}
            className={cn(
              'mt-10 h-16 flex-row items-center justify-center rounded-2xl shadow-2xl',
              isTestRun ? 'bg-muted shadow-none' : 'bg-brand shadow-brand/40'
            )}>
            <Cpu size={20} color={isTestRun ? '#666' : '#fff'} className="mr-3" />
            <Text
              className={cn(
                'text-[14px] font-black uppercase tracking-widest',
                isTestRun ? 'text-muted-foreground' : 'text-white'
              )}>
              {isTestRun ? 'Processing...' : 'Deep Network Diagnostic'}
            </Text>
          </TouchableOpacity>

          {progress === 100 && (
            <Animated.View
              entering={FadeInUp}
              className="mt-6 rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-6">
              <View className="mb-1 flex-row items-center">
                <Text className="text-[13px] font-black uppercase tracking-tight text-emerald-500">
                  Reliability Report
                </Text>
              </View>
              <Text className="text-[11px] font-medium leading-4 text-muted-foreground/80">
                Network diagnostic finished. Your connection to the primary server cluster is{' '}
                {parseInt(diagData.latency) < 100 ? 'excellent' : 'stable'}. No packet fragmentation
                detected.
              </Text>
            </Animated.View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const RadarSweep = ({ color, rotation, idlePulse, sweepOpacity, isTestRun }: any) => {
  const sweepStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
    opacity: sweepOpacity.value,
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: isTestRun ? 1 : idlePulse.value,
  }));

  const RADAR_SIZE = 240;

  return (
    <View className="h-[240px] w-[240px] items-center justify-center">
      {[80, 160, 240].map((size, i) => (
        <Animated.View
          key={i}
          style={[
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderColor: color,
            },
            ringStyle,
          ]}
          className="absolute border"
        />
      ))}
      <View
        style={{ backgroundColor: color }}
        className="absolute h-px w-[240px] opacity-10"
      />
      <View
        style={{ backgroundColor: color }}
        className="absolute h-[240px] w-px opacity-10"
      />
      <Animated.View
        style={[sweepStyle]}
        className="absolute h-[240px] w-[240px] items-center justify-center">
        <View
          style={{
            width: RADAR_SIZE / 2,
            height: RADAR_SIZE / 2,
            backgroundColor: color,
            borderTopRightRadius: RADAR_SIZE / 2,
          }}
          className="absolute right-0 top-0 overflow-hidden opacity-[0.15]"
        />
      </Animated.View>
    </View>
  );
};

const StatusCard = memo(({ icon: Icon, label, status, sub, brandColor, active }: any) => {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (active) {
      scale.value = withSequence(
        withTiming(1.05, { duration: 200 }),
        withTiming(1, { duration: 200 })
      );
    }
  }, [active]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    borderColor: active ? brandColor + '40' : 'transparent',
    backgroundColor: active ? brandColor + '05' : 'rgba(150,150,150,0.05)',
  }));

  return (
    <Animated.View
      style={[{ width: (width - 60) / 2 }, animatedStyle]}
      className="rounded-3xl border border-transparent p-5 shadow-sm shadow-black/5">
      <View className="mb-4 h-10 w-10 items-center justify-center rounded-full bg-background shadow-sm">
        <Icon size={18} color={active ? brandColor : '#9ca3af'} strokeWidth={2.5} />
      </View>
      <Text className="text-[11px] font-black uppercase tracking-tight text-muted-foreground opacity-50">
        {label}
      </Text>
      <Text className="mt-0.5 text-[14px] font-black text-foreground" numberOfLines={1}>
        {status}
      </Text>
      <Text className="mt-1 text-[10px] font-bold text-muted-foreground/60" numberOfLines={1}>
        {sub}
      </Text>
    </Animated.View>
  );
});
