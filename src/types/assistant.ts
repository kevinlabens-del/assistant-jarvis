export type AssistantState =
  | 'IDLE'
  | 'WAKE'
  | 'LISTENING'
  | 'UNDERSTANDING'
  | 'THINKING'
  | 'SPEAKING'
  | 'ACTION'
  | 'ERROR';

export type VisualState = {
  eyeColor: string;
  mouthColor: string;
  heartColor: string;
  glowIntensity: number;
  pulseSpeedMs: number;
};
