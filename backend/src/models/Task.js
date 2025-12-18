const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  username: {
    type: String,
    required: true
  },
  taskType: {
    type: String,
    required: true,
    enum: ['checkin', 'checkout']
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending',
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  startedAt: Date,
  completedAt: Date,
  result: {
    success: Boolean,
    message: String,
    error: String,
    data: mongoose.Schema.Types.Mixed
  },
  executedBy: String,
  retryCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// 复合索引优化查询
taskSchema.index({ status: 1, createdAt: 1 });
taskSchema.index({ userId: 1, createdAt: -1 });

// 自动清理30天前的已完成任务
taskSchema.index({ completedAt: 1 }, { 
  expireAfterSeconds: 30 * 24 * 60 * 60 
});

module.exports = mongoose.model('Task', taskSchema);
