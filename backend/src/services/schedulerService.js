const schedule = require('node-schedule');
const moment = require('moment');
const Attendance = require('../models/Attendance');

class SchedulerService {
  constructor() {
    this.jobs = [];
  }

  /**
   * 启动所有定时任务
   */
  start() {
    console.log('启动定时任务服务...');
    
    // 每天早上6点重置未签入状态
    this.scheduleDailyReset();
    
    // 每周一早上6点清除上周数据
    this.scheduleWeeklyCleanup();
    
    console.log('定时任务服务已启动');
  }

  /**
   * 每天早上6点重置未签入状态
   * 规则：'0 6 * * *' 表示每天6点0分0秒执行
   */
  scheduleDailyReset() {
    // 使用 cron 表达式：秒 分 时 日 月 星期
    // '0 6 * * *' 表示每天早上6点执行
    const job = schedule.scheduleJob('0 6 * * *', async () => {
      console.log(`[${moment().format('YYYY-MM-DD HH:mm:ss')}] 开始执行每日重置任务...`);
      await this.resetDailyAttendance();
    });

    this.jobs.push(job);
    console.log('已设置每日早上6点重置任务');
  }

  /**
   * 重置每日考勤状态
   * 将所有未签退的记录状态重置，为新的一天做准备
   */
  async resetDailyAttendance() {
    try {
      const yesterday = moment().subtract(1, 'day').format('YYYY-MM-DD');
      
      // 查找昨天所有未签退的记录
      const uncheckedOutRecords = await Attendance.find({
        date: yesterday,
        status: 'checked_in'
      });

      if (uncheckedOutRecords.length > 0) {
        console.log(`发现 ${uncheckedOutRecords.length} 条未签退记录，开始处理...`);

        // 自动为这些记录签退（使用昨天23:59:59作为签退时间）
        for (const record of uncheckedOutRecords) {
          const endOfDay = moment(yesterday).endOf('day').toDate();
          const checkInMoment = moment(record.checkInTime);
          const duration = moment.duration(moment(endOfDay).diff(checkInMoment));
          
          record.checkOutTime = endOfDay;
          record.status = 'checked_out';
          record.workHours = Math.floor(duration.asHours());
          record.workMinutes = duration.minutes();
          
          await record.save();
          console.log(`已自动签退用户 ${record.userId} 的记录`);
        }

        console.log(`成功处理 ${uncheckedOutRecords.length} 条未签退记录`);
      } else {
        console.log('没有需要处理的未签退记录');
      }

      console.log(`[${moment().format('YYYY-MM-DD HH:mm:ss')}] 每日重置任务执行完成`);
    } catch (error) {
      console.error('重置每日考勤状态失败:', error);
    }
  }

  /**
   * 停止所有定时任务
   */
  stop() {
    console.log('停止定时任务服务...');
    this.jobs.forEach(job => {
      if (job) {
        job.cancel();
      }
    });
    this.jobs = [];
    console.log('定时任务服务已停止');
  }

  /**
   * 每周一早上6点清除上周数据
   * 规则：'0 6 * * 1' 表示每周一6点0分0秒执行
   */
  scheduleWeeklyCleanup() {
    // 使用 cron 表达式：秒 分 时 日 月 星期
    // '0 6 * * 1' 表示每周一早上6点执行（星期一=1）
    const job = schedule.scheduleJob('0 6 * * 1', async () => {
      console.log(`[${moment().format('YYYY-MM-DD HH:mm:ss')}] 开始执行每周清除任务...`);
      await this.cleanupLastWeekData();
    });

    this.jobs.push(job);
    console.log('已设置每周一早上6点清除上周数据任务');
  }

  /**
   * 清除上周的考勤数据
   */
  async cleanupLastWeekData() {
    try {
      // 获取上周一和上周日的日期
      const lastMonday = moment().subtract(1, 'week').startOf('isoWeek').format('YYYY-MM-DD');
      const lastSunday = moment().subtract(1, 'week').endOf('isoWeek').format('YYYY-MM-DD');
      
      console.log(`准备清除上周数据：${lastMonday} 至 ${lastSunday}`);
      
      // 删除上周的所有考勤记录
      const result = await Attendance.deleteMany({
        date: {
          $gte: lastMonday,
          $lte: lastSunday
        }
      });

      console.log(`成功清除 ${result.deletedCount} 条上周考勤记录`);
      console.log(`[${moment().format('YYYY-MM-DD HH:mm:ss')}] 每周清除任务执行完成`);
    } catch (error) {
      console.error('清除上周数据失败:', error);
    }
  }

  /**
   * 手动触发每日重置（用于测试）
   */
  async triggerDailyReset() {
    console.log('手动触发每日重置任务...');
    await this.resetDailyAttendance();
  }

  /**
   * 手动触发每周清除（用于测试）
   */
  async triggerWeeklyCleanup() {
    console.log('手动触发每周清除任务...');
    await this.cleanupLastWeekData();
  }
}

module.exports = new SchedulerService();
