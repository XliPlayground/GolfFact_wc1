const service = require('../../utils/service');

function getMonthStart() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
}

function getToday() {
  return new Date().toISOString().split('T')[0];
}

function emptyCoachForm() {
  return {
    _id: '',
    name: '',
    intro: '',
    tagsText: '',
    hourlyRate: '300',
    status: 'active'
  };
}

Page({
  data: {
    coaches: [],
    users: [],
    coachForm: emptyCoachForm(),
    editingCoach: false,
    billCoachIndex: 0,
    billCoachName: '请选择教练',
    billStartDate: getMonthStart(),
    billEndDate: getToday(),
    billRows: [],
    billTotalHours: 0,
    billTotalAmount: 0,
    showBillEmpty: true
  },

  onLoad() {
    this.loadData();
  },

  onShow() {
    this.loadData();
  },

  async loadData() {
    const [rawCoaches, users] = await Promise.all([
      service.getCoaches(),
      service.getUsers()
    ]);
    const coaches = (rawCoaches || [])
      .filter(item => item.status !== 'deleted')
      .map(item => {
        const linkedCount = (users || []).filter(user => (user.coachIds || []).includes(item._id)).length;
        return {
          ...item,
          tagsText: (item.tags || []).join('、'),
          linkedCount,
          statusText: item.status === 'active' ? '启用' : '停用'
        };
      });
    const billCoachIndex = Math.min(this.data.billCoachIndex, Math.max(coaches.length - 1, 0));
    const billCoach = coaches[billCoachIndex];
    this.setData({
      coaches,
      users: users || [],
      billCoachIndex,
      billCoachName: billCoach ? billCoach.name : '请选择教练'
    }, () => {
      this.loadBill();
    });
  },

  newCoach() {
    this.setData({ coachForm: emptyCoachForm(), editingCoach: true });
  },

  editCoach(e) {
    const coach = this.data.coaches.find(item => item._id === e.currentTarget.dataset.id);
    if (!coach) return;
    this.setData({
      coachForm: {
        _id: coach._id,
        name: coach.name || '',
        intro: coach.intro || '',
        tagsText: coach.tagsText || '',
        hourlyRate: String(coach.hourlyRate || 300),
        status: coach.status || 'active'
      },
      editingCoach: true
    });
  },

  onCoachInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({
      coachForm: {
        ...this.data.coachForm,
        [field]: e.detail.value
      }
    });
  },

  toggleCoachStatus() {
    const status = this.data.coachForm.status === 'active' ? 'inactive' : 'active';
    this.setData({
      coachForm: {
        ...this.data.coachForm,
        status
      }
    });
  },

  async saveCoach() {
    const form = this.data.coachForm;
    if (!form.name) {
      wx.showToast({ title: '请填写教练姓名', icon: 'none' });
      return;
    }
    await service.saveCoach({
      ...form,
      hourlyRate: Number(form.hourlyRate || 0)
    });
    wx.showToast({ title: '已保存教练', icon: 'success' });
    this.setData({ editingCoach: false, coachForm: emptyCoachForm() });
    this.loadData();
  },

  async deleteCoach(e) {
    await service.deleteCoach(e.currentTarget.dataset.id);
    wx.showToast({ title: '已删除', icon: 'success' });
    this.loadData();
  },

  onBillCoachChange(e) {
    const billCoachIndex = parseInt(e.detail.value, 10);
    const coach = this.data.coaches[billCoachIndex];
    this.setData({
      billCoachIndex,
      billCoachName: coach ? coach.name : '请选择教练'
    }, () => {
      this.loadBill();
    });
  },

  onBillStartChange(e) {
    this.setData({ billStartDate: e.detail.value }, () => {
      this.loadBill();
    });
  },

  onBillEndChange(e) {
    this.setData({ billEndDate: e.detail.value }, () => {
      this.loadBill();
    });
  },

  async loadBill() {
    const coach = this.data.coaches[this.data.billCoachIndex];
    if (!coach) {
      this.setData({ billRows: [], billTotalHours: 0, billTotalAmount: 0, showBillEmpty: true });
      return;
    }
    const summary = await service.getCoachBillSummary(coach._id, this.data.billStartDate, this.data.billEndDate);
    const rows = (summary.rows || []).map(item => ({
      ...item,
      timeText: `${item.date || ''} ${item.startTime || ''}-${item.endTime || ''}`,
      statusText: item.status === 'completed' ? '已完成' : item.status === 'no_show' ? '爽约' : '预约中'
    }));
    this.setData({
      billRows: rows,
      billTotalHours: summary.totalHours || 0,
      billTotalAmount: summary.totalAmount || 0,
      showBillEmpty: rows.length === 0
    });
  }
});
