const Koa = require('koa');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');
const cors = require('@koa/cors');
const connectDB = require('./config/database');
const attendanceRouter = require('./routes/attendance');
const userRouter = require('./routes/user');

const app = new Koa();
const router = new Router();

// 连接数据库
connectDB();

// 中间件
app.use(cors());
app.use(bodyParser());

// 错误处理
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    ctx.status = err.status || 500;
    ctx.body = {
      success: false,
      message: err.message || '服务器内部错误'
    };
    console.error('Error:', err);
  }
});

// 路由
router.use('/api/user', userRouter.routes());
router.use('/api/attendance', attendanceRouter.routes());

// 健康检查
router.get('/health', (ctx) => {
  ctx.body = { status: 'ok', timestamp: new Date().toISOString() };
});

app.use(router.routes());
app.use(router.allowedMethods());

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
