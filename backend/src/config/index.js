require('dotenv').config({
  path: `.env.${process.env.NODE_ENV || 'development'}`
});

module.exports = {
  // Python服务地址配置
  pythonServiceUrl: process.env.PYTHON_SERVICE_URL || 'http://localhost:5001',
  
  // 服务器端口
  port: process.env.PORT || 3000,
  
  // 数据库配置
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/attendance',
  
  // 其他配置
  env: process.env.NODE_ENV || 'development'
};
