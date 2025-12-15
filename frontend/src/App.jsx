import React, { useState, useEffect } from 'react';
import { Button, Card, Toast, Space, DotLoading } from 'antd-mobile';
import { ClockCircleOutline, CheckOutline, UserOutline } from 'antd-mobile-icons';
import { attendanceAPI } from './api';
import Login from './components/Login';
import moment from 'moment';
import './App.css';

function App() {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [currentTime, setCurrentTime] = useState(moment().format('HH:mm:ss'));
  const [currentWorkDuration, setCurrentWorkDuration] = useState(null);
  const [todayRecords, setTodayRecords] = useState([]);

  // 检查登录状态
  useEffect(() => {
    const savedUserInfo = localStorage.getItem('user_info');
    if (savedUserInfo) {
      try {
        const user = JSON.parse(savedUserInfo);
        setUserInfo(user);
      } catch (error) {
        console.error('解析用户信息失败:', error);
        localStorage.removeItem('user_info');
      }
    }
  }, []);

  // 登录成功回调
  const handleLoginSuccess = (user) => {
    setUserInfo(user);
  };

  // 退出登录
  const handleLogout = () => {
    localStorage.removeItem('user_info');
    setUserInfo(null);
    setStatus(null);
    Toast.show({
      icon: 'success',
      content: '已退出登录',
    });
  };

  // 获取当前状态
  const fetchStatus = async () => {
    if (!userInfo) return;
    
    try {
      const result = await attendanceAPI.getStatus(userInfo.userId);
      if (result.success) {
        setStatus(result.data);
        console.log('当前状态:', result.data);
      } else {
        Toast.show({
          icon: 'fail',
          content: result.message || '获取状态失败',
        });
      }
    } catch (error) {
      console.error('获取状态失败:', error);
      Toast.show({
        icon: 'fail',
        content: '获取状态失败，请检查网络连接',
      });
    }
  };

  // 获取当前用户今日签到数据
  const fetchTodayRecords = async () => {
    if (!userInfo) return;
    
    try {
      const result = await attendanceAPI.getRecords(userInfo.userId, 1);
      if (result.success) {
        setTodayRecords(result.data);
        console.log('今日签到数据:', result.data);
      }
    } catch (error) {
      console.error('获取今日签到数据失败:', error);
    }
  };

  // 签到
  const handleCheckIn = async () => {
    if (!userInfo) return;
    
    setLoading(true);
    try {
        const result = await attendanceAPI.checkIn(userInfo.userId);
      if (result.success) {
        Toast.show({
          icon: 'success',
          content: result.message,
        });
        await fetchStatus();
        await fetchTodayRecords();
      } else {
        Toast.show({
          icon: 'fail',
          content: result.message,
        });
      }
    } catch (error) {
      Toast.show({
        icon: 'fail',
        content: error.message || '签到失败',
      });
    } finally {
      setLoading(false);
    }
  };

  // 签退
  const handleCheckOut = async () => {
    if (!userInfo) return;
    
    setLoading(true);
    try {
        const result = await attendanceAPI.checkOut(userInfo.userId);
      if (result.success) {
        Toast.show({
          icon: 'success',
          content: result.message,
        });
        await fetchStatus();
        await fetchTodayRecords();
      } else {
        Toast.show({
          icon: 'fail',
          content: result.message,
        });
      }
    } catch (error) {
      Toast.show({
        icon: 'fail',
        content: error.message || '签退失败',
      });
    } finally {
      setLoading(false);
    }
  };

  // 初始化加载状态
  useEffect(() => {
    if (!userInfo) return;
    
    // 立即获取一次状态和今日数据
    fetchStatus();
    fetchTodayRecords();
    
    // 每30秒自动刷新一次状态和今日数据
    const statusTimer = setInterval(() => {
      fetchStatus();
      fetchTodayRecords();
    }, 30000);
    
    return () => clearInterval(statusTimer);
  }, [userInfo]);

  // 更新时间和实时工作时长
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(moment().format('HH:mm:ss'));
      
      // 如果已签到但未签退，计算实时工作时长
      if (status && status.status === 'checked_in' && status.checkInTime) {
        const checkInMoment = moment(status.checkInTime, 'YYYY-MM-DD HH:mm:ss');
        const now = moment();
        const duration = moment.duration(now.diff(checkInMoment));
        const hours = Math.floor(duration.asHours());
        const minutes = duration.minutes();
        const seconds = duration.seconds();
        setCurrentWorkDuration(`${hours}小时${minutes}分钟${seconds}秒`);
      } else {
        setCurrentWorkDuration(null);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [status]);

  // 获取状态文本
  const getStatusText = () => {
    if (!status) return '加载中...';
    
    switch (status.status) {
      case 'not_checked_in':
        return '未签到';
      case 'checked_in':
        return '已签到';
      case 'checked_out':
        return '已签退';
      default:
        return '未知状态';
    }
  };

  // 获取状态颜色
  const getStatusColor = () => {
    if (!status) return '#999';
    
    switch (status.status) {
      case 'not_checked_in':
        return '#ff6b6b';
      case 'checked_in':
        return '#51cf66';
      case 'checked_out':
        return '#868e96';
      default:
        return '#999';
    }
  };

  // 如果未登录，显示登录页面
  if (!userInfo) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="app-container">
      <div className="header">
        <div className="user-info-header">
          <div>
            <h1>考勤打卡</h1>
            <div className="user-welcome">
              <UserOutline fontSize={14} />
              <span>欢迎，{userInfo.name}</span>
            </div>
          </div>
          <Button size="small" color="default" onClick={handleLogout}>
            退出登录
          </Button>
        </div>
        <div className="current-time">{currentTime}</div>
        <div className="current-date">{moment().format('YYYY年MM月DD日 dddd')}</div>
      </div>

      <div className="content">
        <Card className="status-card">
          <div className="status-info">
            <div 
              className="status-indicator" 
              style={{ backgroundColor: getStatusColor() }}
            />
            <div className="status-text">{getStatusText()}</div>
          </div>

          {status && status.checkInTime && (
            <div className="time-info">
              <div className="time-item">
                <ClockCircleOutline fontSize={16} />
                <span>签到时间: {status.checkInTime}</span>
              </div>
              
              {/* 显示实时工作时长（已签到但未签退） */}
              {status.status === 'checked_in' && currentWorkDuration && (
                <div className="work-duration current-work">
                  ⏱️ 当前工作时长: {currentWorkDuration}
                </div>
              )}
              
              {status.checkOutTime && (
                <>
                  <div className="time-item">
                    <CheckOutline fontSize={16} />
                    <span>签退时间: {status.checkOutTime}</span>
                  </div>
                  {status.workDuration && (
                    <div className="work-duration">
                      工作时长: {status.workDuration.total}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </Card>

        <div className="action-buttons">
          <Space direction="vertical" block style={{ '--gap': '16px' }}>
            <Button
              color="primary"
              size="large"
              block
              disabled={!status || !status.canCheckIn || loading}
              onClick={handleCheckIn}
              className="action-button checkin-button"
            >
              {loading ? <DotLoading color="white" /> : '签到'}
            </Button>

            <Button
              color="danger"
              size="large"
              block
              disabled={!status || status.status === 'not_checked_in' || loading}
              onClick={handleCheckOut}
              className="action-button checkout-button"
            >
              {loading ? <DotLoading color="white" /> : (status?.status === 'checked_out' ? '更新签退' : '签退')}
            </Button>
          </Space>
        </div>

        <div className="today-records">
          <h3>📊 我的签到记录</h3>
          <div className="records-table">
            {todayRecords.length === 0 ? (
              <div className="no-data">暂无签到数据</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>日期</th>
                    <th>签到时间</th>
                    <th>签退时间</th>
                    <th>工作时长</th>
                    <th>状态</th>
                  </tr>
                </thead>
                <tbody>
                  {todayRecords.map((record, index) => (
                    <tr key={index}>
                      <td>{record.date}</td>
                      <td>{record.checkInTime || '-'}</td>
                      <td>{record.checkOutTime || '-'}</td>
                      <td>{record.workDuration ? record.workDuration.total : '-'}</td>
                      <td>
                        <span className={`status-badge status-${record.status}`}>
                          {record.status === 'checked_in' ? '已签到' : 
                           record.status === 'checked_out' ? '已签退' : '未签到'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>      </div>

      <div className="footer">
        <p>用户: {userInfo.username} ({userInfo.name})</p>
        <p className="user-id">ID: {userInfo.userId}</p>
      </div>
    </div>
  );
}

export default App;
