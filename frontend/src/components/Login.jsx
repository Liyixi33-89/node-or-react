import React, { useState } from 'react';
import { Button, Input, Card, Toast, Space, Tabs } from 'antd-mobile';
import { UserOutline, LockOutline } from 'antd-mobile-icons';
import { userAPI } from '../api';
import CryptoJS from 'crypto-js';
import './Login.css';

function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');

  // 前端密码加密（SHA256）
  const hashPassword = (password) => {
    return CryptoJS.SHA256(password).toString();
  };

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

  // 验证密码格式（6-8位长度，只支持数字和英文）
  const validatePassword = (password) => {
    if (!password) {
      return {
        valid: false,
        message: '请输入密码'
      };
    }

    // 检查长度（必须是6-8位）
    if (password.length < 6 || password.length > 8) {
      return {
        valid: false,
        message: '密码长度必须为6-8位'
      };
    }

    // 只允许数字和英文字符
    const passwordRegex = /^[a-zA-Z0-9]+$/;
    if (!passwordRegex.test(password)) {
      return {
        valid: false,
        message: '密码只能包含数字和英文字符'
      };
    }

    return {
      valid: true
    };
  };
  // 用户登录
  const handleLogin = async () => {
    // 验证用户名格式
    const usernameValidation = validateUsername(username);
    if (!usernameValidation.valid) {
      Toast.show({
        icon: 'fail',
        content: usernameValidation.message,
      });
      return;
    }

    // 验证密码格式
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      Toast.show({
        icon: 'fail',
        content: passwordValidation.message,
      });
      return;
    }

    setLoading(true);
    try {
      // 前端加密密码
      const hashedPassword = hashPassword(password);
      
      const result = await userAPI.login(username.trim(), hashedPassword);
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

  // 用户注册
  const handleRegister = async () => {
    // 验证用户名格式
    const usernameValidation = validateUsername(username);
    if (!usernameValidation.valid) {
      Toast.show({
        icon: 'fail',
        content: usernameValidation.message,
      });
      return;
    }

    // 验证密码格式
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      Toast.show({
        icon: 'fail',
        content: passwordValidation.message,
      });
      return;
    }

    // 验证姓名
    if (!name || !name.trim()) {
      Toast.show({
        icon: 'fail',
        content: '请输入姓名',
      });
      return;
    }

    setLoading(true);
    try {
      // 前端加密密码
      const hashedPassword = hashPassword(password);
      
      const result = await userAPI.register(username.trim(), hashedPassword, name.trim());
      if (result.success) {
        Toast.show({
          icon: 'success',
          content: result.message || '注册成功，请登录',
        });
        // 切换到登录标签
        setActiveTab('login');
        // 清空密码和姓名
        setPassword('');
        setName('');
      } else {
        Toast.show({
          icon: 'fail',
          content: result.message || '注册失败',
        });
      }
    } catch (error) {
      console.error('注册失败:', error);
      Toast.show({
        icon: 'fail',
        content: '注册失败，请检查网络连接',
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
          <p>请登录或注册账号</p>
        </div>

        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <Tabs.Tab title="登录" key="login">
            <div className="login-form">
              <Input
                placeholder="请输入用户名"
                value={username}
                onChange={setUsername}
                prefix={<UserOutline />}
                clearable
                disabled={loading}
              />

              <Input
                placeholder="请输入密码（6-8位数字或英文）"
                value={password}
                onChange={setPassword}
                prefix={<LockOutline />}
                type="password"
                clearable
                disabled={loading}
                style={{ marginTop: 12 }}
              />

              <Button
                color="primary"
                size="large"
                block
                loading={loading}
                onClick={handleLogin}
                style={{ marginTop: 20 }}
              >
                登录
              </Button>

              <div className="login-tips">
                <p>💡 提示：</p>
                <ul>
                  <li>用户名：3-20个字符，只能包含数字和英文字符</li>
                  <li>密码：6-8位，只能包含数字和英文字符</li>
                  <li>密码采用双重加密（前端SHA256 + 后端SHA256）</li>
                </ul>
              </div>
            </div>
          </Tabs.Tab>

          <Tabs.Tab title="注册" key="register">
            <div className="login-form">
              <Input
                placeholder="请输入用户名"
                value={username}
                onChange={setUsername}
                prefix={<UserOutline />}
                clearable
                disabled={loading}
              />

              <Input
                placeholder="请输入密码（6-8位数字或英文）"
                value={password}
                onChange={setPassword}
                prefix={<LockOutline />}
                type="password"
                clearable
                disabled={loading}
                style={{ marginTop: 12 }}
              />

              <Input
                placeholder="请输入姓名"
                value={name}
                onChange={setName}
                clearable
                disabled={loading}
                style={{ marginTop: 12 }}
              />

              <Button
                color="primary"
                size="large"
                block
                loading={loading}
                onClick={handleRegister}
                style={{ marginTop: 20 }}
              >
                注册
              </Button>

              <div className="login-tips">
                <p>💡 注册说明：</p>
                <ul>
                  <li>用户名：3-20个字符，只能包含数字和英文字符</li>
                  <li>密码：6-8位，只能包含数字和英文字符</li>
                  <li>姓名：用于显示，可以是中文</li>
                  <li>⚠️ 每天最多注册10个新用户</li>
                  <li>密码采用双重加密，安全可靠</li>
                </ul>
              </div>
            </div>
          </Tabs.Tab>
        </Tabs>
      </Card>
    </div>
  );
}

export default Login;
