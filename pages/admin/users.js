const service = require('../../utils/service');

const STATUS_TEXT = {
  active: '正常',
  pending: '待处理'
};

Page({
  data: {
    allUsers: [],
    users: [],
    userKeyword: '',
    coaches: [],
    selectedUserId: '',
    selectedUser: null,
    selectedCoachIds: [],
    selectedRecharges: [],
    selectedAppointments: [],
    adjustHours: '',
    adjustReason: '',
    editingUserId: '',
    userFormTitle: '新建会员',
    userName: '',
    userPhone: '',
    userMemberLevel: 'normal',
    userInitialHours: '',
    showInitialHours: true,
    userStatusIndex: 0,
    userStatusOptions: [
      { label: '正常', value: 'active' },
      { label: '待处理', value: 'pending' }
    ],
    userStatusLabel: '正常'
  },

  onLoad() {
    this.loadData();
  },

  onShow() {
    this.loadData();
  },

  async loadData() {
    const [rawUsers, rawCoaches] = await Promise.all([
      service.getUsers(),
      service.getCoaches()
    ]);

    const initialSelectedUserId = this.data.selectedUserId || ((rawUsers || [])[0] && (rawUsers || [])[0]._id) || '';
    const decoratedUsers = (rawUsers || []).map(user => ({
      ...user,
      className: user._id === initialSelectedUserId ? 'user-row active' : 'user-row',
      displayName: user.name || user.nickname || '未命名会员',
      phoneText: user.phone || '未绑定手机号',
      coachIds: user.coachIds || [],
      coachCount: (user.coachIds || []).length,
      remainingHours: user.remainingHours || 0,
      totalRechargedHours: user.totalRechargedHours || 0,
      currentNoShowCount: user.currentNoShowCount || 0,
      status: user.status || 'active',
      statusText: STATUS_TEXT[user.status || 'active'] || user.status,
      isPending: (user.status || 'active') === 'pending',
      isActive: (user.status || 'active') === 'active'
    }));

    const selectedUserId = initialSelectedUserId || (decoratedUsers[0] && decoratedUsers[0]._id) || '';
    decoratedUsers.forEach(user => {
      user.className = user._id === selectedUserId ? 'user-row active' : 'user-row';
    });
    const selectedUser = decoratedUsers.find(user => user._id === selectedUserId) || null;
    const selectedCoachIds = selectedUser ? selectedUser.coachIds : [];
    const coaches = this.decorateCoaches(rawCoaches || [], selectedCoachIds);
    const detail = selectedUser ? await this.buildUserDetail(selectedUser, rawCoaches || []) : {
      selectedRecharges: [],
      selectedAppointments: []
    };

    this.setData({
      allUsers: decoratedUsers,
      users: this.filterUsers(decoratedUsers, this.data.userKeyword),
      coaches,
      selectedUserId,
      selectedUser,
      selectedCoachIds,
      selectedRecharges: detail.selectedRecharges,
      selectedAppointments: detail.selectedAppointments
    });
  },

  filterUsers(users, keyword) {
    const query = String(keyword || '').trim().toLowerCase();
    if (!query) return users;
    return users.filter(user => {
      const text = `${user.displayName || ''} ${user.phone || ''} ${user.phoneText || ''} ${user.memberLevel || ''} ${user.statusText || ''}`.toLowerCase();
      return text.includes(query);
    });
  },

  async buildUserDetail(user, coaches) {
    const [recharges, appointments, bays] = await Promise.all([
      service.getRecharges(user._id),
      service.getAppointments(user._id),
      service.getBays()
    ]);
    const statusMap = {
      booked: '待使用',
      completed: '已完成',
      cancelled: '已取消',
      no_show: '爽约'
    };
    const rechargeStatusMap = {
      valid: '有效',
      expired: '已过期',
      used_up: '已用完',
      adjustment: '手动调整'
    };

    return {
      selectedRecharges: (recharges || []).slice(0, 5).map(row => ({
        ...row,
        hoursText: Number(row.hours || 0) > 0 ? `+${row.hours}` : `${row.hours}`,
        statusText: rechargeStatusMap[row.status] || row.status,
        remarkText: row.remark || row.source || '管理员录入'
      })),
      selectedAppointments: (appointments || []).slice(0, 5).map(item => {
        const bay = (bays || []).find(row => row._id === item.bayId);
        const coach = (coaches || []).find(row => row._id === item.coachId);
        return {
          ...item,
          statusText: statusMap[item.status] || item.status,
          bayName: bay ? bay.name : '-',
          coachName: coach ? coach.name : '',
          typeText: item.type === 'teaching' ? '教练课' : '自助',
          timeText: `${item.date} ${item.startTime}-${item.endTime}`,
          deductedHoursText: `${item.deductedHours || item.duration || 0}小时`
        };
      })
    };
  },

  decorateCoaches(coaches, selectedCoachIds) {
    return coaches.map(coach => ({
      ...coach,
      checked: selectedCoachIds.includes(coach._id),
      tagsText: (coach.tags || []).join('、')
    }));
  },

  selectUser(e) {
    const selectedUserId = e.currentTarget.dataset.id;
    const selectedUser = this.data.allUsers.find(user => user._id === selectedUserId);
    const selectedCoachIds = selectedUser ? selectedUser.coachIds : [];
    this.setData({
      selectedUserId,
      selectedUser,
      allUsers: this.data.allUsers.map(user => ({
        ...user,
        className: user._id === selectedUserId ? 'user-row active' : 'user-row'
      })),
      selectedCoachIds,
      coaches: this.decorateCoaches(this.data.coaches, selectedCoachIds),
      adjustHours: '',
      adjustReason: ''
    }, async () => {
      this.setData({ users: this.filterUsers(this.data.allUsers, this.data.userKeyword) });
      if (!selectedUser) return;
      const detail = await this.buildUserDetail(selectedUser, this.data.coaches);
      this.setData(detail);
    });
  },

  onUserKeywordInput(e) {
    const userKeyword = e.detail.value;
    this.setData({
      userKeyword,
      users: this.filterUsers(this.data.allUsers, userKeyword)
    });
  },

  clearUserKeyword() {
    this.setData({
      userKeyword: '',
      users: this.filterUsers(this.data.allUsers, '')
    });
  },

  onCoachChange(e) {
    const selectedCoachIds = e.detail.value;
    this.setData({
      selectedCoachIds,
      coaches: this.decorateCoaches(this.data.coaches, selectedCoachIds)
    });
  },

  async saveUserCoaches() {
    if (!this.data.selectedUserId) {
      wx.showToast({ title: '请选择会员', icon: 'none' });
      return;
    }

    const res = await service.updateUserCoaches(this.data.selectedUserId, this.data.selectedCoachIds);
    if (res && res.success === false) {
      wx.showToast({ title: '保存失败', icon: 'none' });
      return;
    }

    wx.showToast({ title: '已保存', icon: 'success' });
    this.loadData();
  },

  resetUserForm() {
    this.setData({
      editingUserId: '',
      userFormTitle: '新建会员',
      userName: '',
      userPhone: '',
      userMemberLevel: 'normal',
      userInitialHours: '',
      showInitialHours: true,
      userStatusIndex: 0,
      userStatusLabel: '正常'
    });
  },

  editUser(e) {
    const id = e.currentTarget.dataset.id;
    const user = this.data.allUsers.find(item => item._id === id) || this.data.selectedUser;
    if (!user) {
      wx.showToast({ title: '请选择会员', icon: 'none' });
      return;
    }
    const statusIndex = user.status === 'pending' ? 1 : 0;
    this.setData({
      editingUserId: user._id,
      userFormTitle: '编辑会员',
      userName: user.name || user.nickname || '',
      userPhone: user.phone || '',
      userMemberLevel: user.memberLevel || 'normal',
      userInitialHours: '',
      showInitialHours: false,
      userStatusIndex: statusIndex,
      userStatusLabel: this.data.userStatusOptions[statusIndex].label
    });
  },

  onUserNameInput(e) {
    this.setData({ userName: e.detail.value });
  },

  onUserPhoneInput(e) {
    this.setData({ userPhone: e.detail.value });
  },

  onUserMemberLevelInput(e) {
    this.setData({ userMemberLevel: e.detail.value });
  },

  onUserInitialHoursInput(e) {
    this.setData({ userInitialHours: e.detail.value });
  },

  onUserStatusChange(e) {
    const userStatusIndex = parseInt(e.detail.value, 10);
    this.setData({
      userStatusIndex,
      userStatusLabel: this.data.userStatusOptions[userStatusIndex].label
    });
  },

  async saveUserProfile() {
    const name = this.data.userName.trim();
    if (!name) {
      wx.showToast({ title: '请输入会员姓名', icon: 'none' });
      return;
    }
    const status = this.data.userStatusOptions[this.data.userStatusIndex].value;
    const payload = {
      _id: this.data.editingUserId,
      name,
      nickname: name,
      phone: this.data.userPhone.trim(),
      memberLevel: this.data.userMemberLevel.trim() || 'normal',
      status
    };
    if (!payload._id) {
      payload.remainingHours = Number(this.data.userInitialHours || 0);
      payload.totalRechargedHours = Number(this.data.userInitialHours || 0);
    }

    const res = await service.saveUser(payload);
    if (res && res.success === false) {
      wx.showToast({ title: res.error || '保存失败', icon: 'none' });
      return;
    }
    wx.showToast({ title: '已保存', icon: 'success' });
    this.resetUserForm();
    this.setData({ selectedUserId: res.data._id });
    this.loadData();
  },

  async setUserPending(e) {
    await this.updateUserStatus(e.currentTarget.dataset.id, 'pending', '已设为待处理');
  },

  async restoreUserActive(e) {
    await this.updateUserStatus(e.currentTarget.dataset.id, 'active', '已恢复');
  },

  async updateUserStatus(id, status, toastTitle) {
    const res = await service.updateUserStatus(id, status);
    if (res && res.success === false) {
      wx.showToast({ title: res.error || '更新失败', icon: 'none' });
      return;
    }
    wx.showToast({ title: toastTitle, icon: 'success' });
    this.loadData();
  },

  deleteUser(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '删除会员',
      content: '删除后会员列表不再显示，历史预约和时长记录仍保留。',
      success: async (res) => {
        if (!res.confirm) return;
        const result = await service.deleteUser(id);
        if (result && result.success === false) {
          wx.showToast({ title: result.error || '删除失败', icon: 'none' });
          return;
        }
        wx.showToast({ title: '已删除', icon: 'success' });
        this.setData({ selectedUserId: '' });
        this.loadData();
      }
    });
  },

  onAdjustHoursInput(e) {
    this.setData({ adjustHours: e.detail.value });
  },

  onAdjustReasonInput(e) {
    this.setData({ adjustReason: e.detail.value });
  },

  async submitAdjustHours() {
    const user = this.data.selectedUser;
    const hours = Number(this.data.adjustHours);
    if (!user) {
      wx.showToast({ title: '请选择会员', icon: 'none' });
      return;
    }
    if (!hours) {
      wx.showToast({ title: '请输入调整小时数', icon: 'none' });
      return;
    }
    if (!this.data.adjustReason.trim()) {
      wx.showToast({ title: '请填写调整原因', icon: 'none' });
      return;
    }

    const res = await service.adjustUserHours(user._id, hours, this.data.adjustReason.trim(), 'admin');
    if (res && res.success === false) {
      wx.showToast({ title: res.error || '调整失败', icon: 'none' });
      return;
    }

    wx.showToast({ title: '已调整', icon: 'success' });
    this.setData({ adjustHours: '', adjustReason: '' });
    this.loadData();
  }
});
