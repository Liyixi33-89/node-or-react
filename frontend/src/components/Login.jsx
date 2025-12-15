import React, { useState } from 'react';
import { Button, Input, Card, Toast, Space } from 'antd-mobile';
import { UserOutline, LockOutline } from 'antd-mobile-icons';
import { userAPI } from '../api';
import './Login.css';

function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  // 验证用户名格式
  const validateUsername = (username) => {
    if (!username || !username.trim()) {
      return {
        valid: false,
        message: '请输入用户名'
      };
    }

    const trimmedUsername = username.trim();

    // 检查长度
    if (trimmedUsername.length < 3 || trimmedUsername.length > 20) {
      return {
        valid: false,
        message: '用户名长度必须在3-20个字符之间'
      };
    }

    // 只允许数字和英文字符
    const usernameRegex = /^[a-zA-Z0-9]+$/;
    if (!usernameRegex.test(trimmedUsername)) {
      return {
        valid: false,
        message: '用户名只能包含数字和英文字符'
      };
    }

    return {
      valid: true
    };
  };

  // 快速登录（开发模式）
  const handleQuickLogin = async () => {
    // 验证用户名格式
    const validation = validateUsername(username);
    if (!validation.valid) {
      Toast.show({
        icon: 'fail',
        content: validation.message,
      });
      return;
    }

    setLoading(true);
    try {
      const result = await userAPI.quickLogin(username.trim());
      if (result.success) {
        // 保存用户信息到 localStorage
        localStorage.setItem('user_info', JSON.stringify(result.data));
        Toast.show({
          icon: 'success',
          content: result.message || '登录成功',
        });
        onLoginSuccess(result.data);
      } else {
        Toast.show({
          icon: 'fail',
          content: result.message || '登录失败',
        });
      }
    } catch (error) {
      console.error('登录失败:', error);
      Toast.show({
        icon: 'fail',
        content: '登录失败，请检查网络连接',
      });
    } finally {
      setLoading(false);
    }
  };

  // 使用演示账号
  const handleDemoLogin = async () => {
    setLoading(true);
    try {
      const result = await userAPI.quickLogin('demo');
      if (result.success) {
        localStorage.setItem('user_info', JSON.stringify(result.data));
        Toast.show({
          icon: 'success',
          content: '使用演示账号登录成功',
        });
        onLoginSuccess(result.data);
      } else {
        Toast.show({
          icon: 'fail',
          content: result.message || '登录失败',
        });
      }
    } catch (error) {
      console.error('登录失败:', error);
      Toast.show({
        icon: 'fail',
        content: '登录失败，请检查网络连接',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <Card className="login-card">
        <div className="login-header">
          <h1>📋 考勤打卡系统</h1>
          <p>请输入用户名登录</p>
        </div>

        <div className="login-form">
          <Input
            placeholder="请输入用户名"
            value={username}
            onChange={setUsername}
            prefix={<UserOutline />}
            clearable
            disabled={loading}
          />

          <Space direction="vertical" block style={{ marginTop: 20 }}>
            <Button
              color="primary"
              size="large"
              block
              loading={loading}
              onClick={handleQuickLogin}
            >
              快速登录
            </Button>

            <Button
              color="default"
              size="large"
              block
              loading={loading}
              onClick={handleDemoLogin}
            >
              使用演示账号
            </Button>
          </Space>

          <div className="login-tips">
            <p>💡 提示：</p>
            <ul>
              <li>用户名只能包含数字和英文字符（3-20个字符）</li>
              <li>快速登录：输入用户名即可登录（自动创建账号）</li>
              <li>演示账号：使用 demo 账号快速体验</li>
              <li>⚠️ 每天最多注册10个新用户，超过限制请明天再试</li>
              <li>用户信息保存在数据库中，刷新页面不会丢失</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default Login;
