const Router = require('koa-router');
const UserService = require('../services/userService');

const router = new Router();

// 用户注册
router.post('/register', async (ctx) => {
  try {
    const { username, password, name } = ctx.request.body;

    if (!username || !password || !name) {
      ctx.body = {
        success: false,
        message: '请提供完整的注册信息'
      };
      return;
    }

    const result = await UserService.register(username, password, name);
    ctx.body = result;
  } catch (error) {
    console.error('注册接口错误:', error);
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: '服务器错误'
    };
  }
});

// 用户登录
router.post('/login', async (ctx) => {
  try {
    const { username, password } = ctx.request.body;

    if (!username || !password) {
      ctx.body = {
        success: false,
        message: '请提供用户名和密码'
      };
      return;
    }

    const result = await UserService.login(username, password);
    ctx.body = result;
  } catch (error) {
    console.error('登录接口错误:', error);
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: '服务器错误'
    };
  }
});

// 快速登录（开发模式）
router.post('/quick-login', async (ctx) => {
  try {
    const { username } = ctx.request.body;
    const result = await UserService.quickLogin(username || 'demo');
    ctx.body = result;
  } catch (error) {
    console.error('快速登录接口错误:', error);
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: '服务器错误'
    };
  }
});

// 获取用户信息
router.get('/info/:userId', async (ctx) => {
  try {
    const { userId } = ctx.params;
    const result = await UserService.getUserInfo(userId);
    ctx.body = result;
  } catch (error) {
    console.error('获取用户信息接口错误:', error);
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: '服务器错误'
    };
  }
});

module.exports = router;
