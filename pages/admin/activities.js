const service = require('../../utils/service');

function pad(number) {
  return String(number).padStart(2, '0');
}

function getTodayText() {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function splitDateTime(value, fallbackDate, fallbackClock) {
  const text = String(value || '').trim();
  if (!text) {
    return { date: fallbackDate, clock: fallbackClock };
  }
  const normalized = text.replace('T', ' ');
  const parts = normalized.split(' ');
  return {
    date: parts[0] || fallbackDate,
    clock: (parts[1] || fallbackClock).slice(0, 5)
  };
}

function createEmptyForm() {
  const today = getTodayText();
  return {
    _id: '',
    title: '',
    type: 'event',
    courseId: '',
    location: '',
    startTime: '',
    endTime: '',
    signupStartTime: '',
    signupEndTime: '',
    startDate: today,
    startClock: '08:00',
    endDate: today,
    endClock: '15:00',
    signupStartDate: today,
    signupStartClock: '09:00',
    signupEndDate: today,
    signupEndClock: '18:00',
    itinerary: '',
    meal: '',
    fee: '',
    maxParticipants: '',
    description: '',
    status: 'upcoming'
  };
}

const EMPTY_FORM = createEmptyForm();

Page({
  data: {
    activeTab: 'recruiting',
    tabs: [
      { label: '募集中', value: 'recruiting', className: 'tab active' },
      { label: '完成', value: 'finished', className: 'tab' }
    ],
    allActivities: [],
    activities: [],
    courses: [],
    courseOptions: ['不关联球场'],
    courseIndex: 0,
    coursePickerText: '不关联球场',
    selectedActivity: null,
    form: EMPTY_FORM,
    isEditing: false,
    showEmpty: true
  },

  onLoad() {
    this.loadData();
  },

  onShow() {
    this.loadData();
  },

  async loadData() {
    const [activities, courses] = await Promise.all([
      service.getActivities(),
      service.getCourses()
    ]);
    const decorated = (activities || []).map(item => this.decorateActivity(item));
    this.setData({
      allActivities: decorated,
      courses: courses || [],
      courseOptions: ['不关联球场', ...(courses || []).map(item => item.name)]
    }, () => {
      this.applyTab();
    });
  },

  decorateActivity(activity) {
    const registrations = activity.registrations || [];
    const approvedCount = registrations.filter(item => item.status === 'approved').length;
    const pendingCount = registrations.filter(item => item.status === 'pending').length;
    const rejectedCount = registrations.filter(item => item.status === 'rejected').length;
    const maxParticipantsText = activity.maxParticipants ? String(activity.maxParticipants) : '不限';
    const statusMap = {
      upcoming: '报名中',
      ongoing: '已确认',
      completed: '已结束',
      cancelled: '已取消'
    };
    const registrationStatusMap = {
      pending: '待确认',
      approved: '已同意',
      rejected: '已拒绝',
      completed: '已履约',
      no_show: '爽约'
    };
    return {
      ...activity,
      feeText: String(Number(activity.fee || 0)),
      maxParticipantsText,
      approvedCount,
      pendingCount,
      rejectedCount,
      statusText: statusMap[activity.status] || '报名中',
      isFinished: activity.status === 'completed' || activity.status === 'cancelled',
      showRegistrationsEmpty: registrations.length === 0,
      registrations: registrations.map(item => ({
        ...item,
        activityId: activity._id,
        statusText: registrationStatusMap[item.status] || '待确认',
        canApprove: item.status === 'pending',
        canReject: item.status === 'pending',
        canSettle: item.status === 'approved'
      }))
    };
  },

  decorateTabs(activeTab) {
    return this.data.tabs.map(item => ({
      ...item,
      className: item.value === activeTab ? 'tab active' : 'tab'
    }));
  },

  applyTab() {
    const activeTab = this.data.activeTab;
    const activities = this.data.allActivities.filter(item => {
      if (activeTab === 'finished') return item.isFinished;
      return !item.isFinished;
    });
    this.setData({
      tabs: this.decorateTabs(activeTab),
      activities,
      showEmpty: activities.length === 0
    });
  },

  switchTab(e) {
    const activeTab = e.currentTarget.dataset.tab;
    this.setData({ activeTab }, () => {
      this.applyTab();
    });
  },

  resetForm() {
    this.setData({
      form: createEmptyForm(),
      selectedActivity: null,
      courseIndex: 0,
      coursePickerText: '不关联球场',
      isEditing: true
    });
  },

  selectActivity(e) {
    const id = e.currentTarget.dataset.id;
    const activity = this.data.activities.find(item => item._id === id);
    if (!activity) return;
    const start = splitDateTime(activity.startTime, getTodayText(), '08:00');
    const end = splitDateTime(activity.endTime, start.date, '15:00');
    const signupStart = splitDateTime(activity.signupStartTime, getTodayText(), '09:00');
    const signupEnd = splitDateTime(activity.signupEndTime, signupStart.date, '18:00');
    this.setData({
      selectedActivity: activity,
      form: {
        _id: activity._id,
        title: activity.title || '',
        type: activity.type || 'event',
        courseId: activity.courseId || '',
        location: activity.location || '',
        startTime: activity.startTime || '',
        endTime: activity.endTime || '',
        signupStartTime: activity.signupStartTime || '',
        signupEndTime: activity.signupEndTime || '',
        startDate: start.date,
        startClock: start.clock,
        endDate: end.date,
        endClock: end.clock,
        signupStartDate: signupStart.date,
        signupStartClock: signupStart.clock,
        signupEndDate: signupEnd.date,
        signupEndClock: signupEnd.clock,
        itinerary: activity.itinerary || '',
        meal: activity.meal || '',
        fee: String(activity.fee || ''),
        maxParticipants: String(activity.maxParticipants || ''),
        description: activity.description || '',
        status: activity.status || 'upcoming'
      },
      courseIndex: this.getCourseIndex(activity.courseId || ''),
      coursePickerText: this.getCoursePickerText(activity.courseId || ''),
      isEditing: true
    });
  },

  composeDateTime(date, clock) {
    if (!date || !clock) return '';
    return `${date} ${clock}`;
  },

  buildSubmitForm(form) {
    return {
      ...form,
      startTime: this.composeDateTime(form.startDate, form.startClock),
      endTime: this.composeDateTime(form.endDate, form.endClock),
      signupStartTime: this.composeDateTime(form.signupStartDate, form.signupStartClock),
      signupEndTime: this.composeDateTime(form.signupEndDate, form.signupEndClock)
    };
  },

  getCourseIndex(courseId) {
    if (!courseId) return 0;
    const index = this.data.courses.findIndex(item => item._id === courseId);
    return index >= 0 ? index + 1 : 0;
  },

  getCoursePickerText(courseId) {
    const index = this.getCourseIndex(courseId);
    return this.data.courseOptions[index] || '不关联球场';
  },

  onCourseChange(e) {
    const courseIndex = parseInt(e.detail.value, 10);
    const course = this.data.courses[courseIndex - 1];
    const form = {
      ...this.data.form,
      courseId: course ? course._id : '',
      location: course ? course.name : this.data.form.location
    };
    this.setData({
      courseIndex,
      coursePickerText: this.data.courseOptions[courseIndex] || '不关联球场',
      form
    });
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field;
    const form = {
      ...this.data.form,
      [field]: e.detail.value
    };
    this.setData({ form });
  },

  onDateTimeChange(e) {
    const field = e.currentTarget.dataset.field;
    const form = {
      ...this.data.form,
      [field]: e.detail.value
    };
    this.setData({ form });
  },

  async saveActivity() {
    const form = this.buildSubmitForm(this.data.form);
    if (!form.title || !form.startTime) {
      wx.showToast({ title: '请填写标题和时间', icon: 'none' });
      return;
    }
    await service.saveActivity(form);
    wx.showToast({ title: '已保存', icon: 'success' });
    this.setData({ isEditing: false, selectedActivity: null, form: createEmptyForm() });
    this.loadData();
  },

  async cancelActivity(e) {
    const id = e.currentTarget.dataset.id;
    await service.deleteActivity(id);
    wx.showToast({ title: '已取消活动', icon: 'success' });
    this.loadData();
  },

  async markActivityStatus(e) {
    const { id, status } = e.currentTarget.dataset;
    await service.updateActivityStatus(id, status);
    wx.showToast({ title: status === 'ongoing' ? '已确认成团' : '已结束', icon: 'success' });
    this.loadData();
  },

  async updateRegistration(e) {
    const { activityid, userid, status } = e.currentTarget.dataset;
    await service.updateActivityRegistration(activityid, userid, status);
    const titleMap = {
      approved: '已同意',
      rejected: '已拒绝',
      completed: '已履约',
      no_show: '已记爽约'
    };
    wx.showToast({ title: titleMap[status] || '已更新', icon: 'success' });
    this.loadData();
  },

  goRecords(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/admin/records?activityId=${id}` });
  }
});
