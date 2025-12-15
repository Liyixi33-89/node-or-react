const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/attendance';

console.log('正在测试 MongoDB 连接...');
console.log(`连接地址: ${MONGODB_URI}`);
console.log('');

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ MongoDB 连接成功！');
  console.log('');
  console.log('数据库信息:');
  console.log(`- 数据库名: ${mongoose.connection.name}`);
  console.log(`- 主机: ${mongoose.connection.host}`);
  console.log(`- 端口: ${mongoose.connection.port}`);
  console.log('');
  console.log('系统已准备就绪，可以启动应用！');
  process.exit(0);
})
.catch((error) => {
  console.error('❌ MongoDB 连接失败！');
  console.error('');
  console.error('错误信息:', error.message);
  console.error('');
  console.error('请检查:');
  console.error('1. MongoDB 服务是否已启动');
  console.error('2. 连接地址是否正确');
  console.error('3. 防火墙是否阻止连接');
  console.error('');
  console.error('Windows 用户可以运行: net start MongoDB');
  console.error('Linux/Mac 用户可以运行: sudo systemctl start mongod');
  process.exit(1);
});
