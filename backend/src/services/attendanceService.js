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

      // 获取当前时间（小时和分钟）
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTimeInMinutes = currentHour * 60 + currentMinute;
      const checkInDeadline = 9 * 60 + 30; // 9:30 = 570分钟
      
      // 判断是否超过签到时间（9:30）
      const isPastCheckInTime = currentTimeInMinutes > checkInDeadline;

      if (!record) {
        // 如果超过9:30，自动判定为已签入（只能签退）
        if (isPastCheckInTime) {
          return {
            success: true,
            message: '已超过签到时间(9:30)，视为已签入',
            data: {
              status: 'not_checked_in',
              canCheckIn: false,  // 不能签入
              canCheckOut: true,  // 可以签退
              date: dateKey,
              hasCheckedInToday: true,  // 视为已签入
              isPastCheckInTime: true
            }
          };
        }
        
        // 未超过9:30，正常显示未签入状态
        return {
          success: true,
          message: '今天还未签到',
          data: {
            status: 'not_checked_in',
            canCheckIn: true,  // 可以签入
            canCheckOut: false,  // 不能签退
            date: dateKey,
            hasCheckedInToday: false,  // 今天未签入
            isPastCheckInTime: false
          }
        };
      }

      // 检查是否有签入记录
      // 判断逻辑：
      // 1. 主记录的status为'checked_in'，说明已经签入
      // 2. 或者checkoutData中有成功的签入记录
      const hasCheckedInToday = record.status === 'checked_in' || 
                                (record.checkoutData && 
                                 record.checkoutData.operationType === 'check_in' && 
                                 record.checkoutData.status === 'success');

      // 签退逻辑：
      // 1. 如果已经签入（status === 'checked_in'），可以签退
      // 2. 如果超过9:30，即使没有签入，也可以签退
      const canCheckOut = record.status === 'checked_in' || isPastCheckInTime;

      return {
        success: true,
        message: '获取状态成功',
        data: {
          ...this.formatRecord(record),
          canCheckIn: !hasCheckedInToday && !isPastCheckInTime,  // 已签入或超过9:30则不能再签入
          canCheckOut,  // 已签入或超过9:30可以签退
          hasCheckedInToday: hasCheckedInToday || isPastCheckInTime,  // 已签入或超过9:30视为已签入
          isPastCheckInTime  // 是否超过签到时间
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

    // 添加签出数据信息
    if (record.checkoutData) {
      formatted.checkoutData = {
        status: record.checkoutData.status,
        operationTime: record.checkoutData.operationTime ? 
          moment(record.checkoutData.operationTime).format('YYYY-MM-DD HH:mm:ss') : null,
        hasCaptcha: record.checkoutData.hasCaptcha,
        captchaCode: record.checkoutData.captchaCode,
        captchaResult: record.checkoutData.captchaResult,
        errorMessage: record.checkoutData.errorMessage,
        operationSource: record.checkoutData.operationSource
      };
    }

    return formatted;
  }

  /**
   * 收集签出数据
   * @param {string} username - 用户名
   * @param {Object} checkoutData - 签出数据
   * @param {string} userId - 用户ID（可选，默认'001'）
   * @returns {Object} 收集结果
   */
  async collectCheckoutData(username, checkoutData, userId = '001') {
    try {
      const now = moment();
      const dateKey = this.getCurrentEffectiveDate();

      // 查找今天的记录
      const record = await Attendance.findTodayRecord(userId, dateKey);

      if (!record) {
        // 如果记录不存在，创建新记录
        const newRecord = new Attendance({
          userId: userId,
          username: username,
          date: dateKey,
          checkInTime: now.toDate(),
          status: 'checked_in'
        });
        
        // 设置签到签出数据
        newRecord.checkoutData = {
          operationType: checkoutData.operationType || 'check_out',
          status: checkoutData.status || 'failed',
          operationTime: now.toDate(),
          hasCaptcha: checkoutData.hasCaptcha || false,
          captchaCode: checkoutData.captchaCode || null,
          captchaResult: checkoutData.captchaResult || 'not_applicable',
          errorMessage: checkoutData.errorMessage || null,
          operationSource: checkoutData.operationSource || 'auto'
        };

        // 如果签出成功，同时更新签退时间
        if (checkoutData.status === 'success') {
          newRecord.checkOutTime = now.toDate();
          newRecord.status = 'checked_out';
          
          // 计算工作时长
          const checkInMoment = moment(newRecord.checkInTime);
          const duration = moment.duration(now.diff(checkInMoment));
          newRecord.workHours = Math.floor(duration.asHours());
          newRecord.workMinutes = duration.minutes();
        }

        await newRecord.save();

        return {
          success: true,
          message: '签出数据收集成功（创建新记录）',
          data: this.formatRecord(newRecord)
        };
      }

      // 更新签到签出数据
      record.checkoutData = {
        operationType: checkoutData.operationType || 'check_out',
        status: checkoutData.status || 'failed',
        operationTime: now.toDate(),
        hasCaptcha: checkoutData.hasCaptcha || false,
        captchaCode: checkoutData.captchaCode || null,
        captchaResult: checkoutData.captchaResult || 'not_applicable',
        errorMessage: checkoutData.errorMessage || null,
        operationSource: checkoutData.operationSource || 'auto'
      };

      // 如果签出成功，同时更新签退时间
      if (checkoutData.status === 'success') {
        record.checkOutTime = now.toDate();
        record.status = 'checked_out';
        
        // 计算工作时长
        const checkInMoment = moment(record.checkInTime);
        const duration = moment.duration(now.diff(checkInMoment));
        record.workHours = Math.floor(duration.asHours());
        record.workMinutes = duration.minutes();
      }

      await record.save();

      return {
        success: true,
        message: '签出数据收集成功',
        data: this.formatRecord(record)
      };
    } catch (error) {
      console.error('签出数据收集失败:', error);
      return {
        success: false,
        message: '签出数据收集失败，请稍后重试'
      };
    }
  }

  /**
   * 获取用户的签出数据统计
   * @param {string} username - 用户名
   * @param {number} days - 查询天数
   * @param {string} userId - 用户ID（可选，默认'001'）
   * @returns {Object} 签出数据统计
   */
  async getCheckoutStats(username, days = 30, userId = '001') {
    try {
      const moment = require('moment');
      const startDate = moment().subtract(days - 1, 'days').format('YYYY-MM-DD');
      
      const records = await Attendance.find({
        userId: userId,
        username: username,
        date: { $gte: startDate },
        'checkoutData.status': { $exists: true }
      }).sort({ date: -1 });

      const stats = {
        total: records.length,
        success: records.filter(r => r.checkoutData.status === 'success').length,
        failed: records.filter(r => r.checkoutData.status === 'failed').length,
        withCaptcha: records.filter(r => r.checkoutData.hasCaptcha).length,
        captchaSuccess: records.filter(r => r.checkoutData.captchaResult === 'success').length,
        autoOperations: records.filter(r => r.checkoutData.operationSource === 'auto').length,
        manualOperations: records.filter(r => r.checkoutData.operationSource === 'manual').length
      };

      return {
        success: true,
        message: '获取签出数据统计成功',
        data: stats
      };
    } catch (error) {
      console.error('获取签出数据统计失败:', error);
      return {
        success: false,
        message: '获取签出数据统计失败，请稍后重试',
        data: {}
      };
    }
  }

  /**
   * 获取用户的详细签出记录（用于表格渲染）
   * @param {string} userId - 用户ID
   * @param {number} days - 查询天数
   * @returns {Object} 详细签出记录
   */
  async getCheckoutRecords(userId, days = 30) {
    try {
      const moment = require('moment');
      const startDate = moment().subtract(days - 1, 'days').format('YYYY-MM-DD');
      
      const records = await Attendance.find({
        userId: userId,
        date: { $gte: startDate },
        'checkoutData.status': { $exists: true }
      }).sort({ date: -1 });
      // 格式化记录用于表格渲染
      const formattedRecords = records.map(record => {
        // 安全地访问 checkoutData 属性
        const checkoutData = record.checkoutData || {};
        
        return {
          date: record.date,
          username: record.username || null,
          checkInTime: record.getFormattedCheckInTime(),
          checkOutTime: record.getFormattedCheckOutTime(),
          operationType: checkoutData.operationType || 'check_out',  // 操作类型
          status: checkoutData.status || null,
          operationTime: checkoutData.operationTime ? 
            moment(checkoutData.operationTime).format('YYYY-MM-DD HH:mm:ss') : null,
          hasCaptcha: checkoutData.hasCaptcha || false,
          captchaCode: checkoutData.captchaCode || null,
          captchaResult: checkoutData.captchaResult || 'not_applicable',
          errorMessage: checkoutData.errorMessage || null,
          operationSource: checkoutData.operationSource || null,
          workDuration: record.status === 'checked_out' ? record.getWorkDurationText() : null
        };
      });

      return {
        success: true,
        message: '获取签出记录成功',
        data: formattedRecords
      };
    } catch (error) {
      console.error('获取签出记录失败:', error);
      return {
        success: false,
        message: '获取签出记录失败，请稍后重试',
        data: []
      };
    }
  }
}

module.exports = new AttendanceService();
