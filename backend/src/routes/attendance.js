const Router = require('koa-router');
const attendanceService = require('../services/attendanceService');
const config = require('../config');
const axios = require('axios');
const Task = require('../models/Task');

const router = new Router();

/**
 * 签到接口
 * POST /api/attendance/checkin
 * Body: { userId: string }
 */
router.post('/checkin', async (ctx) => {
  const { userId } = ctx.request.body;

  if (!userId) {
    ctx.status = 400;
    ctx.body = {
      success: false,
      message: '用户ID不能为空'
    };
    return;
  }

  const result = await attendanceService.checkIn(userId);
  ctx.body = result;
});

/**
 * 签退接口
 * POST /api/attendance/checkout
 * Body: { userId: string }
 */
router.post('/checkout', async (ctx) => {
  const { userId } = ctx.request.body;

  if (!userId) {
    ctx.status = 400;
    ctx.body = {
      success: false,
      message: '用户ID不能为空'
    };
    return;
  }

  const result = await attendanceService.checkOut(userId);
  ctx.body = result;
});

/**
 * 获取当前状态接口
 * GET /api/attendance/status/:userId
 */
router.get('/status/:userId', async (ctx) => {
  const { userId } = ctx.params;

  if (!userId) {
    ctx.status = 400;
    ctx.body = {
      success: false,
      message: '用户ID不能为空'
    };
    return;
  }

  const result = await attendanceService.getStatus(userId);
  ctx.body = result;
});

/**
 * 获取考勤记录接口
 * GET /api/attendance/records/:userId?days=7
 */
router.get('/records/:userId', async (ctx) => {
  const { userId } = ctx.params;
  const days = parseInt(ctx.query.days) || 7;

  if (!userId) {
    ctx.status = 400;
    ctx.body = {
      success: false,
      message: '用户ID不能为空'
    };
    return;
  }

  const result = await attendanceService.getRecords(userId, days);
  ctx.body = result;
});

/**
 * 获取今日所有签到数据接口
 * GET /api/attendance/today-all
 */
router.get('/today-all', async (ctx) => {
  const result = await attendanceService.getTodayAllRecords();
  ctx.body = result;
});

/**
 * 收集签出数据接口
 * POST /api/attendance/collect-checkout
 * Body: {
 *   username: string,           // 用户名（必填）
 *   userId: string,             // 用户ID（可选，默认'001'）
 *   status: 'success' | 'failed',
 *   hasCaptcha: boolean,
 *   captchaCode: string | null,
 *   captchaResult: 'success' | 'failed' | 'not_applicable',
 *   errorMessage: string | null,
 *   operationSource: 'auto' | 'manual'
 * }
 */
router.post('/collect-checkout', async (ctx) => {
  const {
    username,
    userId = '001',
    operationType = 'check_out',  // 操作类型：check_in（签入）或 check_out（签出）
    status,
    hasCaptcha = false,
    captchaCode = null,
    captchaResult = 'not_applicable',
    errorMessage = null,
    operationSource = 'auto'
  } = ctx.request.body;

  if (!username) {
    ctx.status = 400;
    ctx.body = {
      success: false,
      message: '用户名不能为空'
    };
    return;
  }

  if (!status || !['success', 'failed'].includes(status)) {
    ctx.status = 400;
    ctx.body = {
      success: false,
      message: '操作状态必须为 success 或 failed'
    };
    return;
  }

  if (!operationType || !['check_in', 'check_out'].includes(operationType)) {
    ctx.status = 400;
    ctx.body = {
      success: false,
      message: '操作类型必须为 check_in 或 check_out'
    };
    return;
  }

  const result = await attendanceService.collectCheckoutData(username, {
    operationType,
    status,
    hasCaptcha,
    captchaCode,
    captchaResult,
    errorMessage,
    operationSource
  }, userId);

  ctx.body = result;
});

/**
 * 获取签出数据统计接口
 * GET /api/attendance/checkout-stats/:username?days=30&userId=001
 */
