import React, { useState, useEffect } from 'react';
import { Button, Card, Toast, Space, DotLoading } from 'antd-mobile';
import { ClockCircleOutline, CheckOutline } from 'antd-mobile-icons';
import { attendanceAPI } from './api';
import moment from 'moment';
import './App.css';

// 模拟用户ID，实际项目中应该从登录状态获取
const USER_ID = 'user_' + Math.random().toString(36).substr(2, 9);

function App() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [currentTime, setCurrentTime] = useState(moment().format('HH:mm:ss'));

  // 获取当前状态
  const fetchStatus = async () => {
    try {
      const result = await attendanceAPI.getStatus(USER_ID);
      if (result.success) {
        setStatus(result.data);
      }
    } catch (error) {
      console.error('获取状态失败:', error);
    }
  };

  // 签到
  const handleCheckIn = async () => {
    setLoading(true);
    try {
      const result = await attendanceAPI.checkIn(USER_ID);
      if (result.success) {
        Toast.show({
          icon: 'success',
          content: result.message,
        });
        await fetchStatus();
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
    setLoading(true);
    try {
      const result = await attendanceAPI.checkOut(USER_ID);
      if (result.success) {
        Toast.show({
          icon: 'success',
          content: result.message,
        });
        await fetchStatus();
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
    fetchStatus();
  }, []);

  // 更新时间
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(moment().format('HH:mm:ss'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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

  return (
    <div className="app-container">
      <div className="header">
        <h1>考勤打卡</h1>
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
                  {status.isOvertime && status.overtimeDuration && (
                    <div className="overtime-duration">
                      🌙 加班时长: {status.overtimeDuration.total}
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
              disabled={!status || !status.canCheckOut || loading}
              onClick={handleCheckOut}
              className="action-button checkout-button"
            >
              {loading ? <DotLoading color="white" /> : '签退'}
            </Button>
          </Space>
        </div>

        <div className="tips">
          <p>💡 温馨提示</p>
          <p>• 每天早上6点开始新的考勤周期</p>
          <p>• 每天只能签到和签退各一次</p>
          <p>• 签到后才能进行签退操作</p>
          <p>• 晚上7点后签退将记录为加班</p>
          <p>• 签退后会自动计算工作时长和加班时长</p>
        </div>
      </div>

      <div className="footer">
        <p>用户ID: {USER_ID}</p>
      </div>
    </div>
  );
}

export default App;
