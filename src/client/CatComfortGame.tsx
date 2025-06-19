import React, { useState, useEffect, useCallback, useRef } from 'react';

// ==================== 类型定义 ====================
export type GameStatus = 'playing' | 'success' | 'failure' | 'paused';
export type InterferenceType = 'controls_reversed' | 'temperature_shock' | 'bubble_obstruction' | 'none';

export interface InterferenceEvent {
  type: InterferenceType;
  isActive: boolean;
  duration: number;
  remainingTime: number;
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

// ==================== 游戏配置 ====================
const GAME_CONFIG: GameConfig = {
  TEMPERATURE_CHANGE_RATE: 0.5,
  TEMPERATURE_COOLING_RATE: 0.3,
  COMFORT_CHANGE_RATE: 0.2,
  GAME_DURATION: 30,
  SUCCESS_HOLD_TIME: 5,
  INITIAL_TEMPERATURE: 0.5,
  TARGET_TEMPERATURE_MIN: 0.3,
  TARGET_TEMPERATURE_MAX: 0.7,
  TOLERANCE_WIDTH: 0.1,
  INTERFERENCE_MIN_INTERVAL: 3,
  INTERFERENCE_MAX_INTERVAL: 5,
  INTERFERENCE_DURATION: 8,
};

// ==================== 图片资源配置 ====================
// 🎯 使用 public 文件夹中的图片资源，路径从根目录开始
const USE_IMAGES = true;

const IMAGE_ASSETS = {
  background: USE_IMAGES ? '/public/background.png' : null,
  avatarBad: USE_IMAGES ? '/public/avatar-bad.png' : '😿',
  avatarHappy: USE_IMAGES ? '/public/avatar-yellowsmiley.png' : '😸',
  buttonMinus: USE_IMAGES ? '/public/button-temp-minus.png' : null,
  buttonPlus: USE_IMAGES ? '/public/button-temp-plus.png' : null,
  buttonCenter: USE_IMAGES ? '/public/button-center-interaction.png' : null,
};

// ==================== 游戏系统类 ====================

class TemperatureSystem {
  private config: GameConfig;

  constructor(config: GameConfig) {
    this.config = config;
  }

  updateTemperature(
    currentTemperature: number,
    isPlusHeld: boolean,
    isMinusHeld: boolean,
    isControlsReversed: boolean,
    deltaTime: number
  ): number {
    // 🎯 关键：控制反转逻辑 - 当 isControlsReversed 为 true 时，按钮功能互换
    const effectivePlusHeld = isControlsReversed ? isMinusHeld : isPlusHeld;
    const effectiveMinusHeld = isControlsReversed ? isPlusHeld : isMinusHeld;

    let newTemperature = currentTemperature;

    if (effectivePlusHeld) {
      newTemperature += this.config.TEMPERATURE_CHANGE_RATE * deltaTime;
    } else if (effectiveMinusHeld) {
      newTemperature -= this.config.TEMPERATURE_CHANGE_RATE * deltaTime;
    } else {
      newTemperature -= this.config.TEMPERATURE_COOLING_RATE * deltaTime;
    }

    return Math.max(0, Math.min(1, newTemperature));
  }

  generateRandomTargetTemperature(): number {
    return Math.random() * 
      (this.config.TARGET_TEMPERATURE_MAX - this.config.TARGET_TEMPERATURE_MIN) + 
      this.config.TARGET_TEMPERATURE_MIN;
  }

  isTemperatureInRange(
    currentTemperature: number,
    targetTemperature: number,
    toleranceWidth: number
  ): boolean {
    const temperatureDifference = Math.abs(currentTemperature - targetTemperature);
    return temperatureDifference <= toleranceWidth;
  }
}

class ComfortSystem {
  private config: GameConfig;

  constructor(config: GameConfig) {
    this.config = config;
  }

  updateComfort(
    currentComfort: number,
    isInToleranceRange: boolean,
    deltaTime: number
  ): number {
    let newComfort = currentComfort;

    if (isInToleranceRange) {
      newComfort += this.config.COMFORT_CHANGE_RATE * deltaTime;
    } else {
      newComfort -= this.config.COMFORT_CHANGE_RATE * deltaTime;
    }

    return Math.max(0, Math.min(1, newComfort));
  }
}

class InterferenceSystem {
  private config: GameConfig;