router.get('/checkout-stats/:username', async (ctx) => {
  const { username } = ctx.params;
  const days = parseInt(ctx.query.days) || 30;
  const userId = ctx.query.userId || '001';

  if (!username) {
    ctx.status = 400;
    ctx.body = {
      success: false,
      message: '用户名不能为空'
    };
    return;
  }

  const result = await attendanceService.getCheckoutStats(username, days, userId);
  ctx.body = result;
});

/**
 * 获取签出记录接口
 * GET /api/attendance/checkout-records/:userId?days=30
 */
router.get('/checkout-records/:userId', async (ctx) => {
  const { userId } = ctx.params;
  const days = parseInt(ctx.query.days) || 30;

  if (!userId) {
    ctx.status = 400;
    ctx.body = {
      success: false,
      message: '用户ID不能为空'
    };
    return;
  }

  const result = await attendanceService.getCheckoutRecords(userId, days);
  ctx.body = result;
});

/**
 * 触发脚本执行签入（消息队列模式）
 * POST /api/attendance/trigger-checkin
 * Body: { userId: string, username: string }
 */
router.post('/trigger-checkin', async (ctx) => {
  const { userId, username } = ctx.request.body;

  if (!userId || !username) {
    ctx.status = 400;
    ctx.body = {
      success: false,
      message: '用户ID和用户名不能为空'
    };
    return;
  }

  try {
    // 检查是否有未完成的同类型任务
    const existingTask = await Task.findOne({
      userId,
      taskType: 'checkin',
      status: { $in: ['pending', 'processing'] }
    });

    if (existingTask) {
      ctx.body = {
        success: false,
        message: '已有签入任务正在执行中，请稍后再试',
        taskId: existingTask._id
      };
      return;
    }

    // 创建新任务
    const task = await Task.create({
      userId,
      username,
      taskType: 'checkin',
      status: 'pending'
    });

    console.log(`✅ 创建签入任务: ${task._id}, 用户: ${username}`);

    // 调用Python HTTP服务器，传递taskId
    try {
      const pythonResponse = await axios.post(`${config.pythonServiceUrl}/trigger/checkin`, {
        userId,
        username,
        taskId: task._id.toString()
      }, {
        timeout: 5000
      });

      console.log(`✅ 已通知Python脚本执行任务: ${task._id}`);
    } catch (pythonError) {
      console.error('❌ 调用Python服务失败:', pythonError.message);
      // 更新任务状态为failed
      await Task.findByIdAndUpdate(task._id, {
        status: 'failed',
        completedAt: new Date(),
        result: {
          success: false,
          error: '无法连接到Python服务，请确认Python脚本正在运行'
        }
      });
    }

    ctx.body = {
      success: true,
      message: '签入任务已创建，等待执行',
      taskId: task._id.toString()
    };
  } catch (error) {
    console.error('创建签入任务失败:', error);
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: '创建任务失败'
    };
  }
});

/**
 * 触发脚本执行签出（消息队列模式）
 * POST /api/attendance/trigger-checkout
 * Body: { userId: string, username: string }
 */
router.post('/trigger-checkout', async (ctx) => {
  const { userId, username } = ctx.request.body;

  if (!userId || !username) {
    ctx.status = 400;
    ctx.body = {
      success: false,
      message: '用户ID和用户名不能为空'
    };
    return;
  }

  try {
    // 检查是否有未完成的同类型任务
    const existingTask = await Task.findOne({
      userId,
      taskType: 'checkout',
      status: { $in: ['pending', 'processing'] }
    });

    if (existingTask) {
      ctx.body = {
        success: false,
        message: '已有签出任务正在执行中，请稍后再试',
        taskId: existingTask._id
      };
      return;
    }

    // 创建新任务
    const task = await Task.create({
      userId,
      username,
      taskType: 'checkout',
      status: 'pending'
    });

    console.log(`✅ 创建签出任务: ${task._id}, 用户: ${username}`);

    // 调用Python HTTP服务器，传递taskId
    try {
      const pythonResponse = await axios.post(`${config.pythonServiceUrl}/trigger/checkout`, {
        userId,
        username,
        taskId: task._id.toString()
      }, {
        timeout: 5000
      });

      console.log(`✅ 已通知Python脚本执行任务: ${task._id}`);
    } catch (pythonError) {
      console.error('❌ 调用Python服务失败:', pythonError.message);
      // 更新任务状态为failed
      await Task.findByIdAndUpdate(task._id, {
        status: 'failed',
        completedAt: new Date(),
        result: {
          success: false,
          error: '无法连接到Python服务，请确认Python脚本正在运行'
        }
      });
    }

    ctx.body = {
      success: true,
      message: '签出任务已创建，等待执行',
      taskId: task._id.toString()
    };
  } catch (error) {
    console.error('创建签出任务失败:', error);
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: '创建任务失败'
    };
  }
});

