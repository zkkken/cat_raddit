/**
 * 游戏API服务
 * 处理与后端的数据交互
 * 
 * @author 开发者C - 服务端API负责人
 */

import { GameState } from '../types/GameTypes';

interface ApiResponse<T> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
}

interface GameDataResponse {
  gameState: GameState;
  currentRound: number;
}

class GameApiService {
  private baseUrl = '/api';

  /**
   * 初始化游戏
   */
  async initGame(): Promise<ApiResponse<{ postId: string }>> {
    try {
      const response = await fetch(`${this.baseUrl}/init`);
      return await response.json();
    } catch (error) {
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * 获取游戏数据
   */
  async getGameData(): Promise<ApiResponse<GameDataResponse>> {
    try {
      const response = await fetch(`${this.baseUrl}/game-data`);
      return await response.json();
    } catch (error) {
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * 更新游戏状态
   */
  async updateGame(deltaTime: number): Promise<ApiResponse<{ gameState: GameState }>> {
    try {
      const response = await fetch(`${this.baseUrl}/update-game`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ deltaTime }),
      });
      return await response.json();
    } catch (error) {
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * 处理按钮按下
   */
  async handleButtonPress(
    buttonType: 'plus' | 'minus' | 'center',
    isPressed: boolean
  ): Promise<ApiResponse<{ gameState: GameState }>> {
    try {
      const response = await fetch(`${this.baseUrl}/button-press`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ buttonType, isPressed }),
      });
      return await response.json();
    } catch (error) {
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * 重置游戏
   */
  async resetGame(newRound?: number): Promise<ApiResponse<GameDataResponse>> {
    try {
      const response = await fetch(`${this.baseUrl}/reset-game`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newRound }),
      });
      return await response.json();
    } catch (error) {
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export const gameApiService = new GameApiService();