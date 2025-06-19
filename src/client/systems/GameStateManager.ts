/**
 * 游戏状态管理器
 * 统一管理游戏状态更新和事件处理
 * 
 * @author 开发者A - 游戏核心逻辑负责人
 */

import { GameConfig, GameState, GameStatus } from '../types/GameTypes';
import { TemperatureSystem } from './TemperatureSystem';
import { ComfortSystem } from './ComfortSystem';
import { InterferenceSystem } from './InterferenceSystem';
import { TimerSystem } from './TimerSystem';

export class GameStateManager {
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

  /**
   * 更新游戏配置
   * @param newConfig 新的游戏配置
   */
  updateConfig(newConfig: GameConfig): void {
    this.config = newConfig;
    this.timerSystem = new TimerSystem(newConfig);
  }

  /**
   * 创建初始游戏状态
   * @returns 初始游戏状态
   */
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

  /**
   * 更新游戏状态
   * @param currentState 当前游戏状态
   * @param deltaTime 时间增量（秒）
   * @returns 更新后的游戏状态
   */
  updateGameState(currentState: GameState, deltaTime: number): GameState {
    if (currentState.gameStatus !== 'playing') {
      return currentState;
    }

    let newState = { ...currentState };

    // 更新计时器
    newState.gameTimer = this.timerSystem.updateGameTimer(newState.gameTimer, deltaTime);
    newState.interferenceTimer = this.timerSystem.updateInterferenceTimer(newState.interferenceTimer, deltaTime);

    // 检查时间失败条件
    if (this.timerSystem.isTimeFailure(newState.gameTimer)) {
      newState.gameStatus = this.determineGameResult(newState.currentComfort);
      return newState;
    }

    // 🔧 关键修复：处理干扰事件
    newState = this.handleInterferenceEvents(newState, deltaTime);

    // 更新温度
    newState.currentTemperature = this.temperatureSystem.updateTemperature(
      newState.currentTemperature,
      newState.isPlusHeld,
      newState.isMinusHeld,
      newState.isControlsReversed,
      deltaTime
    );

    // 更新舒适度
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

    // 更新成功保持计时器
    const isMaxComfort = newState.currentComfort >= 1.0;
    newState.successHoldTimer = this.timerSystem.updateSuccessHoldTimer(
      newState.successHoldTimer,
      isMaxComfort,
      deltaTime
    );

    // 检查成功条件
    if (this.timerSystem.isSuccessHoldComplete(newState.successHoldTimer)) {
      newState.gameStatus = 'success';
    }

    return newState;
  }

  /**
   * 🔧 关键修复：处理干扰事件
   * @param state 当前状态
   * @param deltaTime 时间增量
   * @returns 更新后的状态
   */
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

  /**
   * 🔧 关键修复：处理中心按钮点击
   * @param currentState 当前游戏状态
   * @returns 更新后的游戏状态
   */
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

  /**
   * 重置游戏状态
   * @returns 新的初始游戏状态
   */
  resetGameState(): GameState {
    return this.createInitialState();
  }

  /**
   * 确定游戏结果
   * @param comfortLevel 舒适度等级
   * @returns 游戏状态
   */
  private determineGameResult(comfortLevel: number): GameStatus {
    return this.comfortSystem.isSuccessConditionMet(comfortLevel) ? 'success' : 'failure';
  }

  /**
   * 获取游戏状态摘要
   * @param state 游戏状态
   * @returns 状态摘要
   */
  getGameStateSummary(state: GameState): {
    temperatureStatus: string;
    comfortStatus: string;
    timeUrgency: string;
    interferenceActive: boolean;
  } {
    return {
      temperatureStatus: this.temperatureSystem.getTemperatureStatus(
        state.currentTemperature,
        state.targetTemperature,
        state.toleranceWidth
      ),
      comfortStatus: this.comfortSystem.getComfortStatus(state.currentComfort),
      timeUrgency: this.timerSystem.getTimeUrgency(state.gameTimer, this.config.GAME_DURATION),
      interferenceActive: state.interferenceEvent.isActive,
    };
  }

  /**
   * 验证游戏状态的有效性
   * @param state 游戏状态
   * @returns 是否有效
   */
  validateGameState(state: GameState): boolean {
    return (
      state.currentTemperature >= 0 && state.currentTemperature <= 1 &&
      state.targetTemperature >= 0 && state.targetTemperature <= 1 &&
      state.currentComfort >= 0 && state.currentComfort <= 1 &&
      state.gameTimer >= 0 &&
      state.successHoldTimer >= 0
    );
  }

  // 获取各个系统的实例，供UI组件使用
  getTemperatureSystem(): TemperatureSystem {
    return this.temperatureSystem;
  }

  getComfortSystem(): ComfortSystem {
    return this.comfortSystem;
  }

  getInterferenceSystem(): InterferenceSystem {
    return this.interferenceSystem;
  }

  getTimerSystem(): TimerSystem {
    return this.timerSystem;
  }
}