  constructor(config: GameConfig) {
    this.config = config;
  }

  generateRandomInterferenceInterval(): number {
    return Math.random() * 
      (this.config.INTERFERENCE_MAX_INTERVAL - this.config.INTERFERENCE_MIN_INTERVAL) + 
      this.config.INTERFERENCE_MIN_INTERVAL;
  }

  getRandomInterferenceType(): InterferenceType {
    // 🎯 确保包含控制反转干扰
    const types: InterferenceType[] = ['controls_reversed', 'temperature_shock', 'bubble_obstruction'];
    return types[Math.floor(Math.random() * types.length)];
  }

  createInterferenceEvent(type: InterferenceType): InterferenceEvent {
    return {
      type,
      isActive: true,
      duration: this.config.INTERFERENCE_DURATION,
      remainingTime: this.config.INTERFERENCE_DURATION,
    };
  }

  clearInterferenceEvent(): InterferenceEvent {
    return {
      type: 'none',
      isActive: false,
      duration: 0,
      remainingTime: 0,
    };
  }

  applyTemperatureShock(): number {
    return Math.random() > 0.5 ? 0.9 : 0.1;
  }

  shouldTriggerInterference(
    interferenceTimer: number,
    isInterferenceActive: boolean
  ): boolean {
    return interferenceTimer <= 0 && !isInterferenceActive;
  }

  // 🔧 关键修复：更新干扰事件剩余时间
  updateInterferenceEvent(
    interferenceEvent: InterferenceEvent,
    deltaTime: number
  ): InterferenceEvent {
    if (!interferenceEvent.isActive) {
      return interferenceEvent;
    }

    const newRemainingTime = Math.max(0, interferenceEvent.remainingTime - deltaTime);
    
    if (newRemainingTime <= 0) {
      return this.clearInterferenceEvent();
    }

    return {
      ...interferenceEvent,
      remainingTime: newRemainingTime,
    };
  }
}

class TimerSystem {
  private config: GameConfig;

  constructor(config: GameConfig) {
    this.config = config;
  }

  updateGameTimer(currentTimer: number, deltaTime: number): number {
    return Math.max(0, currentTimer - deltaTime);
  }

  updateInterferenceTimer(currentTimer: number, deltaTime: number): number {
    return Math.max(0, currentTimer - deltaTime);
  }

  updateSuccessHoldTimer(
    currentTimer: number,
    isMaxComfort: boolean,
    deltaTime: number
  ): number {
    if (isMaxComfort) {
      return currentTimer + deltaTime;
    } else {
      return 0;
    }
  }

  isTimeFailure(gameTimer: number): boolean {
    return gameTimer <= 0;
  }

  isSuccessHoldComplete(successHoldTimer: number): boolean {
    return successHoldTimer >= this.config.SUCCESS_HOLD_TIME;
  }
}

class GameStateManager {
  private temperatureSystem: TemperatureSystem;
  private comfortSystem: ComfortSystem;
  private interferenceSystem: InterferenceSystem;
  private timerSystem: TimerSystem;
  private config: GameConfig;

  constructor(config: GameConfig) {
    this.config = config;
    this.temperatureSystem = new TemperatureSystem(config);
    this.comfortSystem = new ComfortSystem(config);
    this.interferenceSystem = new InterferenceSystem(config);
    this.timerSystem = new TimerSystem(config);
  }

  updateConfig(newConfig: GameConfig): void {
    this.config = newConfig;
    this.timerSystem = new TimerSystem(newConfig);
  }

  createInitialState(): GameState {
    return {
      currentTemperature: this.config.INITIAL_TEMPERATURE,
      targetTemperature: this.temperatureSystem.generateRandomTargetTemperature(),
      toleranceWidth: this.config.TOLERANCE_WIDTH,
      currentComfort: 0.5,
      gameTimer: this.config.GAME_DURATION,
      successHoldTimer: 0,
      isPlusHeld: false,
      isMinusHeld: false,
      gameStatus: 'playing',
      interferenceEvent: this.interferenceSystem.clearInterferenceEvent(),
      interferenceTimer: this.interferenceSystem.generateRandomInterferenceInterval(),
      isControlsReversed: false,
    };
  }

