const service = require('../../utils/service');

function getDefaultExpiryDate() {
  const date = new Date();
  date.setMonth(date.getMonth() + 6);
  return date.toISOString().split('T')[0];
}

Page({
  data: {
    users: [],
    recharges: [],
    userIndex: 0,
    selectedUserName: '请选择会员',
    hours: '',
    expiryDate: getDefaultExpiryDate(),
    remark: ''
  },

  onLoad() {
    this.loadData();
  },

  onShow() {
    this.loadData();
  },

  async loadData() {
    const rawUsers = await service.getUsers();
    const users = (rawUsers || []).map(user => ({
      ...user,
      displayName: user.name || user.nickname || '未命名会员',
      phoneText: user.phone || '未绑定手机号',
      memberLevelText: user.memberLevel || 'normal',
      remainingHours: user.remainingHours || 0
    }));

    const selectedUser = users[this.data.userIndex] || users[0];
    const recharges = [];
    for (const user of users) {
      const rows = await service.getRecharges(user._id);
      (rows || []).forEach(row => {
        recharges.push({
          ...row,
          userName: user.displayName,
          statusText: row.status === 'valid' ? '有效' : row.status
        });
      });
    }

    recharges.sort((a, b) => new Date(b.createdAt || b.createTime || 0) - new Date(a.createdAt || a.createTime || 0));

    this.setData({
      users,
      recharges,
      selectedUserName: selectedUser ? selectedUser.displayName : '请选择会员'
    });
  },

  onUserChange(e) {
    const userIndex = parseInt(e.detail.value, 10);
    const selectedUser = this.data.users[userIndex];
    this.setData({
      userIndex,
      selectedUserName: selectedUser ? selectedUser.displayName : '请选择会员'
    });
  },

  onHoursInput(e) {
    this.setData({ hours: e.detail.value });
  },

  onExpiryChange(e) {
    this.setData({ expiryDate: e.detail.value });
  },

  onRemarkInput(e) {
    this.setData({ remark: e.detail.value });
  },

  async submitRecharge() {
    const user = this.data.users[this.data.userIndex];
    const hours = Number(this.data.hours);

    if (!user) {
      wx.showToast({ title: '请选择会员', icon: 'none' });
      return;
    }
    if (!hours || hours <= 0) {
      wx.showToast({ title: '请输入有效小时数', icon: 'none' });
      return;
    }
    if (!this.data.expiryDate) {
      wx.showToast({ title: '请选择到期日', icon: 'none' });
      return;
    }

    const res = await service.createRecharge(user._id, hours, this.data.expiryDate, 'admin', this.data.remark.trim());
    if (res && res.success === false) {
      wx.showToast({ title: '充时失败', icon: 'none' });
      return;
    }

    wx.showToast({ title: '充时成功', icon: 'success' });
    this.setData({ hours: '', remark: '' });
    this.loadData();
  }
});
