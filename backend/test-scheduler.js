/**
 * 定时任务测试脚本
 * 用于测试每日重置功能
 */

const mongoose = require('mongoose');
const schedulerService = require('./src/services/schedulerService');
const connectDB = require('./src/config/database');

async function testScheduler() {
  console.log('='.repeat(60));
  console.log('定时任务测试脚本');
  console.log('='.repeat(60));

  try {
    // 连接数据库
    console.log('\n1. 连接数据库...');
    await connectDB();
    console.log('✅ 数据库连接成功');

    // 获取命令行参数
    const args = process.argv.slice(2);
    const testType = args[0] || 'daily'; // 默认测试每日重置

    if (testType === 'weekly') {
      // 手动触发每周清除任务
      console.log('\n2. 手动触发每周清除任务...');
      await schedulerService.triggerWeeklyCleanup();
      console.log('✅ 清除任务执行完成');
    } else {
      // 手动触发每日重置任务
      console.log('\n2. 手动触发每日重置任务...');
      await schedulerService.triggerDailyReset();
      console.log('✅ 重置任务执行完成');
    }

    console.log('\n' + '='.repeat(60));
    console.log('测试完成！');
    console.log('='.repeat(60));
    console.log('\n使用说明：');
    console.log('  测试每日重置: node test-scheduler.js daily');
    console.log('  测试每周清除: node test-scheduler.js weekly');

  } catch (error) {
    console.error('\n❌ 测试失败:', error);
  } finally {
    // 关闭数据库连接
    await mongoose.connection.close();
    console.log('\n数据库连接已关闭');
    process.exit(0);
  }
}

// 运行测试
testScheduler();
