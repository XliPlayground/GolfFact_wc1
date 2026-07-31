const service = require('../../utils/service');

Page({
  data: {
    activeTab: 'booked',
    tabOptions: [
      { label: '待确认', value: 'booked', className: 'tab active' },
      { label: '已完成', value: 'completed', className: 'tab' },
      { label: '取消/爽约', value: 'cancelled', className: 'tab' },
      { label: '全部', value: 'all', className: 'tab' }
    ],
    appointments: [],
    users: [],
    userFilterOptions: [{ _id: 'all', displayName: '全部会员' }],
    userFilterIndex: 0,
    selectedUserFilterName: '全部会员',
    selectedDate: '',
    selectedDateText: '全部日期'
  },

  onLoad() {
    this.loadData();
  },

  onShow() {
    this.loadData();
  },

  async loadData() {
    const [rawAppointments, users, bays] = await Promise.all([
      service.getAllAppointments(),
      service.getUsers(),
      service.getBays()
    ]);
    const userFilterOptions = [
      { _id: 'all', displayName: '全部会员' },
      ...(users || []).map(user => ({
        _id: user._id,
        displayName: user.name || user.nickname || '会员'
      }))
    ];
    const currentFilter = userFilterOptions[this.data.userFilterIndex] || userFilterOptions[0];

    const userMap = {};
    (users || []).forEach(user => {
      userMap[user._id] = user.name || user.nickname || '会员';
    });

    const bayMap = {};
    (bays || []).forEach(bay => {
      bayMap[bay._id] = bay.name || bay.code || '打位';
    });

    const statusText = {
      booked: '待确认',
      completed: '已完成',
      cancelled: '已取消',
      no_show: '爽约'
    };

    let appointments = (rawAppointments || []).map(item => ({
      ...item,
      userName: userMap[item.userId] || '会员',
      bayName: bayMap[item.bayId] || '打位',
      typeText: item.type === 'teaching' ? '培训' : '自助',
      statusText: statusText[item.status] || item.status,
      confirmUntilText: this.getConfirmUntilText(item),
      settlementModeText: this.getSettlementModeText(item),
      requirementsText: this.formatRequirements(item.requirements),
      isBooked: item.status === 'booked'
    }));

    if (currentFilter && currentFilter._id !== 'all') {
      appointments = appointments.filter(item => item.userId === currentFilter._id);
    }
    if (this.data.selectedDate) {
      appointments = appointments.filter(item => item.date === this.data.selectedDate);
    }

    if (this.data.activeTab !== 'all') {
      if (this.data.activeTab === 'cancelled') {
        appointments = appointments.filter(item => item.status === 'cancelled' || item.status === 'no_show');
      } else {
        appointments = appointments.filter(item => item.status === this.data.activeTab);
      }
    }

    appointments.sort((a, b) => {
      const aTime = `${a.date || ''} ${a.startTime || ''}`;
      const bTime = `${b.date || ''} ${b.startTime || ''}`;
      return bTime.localeCompare(aTime);
    });

    this.setData({
      appointments,
      users,
      userFilterOptions,
      selectedUserFilterName: currentFilter.displayName,
      selectedDateText: this.data.selectedDate || '全部日期'
    });
  },

  formatRequirements(requirements) {
    if (!requirements) return '';
    const map = {
      prepareBalls: '准备球',
      prepareClubs: '准备杆',
      prepareWater: '准备水',
      prepareSnacks: '准备茶点'
    };
    const list = requirements.list || [];
    const labels = list.map(item => map[item]).filter(Boolean);
    if (requirements.visitorCount) labels.push(`${requirements.visitorCount}人`);
    if (requirements.ashtray) labels.push('准备烟灰缸');
    return labels.join('、');
  },

  getConfirmUntilText(appointment) {
    if (appointment.status !== 'booked' || !appointment.date || !appointment.endTime) return '';
    const end = new Date(`${appointment.date}T${appointment.endTime}:00`);
    if (Number.isNaN(end.getTime())) return '';
    const confirmUntil = new Date(end.getTime() + 48 * 60 * 60 * 1000);
    return confirmUntil.toISOString().slice(0, 16).replace('T', ' ');
  },

  getSettlementModeText(appointment) {
    if (appointment.settlementMode === 'auto_no_dispute') return '48小时未处理，已按无异议自动完成';
    if (appointment.settlementMode === 'manual') return '老板手动确认完成';
    if (appointment.settlementMode === 'no_show') return `按 ${appointment.noShowMultiplier || 1.5} 倍爽约规则结算`;
    return '';
  },

  switchTab(e) {
    const activeTab = e.currentTarget.dataset.tab;
    this.setData({
      activeTab,
      tabOptions: this.data.tabOptions.map(item => ({
        ...item,
        className: item.value === activeTab ? 'tab active' : 'tab'
      }))
    }, () => {
      this.loadData();
    });
  },

  onUserFilterChange(e) {
    const userFilterIndex = parseInt(e.detail.value, 10);
    const selected = this.data.userFilterOptions[userFilterIndex] || this.data.userFilterOptions[0];
    this.setData({ userFilterIndex, selectedUserFilterName: selected.displayName }, () => {
      this.loadData();
    });
  },

  onDateFilterChange(e) {
    this.setData({ selectedDate: e.detail.value, selectedDateText: e.detail.value }, () => {
      this.loadData();
    });
  },

  clearFilters() {
    this.setData({ userFilterIndex: 0, selectedUserFilterName: '全部会员', selectedDate: '', selectedDateText: '全部日期' }, () => {
      this.loadData();
    });
  },

  updateStatus(id, status, title) {
    wx.showModal({
      title,
      content: '确认更新该预约状态？',
      success: async res => {
        if (!res.confirm) return;
        const result = await service.updateAppointmentStatus(id, status);
        if (result && result.success === false) {
          wx.showToast({ title: '更新失败', icon: 'none' });
          return;
        }
        wx.showToast({ title: '已更新', icon: 'success' });
        this.loadData();
      }
    });
  },

  markCompleted(e) {
    this.updateStatus(e.currentTarget.dataset.id, 'completed', '标记完成');
  },

  markCancelled(e) {
    this.updateStatus(e.currentTarget.dataset.id, 'cancelled', '取消预约');
  },

  markNoShow(e) {
    this.updateStatus(e.currentTarget.dataset.id, 'no_show', '标记爽约');
  }
});
