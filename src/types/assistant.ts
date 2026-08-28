export type AssistantState =
  | 'MATERIALIZING'
  | 'IDLE'
  | 'WAKE'
  | 'LISTENING'
  | 'UNDERSTANDING'
  | 'THINKING'
  | 'SPEAKING'
  | 'ACTION'
  | 'ERROR'
  | 'DISSOLVING';

export type VisualState = {
  eyeColor: string;
  mouthColor: string;
  heartColor: string;
  glowIntensity: number;
  pulseSpeedMs: number;
};
