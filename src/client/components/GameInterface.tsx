/**
 * 主游戏界面组件
 * 负责整体游戏界面的布局和交互
 * 
 * @author 开发者B - UI/UX 界面负责人
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, GameConfig } from '../../shared/types/game';
import { GameStateManager } from '../systems/GameStateManager';
import { ProgressBar } from './ProgressBar';
import { GameButton } from './GameButton';
import { GameOverlay } from './GameOverlay';
import { InterferenceOverlay } from './InterferenceOverlay';
import { StatusIndicator } from './StatusIndicator';

interface GameInterfaceProps {
  initialConfig?: GameConfig;
  onGameStateChange?: (state: GameState) => void;
}

// 默认游戏配置
const DEFAULT_GAME_CONFIG: GameConfig = {
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

// 图片资源配置
const USE_IMAGES = true;
const IMAGE_ASSETS = {
  background: USE_IMAGES ? './background.png' : null,
  avatarBad: USE_IMAGES ? './avatar-bad.png' : '😿',
  avatarHappy: USE_IMAGES ? './avatar-yellowsmiley.png' : '😸',
  buttonMinus: USE_IMAGES ? './button-temp-minus.png' : null,
  buttonPlus: USE_IMAGES ? './button-temp-plus.png' : null,
  buttonCenter: USE_IMAGES ? './button-center-interaction.png' : null,
};

export const GameInterface: React.FC<GameInterfaceProps> = ({
  initialConfig = DEFAULT_GAME_CONFIG,
  onGameStateChange,
}) => {
  // 游戏状态管理
  const [gameStateManager] = useState(() => new GameStateManager(initialConfig));
  const [gameState, setGameState] = useState<GameState>(() => 
    gameStateManager.createInitialState()
  );
  const [currentRound, setCurrentRound] = useState(1);

  // 游戏循环管理
  const gameLoopRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(Date.now());

  // 按钮事件处理
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

  // 游戏控制
  const resetGame = useCallback(() => {
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
      gameLoopRef.current = null;
    }
    
    setCurrentRound(1);
    const newConfig = { ...initialConfig, GAME_DURATION: 30 };
    gameStateManager.updateConfig(newConfig);
    const newState = gameStateManager.resetGameState();
    setGameState(newState);
    
    lastUpdateRef.current = Date.now();
    console.log('🔄 Game reset');
  }, [gameStateManager, initialConfig]);

  const startNextRound = useCallback(() => {
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
      gameLoopRef.current = null;
    }
    
    const nextRound = currentRound + 1;
    const newDuration = Math.max(10, 30 - ((nextRound - 1) * 10));
    const newConfig = { ...initialConfig, GAME_DURATION: newDuration };
    
    setCurrentRound(nextRound);
    gameStateManager.updateConfig(newConfig);
    const newState = gameStateManager.resetGameState();
    setGameState(newState);
    
    lastUpdateRef.current = Date.now();
    console.log(`🎯 Starting round ${nextRound} with ${newDuration}s`);
  }, [currentRound, gameStateManager, initialConfig]);

  // 游戏循环
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
        const newState = gameStateManager.updateGameState(prevState, deltaTime);
        onGameStateChange?.(newState);
        return newState;
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
  }, [gameState.gameStatus, gameStateManager, onGameStateChange]);

  // 时间格式化
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 背景样式
  const backgroundStyle = USE_IMAGES && IMAGE_ASSETS.background 
    ? { backgroundImage: `url(${IMAGE_ASSETS.background})`, backgroundSize: 'cover', backgroundPosition: '50% 50%' }
    : {};

  return (
    <div className="w-full h-screen bg-gradient-to-b from-blue-100 to-blue-200 flex items-center justify-center">
      <div className="w-[390px] h-[844px] relative overflow-hidden rounded-3xl shadow-2xl">
        <div className="fixed w-[390px] h-[844px] top-0 left-0">
          <div className="p-0 h-[844px]">
            <div 
              className="relative w-[390px] h-[844px] bg-gradient-to-b from-purple-300 via-pink-200 to-blue-300"
              style={backgroundStyle}
            >
              {/* 游戏标题 - 更新样式 */}
              <div className="absolute top-8 left-0 right-0 text-center">
                <h1 className="text-3xl font-bold text-white drop-shadow-lg">
                  🐱 Cat Comfort 🐱
                </h1>
                <p className="text-sm text-white/90 mt-2 font-medium">
                  Keep your cat cozy and happy!
                </p>
              </div>
              
              {/* 计时器显示 - 更新样式 */}
              <div className="absolute top-[280px] left-1/2 transform -translate-x-1/2 flex flex-col items-center">
                <div className="bg-white/20 backdrop-blur-md text-white px-4 py-1 rounded-full mb-2 text-sm font-bold">
                  Round {currentRound}
                </div>
                
                <div 
                  className="bg-white/30 backdrop-blur-md text-white px-6 py-4 rounded-2xl text-center shadow-lg"
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '28px',
                    fontWeight: '700',
                    minWidth: '120px'
                  }}
                >
                  {formatTime(gameState.gameTimer)}
                </div>
                
                {gameState.gameStatus === 'playing' && currentRound < 3 && (
                  <div className="text-xs text-white/80 mt-2 text-center font-medium">
                    Next Round: {Math.max(10, 30 - (currentRound * 10))}s
                  </div>
                )}
              </div>

              {/* 进度条容器 - 更新样式 */}
              <div className="absolute bottom-32 left-0 right-0 px-8">
                <div className="space-y-6">
                  {/* 温度进度条 */}
                  <div>
                    <div className="flex justify-between text-sm text-white/90 mb-2">
                      <span>Temperature</span>
                      <span>{Math.round(gameState.currentTemperature * 100)}%</span>
                    </div>
                    <ProgressBar
                      value={gameState.currentTemperature}
                      barColor="rgb(239 68 68)"
                      backgroundColor="rgb(255 255 255 / 0.2)"
                      className="h-3 rounded-full overflow-hidden backdrop-blur-sm"
                    />
                  </div>
                  
                  {/* 舒适度进度条 */}
                  <div>
                    <div className="flex justify-between text-sm text-white/90 mb-2">
                      <span>Comfort</span>
                      <span>{Math.round(gameState.currentComfort * 100)}%</span>
                    </div>
                    <ProgressBar
                      value={gameState.currentComfort}
                      barColor="rgb(34 197 94)"
                      backgroundColor="rgb(255 255 255 / 0.2)"
                      className="h-3 rounded-full overflow-hidden backdrop-blur-sm"
                    />
                  </div>
                </div>
              </div>

              {/* 控制按钮 - 更新样式 */}
              <div className="absolute bottom-12 left-0 right-0 px-8">
                <div className="flex justify-between items-center">
                  <GameButton
                    onMouseDown={handleMinusPress}
                    onMouseUp={handleMinusRelease}
                    onMouseLeave={handleMinusRelease}
                    onTouchStart={handleMinusPress}
                    onTouchEnd={handleMinusRelease}
                    disabled={gameState.gameStatus !== 'playing'}
                    className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-full shadow-lg"
                    imageSrc={IMAGE_ASSETS.buttonMinus}
                    isReversed={gameState.isControlsReversed}
                  >
                    ❄️
                  </GameButton>
                  
                  <GameButton
                    onClick={handleCenterButtonClick}
                    disabled={!gameState.interferenceEvent.isActive}
                    className="w-16 h-16 bg-white/30 backdrop-blur-md rounded-full shadow-lg"
                    imageSrc={IMAGE_ASSETS.buttonCenter}
                  >
                    🔧
                  </GameButton>
                  
                  <GameButton
                    onMouseDown={handlePlusPress}
                    onMouseUp={handlePlusRelease}
                    onMouseLeave={handlePlusRelease}
                    onTouchStart={handlePlusPress}
                    onTouchEnd={handlePlusRelease}
                    disabled={gameState.gameStatus !== 'playing'}
                    className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-full shadow-lg"
                    imageSrc={IMAGE_ASSETS.buttonPlus}
                    isReversed={gameState.isControlsReversed}
                  >
                    🔥
                  </GameButton>
                </div>
              </div>
              
              {/* 游戏状态覆盖层 */}
              {gameState.gameStatus !== 'playing' && (
                <GameOverlay
                  gameState={gameState}
                  currentRound={currentRound}
                  onRestart={resetGame}
                  onNextRound={startNextRound}
                />
              )}
              
              {/* 干扰效果覆盖层 */}
              {gameState.interferenceEvent.isActive && (
                <InterferenceOverlay
                  interferenceEvent={gameState.interferenceEvent}
                  onCenterButtonClick={handleCenterButtonClick}
                  isControlsReversed={gameState.isControlsReversed}
                />
              )}
              
              {/* 状态指示器 */}
              <StatusIndicator
                gameState={gameState}
                className="absolute top-24 right-8"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};