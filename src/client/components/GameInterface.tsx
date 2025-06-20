/**
 * 主游戏界面组件
 * 负责整体游戏界面的布局和交互
 * 
 * @author 开发者B - UI/UX 界面负责人
 */

import React, { useState, useEffect, useCallback } from 'react';
import { GameState, GameConfig, ImageAssets } from '../types/GameTypes';
import { GameStateManager } from '../systems/GameStateManager';
import { ProgressBar } from './ProgressBar';
import { GameButton } from './GameButton';
import { GameOverlay } from './GameOverlay';
import { InterferenceOverlay } from './InterferenceOverlay';

// 游戏配置
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

// 图片资源配置
const USE_IMAGES = true;
const IMAGE_ASSETS: ImageAssets = {
  background: USE_IMAGES ? '/background.png' : null,
  avatarBad: USE_IMAGES ? '/avatar-bad.png' : null,
  avatarHappy: USE_IMAGES ? '/avatar-yellowsmiley.png' : null,
  buttonMinus: USE_IMAGES ? '/button-temp-minus.png' : null,
  buttonPlus: USE_IMAGES ? '/button-temp-plus.png' : null,
  buttonCenter: USE_IMAGES ? '/button-center-interaction.png' : null,
};

export const GameInterface: React.FC = () => {
  // 创建游戏状态管理器实例
  const [gameStateManager] = useState(() => new GameStateManager(GAME_CONFIG));
  
  // 初始化游戏状态
  const [gameState, setGameState] = useState<GameState>(() => 
    gameStateManager.createInitialState()
  );

  // Track current round for timer reduction
  const [currentRound, setCurrentRound] = useState(1);

  // Temperature control handlers
  const handlePlusPress = useCallback(() => {
    setGameState(prev => ({ ...prev, isPlusHeld: true }));
  }, []);

  const handlePlusRelease = useCallback(() => {
    setGameState(prev => ({ ...prev, isPlusHeld: false }));
  }, []);

  const handleMinusPress = useCallback(() => {
    setGameState(prev => ({ ...prev, isMinusHeld: true }));
  }, []);

  const handleMinusRelease = useCallback(() => {
    setGameState(prev => ({ ...prev, isMinusHeld: false }));
  }, []);

  // Center button handler for interference events
  const handleCenterButtonClick = useCallback(() => {
    setGameState(prev => gameStateManager.handleCenterButtonClick(prev));
  }, [gameStateManager]);

  // Reset game
  const resetGame = useCallback(() => {
    setCurrentRound(1);
    const newConfig = { ...GAME_CONFIG, GAME_DURATION: 30 };
    gameStateManager.updateConfig(newConfig);
    setGameState(gameStateManager.resetGameState());
  }, [gameStateManager]);

  // Start next round
  const startNextRound = useCallback(() => {
    const nextRound = currentRound + 1;
    const newDuration = Math.max(10, 30 - ((nextRound - 1) * 10));
    const newConfig = { ...GAME_CONFIG, GAME_DURATION: newDuration };
    
    setCurrentRound(nextRound);
    gameStateManager.updateConfig(newConfig);
    setGameState(gameStateManager.resetGameState());
  }, [currentRound, gameStateManager]);

  // Main game loop
  useEffect(() => {
    if (gameState.gameStatus !== 'playing') return;

    const gameLoop = setInterval(() => {
      setGameState(prevState => {
        const deltaTime = 1/60;
        return gameStateManager.updateGameState(prevState, deltaTime);
      });
    }, 1000/60);

    return () => clearInterval(gameLoop);
  }, [gameState.gameStatus, gameStateManager]);

  // Format time as MM:SS
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
    <div className="w-[390px] h-[844px] relative">
      <div className="fixed w-[390px] h-[844px] top-0 left-0 border-0">
        <div className="p-0 h-[844px] bg-white">
          <div 
            className="relative w-[390px] h-[844px] bg-gradient-to-b from-purple-200 via-pink-200 to-blue-200"
            style={backgroundStyle}
          >
            
            {/* Timer Display */}
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

            {/* Avatar_Bad - Left side position */}
            <img
              className="absolute object-cover transition-all duration-300"
              alt="Bad cat avatar"
              src={IMAGE_ASSETS.avatarBad as string}
              style={{
                width: '35.5px',
                height: '36px',
                top: '131px',
                left: '25px'
              }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />

            {/* Avatar_YellowSmiley - Right side position */}
            <img
              className="absolute object-cover transition-all duration-300"
              alt="Happy cat avatar"
              src={IMAGE_ASSETS.avatarHappy as string}
              style={{
                width: '35.5px',
                height: '36px',
                top: '126px',
                left: '329px'
              }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />

            {/* Comfort Progress Bar */}
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

            {/* Temperature Progress Bar */}
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
                
                {/* Temperature Tolerance Band */}
                <div
                  className="absolute top-0 h-full opacity-60"
                  style={{
                    left: `${Math.max(0, (gameState.targetTemperature - gameState.toleranceWidth)) * 100}%`,
                    width: `${Math.min(100, (gameState.toleranceWidth * 2) * 100)}%`,
                    background: '#F99945',
                  }}
                />
                
                {/* Target temperature line */}
                <div
                  className="absolute top-0 w-1 h-full bg-red-600 z-10"
                  style={{
                    left: `${gameState.targetTemperature * 100}%`,
                  }}
                />
              </div>
            </div>

            {/* Temperature Pointer */}
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

            {/* Control buttons */}
            <GameButton
              className="absolute w-[63px] h-[62px] top-[692px] left-8 transition-all duration-100 hover:scale-105 active:scale-95"
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

            {/* Center interaction button */}
            <div className="absolute w-[111px] h-28 top-[667px] left-36">
              <GameButton
                onClick={handleCenterButtonClick}
                className={`w-full h-full relative transition-all duration-200 ${
                  gameState.interferenceEvent.isActive && gameState.interferenceEvent.type !== 'controls_reversed'
                    ? 'hover:scale-105 active:scale-95 animate-pulse' 
                    : 'opacity-50 cursor-default'
                }`}
                disabled={!gameState.interferenceEvent.isActive || gameState.interferenceEvent.type === 'controls_reversed'}
                imageSrc={IMAGE_ASSETS.buttonCenter}
              >
                {gameState.interferenceEvent.isActive && gameState.interferenceEvent.type !== 'controls_reversed' && (
                  <>
                    <div className="absolute inset-0 bg-yellow-400 bg-opacity-30 rounded-lg animate-ping" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-white font-bold text-lg bg-black bg-opacity-50 px-2 py-1 rounded">
                        FIX!
                      </span>
                    </div>
                  </>
                )}
              </GameButton>
            </div>

            <GameButton
              className="absolute w-[71px] h-16 top-[691px] left-[296px] transition-all duration-100 hover:scale-105 active:scale-95"
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

            {/* Interference system overlay */}
            <InterferenceOverlay
              interferenceEvent={gameState.interferenceEvent}
              onCenterButtonClick={handleCenterButtonClick}
              isControlsReversed={gameState.isControlsReversed}
            />
          </div>
        </div>
      </div>

      {/* Game Over Overlay */}
      <GameOverlay 
        gameState={gameState} 
        currentRound={currentRound}
        onRestart={resetGame}
        onNextRound={startNextRound}
      />
    </div>
  );
};