  updateGameState(currentState: GameState, deltaTime: number): GameState {
    if (currentState.gameStatus !== 'playing') {
      return currentState;
    }

    let newState = { ...currentState };

    newState.gameTimer = this.timerSystem.updateGameTimer(newState.gameTimer, deltaTime);
    newState.interferenceTimer = this.timerSystem.updateInterferenceTimer(newState.interferenceTimer, deltaTime);

    if (this.timerSystem.isTimeFailure(newState.gameTimer)) {
      if (newState.currentComfort >= 0.8) {
        newState.gameStatus = 'success';
      } else {
        newState.gameStatus = 'failure';
      }
      return newState;
    }

    // 🔧 关键修复：处理干扰事件
    newState = this.handleInterferenceEvents(newState, deltaTime);

    newState.currentTemperature = this.temperatureSystem.updateTemperature(
      newState.currentTemperature,
      newState.isPlusHeld,
      newState.isMinusHeld,
      newState.isControlsReversed,
      deltaTime
    );

    const isInToleranceRange = this.temperatureSystem.isTemperatureInRange(
      newState.currentTemperature,
      newState.targetTemperature,
      newState.toleranceWidth
    );
    
    newState.currentComfort = this.comfortSystem.updateComfort(
      newState.currentComfort,
      isInToleranceRange,
      deltaTime
    );

    const isMaxComfort = newState.currentComfort >= 1.0;
    newState.successHoldTimer = this.timerSystem.updateSuccessHoldTimer(
      newState.successHoldTimer,
      isMaxComfort,
      deltaTime
    );

    return newState;
  }

  // 🔧 关键修复：处理干扰事件
  private handleInterferenceEvents(state: GameState, deltaTime: number): GameState {
    let newState = { ...state };

    // 更新当前干扰事件
    newState.interferenceEvent = this.interferenceSystem.updateInterferenceEvent(
      newState.interferenceEvent,
      deltaTime
    );

    // 如果干扰事件结束，重置相关状态
    if (!newState.interferenceEvent.isActive && state.interferenceEvent.isActive) {
      newState.isControlsReversed = false;
      console.log('🔧 Interference event ended, controls restored to normal');
    }

    // 检查是否应该触发新的干扰
    if (this.interferenceSystem.shouldTriggerInterference(
      newState.interferenceTimer,
      newState.interferenceEvent.isActive
    )) {
      const interferenceType = this.interferenceSystem.getRandomInterferenceType();
      newState.interferenceEvent = this.interferenceSystem.createInterferenceEvent(interferenceType);

      // 应用干扰效果
      switch (interferenceType) {
        case 'controls_reversed':
          newState.isControlsReversed = true;
          console.log('🔄 Controls reversed interference activated!');
          break;
        case 'temperature_shock':
          newState.targetTemperature = this.interferenceSystem.applyTemperatureShock();
          console.log('⚡ Temperature shock interference activated!');
          break;
        case 'bubble_obstruction':
          console.log('🫧 Bubble obstruction interference activated!');
          break;
      }

      // 重置干扰计时器
      newState.interferenceTimer = this.interferenceSystem.generateRandomInterferenceInterval();
    }

    return newState;
  }

  // 🔧 关键修复：处理中心按钮点击
  handleCenterButtonClick(currentState: GameState): GameState {
    if (!currentState.interferenceEvent.isActive) {
      return currentState;
    }

    console.log('🔧 Center button clicked - clearing interference:', currentState.interferenceEvent.type);

    // 🔥 关键修复：清除干扰事件时正确重置状态，但保持按钮状态
    return {
      ...currentState,
      interferenceEvent: this.interferenceSystem.clearInterferenceEvent(),
      isControlsReversed: false, // 清除控制反转
      interferenceTimer: this.interferenceSystem.generateRandomInterferenceInterval(),
      // 🔥 关键修复：不重置按钮状态，保持用户的实际操作
      // isPlusHeld 和 isMinusHeld 保持不变
    };
  }

