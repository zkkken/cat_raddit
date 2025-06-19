/**
 * 舒适度管理系统
 * 负责处理猫咪舒适度的计算和状态变化
 * 
 * @author 开发者A - 游戏核心逻辑负责人
 */

import { GameConfig } from '../types/GameTypes';

export class ComfortSystem {
  private config: GameConfig;

  constructor(config: GameConfig) {
    this.config = config;
  }

  /**
   * 更新舒适度基于温度准确性
   * Update comfort based on temperature accuracy
   */
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

    // 限制舒适度范围在 0-1 之间
    return Math.max(0, Math.min(1, newComfort));
  }

  /**
   * 获取舒适度对应的颜色
   * Get color based on comfort level
   */
  getComfortColor(comfortLevel: number): string {
    if (comfortLevel >= 0.8) return '#10b981'; // Green
    if (comfortLevel >= 0.5) return '#f59e0b'; // Yellow
    return '#ef4444'; // Red
  }

  /**
   * 获取舒适度对应的表情
   * Get emoji based on comfort level
   */
  getComfortEmoji(comfortLevel: number): string {
    if (comfortLevel >= 0.8) return '😸'; // Happy cat
    if (comfortLevel >= 0.5) return '😐'; // Neutral cat
    return '🙀'; // Scared cat
  }

  /**
   * 获取舒适度对应的头像
   * Get avatar based on comfort level
   */
  getComfortAvatar(comfortLevel: number): string {
    if (comfortLevel >= 0.8) {
      return "/avatar-yellowsmiley.png"; // Happy cat
    } else if (comfortLevel <= 0.3) {
      return "/avatar-bad.png"; // Unhappy cat
    } else {
      return "/avatar-yellowsmiley.png"; // Neutral/default
    }
  }

  /**
   * 检查是否舒适度过低导致失败
   * Check if comfort is too low causing failure
   */
  isComfortFailure(comfortLevel: number): boolean {
    return comfortLevel <= 0;
  }

  /**
   * 检查是否达到最大舒适度
   * Check if maximum comfort is reached
   */
  isMaxComfort(comfortLevel: number): boolean {
    return comfortLevel >= 1.0;
  }

  /**
   * 根据舒适度获取猫咪头像
   * @param comfortLevel 舒适度等级 (0-1)
   * @returns 头像文件名或表情符号
   */
  getComfortAvatar2(comfortLevel: number): string {
    if (comfortLevel >= 0.8) {
      return "😻"; // 非常开心
    } else if (comfortLevel >= 0.6) {
      return "😸"; // 开心
    } else if (comfortLevel >= 0.4) {
      return "😐"; // 一般
    } else if (comfortLevel >= 0.2) {
      return "😿"; // 不开心
    } else {
      return "💀"; // 非常不开心
    }
  }

  /**
   * 获取舒适度状态描述
   * @param comfortLevel 舒适度等级 (0-1)
   * @returns 状态描述
   */
  getComfortStatus(comfortLevel: number): 'excellent' | 'good' | 'fair' | 'poor' | 'critical' {
    if (comfortLevel >= 0.8) return 'excellent';
    if (comfortLevel >= 0.6) return 'good';
    if (comfortLevel >= 0.4) return 'fair';
    if (comfortLevel >= 0.2) return 'poor';
    return 'critical';
  }

  /**
   * 检查是否达到成功条件
   * @param comfortLevel 舒适度等级 (0-1)
   * @returns 是否达到成功条件
   */
  isSuccessConditionMet(comfortLevel: number): boolean {
    return comfortLevel >= 0.8;
  }

  /**
   * 计算舒适度变化趋势
   * @param currentComfort 当前舒适度
   * @param previousComfort 之前的舒适度
   * @returns 变化趋势 ('increasing' | 'decreasing' | 'stable')
   */
  getComfortTrend(currentComfort: number, previousComfort: number): 'increasing' | 'decreasing' | 'stable' {
    const difference = currentComfort - previousComfort;
    const threshold = 0.01; // 1% 的变化阈值

    if (difference > threshold) return 'increasing';
    if (difference < -threshold) return 'decreasing';
    return 'stable';
  }
}