const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/attendance';

const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
    console.log(`Database: ${MONGODB_URI}`);
  } catch (error) {
    console.error('MongoDB connection error:', error);
    // 开发环境下如果连接失败，继续运行（使用内存模式）
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    } else {
      console.warn('⚠️  Running in memory mode (MongoDB not available)');
    }
  }
};

// 监听连接事件
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected from MongoDB');
});

// 优雅关闭
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('Mongoose connection closed through app termination');
  process.exit(0);
});

module.exports = connectDB;
