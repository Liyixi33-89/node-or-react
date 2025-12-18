import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器
api.interceptors.request.use(
  config => {
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  response => {
    return response.data;
  },
  error => {
    const message = error.response?.data?.message || '网络请求失败';
    return Promise.reject(new Error(message));
  }
);

// API方法
export const userAPI = {
  // 注册
  register: (username, password, name) => {
    return api.post('/user/register', { username, password, name });
  },
  
  // 登录
  login: (username, password) => {
    return api.post('/user/login', { username, password });
  },
  
  // 获取用户信息
  getUserInfo: (userId) => {
    return api.get(`/user/info/${userId}`);
  }
};

export const attendanceAPI = {
  // 签到
  checkIn: (userId) => {
    return api.post('/attendance/checkin', { userId });
  },
  
  // 签退
  checkOut: (userId) => {
    return api.post('/attendance/checkout', { userId });
  },
  
  // 获取状态
  getStatus: (userId) => {
    return api.get(`/attendance/status/${userId}`);
  },
  
  // 获取记录
  getRecords: (userId, days = 7) => {
    return api.get(`/attendance/records/${userId}?days=${days}`);
  },
  
  // 获取今日所有签到数据
  getTodayAll: () => {
    return api.get('/attendance/today-all');
  },
  
  // 收集签出数据
  collectCheckout: (username, checkoutData, userId = '001') => {
    return api.post('/attendance/collect-checkout', {
      username,
      userId,
      ...checkoutData
    });
  },
  
  // 获取签出数据统计
  getCheckoutStats: (username, days = 30, userId = '001') => {
    return api.get(`/attendance/checkout-stats/${username}?days=${days}&userId=${userId}`);
  },
  
  // 获取签出详细记录
  getCheckoutRecords: (userId, days = 30) => {
    return api.get(`/attendance/checkout-records/${userId}?days=${days}`);
  },
  
// 触发脚本执行签入
  triggerCheckIn: (userId, username) => {
    return api.post('/attendance/trigger-checkin', { userId, username });
  },
  
  // 触发脚本执行签出
  triggerCheckOut: (userId, username) => {
    return api.post('/attendance/trigger-checkout', { userId, username });
  },
  
  // 获取任务状态
  getTaskStatus: (taskId) => {
    return api.get(`/attendance/task/${taskId}`);
  },
  
  // 更新任务状态
  updateTaskStatus: (taskId, status, result) => {
    return api.put(`/attendance/task/${taskId}`, { status, result });
  }
};

export default api;
