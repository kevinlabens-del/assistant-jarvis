import type { AssistantState, VisualState } from '../types/assistant';

export const STATE_SEQUENCE: AssistantState[] = [
  'MATERIALIZING',
  'WAKE',
  'IDLE',
  'LISTENING',
  'UNDERSTANDING',
  'THINKING',
  'SPEAKING',
  'ACTION',
  'DISSOLVING',
];

export const DEMO_TIMELINE: Array<{ state: AssistantState; durationMs: number }> = [
  { state: 'MATERIALIZING', durationMs: 6200 },
  { state: 'WAKE', durationMs: 2800 },
  { state: 'IDLE', durationMs: 3600 },
  { state: 'LISTENING', durationMs: 6500 },
  { state: 'UNDERSTANDING', durationMs: 3800 },
  { state: 'THINKING', durationMs: 4800 },
  { state: 'SPEAKING', durationMs: 7200 },
  { state: 'ACTION', durationMs: 3600 },
  { state: 'DISSOLVING', durationMs: 6400 },
];

export const VISUAL_STATE: Record<AssistantState, VisualState> = {
  MATERIALIZING: { eyeColor: '#FF8A00', mouthColor: '#FF8A00', heartColor: '#FF9718', glowIntensity: 0.8, pulseSpeedMs: 720 },
  IDLE: { eyeColor: '#6A3900', mouthColor: '#6A3900', heartColor: '#8A4B00', glowIntensity: 0.24, pulseSpeedMs: 1800 },
  WAKE: { eyeColor: '#FF9718', mouthColor: '#E57B00', heartColor: '#FF9718', glowIntensity: 0.65, pulseSpeedMs: 900 },
  LISTENING: { eyeColor: '#FFAA32', mouthColor: '#FF8A00', heartColor: '#FF9718', glowIntensity: 0.8, pulseSpeedMs: 760 },
  UNDERSTANDING: { eyeColor: '#FFB344', mouthColor: '#FF9012', heartColor: '#FFA11F', glowIntensity: 0.9, pulseSpeedMs: 690 },
  THINKING: { eyeColor: '#FFC15A', mouthColor: '#FF940F', heartColor: '#FFAA28', glowIntensity: 1, pulseSpeedMs: 600 },
  SPEAKING: { eyeColor: '#FFD078', mouthColor: '#FFD078', heartColor: '#FFA11F', glowIntensity: 1, pulseSpeedMs: 460 },
  ACTION: { eyeColor: '#FFB344', mouthColor: '#FF9A1F', heartColor: '#FFC15A', glowIntensity: 1, pulseSpeedMs: 410 },
  ERROR: { eyeColor: '#FF9A1F', mouthColor: '#FF9A1F', heartColor: '#FF9A1F', glowIntensity: 0.9, pulseSpeedMs: 420 },
  DISSOLVING: { eyeColor: '#B86200', mouthColor: '#B86200', heartColor: '#D77700', glowIntensity: 0.42, pulseSpeedMs: 1100 },
};

export function nextState(current: AssistantState): AssistantState {
  const index = STATE_SEQUENCE.indexOf(current);
  return STATE_SEQUENCE[(index + 1) % STATE_SEQUENCE.length];
}
