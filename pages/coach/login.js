// pages/coach/login.js
Page({
  data: {
    username: 'coach',
    password: '123456'
  },

  onUsernameInput(e) {
    this.setData({ username: e.detail.value });
  },

  onPasswordInput(e) {
    this.setData({ password: e.detail.value });
  },

  login() {
    if (this.data.username === 'coach' && this.data.password === '123456') {
      wx.setStorageSync('coach_logged_in', true);
      wx.redirectTo({ url: '/pages/coach/schedule' });
    } else {
      wx.showToast({ title: '用户名或密码错误', icon: 'none' });
    }
  }
});