module.exports = {
  apps: [
    {
      name: 'attendance-backend',
      script: './src/app.js',
      instances: 2, // 使用2个实例（根据CPU核心数调整）
      exec_mode: 'cluster', // 集群模式
      watch: false, // 生产环境不监听文件变化
      max_memory_restart: '500M', // 内存超过500M自动重启
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
        MONGODB_URI: 'mongodb://localhost:27017/attendance'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        MONGODB_URI: 'mongodb://localhost:27017/attendance'
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      listen_timeout: 3000,
      kill_timeout: 5000
    }
  ]
};
