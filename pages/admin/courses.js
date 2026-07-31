const service = require('../../utils/service');

const DEFAULT_PARS_TEXT = '4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4';
const EMPTY_FORM = {
  _id: '',
  name: '',
  province: '',
  city: '',
  address: '',
  latitude: '',
  longitude: '',
  holeCount: '18',
  parsText: DEFAULT_PARS_TEXT,
  features: '',
  dataSource: 'manual'
};

function parsToText(pars) {
  return (pars || []).join(',');
}

Page({
  data: {
    courses: [],
    form: { ...EMPTY_FORM },
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
    const courses = await service.getCourses();
    const decorated = (courses || []).map(item => ({
      ...item,
      regionText: [item.province, item.city].filter(Boolean).join(' · ') || '未设置地区',
      totalParText: String(item.totalPar || 0),
      holeCountText: String(item.holeCount || 18),
      parsText: parsToText(item.pars || [])
    }));
    this.setData({
      courses: decorated,
      showEmpty: decorated.length === 0
    });
  },

  resetForm() {
    this.setData({
      form: { ...EMPTY_FORM },
      isEditing: true
    });
  },

  selectCourse(e) {
    const id = e.currentTarget.dataset.id;
    const course = this.data.courses.find(item => item._id === id);
    if (!course) return;
    this.setData({
      form: {
        _id: course._id,
        name: course.name || '',
        province: course.province || '',
        city: course.city || '',
        address: course.address || '',
        latitude: course.latitude || '',
        longitude: course.longitude || '',
        holeCount: String(course.holeCount || 18),
        parsText: course.parsText || DEFAULT_PARS_TEXT,
        features: course.features || '',
        dataSource: course.dataSource || 'manual'
      },
      isEditing: true
    });
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({
      form: {
        ...this.data.form,
        [field]: e.detail.value
      }
    });
  },

  async saveCourse() {
    if (!this.data.form.name) {
      wx.showToast({ title: '请填写球场名称', icon: 'none' });
      return;
    }
    await service.saveCourse(this.data.form);
    wx.showToast({ title: '已保存', icon: 'success' });
    this.setData({
      form: { ...EMPTY_FORM },
      isEditing: false
    });
    this.loadData();
  },

  async deleteCourse(e) {
    const id = e.currentTarget.dataset.id;
    await service.deleteCourse(id);
    wx.showToast({ title: '已删除', icon: 'success' });
    this.loadData();
  }
});
