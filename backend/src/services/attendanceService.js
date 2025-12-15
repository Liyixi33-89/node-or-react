const moment = require('moment');
const Attendance = require('../models/Attendance');

class AttendanceService {
  /**
   * 判断是否需要重置（每天早上6点重置）
   * @param {Date} lastCheckInTime - 上次签到时间
   * @returns {boolean}
   */
  shouldReset(lastCheckInTime) {
    const now = moment();
    const lastCheckIn = moment(lastCheckInTime);
    
    // 如果是不同日期
    if (!now.isSame(lastCheckIn, 'day')) {
      // 如果当前时间已过早上6点，则可以重置
      if (now.hour() >= 6) {
        return true;
      }
      // 如果当前时间未到早上6点，但上次签到是昨天6点之前
      if (now.hour() < 6 && lastCheckIn.hour() < 6) {
        return false;
      }
      return true;
    }
    return false;
  }

  /**
   * 获取当前有效日期（考虑早上6点重置规则）
   * @returns {string} YYYY-MM-DD格式的日期
   */
  getCurrentEffectiveDate() {
    const now = moment();
    // 如果当前时间在早上6点之前，算作前一天
    if (now.hour() < 6) {
      return now.subtract(1, 'day').format('YYYY-MM-DD');
    }
    return now.format('YYYY-MM-DD');
  }



  /**
   * 签到
   * @param {string} userId - 用户ID
   * @returns {Object} 签到结果
   */
  async checkIn(userId) {
    try {
      const now = moment();
      const dateKey = this.getCurrentEffectiveDate();

      // 查找今天的记录
      const existingRecord = await Attendance.findTodayRecord(userId, dateKey);

      if (existingRecord) {
        // 检查是否已经签到
        if (existingRecord.status === 'checked_in') {
          return {
            success: false,
            message: '今天已经签到过了',
            data: this.formatRecord(existingRecord)
          };
        }
        // 检查是否已经签退
        if (existingRecord.status === 'checked_out') {
          return {
            success: false,
            message: '今天已经签退，无法再次签到',
            data: this.formatRecord(existingRecord)
          };
        }
      }

      // 创建新的签到记录
      const record = new Attendance({
        userId,
        date: dateKey,
        checkInTime: now.toDate(),
        status: 'checked_in'
      });

      await record.save();

      return {
        success: true,
        message: '签到成功',
        data: this.formatRecord(record)
      };
    } catch (error) {
      console.error('签到失败:', error);
      return {
        success: false,
        message: '签到失败，请稍后重试'
      };
    }
  }

  /**
   * 签退
   * @param {string} userId - 用户ID
   * @returns {Object} 签退结果
   */
  async checkOut(userId) {
    try {
      const now = moment();
      const dateKey = this.getCurrentEffectiveDate();

      // 查找今天的记录
      const record = await Attendance.findTodayRecord(userId, dateKey);

      if (!record) {
        return {
          success: false,
          message: '今天还未签到，无法签退'
        };
      }

      // 更新签退时间（允许多次签退，每次更新时间）
      record.checkOutTime = now.toDate();
      record.status = 'checked_out';

      // 计算工作时长
      const checkInMoment = moment(record.checkInTime);
      const duration = moment.duration(now.diff(checkInMoment));
      record.workHours = Math.floor(duration.asHours());
      record.workMinutes = duration.minutes();

      await record.save();

      const message = `签退成功，工作时长：${record.workHours}小时${record.workMinutes}分钟`;

      return {
        success: true,
        message,
        data: this.formatRecord(record)
      };
    } catch (error) {
      console.error('签退失败:', error);
      return {
        success: false,
        message: '签退失败，请稍后重试'
      };
    }
  }

  /**
   * 获取当前状态
   * @param {string} userId - 用户ID
   * @returns {Object} 当前状态
   */
  async getStatus(userId) {
    try {
      const dateKey = this.getCurrentEffectiveDate();
      const record = await Attendance.findTodayRecord(userId, dateKey);

      if (!record) {
        return {
          success: true,
          message: '今天还未签到',
          data: {
            status: 'not_checked_in',
            canCheckIn: true,
            canCheckOut: false,
            date: dateKey
          }
        };
      }

      return {
        success: true,
        message: '获取状态成功',
        data: {
          ...this.formatRecord(record),
          canCheckIn: false,
          canCheckOut: record.status === 'checked_in'
        }
      };
    } catch (error) {
      console.error('获取状态失败:', error);
      return {
        success: false,
        message: '获取状态失败，请稍后重试'
      };
    }
  }

  /**
   * 获取用户考勤记录
   * @param {string} userId - 用户ID
   * @param {number} days - 查询天数
   * @returns {Object} 考勤记录列表
   */
  async getRecords(userId, days = 7) {
    try {
      const records = await Attendance.findUserRecords(userId, days);
      
      return {
        success: true,
        message: '获取记录成功',
        data: records.map(record => this.formatRecord(record))
      };
    } catch (error) {
      console.error('获取记录失败:', error);
      return {
        success: false,
        message: '获取记录失败，请稍后重试',
        data: []
      };
    }
  }

  /**
   * 获取今日所有签到数据
   * @returns {Object} 今日所有签到记录
   */
  async getTodayAllRecords() {
    try {
      const dateKey = this.getCurrentEffectiveDate();
      
      // 查找今天所有的签到记录
      const records = await Attendance.find({ date: dateKey }).sort({ checkInTime: -1 });
      
      return {
        success: true,
        message: '获取今日签到数据成功',
        data: records.map(record => this.formatRecord(record))
      };
    } catch (error) {
      console.error('获取今日签到数据失败:', error);
      return {
        success: false,
        message: '获取今日签到数据失败，请稍后重试',
        data: []
      };
    }
  }

  /**
   * 格式化记录数据
   * @param {Object} record - 数据库记录
   * @returns {Object} 格式化后的记录
   */
  formatRecord(record) {
    const formatted = {
      userId: record.userId,
      date: record.date,
      checkInTime: record.getFormattedCheckInTime(),
      checkOutTime: record.getFormattedCheckOutTime(),
      status: record.status
    };

    // 如果已签退，添加工作时长信息
    if (record.status === 'checked_out') {
      formatted.workDuration = {
        hours: record.workHours,
        minutes: record.workMinutes,
        total: record.getWorkDurationText()
      };
    }

    return formatted;
  }
}

module.exports = new AttendanceService();
