/**
 * 计时器系统
 * 负责处理游戏中的各种计时逻辑
 * 
 * @author 开发者A - 游戏核心逻辑负责人
 */

import { GameConfig } from '../types/GameTypes';

export class TimerSystem {
  private config: GameConfig;

  constructor(config: GameConfig) {
    this.config = config;
  }

  /**
   * 更新游戏主计时器
   * Update main game timer
   */
  updateGameTimer(currentTimer: number, deltaTime: number): number {
    return Math.max(0, currentTimer - deltaTime);
  }

  /**
   * 更新干扰计时器
   * Update interference timer
   */
  updateInterferenceTimer(currentTimer: number, deltaTime: number): number {
    return Math.max(0, currentTimer - deltaTime);
  }

  /**
   * 更新成功保持计时器
   * Update success hold timer
   */
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

  /**
   * 检查是否因时间耗尽而失败
   * Check if game failed due to time running out
   */
  isTimeFailure(gameTimer: number): boolean {
    return gameTimer <= 0;
  }

  /**
   * 检查是否达成成功条件
   * Check if success condition is met
   */
  isSuccessConditionMet(successHoldTimer: number): boolean {
    return successHoldTimer >= this.config.SUCCESS_HOLD_TIME;
  }

  /**
   * 检查是否达到成功保持时间
   * @param successHoldTimer 成功保持时间
   * @returns 是否达到成功条件
   */
  isSuccessHoldComplete(successHoldTimer: number): boolean {
    return successHoldTimer >= this.config.SUCCESS_HOLD_TIME;
  }

  /**
   * 获取剩余成功保持时间
   * Get remaining success hold time
   */
  getRemainingSuccessTime(successHoldTimer: number): number {
    return Math.ceil(this.config.SUCCESS_HOLD_TIME - successHoldTimer);
  }

  /**
   * 获取游戏时间进度（0-1）
   * Get game time progress (0-1)
   */
  getTimeProgress(currentTimer: number): number {
    return currentTimer / this.config.GAME_DURATION;
  }

  /**
   * 获取时间对应的颜色
   * Get color based on remaining time
   */
  getTimeColor(timeProgress: number): string {
    if (timeProgress > 0.6) return '#3b82f6'; // Blue
    if (timeProgress > 0.3) return '#f59e0b'; // Orange
    return '#ef4444'; // Red
  }

  /**
   * 格式化显示时间
   * Format display time
   */
  formatTime(seconds: number): string {
    return `${Math.ceil(Math.max(0, seconds))}s`;
  }

  /**
   * 格式化时间显示
   * @param seconds 秒数
   * @returns 格式化的时间字符串 (MM:SS)
   */
  formatTimeDetailed(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * 获取时间紧急程度
   * @param remainingTime 剩余时间
   * @param totalTime 总时间
   * @returns 紧急程度 ('safe' | 'warning' | 'critical')
   */
  getTimeUrgency(remainingTime: number, totalTime: number): 'safe' | 'warning' | 'critical' {
    const ratio = remainingTime / totalTime;
    
    if (ratio > 0.5) return 'safe';
    if (ratio > 0.2) return 'warning';
    return 'critical';
  }

  /**
   * 计算时间进度百分比
   * @param remainingTime 剩余时间
   * @param totalTime 总时间
   * @returns 进度百分比 (0-1)
   */
  getTimeProgressRatio(remainingTime: number, totalTime: number): number {
    return Math.max(0, Math.min(1, (totalTime - remainingTime) / totalTime));
  }

  /**
   * 获取时间显示颜色
   * @param remainingTime 剩余时间
   * @param totalTime 总时间
   * @returns 颜色值
   */
  getTimeDisplayColor(remainingTime: number, totalTime: number): string {
    const urgency = this.getTimeUrgency(remainingTime, totalTime);
    
    switch (urgency) {
      case 'safe': return '#10b981';    // 绿色
      case 'warning': return '#f59e0b'; // 黄色
      case 'critical': return '#ef4444'; // 红色
      default: return '#6b7280';        // 灰色
    }
  }

  /**
   * 计算下一回合的时间
   * @param currentRound 当前回合数
   * @param baseTime 基础时间
   * @param timeReduction 每回合减少的时间
   * @param minTime 最小时间
   * @returns 下一回合的时间
   */
  calculateNextRoundTime(
    currentRound: number,
    baseTime: number = 30,
    timeReduction: number = 10,
    minTime: number = 10
  ): number {
    return Math.max(minTime, baseTime - (currentRound * timeReduction));
  }

  /**
   * 获取时间警告信息
   * @param remainingTime 剩余时间
   * @returns 警告信息
   */
  getTimeWarning(remainingTime: number): string | null {
    if (remainingTime <= 5) {
      return `Only ${Math.ceil(remainingTime)} seconds left!`;
    }
    if (remainingTime <= 10) {
      return 'Time is running out!';
    }
    return null;
  }
}