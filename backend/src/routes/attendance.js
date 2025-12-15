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

module.exports = router;
