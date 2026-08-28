import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Platform, StyleSheet, Text, Vibration, View } from 'react-native';
import type { AssistantState } from '../types/assistant';
import { VISUAL_STATE } from '../state/assistantMachine';

type Props = { state: AssistantState };

const PARTICLES = [
  ['8%', '15%', 3], ['17%', '30%', 2], ['11%', '61%', 4], ['23%', '78%', 2], ['34%', '8%', 2],
  ['70%', '10%', 3], ['83%', '26%', 2], ['91%', '55%', 3], ['79%', '75%', 2], ['61%', '88%', 3],
] as const;

export function JarvisCore({ state }: Props) {
  const pulse = useRef(new Animated.Value(0)).current;
  const float = useRef(new Animated.Value(0)).current;
  const errorBlend = useRef(new Animated.Value(0)).current;
  const config = useMemo(() => VISUAL_STATE[state], [state]);

  useEffect(() => {
    pulse.stopAnimation();
    pulse.setValue(0);
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: Math.max(180, config.pulseSpeedMs / 2), useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0, duration: Math.max(180, config.pulseSpeedMs / 2), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [config.pulseSpeedMs, pulse]);

  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(float, { toValue: 1, duration: 1900, useNativeDriver: true }),
      Animated.timing(float, { toValue: 0, duration: 1900, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [float]);

  useEffect(() => {
    errorBlend.stopAnimation();
    errorBlend.setValue(0);
    if (state !== 'ERROR') return;
    if (Platform.OS !== 'web') Vibration.vibrate([0, 28, 70, 24]);
    Animated.sequence([
      Animated.timing(errorBlend, { toValue: 1, duration: 620, useNativeDriver: false }),
      Animated.delay(220),
      Animated.timing(errorBlend, { toValue: 0, duration: 720, useNativeDriver: false }),
    ]).start();
  }, [errorBlend, state]);

  const bodyY = float.interpolate({ inputRange: [0, 1], outputRange: [4, -4] });
  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, state === 'ERROR' ? 1.025 : 1.09] });
  const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.52, 1] });
  const speakingScaleX = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.82, 1.22] });
  const signalColor = errorBlend.interpolate({ inputRange: [0, 1], outputRange: [config.eyeColor, '#FF2E2E'] });
  const heartColor = errorBlend.interpolate({ inputRange: [0, 1], outputRange: [config.heartColor, '#FF2E2E'] });

  return (
    <View style={styles.stage}>
      <View style={styles.haloOuter} />
      <View style={styles.haloMid} />
      <View style={styles.haloInner} />

      {PARTICLES.map(([left, top, size], index) => (
        <Animated.View key={index} style={[styles.particle, { left, top, width: size, height: size, opacity: pulseOpacity }]} />
      ))}

      <Animated.View style={[styles.avatar, { transform: [{ translateY: bodyY }] }]}>
        <View style={styles.headShell}>
          <View style={styles.templeLeft} />
          <View style={styles.templeRight} />
          <View style={styles.faceInner}>
            <View style={styles.browRow}>
              <View style={styles.brow} />
              <View style={styles.brow} />
            </View>
            <View style={styles.eyeRow}>
              <Animated.View style={[styles.eye, { backgroundColor: signalColor, opacity: pulseOpacity }]} />
              <Animated.View style={[styles.eye, { backgroundColor: signalColor, opacity: pulseOpacity }]} />
            </View>
            <View style={styles.nose} />
            <Animated.View style={[styles.mouth, { backgroundColor: signalColor, opacity: pulseOpacity, transform: [{ scaleX: state === 'SPEAKING' ? speakingScaleX : 1 }] }]} />
          </View>
        </View>

        <View style={styles.neck} />

        <View style={styles.shoulders}>
          <View style={styles.circuitLineA} />
          <View style={styles.circuitLineB} />
          <View style={styles.chestCore} />
          <Animated.View style={[styles.heartGlow, { backgroundColor: heartColor, opacity: pulseOpacity, transform: [{ scale: pulseScale }] }]}>
            <View style={styles.heartTopLeft} />
            <View style={styles.heartTopRight} />
          </Animated.View>
        </View>

        <View style={styles.energyBase} />
      </Animated.View>

      <Text style={styles.stateLabel}>{state}</Text>
      <Text style={styles.stateHint}>SYSTÈME VISUEL V1</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: { width: '100%', minHeight: 475, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  haloOuter: { position: 'absolute', width: 360, height: 360, borderRadius: 180, borderWidth: 1, borderColor: '#0A566B', opacity: 0.38 },
  haloMid: { position: 'absolute', width: 298, height: 298, borderRadius: 149, borderWidth: 1, borderColor: '#0D91AF', opacity: 0.25 },
  haloInner: { position: 'absolute', width: 240, height: 240, borderRadius: 120, borderWidth: 1, borderColor: '#22D7FF', opacity: 0.23 },
  particle: { position: 'absolute', borderRadius: 8, backgroundColor: '#27DFFF', shadowColor: '#20D5FF', shadowOpacity: 0.85, shadowRadius: 6 },
  avatar: { alignItems: 'center', width: 290 },
  headShell: { width: 122, height: 152, borderTopLeftRadius: 62, borderTopRightRadius: 62, borderBottomLeftRadius: 48, borderBottomRightRadius: 48, borderWidth: 2, borderColor: '#2BD9F8', backgroundColor: 'rgba(3,17,25,0.94)', alignItems: 'center', justifyContent: 'center', shadowColor: '#19CBEA', shadowOpacity: 0.65, shadowRadius: 18 },
  faceInner: { width: 94, height: 116, borderRadius: 44, borderWidth: 1, borderColor: 'rgba(61,221,255,0.35)', alignItems: 'center', justifyContent: 'center' },
  templeLeft: { position: 'absolute', left: -14, top: 48, width: 18, height: 42, borderLeftWidth: 2, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#178CA4', borderRadius: 8 },
  templeRight: { position: 'absolute', right: -14, top: 48, width: 18, height: 42, borderRightWidth: 2, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#178CA4', borderRadius: 8 },
  browRow: { flexDirection: 'row', gap: 25, marginBottom: 5 },
  brow: { width: 21, height: 2, borderRadius: 2, backgroundColor: '#16788C' },
  eyeRow: { flexDirection: 'row', gap: 24, marginBottom: 15 },
  eye: { width: 18, height: 7, borderRadius: 8, shadowColor: '#FF9A1F', shadowOpacity: 0.8, shadowRadius: 8 },
  nose: { width: 2, height: 18, backgroundColor: '#1595AD', opacity: 0.65, marginBottom: 12 },
  mouth: { width: 39, height: 5, borderRadius: 4, shadowColor: '#FF9A1F', shadowOpacity: 0.9, shadowRadius: 8 },
  neck: { width: 50, height: 24, borderLeftWidth: 2, borderRightWidth: 2, borderColor: '#178DA8', backgroundColor: 'rgba(4,22,30,0.8)' },
  shoulders: { position: 'relative', width: 242, height: 154, borderTopLeftRadius: 78, borderTopRightRadius: 78, borderBottomLeftRadius: 36, borderBottomRightRadius: 36, borderWidth: 2, borderColor: '#168FAB', backgroundColor: 'rgba(3,20,29,0.86)', overflow: 'hidden' },
  chestCore: { position: 'absolute', left: 94, top: 31, width: 54, height: 80, borderWidth: 1, borderColor: '#0C6880', borderRadius: 22, opacity: 0.55 },
  circuitLineA: { position: 'absolute', left: 20, top: 47, width: 72, height: 1, backgroundColor: '#167D95', transform: [{ rotate: '-12deg' }], opacity: 0.7 },
  circuitLineB: { position: 'absolute', right: 18, top: 48, width: 76, height: 1, backgroundColor: '#167D95', transform: [{ rotate: '13deg' }], opacity: 0.7 },
  heartGlow: { position: 'absolute', right: 63, top: 61, width: 31, height: 31, transform: [{ rotate: '-45deg' }], borderRadius: 5, shadowColor: '#FF8A00', shadowOpacity: 1, shadowRadius: 15 },
  heartTopLeft: { position: 'absolute', left: 0, top: -10, width: 31, height: 31, borderRadius: 16, backgroundColor: 'inherit' as never },
  heartTopRight: { position: 'absolute', right: -10, top: 0, width: 31, height: 31, borderRadius: 16, backgroundColor: 'inherit' as never },
  energyBase: { marginTop: 10, width: 166, height: 9, borderRadius: 20, backgroundColor: '#16C5E7', opacity: 0.18, transform: [{ scaleX: 1.15 }] },
  stateLabel: { marginTop: 19, color: '#82EEFF', fontSize: 13, letterSpacing: 3.2, fontWeight: '800' },
  stateHint: { marginTop: 6, color: '#356F7A', fontSize: 9, letterSpacing: 2, fontWeight: '700' },
});
