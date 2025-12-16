const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  // 用户ID
  userId: {
    type: String,
    required: true,
    index: true
  },
  // 用户名
  username: {
    type: String,
    required: false,
    index: true,
    default: null
  },
  // 日期（YYYY-MM-DD格式）
  date: {
    type: String,
    required: true,
    index: true
  },
  // 签到时间
  checkInTime: {
    type: Date,
    required: true
  },
  // 签退时间
  checkOutTime: {
    type: Date,
    default: null
  },
  // 状态：checked_in（已签到）、checked_out（已签退）
  status: {
    type: String,
    enum: ['checked_in', 'checked_out'],
    default: 'checked_in'
  },
  // 工作时长（小时）
  workHours: {
    type: Number,
    default: 0
  },
  // 工作时长（分钟）
  workMinutes: {
    type: Number,
    default: 0
  },
  // 是否加班
  isOvertime: {
    type: Boolean,
    default: false
  },
  // 加班时长（小时）
  overtimeHours: {
    type: Number,
    default: 0
  },
  // 加班时长（分钟）
  overtimeMinutes: {
    type: Number,
    default: 0
  },
  // 签到签出数据收集相关字段
  checkoutData: {
    // 操作类型：check_in（签入）、check_out（签出）
    operationType: {
      type: String,
      enum: ['check_in', 'check_out'],
      default: null
    },
    // 操作状态：success（成功）、failed（失败）
    status: {
      type: String,
      enum: ['success', 'failed'],
      default: null
    },
    // 操作时间
    operationTime: {
      type: Date,
      default: null
    },
    // 是否遇到验证码
    hasCaptcha: {
      type: Boolean,
      default: false
    },
    // 验证码内容（如果有）
    captchaCode: {
      type: String,
      default: null
    },
    // 验证码识别结果：success（成功）、failed（失败）
    captchaResult: {
      type: String,
      enum: ['success', 'failed', 'not_applicable'],
      default: 'not_applicable'
    },
    // 错误信息（如果签出失败）
    errorMessage: {
      type: String,
      default: null
    },
    // 签出操作来源：manual（手动）、auto（自动）
    operationSource: {
      type: String,
      enum: ['manual', 'auto'],
      default: 'manual'
    }
  }
}, {
  timestamps: true, // 自动添加createdAt和updatedAt
  collection: 'attendances'
});

// 创建复合索引，确保每个用户每天只有一条记录
attendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

// 实例方法：格式化签到时间
attendanceSchema.methods.getFormattedCheckInTime = function() {
  const moment = require('moment');
  return moment(this.checkInTime).format('YYYY-MM-DD HH:mm:ss');
};

// 实例方法：格式化签退时间
attendanceSchema.methods.getFormattedCheckOutTime = function() {
  if (!this.checkOutTime) return null;
  const moment = require('moment');
  return moment(this.checkOutTime).format('YYYY-MM-DD HH:mm:ss');
};

// 实例方法：获取工作时长文本
attendanceSchema.methods.getWorkDurationText = function() {
  if (this.workHours === 0 && this.workMinutes === 0) {
    return '0小时0分钟';
  }
  return `${this.workHours}小时${this.workMinutes}分钟`;
};

// 实例方法：获取加班时长文本
attendanceSchema.methods.getOvertimeDurationText = function() {
  if (!this.isOvertime) return null;
  return `${this.overtimeHours}小时${this.overtimeMinutes}分钟`;
};

// 静态方法：查找今天的考勤记录
attendanceSchema.statics.findTodayRecord = function(userId, date) {
  return this.findOne({ userId, date });
};

// 静态方法：查询用户的考勤记录
attendanceSchema.statics.findUserRecords = function(userId, days = 7) {
  const moment = require('moment');
  const startDate = moment().subtract(days - 1, 'days').format('YYYY-MM-DD');
  
  return this.find({
    userId,
    date: { $gte: startDate }
  }).sort({ date: -1 });
};

const Attendance = mongoose.model('Attendance', attendanceSchema);

module.exports = Attendance;
