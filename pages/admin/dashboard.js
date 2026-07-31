// pages/admin/dashboard.js
Page({
  toast() {
    wx.showToast({ title: '功能开发中', icon: 'none' });
  },
  goTo(e) {
    wx.navigateTo({ url: e.currentTarget.dataset.url });
  }
});