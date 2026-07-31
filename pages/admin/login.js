// pages/admin/login.js
Page({
  data: {
    username: 'admin',
    password: '123456'
  },

  onUsernameInput(e) {
    this.setData({ username: e.detail.value });
  },

  onPasswordInput(e) {
    this.setData({ password: e.detail.value });
  },

  login() {
    if (this.data.username === 'admin' && this.data.password === '123456') {
      wx.navigateTo({ url: '/pages/admin/dashboard' });
    } else {
      wx.showToast({ title: '用户名或密码错误', icon: 'none' });
    }
  }
});