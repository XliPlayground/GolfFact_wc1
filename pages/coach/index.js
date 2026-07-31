// pages/coach/index.js
const service = require('../../utils/service');

Page({
  data: {
    coaches: []
  },

  async onLoad() {
    const user = await service.getCurrentUser();
    this.setData({ coaches: await service.getLinkedCoaches(user._id) });
  },

  goDetail(e) {
    wx.navigateTo({ url: `/pages/coach/detail?id=${e.currentTarget.dataset.id}` });
  }
});
