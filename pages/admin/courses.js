const service = require('../../utils/service');

const DEFAULT_PARS_TEXT = '';
const PAR_OPTIONS = ['未维护', '3', '4', '5', '6'];
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
  parSource: '',
  features: '',
  dataSource: 'manual'
};

function parsToGrid(pars) {
  const list = Array.isArray(pars) ? pars : [];
  return Array.from({ length: 18 }, (_, index) => {
    const par = Number(list[index] || 0);
    const optionIndex = Math.max(PAR_OPTIONS.findIndex(item => Number(item) === par), 0);
    return {
      holeNumber: index + 1,
      par,
      parText: par ? String(par) : '-',
      parPickerIndex: optionIndex,
      className: par ? 'par-cell filled' : 'par-cell empty'
    };
  });
}

function parsToText(pars) {
  return (pars || []).join(',');
}

function parsePars(value, limit) {
  const list = String(value || '')
    .split(/[\s,，、/]+/)
    .map(item => Number(item))
    .filter(item => item > 0);
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
      if (pars.length !== 9) return null;
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

function syncNineHoleFromPars(pars) {
  if (!Array.isArray(pars) || pars.length !== 18) return '';
  const front = pars.slice(0, 9);
  const back = pars.slice(9, 18);
  if (front.some(par => !par) || back.some(par => !par)) return '';
  return `前9:${parsToText(front)}\n后9:${parsToText(back)}`;
}

Page({
  data: {
    courses: [],
    form: { ...EMPTY_FORM },
    parOptions: PAR_OPTIONS,
    parsGrid: parsToGrid([]),
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
      hasPars: Array.isArray(item.pars) && item.pars.length === 18 && Number(item.totalPar || 0) > 0,
      totalParText: item.totalPar ? String(item.totalPar) : '待维护',
      parStatusText: item.parStatus === 'verified_manual' ? '已维护' : '待维护',
      holeCountText: String(item.holeCount || 18),
      parsText: (item.pars || []).length > 0 ? parsToText(item.pars || []) : '逐洞标准杆待维护',
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
      parsGrid: parsToGrid([]),
      isEditing: true
    });
  },

  importRegionalCourses() {
    wx.showModal({
      title: '导入京津冀球场',
      content: '会增量导入北京、天津、河北球场名录，不会清空现有数据。没有可靠来源的逐洞标准杆会标记为待维护，不会自动带入记分。',
      success: async res => {
        if (!res.confirm) return;
        const result = await service.importRegionalCourses();
        if (!result.success) {
          wx.showToast({ title: result.error || '导入失败', icon: 'none' });
          return;
        }
        const data = result.data || {};
        wx.showModal({
          title: '导入完成',
          content: `新增 ${data.imported || 0} 个，更新 ${data.updated || 0} 个，跳过 ${data.skipped || 0} 个。`,
          showCancel: false,
          success: () => {
            this.loadData();
          }
        });
      }
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
        parSource: course.parSource || '',
        features: course.features || '',
        dataSource: course.dataSource || 'manual'
      },
      parsGrid: parsToGrid(course.pars || []),
      isEditing: true
    });
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field;
    const form = {
      ...this.data.form,
      [field]: e.detail.value
    };
    const next = { form };
    if (field === 'parsText') {
      next.parsGrid = parsToGrid(parsePars(e.detail.value, 18));
    }
    this.setData(next);
  },

  onParPickerChange(e) {
    const index = Number(e.currentTarget.dataset.index);
    const optionIndex = Number(e.detail.value || 0);
    const par = Number(PAR_OPTIONS[optionIndex] || 0);
    const pars = this.data.parsGrid.map(item => item.par || 0);
    pars[index] = par;
    const filledPars = pars.filter(item => Number(item) > 0);
    this.setData({
      parsGrid: parsToGrid(pars),
      form: {
        ...this.data.form,
        parsText: filledPars.length ? parsToText(pars) : ''
      }
    });
  },

  clearPars() {
    this.setData({
      parsGrid: parsToGrid([]),
      form: {
        ...this.data.form,
        parsText: '',
        nineHoleText: '',
        comboText: ''
      }
    });
  },

  buildNineHoleUnits() {
    const pars = this.data.parsGrid.map(item => Number(item.par || 0));
    const text = syncNineHoleFromPars(pars);
    if (!text) {
      wx.showToast({ title: '请先填满18洞标准杆', icon: 'none' });
      return;
    }
    this.setData({
      form: {
        ...this.data.form,
        nineHoleText: text,
        comboText: '前9+后9'
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
    if (pars.length > 0 && pars.length !== 18) {
      wx.showToast({ title: '每洞标准杆需填满18洞', icon: 'none' });
      return;
    }
    if (this.data.form.nineHoleText && nineHoleCourses.length === 0) {
      wx.showToast({ title: '9洞单元需每行填满9洞', icon: 'none' });
      return;
    }
    await service.saveCourse({
      ...this.data.form,
      pars,
      holeCount: Number(this.data.form.holeCount || 18),
      totalPar: pars.reduce((sum, par) => sum + Number(par || 0), 0),
      nineHoleCourses,
      courseCombinations,
      parStatus: pars.length === 18 ? 'verified_manual' : 'pending',
      parSource: this.data.form.parSource || ''
    });
    wx.showToast({ title: '已保存', icon: 'success' });
    this.setData({
      form: { ...EMPTY_FORM },
      parsGrid: parsToGrid([]),
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
