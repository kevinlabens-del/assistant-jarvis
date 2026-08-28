import React, { useState } from 'react';
import { Pressable, SafeAreaView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { JarvisCore } from './src/components/JarvisCore';
import { nextState } from './src/state/assistantMachine';
import type { AssistantState } from './src/types/assistant';

export default function App() {
  const [state, setState] = useState<AssistantState>('IDLE');

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#010609" />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.kicker}>CR3@TIX // ASSISTANT SYSTEM</Text>
          <Text style={styles.brand}>CR3@TIX-JARVIS</Text>
          <Text style={styles.version}>V1.0 • REACT NATIVE + WEB</Text>
        </View>

        <JarvisCore state={state} />

        <View style={styles.panel}>
          <View style={styles.panelTop}>
            <Text style={styles.panelTitle}>PROTOCOLE D'ÉTATS</Text>
            <View style={styles.onlineDot} />
          </View>
          <Text style={styles.description}>
            Prototype interactif du corps numérique. Le bouton simule les futurs événements voix, IA et actions Android.
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Passer à l'état suivant"
            onPress={() => setState((current) => nextState(current))}
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          >
            <Text style={styles.buttonText}>SIMULER L'ÉTAT SUIVANT</Text>
          </Pressable>
        </View>

        <Text style={styles.footer}>ANDROID CORE • WEB PREVIEW • BUILD 001</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#010609' },
  container: { flex: 1, width: '100%', maxWidth: 680, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 14, justifyContent: 'space-between' },
  header: { alignItems: 'center', paddingTop: 6 },
  kicker: { color: '#386D78', fontSize: 9, fontWeight: '800', letterSpacing: 2.5 },
  brand: { color: '#E9FBFF', fontSize: 25, lineHeight: 32, fontWeight: '900', letterSpacing: 1.5, marginTop: 8 },
  version: { color: '#45AFC4', fontSize: 10, fontWeight: '700', letterSpacing: 2, marginTop: 5 },
  panel: { borderWidth: 1, borderColor: '#0B5365', backgroundColor: 'rgba(3,19,27,0.93)', padding: 17, borderRadius: 18 },
  panelTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  panelTitle: { color: '#72E9FF', fontSize: 12, fontWeight: '900', letterSpacing: 2 },
  onlineDot: { width: 7, height: 7, borderRadius: 7, backgroundColor: '#31E5FF' },
  description: { marginTop: 10, color: '#91B7C0', fontSize: 12, lineHeight: 18 },
  button: { marginTop: 15, minHeight: 49, borderRadius: 13, borderWidth: 1, borderColor: '#27D6F6', backgroundColor: 'rgba(15,110,132,0.18)', alignItems: 'center', justifyContent: 'center' },
  buttonPressed: { opacity: 0.7, transform: [{ scale: 0.99 }] },
  buttonText: { color: '#DDFBFF', fontSize: 12, fontWeight: '900', letterSpacing: 1.5 },
  footer: { color: '#2C5963', textAlign: 'center', fontSize: 8, fontWeight: '800', letterSpacing: 1.7 },
});
