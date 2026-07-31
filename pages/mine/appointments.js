// pages/mine/appointments.js
const service = require('../../utils/service');

Page({
  data: {
    activeTab: 'upcoming',
    appointments: [],
    statusText: {
      booked: '待使用',
      completed: '已完成',
      cancelled: '已取消',
      no_show: '爽约'
    }
  },

  onLoad() {
    this.loadData();
  },

  onShow() {
    this.loadData();
  },

  async loadData() {
    const user = await service.getCurrentUser();
    const bays = await service.getBays();
    let list = await service.getAppointments(user._id);
    
    list = list.map(item => {
      const bay = bays.find(b => b._id === item.bayId);
      return { ...item, bayName: bay?.name || '' };
    });

    // 按 tab 过滤
    const { activeTab } = this.data;
    if (activeTab === 'upcoming') {
      list = list.filter(item => item.status === 'booked');
    } else if (activeTab === 'completed') {
      list = list.filter(item => item.status === 'completed');
    } else if (activeTab === 'cancelled') {
      list = list.filter(item => ['cancelled', 'no_show'].includes(item.status));
    }

    this.setData({ appointments: list });
  },

  switchTab(e) {
    this.setData({ activeTab: e.currentTarget.dataset.tab }, () => {
      this.loadData();
    });
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/booking/detail?id=${id}` });
  },

  cancelAppointment(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '取消预约',
      content: '确定要取消吗？开场前 2 小时内取消将计为爽约。',
      success: async (res) => {
        if (res.confirm) {
          const result = await service.updateAppointmentStatus(id, 'cancelled');
          if (result && result.success === false) {
            wx.showToast({ title: '取消失败', icon: 'none' });
            return;
          }
          this.loadData();
        }
      }
    });
  }
});
