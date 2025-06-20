/**
 * 游戏状态管理器
 * 统一管理游戏状态更新和事件处理
 * 
 * @author 开发者A - 游戏核心逻辑负责人
 */

import { GameConfig, GameState, GameStatus, InterferenceType } from '../types/GameTypes';
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
    this.temperatureSystem = new TemperatureSystem(newConfig);
    this.comfortSystem = new ComfortSystem(newConfig);
    this.interferenceSystem = new InterferenceSystem(newConfig);
    this.timerSystem = new TimerSystem(newConfig);
  }

  /**
   * 创建初始游戏状态
   * @returns 初始游戏状态
   */
  createInitialState(): GameState {
    const targetTemp = this.temperatureSystem.generateRandomTargetTemperature();
    return {
      currentTemperature: this.config.INITIAL_TEMPERATURE,
      targetTemperature: targetTemp,
      toleranceWidth: this.config.TOLERANCE_WIDTH,
      currentComfort: 0,
      gameTimer: this.config.GAME_DURATION,
      successHoldTimer: 0,
      isPlusHeld: false,
      isMinusHeld: false,
      gameStatus: 'playing',
      interferenceEvent: this.interferenceSystem.clearInterferenceEvent(),
      interferenceTimer: this.interferenceSystem.generateRandomInterferenceInterval(),
      isControlsReversed: false,
      speedMultiplier: 1.0
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

    // 更新计时器
    const newGameTimer = this.timerSystem.updateGameTimer(currentState.gameTimer, deltaTime);
    const newInterferenceTimer = this.timerSystem.updateInterferenceTimer(
      currentState.interferenceTimer,
      deltaTime
    );

    // 处理干扰事件
    let newState = this.handleInterferenceEvents({
      ...currentState,
      gameTimer: newGameTimer,
      interferenceTimer: newInterferenceTimer
    }, deltaTime);

    // 更新温度
    const effectiveDeltaTime = deltaTime * newState.speedMultiplier;
    const newTemperature = this.temperatureSystem.updateTemperature(
      newState.currentTemperature,
      newState.isPlusHeld,
      newState.isMinusHeld,
      newState.isControlsReversed,
      effectiveDeltaTime
    );

    // 检查温度是否在目标范围内
    const isInRange = this.temperatureSystem.isTemperatureInRange(
      newTemperature,
      newState.targetTemperature,
      newState.toleranceWidth
    );

    // 更新舒适度
    let comfortChangeRate = this.config.COMFORT_CHANGE_RATE;
    if (newState.interferenceEvent.type === 'comfort_drain') {
      comfortChangeRate *= newState.interferenceEvent.intensity;
    }
    
    const newComfort = this.comfortSystem.updateComfort(
      newState.currentComfort,
      isInRange,
      effectiveDeltaTime,
      comfortChangeRate
    );

    // 更新成功保持计时器
    const isMaxComfort = newComfort >= 1;
    const newSuccessHoldTimer = this.timerSystem.updateSuccessHoldTimer(
      newState.successHoldTimer,
      isMaxComfort,
      deltaTime
    );

    // 检查游戏状态
    let newGameStatus = newState.gameStatus;
    if (this.timerSystem.isTimeFailure(newGameTimer)) {
      newGameStatus = 'failure';
    } else if (this.timerSystem.isSuccessHoldComplete(newSuccessHoldTimer)) {
      newGameStatus = 'success';
    }

    return {
      ...newState,
      currentTemperature: newTemperature,
      currentComfort: newComfort,
      gameTimer: newGameTimer,
      successHoldTimer: newSuccessHoldTimer,
      gameStatus: newGameStatus
    };
  }

  /**
   * 🔧 关键修复：处理干扰事件
   * @param state 当前状态
   * @param deltaTime 时间增量
   * @returns 更新后的状态
   */
  private handleInterferenceEvents(state: GameState, deltaTime: number): GameState {
    let newState = { ...state };

    // 更新现有干扰事件
    if (newState.interferenceEvent.isActive) {
      const updatedEvent = this.interferenceSystem.updateInterferenceEvent(
        newState.interferenceEvent,
        deltaTime
      );

      // 如果干扰结束，重置相关状态
      if (!updatedEvent.isActive) {
        newState.isControlsReversed = false;
        newState.speedMultiplier = 1.0;
        newState.interferenceTimer = this.interferenceSystem.generateRandomInterferenceInterval();
      }

      newState.interferenceEvent = updatedEvent;
    }

    // 检查是否需要触发新的干扰
    if (this.interferenceSystem.shouldTriggerInterference(
      newState.interferenceTimer,
      newState.interferenceEvent.isActive
    )) {
      const interferenceType = this.interferenceSystem.getRandomInterferenceType();
      const newEvent = this.interferenceSystem.createInterferenceEvent(interferenceType);

      // 应用干扰效果
      switch (interferenceType) {
        case 'controls_reversed':
          newState.isControlsReversed = true;
          break;
        case 'temperature_shock':
          newState.currentTemperature = this.interferenceSystem.applyTemperatureShock(
            newState.currentTemperature,
            newEvent.intensity
          );
          break;
        case 'speed_change':
          newState.speedMultiplier = newEvent.intensity;
          break;
        case 'target_shift':
          const shift = (Math.random() > 0.5 ? 1 : -1) * newEvent.intensity;
          newState.targetTemperature = Math.max(
            this.config.TARGET_TEMPERATURE_MIN,
            Math.min(
              this.config.TARGET_TEMPERATURE_MAX,
              newState.targetTemperature + shift
            )
          );
          break;
        case 'comfort_drain':
          // 舒适度下降效果在更新舒适度时处理
          break;
      }

      newState.interferenceEvent = newEvent;
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

    // 清除干扰效果
    return {
      ...currentState,
      interferenceEvent: this.interferenceSystem.clearInterferenceEvent(),
      isControlsReversed: false,
      speedMultiplier: 1.0,
      interferenceTimer: this.interferenceSystem.generateRandomInterferenceInterval()
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