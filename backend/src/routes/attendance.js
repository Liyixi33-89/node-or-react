const Router = require('koa-router');
const attendanceService = require('../services/attendanceService');

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
 * 获取详细签出记录接口（用于表格渲染）
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

module.exports = router;
