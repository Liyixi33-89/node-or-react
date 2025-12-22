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
  const [checkoutStats, setCheckoutStats] = useState({});
  const [checkoutRecords, setCheckoutRecords] = useState([]);

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

  // 获取签出数据统计
  const fetchCheckoutStats = async () => {
    if (!userInfo) return;

    try {
      const result = await attendanceAPI.getCheckoutStats(userInfo.username, 30, userInfo.userId);
      if (result.success) {
        setCheckoutStats(result.data);
        console.log('签出数据统计:', result.data);
      } else {
        console.error('获取签出统计失败:', result.message);
      }
    } catch (error) {
      console.error('获取签出统计失败:', error);
    }
  };

  // 获取签出详细记录
  const fetchCheckoutRecords = async () => {
    if (!userInfo) return;

    try {
      const result = await attendanceAPI.getCheckoutRecords(userInfo.userId, 30);
      if (result.success) {
        setCheckoutRecords(result.data);
        console.log('签出详细记录:', result.data);
      } else {
        console.error('获取签出记录失败:', result.message);
      }
    } catch (error) {
      console.error('获取签出记录失败:', error);
    }
  };

  // 签到
  // 轮询任务状态
  const pollTaskStatus = async (taskId, taskType) => {
    if (!taskId) {
      console.error('pollTaskStatus: taskId is required');
      return;
    }

    const maxAttempts = 60; // 最多轮询60次（5分钟）
    let attempts = 0;
    
    const poll = setInterval(async () => {
      attempts++;
      
      try {
        const response = await attendanceAPI.getTaskStatus(taskId);
        
        if (response.success) {
          const task = response.task;
          
          if (task.status === 'completed') {
            clearInterval(poll);
            Toast.show({
              icon: 'success',
              content: `${taskType === 'checkin' ? '签入' : '签出'}成功！`,
              duration: 2000,
            });
            // 刷新所有状态
            await fetchStatus();
            await fetchTodayRecords();
            await fetchCheckoutStats();
            await fetchCheckoutRecords();
          } else if (task.status === 'failed') {
            clearInterval(poll);
            Toast.show({
              icon: 'fail',
              content: `${taskType === 'checkin' ? '签入' : '签出'}失败：${task.result?.error || '未知错误'}`,
              duration: 3000,
            });
          } else if (attempts >= maxAttempts) {
            clearInterval(poll);
            Toast.show({
              icon: 'fail',
              content: '任务执行超时，请稍后查看结果',
              duration: 3000,
            });
          }
        }
      } catch (error) {
        console.error('查询任务状态失败:', error);
        // 继续轮询，不中断
      }
    }, 5000); // 每5秒查询一次
  };

  const handleCheckIn = async () => {
    if (!userInfo) return;

    setLoading(true);
    try {
      // 触发签入任务
      Toast.show({
        icon: 'loading',
        content: '正在创建签入任务...',
        duration: 0,
      });
      
      const triggerResult = await attendanceAPI.triggerCheckIn(userInfo.userId, userInfo.username);
      console.log('签入任务创建结果:', triggerResult);
      
      Toast.clear();
      
      if (triggerResult.success) {
        const taskId = triggerResult.taskId;
        
        if (!taskId) {
          console.error('未获取到任务ID:', triggerResult);
          Toast.show({
            icon: 'fail',
            content: '任务创建成功但未获取到ID',
            duration: 3000,
          });
          return;
        }

        Toast.show({
          icon: 'loading',
          content: '签入任务已创建，正在执行中...',
          duration: 0,
        });
        
        // 开始轮询任务状态
        pollTaskStatus(taskId, 'checkin');
      } else {
        Toast.show({
          icon: 'fail',
          content: triggerResult.message || '创建签入任务失败',
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('触发签入异常:', error);
      Toast.clear();
      Toast.show({
        icon: 'fail',
        content: error.message || '触发签入失败',
        duration: 3000,
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
      // 触发签出任务
      Toast.show({
        icon: 'loading',
        content: '正在创建签出任务...',
        duration: 0,
      });
      
      const triggerResult = await attendanceAPI.triggerCheckOut(userInfo.userId, userInfo.username);
      console.log('签出任务创建结果:', triggerResult);
      
      Toast.clear();
      
      if (triggerResult.success) {
        const taskId = triggerResult.taskId;
        
        if (!taskId) {
          console.error('未获取到任务ID:', triggerResult);
          Toast.show({
            icon: 'fail',
            content: '任务创建成功但未获取到ID',
            duration: 3000,
          });
          return;
        }
        
        Toast.show({
          icon: 'loading',
          content: '签出任务已创建，正在执行中...',
          duration: 0,
        });
        
        // 开始轮询任务状态
        pollTaskStatus(taskId, 'checkout');
      } else {
        Toast.show({
          icon: 'fail',
          content: triggerResult.message || '创建签出任务失败',
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('触发签出异常:', error);
      Toast.clear();
      Toast.show({
        icon: 'fail',
        content: error.message || '触发签出失败',
        duration: 3000,
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
    fetchCheckoutStats();
    fetchCheckoutRecords();

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
            <div style={{ position: 'relative' }}>
              <Button
                color="primary"
                size="large"
                block
                disabled={!status || status.hasCheckedInToday || loading}
                onClick={handleCheckIn}
                className="action-button checkin-button"
              >
                {loading ? <DotLoading color="white" /> : '签到'}
              </Button>
              {status && status.hasCheckedInToday && (
                <div style={{ 
                  fontSize: '12px', 
                  color: '#00b578', 
                  marginTop: '4px',
                  textAlign: 'center'
                }}>
                  ✅ 今日已签到
                </div>
              )}
            </div>

            <Button
              color="danger"
              size="large"
              block
              disabled={!status || !status.canCheckOut || loading}
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
        </div>

        {/* 签出详细记录表格 */}
        <div className="checkout-records">
          <div className="section-header">
            <h3>📋 签出详细记录（最近30天）</h3>
            <Button
              size="small"
              color="primary"
              onClick={() => {
                fetchCheckoutRecords();
                Toast.show({ icon: 'success', content: '刷新成功' });
              }}
            >
              🔄 刷新
            </Button>
          </div>
          <div className="records-table">
            {checkoutRecords.length === 0 ? (
              <div className="no-data">
                <div className="no-data-icon">📭</div>
                <div className="no-data-text">暂无签出数据</div>
                <div className="no-data-hint">使用自动签出脚本后，数据将在此显示</div>
              </div>
            ) : (
              <table className="checkout-table">
                <thead>
                  <tr>
                    <th>操作类型</th>
                    <th>操作结果</th>
                    <th>签出时间</th>
                    <th>验证码</th>
                    <th>操作来源</th>
                    <th>错误信息</th>
                  </tr>
                </thead>
                <tbody>
                  {checkoutRecords.map((record, index) => (
                    <tr key={index}>
                      <td>
                        <span className={`operation-type ${record.operationType === 'check_in' ? 'type-checkin' : 'type-checkout'}`}>
                          {record.operationType === 'check_in' ? '📥 签入' : '📤 签出'}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${record.status === 'success' ? 'status-success' : 'status-failed'}`}>
                          {record.status === 'success' ? '✅ 成功' : '❌ 失败'}
                        </span>
                      </td>
                      <td className="time-cell">{record.checkOutTime || '-'}</td>
                      <td>
                        {record.hasCaptcha ? (
                          <div className="captcha-info">
                            <div className="captcha-code">
                              {record.captchaResult ? `验证码: ${record.captchaResult}` : '有验证码'}
                            </div>
                          </div>
                        ) : (
                          <span className="not-applicable">无验证码</span>
                        )}
                      </td>
                      <td>
                        <span className={`operation-source ${record.operationSource === 'auto' ? 'auto' : 'manual'}`}>
                          {record.operationSource === 'auto' ? '🤖 自动' : '👤 手动'}
                        </span>
                      </td>
                      <td className="error-cell">
                        {record.errorMessage ? (
                          <span className="error-message" title={record.errorMessage}>
                            {record.errorMessage.length > 30 ? record.errorMessage.substring(0, 30) + '...' : record.errorMessage}
                          </span>
                        ) : (
                          <span className="no-error">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <div className="footer">
        <p>用户: {userInfo.username} ({userInfo.name})</p>
        <p className="user-id">ID: {userInfo.userId}</p>
      </div>
    </div>
  );
}

export default App;