  resetGameState(): GameState {
    return this.createInitialState();
  }
}

// ==================== UI 组件 ====================

interface ProgressBarProps {
  value: number;
  className?: string;
  barColor?: string;
  backgroundColor?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  className = '',
  barColor = '#4ade80',
  backgroundColor = '#e5e7eb',
}) => {
  const clampedValue = Math.max(0, Math.min(1, value));
  
  return (
    <div 
      className={`relative overflow-hidden rounded ${className}`}
      style={{ backgroundColor }}
    >
      <div
        className="transition-all duration-100 ease-out h-full"
        style={{
          backgroundColor: barColor,
          width: `${clampedValue * 100}%`,
        }}
      />
    </div>
  );
};

interface GameOverlayProps {
  gameState: GameState;
  currentRound: number;
  onRestart: () => void;
  onNextRound: () => void;
}

const GameOverlay: React.FC<GameOverlayProps> = ({ 
  gameState, 
  currentRound, 
  onRestart, 
  onNextRound 
}) => {
  if (gameState.gameStatus === 'playing') return null;

  const isSuccess = gameState.gameStatus === 'success';

  return (
    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 text-center shadow-2xl max-w-sm mx-4">
        <div className="text-6xl mb-4">
          {isSuccess ? '🎉' : '😿'}
        </div>
        <h2 className="text-2xl font-bold mb-4 text-gray-800">
          {isSuccess ? `Round ${currentRound} Complete!` : 'Round Failed'}
        </h2>
        <p className="text-gray-600 mb-6">
          {isSuccess 
            ? `You successfully completed round ${currentRound}! The cat is happy with comfort level: ${Math.round(gameState.currentComfort * 100)}%` 
            : `Time ran out! Final comfort level: ${Math.round(gameState.currentComfort * 100)}%`
          }
        </p>
        
        <div className="flex flex-col gap-3">
          {isSuccess && (
            <button
              onClick={onNextRound}
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200"
            >
              Next Round ({Math.max(10, 30 - (currentRound * 10))}s)
            </button>
          )}
          <button
            onClick={onRestart}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200"
          >
            Start Over
          </button>
        </div>
      </div>
    </div>
  );
};

interface InterferenceOverlayProps {
  interferenceEvent: InterferenceEvent;
  onCenterButtonClick: () => void;
  isControlsReversed: boolean;
}

const InterferenceOverlay: React.FC<InterferenceOverlayProps> = ({
  interferenceEvent,
  onCenterButtonClick,
  isControlsReversed,
}) => {
  if (!interferenceEvent.isActive) return null;

  const getInterferenceContent = () => {
    switch (interferenceEvent.type) {
      case 'controls_reversed':
        return {
          icon: '🔄',
          title: 'Controls Reversed!',
          description: 'The + and - buttons are swapped!',
          bgColor: 'bg-purple-500',
        };
      case 'temperature_shock':
        return {
          icon: '⚡',
          title: 'Temperature Shock!',
          description: 'The target temperature has shifted!',
          bgColor: 'bg-orange-500',
        };
      case 'bubble_obstruction':
        return {
          icon: '🫧',
          title: 'Bubble Trouble!',
          description: 'Bubbles are blocking your view!',
          bgColor: 'bg-blue-500',
        };
      default:
        return {
          icon: '⚠️',
          title: 'Interference!',
          description: 'Something is wrong!',
          bgColor: 'bg-red-500',
        };
    }
  };

  const content = getInterferenceContent();

  return (
    <>
      {/* 干扰通知 - 叠加在游戏界面之上 */}
      <div className="absolute top-16 left-4 right-4 z-40">
        <div className={`${content.bgColor} text-white p-3 rounded-lg shadow-lg animate-pulse`}>
          <div className="flex items-center justify-center mb-2">
            <span className="text-2xl mr-2">{content.icon}</span>
            <h3 className="font-bold text-lg">{content.title}</h3>
          </div>
          <p className="text-center text-sm">{content.description}</p>
          <p className="text-center text-xs mt-1 opacity-80">
            Click the center button to fix!
          </p>
        </div>
      </div>

      {/* 控制反转指示器 - 叠加在游戏界面之上 */}
      {isControlsReversed && (
        <div className="absolute bottom-20 left-4 right-4 z-40">
          <div className="bg-purple-600 text-white p-2 rounded-lg text-center animate-bounce">
            <span className="text-lg">🔄 Controls are REVERSED! 🔄</span>
          </div>
        </div>
      )}

      {/* 气泡干扰效果 */}
      {interferenceEvent.type === 'bubble_obstruction' && (
        <div className="absolute inset-0 z-30 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-24 h-24 bg-white bg-opacity-85 rounded-full animate-bounce shadow-lg" />
          <div className="absolute top-1/3 right-1/4 w-20 h-20 bg-white bg-opacity-80 rounded-full animate-pulse shadow-lg" />
          <div className="absolute bottom-1/3 left-1/3 w-16 h-16 bg-white bg-opacity-90 rounded-full animate-bounce shadow-lg" />
          <div className="absolute top-1/2 right-1/3 w-18 h-18 bg-white bg-opacity-75 rounded-full animate-pulse shadow-lg" />
          <div className="absolute top-2/3 left-1/5 w-12 h-12 bg-white bg-opacity-70 rounded-full animate-bounce shadow-md" />
          <div className="absolute bottom-1/4 right-1/5 w-14 h-14 bg-white bg-opacity-85 rounded-full animate-pulse shadow-md" />
          <div className="absolute top-1/5 right-2/5 w-10 h-10 bg-white bg-opacity-80 rounded-full animate-bounce shadow-md" />
          <div className="absolute top-[218px] left-[25px] w-[340px] h-[39px] bg-white bg-opacity-40 rounded animate-pulse" />
        </div>
      )}
    </>
  );
};

