/**
 * 干扰事件系统
 * 负责处理游戏中的各种干扰事件
 *
 * @author 开发者A - 游戏核心逻辑负责人
 */

// 假设这些类型定义在别处
export interface GameConfig {
  INTERFERENCE_MAX_INTERVAL: number;
  INTERFERENCE_MIN_INTERVAL: number;
  INTERFERENCE_DURATION: number;
}

export type InterferenceType = 'none' | 'controls_reversed' | 'temperature_shock' | 'bubble_obstruction';

export interface InterferenceEvent {
  type: InterferenceType;
  isActive: boolean;
  duration: number;
  remainingTime: number;
}


export class InterferenceSystem {
  private config: GameConfig;

  constructor(config: GameConfig) {
    this.config = config;
  }

  /**
   * 生成随机干扰间隔时间
   * Generate random interference interval
   */
  generateRandomInterferenceInterval(): number {
    return Math.random() *
      (this.config.INTERFERENCE_MAX_INTERVAL - this.config.INTERFERENCE_MIN_INTERVAL) +
      this.config.INTERFERENCE_MIN_INTERVAL;
  }

  /**
   * 获取随机干扰类型
   * Get random interference type
   */
  getRandomInterferenceType(): InterferenceType {
    const types: InterferenceType[] = ['controls_reversed', 'temperature_shock', 'bubble_obstruction'];
    return types[Math.floor(Math.random() * types.length)];
  }

  /**
   * 创建新的干扰事件
   * Create new interference event
   */
  createInterferenceEvent(type: InterferenceType): InterferenceEvent {
    return {
      type,
      isActive: true,
      duration: this.config.INTERFERENCE_DURATION,
      remainingTime: this.config.INTERFERENCE_DURATION,
    };
  }

  /**
   * 清除干扰事件
   * Clear interference event
   */
  clearInterferenceEvent(): InterferenceEvent {
    return {
      type: 'none',
      isActive: false,
      duration: 0,
      remainingTime: 0,
    };
  }

  /**
   * 应用干扰效果到目标温度
   * Apply interference effects to target temperature
   */
  applyTemperatureShock(): number {
    // 温度冲击：随机设置极端目标温度
    return Math.random() > 0.5 ? 0.9 : 0.1;
  }

  /**
   * 🔧【关键修复】更新干扰事件剩余时间
   * 这个函数是解决问题的核心。它负责倒计时，并在时间结束后清除事件。
   * @param interferenceEvent 当前干扰事件
   * @param deltaTime 时间增量 (从游戏主循环传入)
   * @returns 更新后的干扰事件
   */
  updateInterferenceEvent(
    interferenceEvent: InterferenceEvent,
    deltaTime: number
  ): InterferenceEvent {
    if (!interferenceEvent.isActive) {
      return interferenceEvent;
    }

    const newRemainingTime = Math.max(0, interferenceEvent.remainingTime - deltaTime);

    // 当剩余时间为0时，清除干扰事件
    if (newRemainingTime <= 0) {
      return this.clearInterferenceEvent();
    }

    // 否则，只更新剩余时间
    return {
      ...interferenceEvent,
      remainingTime: newRemainingTime,
    };
  }

  /**
   * 获取干扰事件的显示内容
   * Get interference event display content
   */
  getInterferenceContent(type: InterferenceType) {
    switch (type) {
      case 'controls_reversed':
        return {
          icon: '🔄',
          title: '控制反转!',
          description: '+ 和 - 按键功能已交换!',
          bgColor: 'bg-purple-500',
        };
      case 'temperature_shock':
        return {
          icon: '⚡',
          title: '温度冲击!',
          description: '目标温度已改变!',
          bgColor: 'bg-orange-500',
        };
      case 'bubble_obstruction':
        return {
          icon: '🫧',
          title: '气泡麻烦!',
          description: '气泡挡住了你的视线!',
          bgColor: 'bg-blue-500',
        };
      default:
        return {
          icon: '⚠️',
          title: '发生干扰!',
          description: '出现未知问题!',
          bgColor: 'bg-red-500',
        };
    }
  }

  /**
   * 检查是否应该触发干扰事件
   * Check if interference event should be triggered
   */
  shouldTriggerInterference(
    interferenceTimer: number,
    isInterferenceActive: boolean
  ): boolean {
    return interferenceTimer <= 0 && !isInterferenceActive;
  }

  /**
   * 【已恢复】获取干扰事件的描述信息
   * @param type 干扰类型
   * @returns 干扰事件描述
   */
  getInterferenceDescription(type: InterferenceType): {
    icon: string;
    title: string;
    description: string;
    bgColor: string;
  } {
    return this.getInterferenceContent(type);
  }

  /**
   * 【已恢复】获取干扰事件的严重程度
   * @param type 干扰类型
   * @returns 严重程度 (1-3, 3最严重)
   */
  getInterferenceSeverity(type: InterferenceType): number {
    switch (type) {
      case 'bubble_obstruction': return 1; // 视觉干扰，相对较轻
      case 'temperature_shock': return 2;  // 目标变化，中等影响
      case 'controls_reversed': return 3;  // 控制反转，最严重
      default: return 1;
    }
  }

  /**
   * 【已恢复】检查干扰是否可以被清除
   * @param type 干扰类型
   * @returns 是否可以通过中心按钮清除
   */
  canBeClearedByButton(type: InterferenceType): boolean {
    // 假设所有干扰类型都可以通过某个按钮清除
    return type !== 'none';
  }
}