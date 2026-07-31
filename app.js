// app.js
const { initMockData } = require('./utils/mock');

const CLOUD_ENV = 'cloud1-d8gwt560627562aff';

App({
  globalData: {
    userInfo: null,
    isLogin: true,
    mockMode: false,
    tenantId: 'golfact_default',
    cloudEnv: CLOUD_ENV
  },

  onLaunch() {
    console.log('Golfact App Launch');

    // 初始化云开发
    wx.cloud.init({
      env: CLOUD_ENV,
      traceUser: true
    });

    // 开发阶段保留本地兜底数据；initMockData 只在本地无数据时写入。
    initMockData();

    // 微信登录
    this.wxLogin();
  },

  wxLogin() {
    wx.cloud.callFunction({
      name: 'login',
      success: res => {
        const data = res.result || {};
        if (data.openid) {
          wx.setStorageSync('cloud_openid', data.openid);
          this.globalData.openid = data.openid;
        }
        this.checkUserExist();
      },
      fail: err => {
        console.warn('cloud login failed, fallback wx.login:', err);
        wx.login({
          success: () => {
            this.checkUserExist();
          }
        });
      }
    });
  },

  // 检查用户是否已注册（简化版：先回退到本地 mock 用户）
  checkUserExist() {
    if (this.globalData.mockMode) {
      const mockUser = wx.getStorageSync('mock_current_user');
      if (mockUser) {
        this.globalData.userInfo = mockUser;
        this.globalData.isLogin = true;
      }
    }
  },

  // 全局提示
  toast(title, icon = 'none') {
    wx.showToast({ title, icon });
  }
});