// ==================== 按钮组件 ====================

interface GameButtonProps {
  onClick?: () => void;
  onMouseDown?: () => void;
  onMouseUp?: () => void;
  onMouseLeave?: () => void;
  onTouchStart?: () => void;
  onTouchEnd?: () => void;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
  imageSrc?: string | null;
  isReversed?: boolean;
}

const GameButton: React.FC<GameButtonProps> = ({
  onClick,
  onMouseDown,
  onMouseUp,
  onMouseLeave,
  onTouchStart,
  onTouchEnd,
  disabled,
  className,
  children,
  imageSrc,
  isReversed = false,
}) => {
  const [imageError, setImageError] = useState(false);
  
  const handleImageError = () => {
    setImageError(true);
  };

  const shouldUseImage = USE_IMAGES && imageSrc && !imageError;

  return (
    <button
      onClick={onClick}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      disabled={disabled}
      className={`${className} ${isReversed ? 'ring-4 ring-purple-400 animate-pulse' : ''} relative overflow-hidden`}
    >
      {shouldUseImage ? (
        <>
          <img
            src={imageSrc}
            alt="Button"
            className="w-full h-full object-cover"
            onError={handleImageError}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            {children}
          </div>
        </>
      ) : (
        children
      )}
    </button>
  );
};

// ==================== 主游戏组件 ====================

