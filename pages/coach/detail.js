// pages/coach/detail.js
const service = require('../../utils/service');

Page({
  data: {
    coach: {}
  },

  async onLoad(options) {
    const user = await service.getCurrentUser();
    const coaches = await service.getLinkedCoaches(user._id);
    const coach = coaches.find(c => c._id === options.id) || {};
    if (!coach._id) {
      wx.showToast({ title: '暂无查看权限', icon: 'none' });
    }
    this.setData({ coach });
  },

  bookCoach() {
    wx.switchTab({ url: '/pages/booking/index' });
  }
});
