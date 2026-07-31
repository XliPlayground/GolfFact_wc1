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
  nineHoleText: '',
  comboText: '',
  features: '',
  dataSource: 'manual'
};

function parsToText(pars) {
  return (pars || []).join(',');
}

function parsePars(value, limit) {
  const list = String(value || '')
    .split(/[\s,，、/]+/)
    .map(item => Number(item))
    .filter(item => item > 0);
  while (list.length < limit) list.push(4);
  return list.slice(0, limit);
}

function parseNineHoleText(value) {
  return String(value || '')
    .split(/\n+/)
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const parts = line.split(/[:：]/);
      const name = String(parts[0] || '').trim().toUpperCase();
      const pars = parsePars(parts.slice(1).join(':'), 9);
      return name ? { name, pars, totalPar: pars.reduce((sum, par) => sum + par, 0) } : null;
    })
    .filter(Boolean);
}

function nineHolesToText(nineHoleCourses) {
  return (nineHoleCourses || [])
    .map(item => `${item.name}:${parsToText(item.pars || [])}`)
    .join('\n');
}

function parseComboText(value, nineHoleCourses) {
  const segmentMap = {};
  (nineHoleCourses || []).forEach(item => {
    segmentMap[String(item.name || '').toUpperCase()] = item;
  });
  return String(value || '')
    .split(/\n+/)
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const parts = line.split('+').map(item => item.trim().toUpperCase()).filter(Boolean);
      if (parts.length < 2) return null;
      const pars = [];
      parts.forEach(part => {
        if (segmentMap[part]) pars.push(...segmentMap[part].pars);
      });
      if (pars.length !== 18) return null;
      return {
        name: parts.join('+'),
        parts,
        pars,
        holeCount: 18,
        totalPar: pars.reduce((sum, par) => sum + par, 0)
      };
    })
    .filter(Boolean);
}

function combosToText(courseCombinations) {
  return (courseCombinations || [])
    .map(item => (item.parts || []).join('+') || item.name)
    .join('\n');
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
      parsText: parsToText(item.pars || []),
      nineHoleText: nineHolesToText(item.nineHoleCourses || []),
      comboText: combosToText(item.courseCombinations || []),
      comboSummary: (item.courseCombinations || []).map(combo => `${combo.name} Par ${combo.totalPar}`).join(' · ')
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
        nineHoleText: course.nineHoleText || '',
        comboText: course.comboText || '',
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
    const nineHoleCourses = parseNineHoleText(this.data.form.nineHoleText);
    const courseCombinations = parseComboText(this.data.form.comboText, nineHoleCourses);
    const pars = courseCombinations[0]
      ? courseCombinations[0].pars
      : parsePars(this.data.form.parsText, 18);
    await service.saveCourse({
      ...this.data.form,
      pars,
      holeCount: pars.length,
      totalPar: pars.reduce((sum, par) => sum + Number(par || 0), 0),
      nineHoleCourses,
      courseCombinations
    });
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
