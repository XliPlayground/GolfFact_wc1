// pages/activity/index.js
const service = require('../../utils/service');

Page({
  data: {
    activity: {},
    activities: [],
    user: null,
    isDetail: false,
    joinButtonText: '报名参加',
    canJoin: true
  },

  async onLoad(options) {
    const user = await service.getCurrentUser();
    this.setData({ user });
    if (options.id) {
      const activities = await service.getActivities();
      const activity = activities.find(a => a._id === options.id) || {};
      this.setData({
        activity: this.decorateActivity(activity, user),
        isDetail: true
      });
    } else {
      const activities = await service.getActivities();
      this.setData({
        activities: activities.map(item => this.decorateActivity(item, user)),
        isDetail: false
      });
    }
  },

  decorateActivity(activity, user) {
    const registrations = activity.registrations || [];
    const approvedCount = registrations.filter(item => item.status === 'approved').length;
    const pendingCount = registrations.filter(item => item.status === 'pending').length;
    const myRegistration = user ? registrations.find(item => item.userId === user._id) : null;
    const signupEndTime = activity.signupEndTime || '未设置';
    const maxParticipantsText = activity.maxParticipants ? String(activity.maxParticipants) : '不限';
    const feeText = String(Number(activity.fee || 0));
    const statusTextMap = {
      upcoming: '报名中',
      ongoing: '进行中',
      completed: '已结束',
      cancelled: '已取消'
    };
    const registrationTextMap = {
      pending: '待老板确认',
      approved: '已报名',
      rejected: '未通过',
      no_show: '爽约',
      completed: '已履约'
    };
    const isFull = activity.maxParticipants && approvedCount >= Number(activity.maxParticipants);
    const isClosed = activity.signupEndTime && new Date() > new Date(activity.signupEndTime);
    const canJoin = activity.status === 'upcoming' && !isFull && !isClosed && (!myRegistration || myRegistration.status === 'rejected');
    let joinButtonText = '报名参加';
    if (myRegistration) joinButtonText = registrationTextMap[myRegistration.status] || '已报名';
    if (!myRegistration && isFull) joinButtonText = '名额已满';
    if (!myRegistration && isClosed) joinButtonText = '报名截止';
    if (activity.status !== 'upcoming') joinButtonText = statusTextMap[activity.status] || '不可报名';

    const showJoinDisabled = !canJoin;

    return {
      ...activity,
      feeText,
      maxParticipantsText,
      signupEndText: signupEndTime,
      approvedCount,
      pendingCount,
      statusText: statusTextMap[activity.status] || '报名中',
      myRegistrationStatus: myRegistration ? myRegistration.status : '',
      myRegistrationText: myRegistration ? (registrationTextMap[myRegistration.status] || '已报名') : '未报名',
      joinButtonText,
      canJoin,
      showJoinDisabled
    };
  },

  goDetail(e) {
    wx.navigateTo({ url: `/pages/activity/index?id=${e.currentTarget.dataset.id}` });
  },

  async joinActivity() {
    if (!this.data.activity.canJoin) return;
    const result = await service.registerActivity(this.data.activity._id, this.data.user._id);
    wx.showToast({
      title: result.success ? '已提交报名' : (result.message || '报名失败'),
      icon: result.success ? 'success' : 'none'
    });
    if (result.success) {
      const activities = await service.getActivities();
      const activity = activities.find(a => a._id === this.data.activity._id) || {};
      this.setData({ activity: this.decorateActivity(activity, this.data.user) });
    }
  }
});
