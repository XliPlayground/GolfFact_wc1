// pages/mine/recharges.js
const service = require('../../utils/service');

Page({
  data: {
    recharges: [],
    totalValidHours: 0,
    nearestExpiry: '',
    statusText: {
      valid: '有效',
      expired: '已过期',
      used_up: '已用完'
    }
  },

  onLoad() {
    this.loadData();
  },

  async loadData() {
    const user = await service.getCurrentUser();
    const recharges = await service.getRecharges(user._id);
    
    const validRecharges = recharges.filter(r => r.status === 'valid');
    const totalValidHours = validRecharges.reduce((sum, r) => sum + r.remainingHours, 0);
    
    let nearestExpiry = '';
    if (validRecharges.length > 0) {
      const sorted = validRecharges.sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
      nearestExpiry = sorted[0].expiryDate;
    }

    this.setData({
      recharges,
      totalValidHours,
      nearestExpiry
    });
  }
});
