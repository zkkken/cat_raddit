/**
 * 游戏类型定义
 * Game Type Definitions
 */

export type GameStatus = 'playing' | 'success' | 'failure' | 'paused';

export type InterferenceType = 
  | 'none'
  | 'controls_reversed'
  | 'temperature_shock'
  | 'bubble_obstruction'
  | 'speed_change'
  | 'target_shift'
  | 'comfort_drain';

export interface InterferenceEvent {
  type: InterferenceType;
  isActive: boolean;
  duration: number;
  remainingTime: number;
  intensity: number;
}

export interface GameState {
  currentTemperature: number;
  targetTemperature: number;
  toleranceWidth: number;
  currentComfort: number;
  gameTimer: number;
  successHoldTimer: number;
  isPlusHeld: boolean;
  isMinusHeld: boolean;
  gameStatus: GameStatus;
  interferenceEvent: InterferenceEvent;
  interferenceTimer: number;
  isControlsReversed: boolean;
  speedMultiplier: number;
}

export interface GameConfig {
  TEMPERATURE_CHANGE_RATE: number;
  TEMPERATURE_COOLING_RATE: number;
  COMFORT_CHANGE_RATE: number;
  GAME_DURATION: number;
  SUCCESS_HOLD_TIME: number;
  INITIAL_TEMPERATURE: number;
  TARGET_TEMPERATURE_MIN: number;
  TARGET_TEMPERATURE_MAX: number;
  TOLERANCE_WIDTH: number;
  INTERFERENCE_MIN_INTERVAL: number;
  INTERFERENCE_MAX_INTERVAL: number;
  INTERFERENCE_DURATION: number;
}

export interface InterferenceEffectInfo {
  icon: string;
  title: string;
  description: string;
  bgColor: string;
}

export interface InterferenceConfig {
  duration: number;
  intensity: number;
  effectInfo: InterferenceEffectInfo;
}