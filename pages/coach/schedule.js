// pages/coach/schedule.js
const service = require('../../utils/service');
const mock = require('../../utils/mock');

Page({
  data: {
    appointments: [],
    totalHours: 0
  },

  onLoad() {
    if (!wx.getStorageSync('coach_logged_in')) {
      wx.redirectTo({ url: '/pages/coach/login' });
      return;
    }
    this.loadData();
  },

  async loadData() {
    // mock 中使用 coach_001
    const coachId = 'coach_001';
    const appointments = await service.getCoachAppointments(coachId);
    const bays = await service.getBays();
    const users = [await service.getCurrentUser()];
    
    const list = appointments.map(item => {
      const bay = bays.find(b => b._id === item.bayId);
      const user = users.find(u => u._id === item.userId);
      return {
        ...item,
        bayName: bay?.name || '',
        userName: user?.name || '会员'
      };
    });
    
    const totalHours = list.reduce((sum, item) => sum + (item.coachHours || 0), 0);
    
    this.setData({ appointments: list, totalHours });
  }
});