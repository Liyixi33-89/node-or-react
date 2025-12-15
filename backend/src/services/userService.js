const User = require('../models/User');
const crypto = require('crypto');

class UserService {
  // 验证用户名格式（只允许数字和英文字符）
  static validateUsername(username) {
    if (!username) {
      return {
        valid: false,
        message: '用户名不能为空'
      };
    }

    // 检查长度（3-20个字符）
    if (username.length < 3 || username.length > 20) {
      return {
        valid: false,
        message: '用户名长度必须在3-20个字符之间'
      };
    }

    // 只允许数字和英文字符（大小写）
    const usernameRegex = /^[a-zA-Z0-9]+$/;
    if (!usernameRegex.test(username)) {
      return {
        valid: false,
        message: '用户名只能包含数字和英文字符'
      };
    }

    return {
      valid: true
    };
  }

  // 密码加密
  static hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
  }

  // 检查当天注册数量是否超过限制
  static async checkDailyRegistrationLimit() {
    try {
      // 获取今天的开始时间（00:00:00）
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // 获取明天的开始时间（00:00:00）
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // 查询今天注册的用户数量
      const todayRegistrationCount = await User.countDocuments({
        createdAt: {
          $gte: today,
          $lt: tomorrow
        }
      });

      // 每天最多注册10个用户
      const dailyLimit = 10;

      return {
        isExceeded: todayRegistrationCount >= dailyLimit,
        currentCount: todayRegistrationCount,
        limit: dailyLimit,
        remaining: Math.max(0, dailyLimit - todayRegistrationCount)
      };
    } catch (error) {
      console.error('检查注册限制失败:', error);
      return {
        isExceeded: false,
        currentCount: 0,
        limit: 10,
        remaining: 10
      };
    }
  }

  // 用户注册
  static async register(username, password, name) {
    try {
      // 验证用户名格式
      const validation = this.validateUsername(username);
      if (!validation.valid) {
        return {
          success: false,
          message: validation.message
        };
      }

      // 检查当天注册数量限制
      const limitCheck = await this.checkDailyRegistrationLimit();
      if (limitCheck.isExceeded) {
        return {
          success: false,
          message: `今日注册人数已达上限（${limitCheck.limit}人），请明天再试`
        };
      }

      // 检查用户名是否已存在
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return {
          success: false,
          message: '用户名已存在'
        };
      }

      // 创建新用户
      const hashedPassword = this.hashPassword(password);
      const user = new User({
        username,
        password: hashedPassword,
        name
      });

      await user.save();

      return {
        success: true,
        message: '注册成功',
        data: {
          userId: user._id.toString(),
          username: user.username,
          name: user.name
        }
      };
    } catch (error) {
      console.error('注册失败:', error);
      return {
        success: false,
        message: '注册失败: ' + error.message
      };
    }
  }

  // 用户登录
  static async login(username, password) {
    try {
      // 验证用户名格式
      const validation = this.validateUsername(username);
      if (!validation.valid) {
        return {
          success: false,
          message: validation.message
        };
      }

      // 查找用户
      const user = await User.findOne({ username });
      if (!user) {
        return {
          success: false,
          message: '用户名或密码错误'
        };
      }

      // 验证密码
      const hashedPassword = this.hashPassword(password);
      if (user.password !== hashedPassword) {
        return {
          success: false,
          message: '用户名或密码错误'
        };
      }

      // 更新最后登录时间
      user.lastLoginAt = new Date();
      await user.save();

      return {
        success: true,
        message: '登录成功',
        data: {
          userId: user._id.toString(),
          username: user.username,
          name: user.name
        }
      };
    } catch (error) {
      console.error('登录失败:', error);
      return {
        success: false,
        message: '登录失败: ' + error.message
      };
    }
  }

  // 获取用户信息
  static async getUserInfo(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return {
          success: false,
          message: '用户不存在'
        };
      }

      return {
        success: true,
        data: {
          userId: user._id.toString(),
          username: user.username,
          name: user.name,
          createdAt: user.createdAt,
          lastLoginAt: user.lastLoginAt
        }
      };
    } catch (error) {
      console.error('获取用户信息失败:', error);
      return {
        success: false,
        message: '获取用户信息失败: ' + error.message
      };
    }
  }

  // 快速登录（开发模式，自动创建用户）
  static async quickLogin(username = 'demo') {
    try {
      // 验证用户名格式
      const validation = this.validateUsername(username);
      if (!validation.valid) {
        return {
          success: false,
          message: validation.message
        };
      }

      // 查找或创建用户
      let user = await User.findOne({ username });
      
      if (!user) {
        // 检查当天注册数量限制
        const limitCheck = await this.checkDailyRegistrationLimit();
        if (limitCheck.isExceeded) {
          return {
            success: false,
            message: `今日注册人数已达上限（${limitCheck.limit}人），请明天再试或使用已有账号登录`
          };
        }

        const hashedPassword = this.hashPassword('123456');
        user = new User({
          username,
          password: hashedPassword,
          name: username === 'demo' ? '演示用户' : username
        });
        await user.save();
      }

      // 更新最后登录时间
      user.lastLoginAt = new Date();
      await user.save();

      return {
        success: true,
        message: '快速登录成功',
        data: {
          userId: user._id.toString(),
          username: user.username,
          name: user.name
        }
      };
    } catch (error) {
      console.error('快速登录失败:', error);
      return {
        success: false,
        message: '快速登录失败: ' + error.message
      };
    }
  }
}

module.exports = UserService;
