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
  }
};

export default api;