export const CatComfortGame: React.FC = () => {
  const [gameStateManager] = useState(() => new GameStateManager(GAME_CONFIG));
  
  const [gameState, setGameState] = useState<GameState>(() => 
    gameStateManager.createInitialState()
  );

  const [currentRound, setCurrentRound] = useState(1);
  const gameLoopRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(Date.now());

  const handlePlusPress = useCallback(() => {
    console.log('➕ Plus button pressed, controls reversed:', gameState.isControlsReversed);
    setGameState(prev => ({ ...prev, isPlusHeld: true }));
  }, [gameState.isControlsReversed]);

  const handlePlusRelease = useCallback(() => {
    console.log('➕ Plus button released');
    setGameState(prev => ({ ...prev, isPlusHeld: false }));
  }, []);

  const handleMinusPress = useCallback(() => {
    console.log('➖ Minus button pressed, controls reversed:', gameState.isControlsReversed);
    setGameState(prev => ({ ...prev, isMinusHeld: true }));
  }, [gameState.isControlsReversed]);

  const handleMinusRelease = useCallback(() => {
    console.log('➖ Minus button released');
    setGameState(prev => ({ ...prev, isMinusHeld: false }));
  }, []);

  const handleCenterButtonClick = useCallback(() => {
    console.log('🔧 Center button clicked, interference active:', gameState.interferenceEvent.isActive);
    setGameState(prev => gameStateManager.handleCenterButtonClick(prev));
  }, [gameStateManager, gameState.interferenceEvent.isActive]);

  const resetGame = useCallback(() => {
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
      gameLoopRef.current = null;
    }
    
    setCurrentRound(1);
    const newConfig = { ...GAME_CONFIG, GAME_DURATION: 30 };
    gameStateManager.updateConfig(newConfig);
    const newState = gameStateManager.resetGameState();
    setGameState(newState);
    
    lastUpdateRef.current = Date.now();
    console.log('🔄 Game reset');
  }, [gameStateManager]);

  const startNextRound = useCallback(() => {
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
      gameLoopRef.current = null;
    }
    
    const nextRound = currentRound + 1;
    const newDuration = Math.max(10, 30 - ((nextRound - 1) * 10));
    const newConfig = { ...GAME_CONFIG, GAME_DURATION: newDuration };
    
    setCurrentRound(nextRound);
    gameStateManager.updateConfig(newConfig);
    const newState = gameStateManager.resetGameState();
    setGameState(newState);
    
    lastUpdateRef.current = Date.now();
    console.log(`🎯 Starting round ${nextRound} with ${newDuration}s`);
  }, [currentRound, gameStateManager]);

  useEffect(() => {
    if (gameState.gameStatus !== 'playing') {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
        gameLoopRef.current = null;
      }
      return;
    }

    const gameLoop = () => {
      const now = Date.now();
      const deltaTime = Math.min((now - lastUpdateRef.current) / 1000, 1/30);
      lastUpdateRef.current = now;
      
      setGameState(prevState => {
        return gameStateManager.updateGameState(prevState, deltaTime);
      });
      
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    lastUpdateRef.current = Date.now();
    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
        gameLoopRef.current = null;
      }
    };
  }, [gameState.gameStatus, gameStateManager]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 背景样式 - 使用 public 文件夹中的图片
  const backgroundStyle = USE_IMAGES && IMAGE_ASSETS.background 
    ? { backgroundImage: `url(${IMAGE_ASSETS.background})`, backgroundSize: 'cover', backgroundPosition: '50% 50%' }
    : {};

  return (
    <div className="w-full h-screen bg-gradient-to-b from-blue-100 to-blue-200 flex items-center justify-center">
      <div className="w-[390px] h-[844px] relative">
        <div className="fixed w-[390px] h-[844px] top-0 left-0 border-0">
          <div className="p-0 h-[844px] bg-white">
            <div 
              className="relative w-[390px] h-[844px] bg-gradient-to-b from-purple-200 via-pink-200 to-blue-200"
              style={backgroundStyle}
            >
              
              {/* 游戏标题 */}
              <div className="absolute top-4 left-0 right-0 text-center">
                <h1 className="text-2xl font-bold text-purple-800">🐱 Cat Comfort Game 🐱</h1>
                <p className="text-sm text-purple-600">Keep the cat comfortable by controlling temperature!</p>
              </div>
              
              {/* 计时器显示 */}
              <div className="absolute top-[320px] left-[25px] flex flex-col items-center">
                <div className="bg-[#36417E] text-white px-3 py-1 rounded-lg mb-2 text-sm font-bold">
                  Round {currentRound}
                </div>
                
                <div 
                  className="bg-[#36417E] text-white px-4 py-3 rounded-lg text-center shadow-lg"
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '24px',
                    fontWeight: '700',
                    minWidth: '80px'
                  }}
                >
                  {formatTime(gameState.gameTimer)}
                </div>
                
                {gameState.gameStatus === 'playing' && currentRound < 3 && (
                  <div className="text-xs text-gray-600 mt-1 text-center">
                    Next: {Math.max(10, 30 - (currentRound * 10))}s
                  </div>
                )}
              </div>

              {/* 头像 - 使用 public 文件夹中的图片 */}
              {USE_IMAGES ? (
                <>
                  <img
                    className="absolute object-cover transition-all duration-300"
                    alt="Bad cat avatar"
                    src={IMAGE_ASSETS.avatarBad as string}
                    style={{
                      width: '35.5px',
                      height: '36px',
                      top: '131px',
                      left: '25px',
                      opacity: gameState.currentComfort <= 0.3 ? 1 : 0.3
                    }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />

                  <img
                    className="absolute object-cover transition-all duration-300"
                    alt="Happy cat avatar"
                    src={IMAGE_ASSETS.avatarHappy as string}
                    style={{
                      width: '35.5px',
                      height: '36px',
                      top: '126px',
                      left: '329px',
                      opacity: gameState.currentComfort >= 0.8 ? 1 : 0.3
                    }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </>
              ) : (
                <>
                  <div
                    className="absolute flex items-center justify-center text-4xl transition-all duration-300"
                    style={{
                      width: '35.5px',
                      height: '36px',
                      top: '131px',
                      left: '25px',
                      opacity: gameState.currentComfort <= 0.3 ? 1 : 0.3
                    }}
                  >
                    {IMAGE_ASSETS.avatarBad}
                  </div>

                  <div
                    className="absolute flex items-center justify-center text-4xl transition-all duration-300"
                    style={{
                      width: '35.5px',
                      height: '36px',
                      top: '126px',
                      left: '329px',
                      opacity: gameState.currentComfort >= 0.8 ? 1 : 0.3
                    }}
                  >
                    {IMAGE_ASSETS.avatarHappy}
                  </div>
                </>
              )}

              {/* 舒适度进度条 */}
              <div 
                className="absolute"
                style={{
                  top: '172px',
                  left: '25px',
                  width: '340px',
                  height: '28px',
                  border: '6px solid #36417E',
                  background: '#D9D9D9',
                  borderRadius: '4px'
                }}
              >
                <div className="relative w-full h-full overflow-hidden">
                  <ProgressBar
                    value={gameState.currentComfort}
                    className="w-full h-full"
                    barColor="#5FF367"
                    backgroundColor="transparent"
                  />
                  
                  {gameState.currentComfort >= 1.0 && gameState.successHoldTimer > 0 && (
                    <div className="absolute -top-12 left-1/2 transform -translate-x-1/2">
                      <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse">
                        Hold: {Math.ceil(GAME_CONFIG.SUCCESS_HOLD_TIME - gameState.successHoldTimer)}s
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 温度进度条 */}
              <div 
                className="absolute"
                style={{
                  top: '218px',
                  left: '25px',
                  width: '340px',
                  height: '39px',
                  border: '6px solid #36417E',
                  background: '#D9D9D9',
                  borderRadius: '4px'
                }}
              >
                <div className="relative w-full h-full overflow-hidden">
                  <ProgressBar
                    value={gameState.currentTemperature}
                    className="w-full h-full"
                    barColor="#728CFF"
                    backgroundColor="transparent"
                  />
                  
                  {/* 温度容忍带 */}
                  <div
                    className="absolute top-0 h-full opacity-60"
                    style={{
                      left: `${Math.max(0, (gameState.targetTemperature - gameState.toleranceWidth)) * 100}%`,
                      width: `${Math.min(100, (gameState.toleranceWidth * 2) * 100)}%`,
                      background: '#F99945',
                    }}
                  />
                  
                  {/* 目标温度线 */}
                  <div
                    className="absolute top-0 w-1 h-full bg-red-600 z-10"
                    style={{
                      left: `${gameState.targetTemperature * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* 目标温度显示 */}
              <div 
                className="absolute text-center"
                style={{
                  top: '275px',
                  left: '25px',
                  width: '340px',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '23px',
                  letterSpacing: '-0.423px',
                  color: '#36417E',
                  fontWeight: '900'
                }}
              >
                Target: {Math.round(gameState.targetTemperature * 100)}°
              </div>

              {/* 温度指针 */}
              <div
                className="absolute transition-all duration-100 flex items-center justify-center z-20"
                style={{
                  top: '209px',
                  left: `${25 + (gameState.currentTemperature * 315)}px`,
                  width: '25px',
                  height: '57px',
                  border: '6px solid #36417E',
                  background: '#F8CB56',
                  borderRadius: '4px'
                }}
              />

              {/* 控制按钮 - 使用 public 文件夹中的图片 */}
              <GameButton
                className="absolute w-[63px] h-[62px] top-[692px] left-8 transition-all duration-100 hover:scale-105 active:scale-95 bg-red-500 hover:bg-red-600 text-white font-bold text-2xl rounded-lg shadow-lg"
                onMouseDown={handleMinusPress}
                onMouseUp={handleMinusRelease}
                onMouseLeave={handleMinusRelease}
                onTouchStart={handleMinusPress}
                onTouchEnd={handleMinusRelease}
                disabled={gameState.gameStatus !== 'playing'}
                imageSrc={IMAGE_ASSETS.buttonMinus}
                isReversed={gameState.isControlsReversed}
              >
                <span className="text-white font-bold text-2xl">
                  {gameState.isControlsReversed ? '+' : '-'}
                </span>
              </GameButton>

              {/* 中心交互按钮 */}
              <div className="absolute w-[111px] h-28 top-[667px] left-36">
                <GameButton
                  onClick={handleCenterButtonClick}
                  className={`w-full h-full transition-all duration-200 ${
                    gameState.interferenceEvent.isActive 
                      ? 'bg-yellow-400 hover:bg-yellow-500 hover:scale-105 active:scale-95 animate-pulse' 
                      : 'bg-gray-400 opacity-50 cursor-default'
                  } rounded-lg shadow-lg`}
                  disabled={!gameState.interferenceEvent.isActive}
                  imageSrc={IMAGE_ASSETS.buttonCenter}
                >
                  {gameState.interferenceEvent.isActive ? (
                    <>
                      <div className="absolute inset-0 bg-yellow-400 bg-opacity-30 rounded-lg animate-ping" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-white font-bold text-lg bg-black bg-opacity-50 px-2 py-1 rounded">
                          FIX!
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-600 text-2xl">
                      🔧
                    </div>
                  )}
                </GameButton>
              </div>

              <GameButton
                className="absolute w-[71px] h-16 top-[691px] left-[296px] transition-all duration-100 hover:scale-105 active:scale-95 bg-blue-500 hover:bg-blue-600 text-white font-bold text-2xl rounded-lg shadow-lg"
                onMouseDown={handlePlusPress}
                onMouseUp={handlePlusRelease}
                onMouseLeave={handlePlusRelease}
                onTouchStart={handlePlusPress}
                onTouchEnd={handlePlusRelease}
                disabled={gameState.gameStatus !== 'playing'}
                imageSrc={IMAGE_ASSETS.buttonPlus}
                isReversed={gameState.isControlsReversed}
              >
                <span className="text-white font-bold text-2xl">
                  {gameState.isControlsReversed ? '-' : '+'}
                </span>
              </GameButton>

              {/* 游戏状态指示器 - 叠加在游戏界面之上 */}
              <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center text-sm z-30">
                <div className="bg-black bg-opacity-50 text-white px-2 py-1 rounded">
                  Temp: {Math.round(gameState.currentTemperature * 100)}%
                </div>
                <div className="bg-black bg-opacity-50 text-white px-2 py-1 rounded">
                  Comfort: {Math.round(gameState.currentComfort * 100)}%
                </div>
                <div className="bg-black bg-opacity-50 text-white px-2 py-1 rounded">
                  Target: {Math.round(gameState.targetTemperature * 100)}%
                </div>
                {gameState.isControlsReversed && (
                  <div className="bg-purple-600 text-white px-2 py-1 rounded animate-pulse">
                    🔄 REVERSED
                  </div>
                )}
              </div>

              {/* 干扰系统覆盖层 - 叠加在游戏界面之上 */}
              <InterferenceOverlay
                interferenceEvent={gameState.interferenceEvent}
                onCenterButtonClick={handleCenterButtonClick}
                isControlsReversed={gameState.isControlsReversed}
              />
            </div>
          </div>
        </div>

        {/* 游戏结束覆盖层 - 最高层级 */}
        <GameOverlay 
          gameState={gameState} 
          currentRound={currentRound}
          onRestart={resetGame}
          onNextRound={startNextRound}
        />
      </div>
    </div>
  );
};