/**
 * 查询任务状态
 * GET /api/attendance/task/:taskId
 */
router.get('/task/:taskId', async (ctx) => {
  const { taskId } = ctx.params;

  try {
    const task = await Task.findById(taskId);

    if (!task) {
      ctx.status = 404;
      ctx.body = {
        success: false,
        message: '任务不存在'
      };
      return;
    }

    ctx.body = {
      success: true,
      task: {
        id: task._id,
        userId: task.userId,
        username: task.username,
        taskType: task.taskType,
        status: task.status,
        createdAt: task.createdAt,
        startedAt: task.startedAt,
        completedAt: task.completedAt,
        result: task.result
      }
    };
  } catch (error) {
    console.error('查询任务失败:', error);
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: '查询任务失败'
    };
  }
});

/**
 * 获取待执行任务列表（供Python脚本调用）
 * GET /api/attendance/tasks/pending
 */
router.get('/tasks/pending', async (ctx) => {
  try {
    const tasks = await Task.find({
      status: 'pending'
    })
    .sort({ createdAt: 1 })
    .limit(10);

    ctx.body = {
      success: true,
      count: tasks.length,
      tasks: tasks.map(task => ({
        id: task._id,
        userId: task.userId,
        username: task.username,
        taskType: task.taskType,
        createdAt: task.createdAt
      }))
    };
  } catch (error) {
    console.error('获取待执行任务失败:', error);
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: '获取任务失败'
    };
  }
});

/**
 * 更新任务状态（供Python脚本调用）
 * PUT /api/attendance/task/:taskId
 * Body: { status: string, result?: object, executedBy?: string }
 */
router.put('/task/:taskId', async (ctx) => {
  const { taskId } = ctx.params;
  const { status, result, executedBy } = ctx.request.body;

  if (!status) {
    ctx.status = 400;
    ctx.body = {
      success: false,
      message: '状态不能为空'
    };
    return;
  }

  try {
    const updateData = { status };

    if (status === 'processing') {
      updateData.startedAt = new Date();
      if (executedBy) {
        updateData.executedBy = executedBy;
      }
    }

    if (status === 'completed' || status === 'failed') {
      updateData.completedAt = new Date();
      if (result) {
        updateData.result = result;
      }
    }

    const task = await Task.findByIdAndUpdate(
      taskId,
      updateData,
      { new: true }
    );

    if (!task) {
      ctx.status = 404;
      ctx.body = {
        success: false,
        message: '任务不存在'
      };
      return;
    }

    console.log(`✅ 更新任务状态: ${taskId}, 状态: ${status}`);

    ctx.body = {
      success: true,
      task: {
        id: task._id,
        status: task.status,
        completedAt: task.completedAt
      }
    };
  } catch (error) {
    console.error('更新任务失败:', error);
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: '更新任务失败'
    };
  }
});

/**
 * 获取待执行的任务（用于任务轮询模式）
 * GET /api/attendance/pending-tasks
 * Query: { userId?: string }
 */
router.get('/pending-tasks', async (ctx) => {
  try {
    const { userId } = ctx.query;
    
    // 构建查询条件
    const query = { status: 'pending' };
    if (userId) {
      query.userId = userId;
    }
    
    // 查询待执行的任务，按创建时间排序
    const tasks = await Task.find(query)
      .sort({ createdAt: 1 })
      .limit(10);  // 最多返回10个任务
    
    console.log(`📋 查询待执行任务: 找到 ${tasks.length} 个任务`);
    
    ctx.body = {
      success: true,
      data: tasks,
      count: tasks.length
    };
  } catch (error) {
    console.error('查询待执行任务失败:', error);
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: '查询待执行任务失败'
    };
  }
});

module.exports = router;