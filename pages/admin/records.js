// pages/admin/records.js
const service = require('../../utils/service');

Page({
  data: {
    activities: [],
    activityIndex: 0,
    activityTitle: '请选择活动',
    selectedActivity: null,
    participants: []
  },

  async onLoad(options) {
    const activities = await service.getActivities();
    const targetIndex = options.activityId
      ? activities.findIndex(item => item._id === options.activityId)
      : 0;
    const activityIndex = targetIndex >= 0 ? targetIndex : 0;
    this.setData({
      activities,
      activityIndex,
      activityTitle: activities.length > 0 ? activities[activityIndex].title : '请选择活动'
    });
    if (activities.length > 0) {
      this.loadParticipants(activityIndex);
    }
  },

  loadParticipants(index) {
    const selectedActivity = this.data.activities[index];
    if (!selectedActivity) {
      this.setData({
        selectedActivity: null,
        activityTitle: '请选择活动',
        participants: []
      });
      return;
    }

    const approvedRegistrations = (selectedActivity.registrations || []).filter(item => item.status === 'approved');
    const registeredUserIds = selectedActivity.participants || [];
    const participants = approvedRegistrations.length > 0
      ? approvedRegistrations.map(item => ({ userId: item.userId, name: item.name || '会员', totalStrokes: '', netScore: '' }))
      : registeredUserIds.length > 0
        ? registeredUserIds.map(userId => ({ userId, name: '会员' + userId.slice(-3), totalStrokes: '', netScore: '' }))
      : [
          { userId: 'user_001', name: '张三', totalStrokes: '', netScore: '' },
          { userId: 'user_002', name: '李四', totalStrokes: '', netScore: '' }
        ];
    this.setData({
      selectedActivity,
      activityTitle: selectedActivity.title || '请选择活动',
      participants
    });
  },

  onActivityChange(e) {
    const index = parseInt(e.detail.value);
    this.setData({ activityIndex: index });
    this.loadParticipants(index);
  },

  onScoreInput(e) {
    const { index, field } = e.currentTarget.dataset;
    const value = e.detail.value;
    const participants = [...this.data.participants];
    participants[index][field] = value;
    this.setData({ participants });
  },

  editScorecard(e) {
    const { userid, name } = e.currentTarget.dataset;
    const activityId = this.data.selectedActivity && this.data.selectedActivity._id;
    if (!activityId || !userid) {
      wx.showToast({ title: '缺少活动或会员', icon: 'none' });
      return;
    }
    wx.navigateTo({
      url: `/pages/scorecard/edit?activityId=${activityId}&userId=${userid}&recordedBy=admin&playerName=${encodeURIComponent(name || '')}`
    });
  },

  async submitRecords() {
    const { selectedActivity, participants } = this.data;
    for (const p of participants) {
      if (p.totalStrokes) {
        await service.createActivityRecord({
          activityId: selectedActivity._id,
          userId: p.userId,
          totalStrokes: parseInt(p.totalStrokes),
          netScore: parseInt(p.netScore) || 0,
          status: 'approved',
          recordedBy: 'admin'
        });
      }
    }
    wx.showToast({ title: '保存成功', icon: 'success' });
  }
});
