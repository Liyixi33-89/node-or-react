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
   * 判断是否加班（晚上7点后签退算加班）
   * @param {Date} checkOutTime - 签退时间
   * @returns {boolean}
   */
  isOvertimeCheckout(checkOutTime) {
    const checkOut = moment(checkOutTime);
    return checkOut.hour() >= 19; // 19点即晚上7点
  }

  /**
   * 计算加班时长
   * @param {Date} checkOutTime - 签退时间
   * @returns {Object} 加班时长
   */
  calculateOvertime(checkOutTime) {
    const checkOut = moment(checkOutTime);
    const overtimeStart = checkOut.clone().hour(19).minute(0).second(0);
    
    if (checkOut.isBefore(overtimeStart)) {
      return { hours: 0, minutes: 0 };
    }
    
    const duration = moment.duration(checkOut.diff(overtimeStart));
    return {
      hours: Math.floor(duration.asHours()),
      minutes: duration.minutes()
    };
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

      // 检查是否已经签退
      if (record.status === 'checked_out') {
        return {
          success: false,
          message: '今天已经签退过了',
          data: this.formatRecord(record)
        };
      }

      // 更新签退时间
      record.checkOutTime = now.toDate();
      record.status = 'checked_out';

      // 计算工作时长
      const checkInMoment = moment(record.checkInTime);
      const duration = moment.duration(now.diff(checkInMoment));
      record.workHours = Math.floor(duration.asHours());
      record.workMinutes = duration.minutes();

      // 判断是否加班（晚上7点后签退）
      record.isOvertime = this.isOvertimeCheckout(now.toDate());
      if (record.isOvertime) {
        const overtime = this.calculateOvertime(now.toDate());
        record.overtimeHours = overtime.hours;
        record.overtimeMinutes = overtime.minutes;
      }

      await record.save();

      const message = record.isOvertime 
        ? `签退成功，您今天加班了${record.overtimeHours}小时${record.overtimeMinutes}分钟` 
        : '签退成功';

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

      // 如果有加班，添加加班信息
      if (record.isOvertime) {
        formatted.isOvertime = true;
        formatted.overtimeDuration = {
          hours: record.overtimeHours,
          minutes: record.overtimeMinutes,
          total: record.getOvertimeDurationText()
        };
      }
    }

    return formatted;
  }
}

module.exports = new AttendanceService();
