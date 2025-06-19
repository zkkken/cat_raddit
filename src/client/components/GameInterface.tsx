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

              {/* 猫咪头像 */}
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
                <ProgressBar
                  value={gameState.currentComfort}
                  className="w-full h-full"
                  barColor="#5FF367"
                  backgroundColor="transparent"
                />
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
                className="absolute transition-all duration-100 flex items-center justify-center z-20 temperature-pointer"
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

              {/* 控制按钮 */}
              <GameButton
                className="absolute w-[63px] h-[62px] top-[692px] left-8 transition-all duration-100 hover:scale-105 active:scale-95 bg-red-500 hover:bg-red-600 text-white font-bold text-2xl rounded-lg shadow-lg game-button"
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
                  className={`w-full h-full transition-all duration-200 game-button ${
                    gameState.interferenceEvent.isActive 
                      ? 'bg-yellow-400 hover:bg-yellow-500 hover:scale-105 active:scale-95 animate-pulse interference-active' 
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
                className="absolute w-[71px] h-16 top-[691px] left-[296px] transition-all duration-100 hover:scale-105 active:scale-95 bg-blue-500 hover:bg-blue-600 text-white font-bold text-2xl rounded-lg shadow-lg game-button"
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

              {/* 状态指示器 */}
              <StatusIndicator
                gameState={gameState}
                className="absolute bottom-4 left-4 right-4 z-30"
              />

              {/* 干扰系统覆盖层 */}
              <InterferenceOverlay
                interferenceEvent={gameState.interferenceEvent}
                onCenterButtonClick={handleCenterButtonClick}
                isControlsReversed={gameState.isControlsReversed}
              />
            </div>
          </div>
        </div>

        {/* 游戏结束覆盖层 */}
        <GameOverlay 
          gameState={gameState} 
          currentRound={currentRound}
          onRestart={resetGame}
          onNextRound={startNextRound}
          className="game-overlay"
        />
      </div>
    </div>
  );
};