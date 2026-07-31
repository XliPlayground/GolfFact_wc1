const service = require('../../utils/service');

const TYPE_OPTIONS = [
  { label: '销售卡', value: 'sale' },
  { label: '体验卡', value: 'trial' },
  { label: '福利包', value: 'benefit' }
];

const MODE_OPTIONS = [
  { label: '直接生成可兑换卡', value: 'active' },
  { label: '预制未激活空卡', value: 'inactive' }
];

const TAB_OPTIONS = [
  { label: '在效期', value: 'valid' },
  { label: '过期', value: 'expired' },
  { label: '已使用', value: 'used' }
];

function decorateTabs(activeTab) {
  return TAB_OPTIONS.map(item => ({
    ...item,
    className: item.value === activeTab ? 'tab active' : 'tab'
  }));
}

function getDateAfterDays(days) {
  const date = new Date();
  date.setDate(date.getDate() + Number(days || 0));
  return date.toISOString().split('T')[0];
}

function extractCode(rawValue) {
  const value = String(rawValue || '').trim();
  if (!value) return '';

  let decodedValue = value;
  try {
    decodedValue = decodeURIComponent(value);
  } catch (err) {
    decodedValue = value;
  }

  const queryMatch = decodedValue.match(/[?&](code|cardNo)=([^&#]+)/i);
  if (queryMatch && queryMatch[2]) {
    return queryMatch[2].trim().toUpperCase();
  }
  return decodedValue.trim().toUpperCase();
}

function isExpired(item) {
  if (!item.cardValidUntil) return false;
  return new Date(`${item.cardValidUntil}T23:59:59`).getTime() < Date.now();
}

function buildReceipt(voucher) {
  return [
    '秋の高球练习场',
    '充时卡兑换小票',
    '------------------------',
    `卡号：${voucher.cardNo}`,
    `类型：${voucher.typeLabel}`,
    `时长：${voucher.hours}小时`,
    `充值后有效：${voucher.validDays}天`,
    `卡片有效期：${voucher.cardValidUntil}`,
    '',
    '兑换码：',
    voucher.token,
    '',
    '兑换路径：',
    `/pages/mine/redeem?code=${voucher.token}`,
    '',
    '请在小程序「我的-兑换充时卡」扫码或输入兑换码。',
    '------------------------'
  ].join('\n');
}

Page({
  data: {
    tabOptions: decorateTabs('valid'),
    activeTab: 'valid',
    modeOptions: MODE_OPTIONS,
    modeIndex: 0,
    modeLabel: MODE_OPTIONS[0].label,
    modeIsActive: true,
    typeOptions: TYPE_OPTIONS,
    typeIndex: 0,
    typeLabel: TYPE_OPTIONS[0].label,
    hours: 3,
    validDays: 30,
    cardValidUntil: getDateAfterDays(365),
    count: 1,
    activateTypeIndex: 0,
    activateTypeLabel: TYPE_OPTIONS[0].label,
    activateCardNo: '',
    activateHours: 3,
    activateValidDays: 30,
    activateCardValidUntil: getDateAfterDays(365),
    activateCount: 1,
    vouchers: [],
    visibleVouchers: [],
    editingVoucherId: '',
    editTypeIndex: 0,
    editTypeLabel: TYPE_OPTIONS[0].label,
    editHours: '',
    editValidDays: '',
    editCardValidUntil: '',
    editRemark: ''
  },

  onLoad() {
    this.loadVouchers();
  },

  onShow() {
    this.loadVouchers();
  },

  async loadVouchers() {
    const vouchers = await service.getVouchers();
    const typeMap = { sale: '销售卡', trial: '体验卡', benefit: '福利包', blank: '空卡' };
    const statusMap = { active: '可兑换', used: '已兑换', inactive: '未激活', pending: '待处理' };
    const decorated = (vouchers || []).map(item => {
      const expired = isExpired(item);
      return {
        ...item,
        isExpired: expired,
        typeLabel: typeMap[item.type] || item.type,
        statusText: expired && item.status !== 'used' ? '已过期' : (statusMap[item.status] || item.status),
        metaText: item.status === 'inactive'
          ? `未设置权益 · 卡有效期至 ${item.cardValidUntil || '-'}`
          : `${item.hours}小时 · 充值后${item.validDays}天有效 · 卡至 ${item.cardValidUntil || '-'}`
      };
    });

    this.setData({ vouchers: decorated }, () => {
      this.applyTabFilter();
    });
  },

  applyTabFilter() {
    const { activeTab, vouchers, editingVoucherId } = this.data;
    let visibleVouchers = vouchers;
    if (activeTab === 'used') {
      visibleVouchers = vouchers.filter(item => item.status === 'used');
    } else if (activeTab === 'expired') {
      visibleVouchers = vouchers.filter(item => item.status !== 'used' && item.isExpired);
    } else {
      visibleVouchers = vouchers.filter(item => item.status !== 'used' && !item.isExpired);
    }
    visibleVouchers = visibleVouchers.map(item => ({
      ...item,
      isEditing: item._id === editingVoucherId,
      canEdit: item.status !== 'used',
      canSetPending: item.status === 'active' || item.status === 'inactive',
      canRestore: item.status === 'pending'
    }));
    this.setData({ visibleVouchers });
  },

  switchTab(e) {
    const activeTab = e.currentTarget.dataset.tab;
    this.setData({ activeTab, tabOptions: decorateTabs(activeTab), editingVoucherId: '' }, () => {
      this.applyTabFilter();
    });
  },

  onModeChange(e) {
    const modeIndex = parseInt(e.detail.value, 10);
    this.setData({
      modeIndex,
      modeLabel: MODE_OPTIONS[modeIndex].label,
      modeIsActive: MODE_OPTIONS[modeIndex].value === 'active'
    });
  },

  onTypeChange(e) {
    const typeIndex = parseInt(e.detail.value, 10);
    this.setData({
      typeIndex,
      typeLabel: TYPE_OPTIONS[typeIndex].label
    });
  },

  onHoursInput(e) {
    this.setData({ hours: e.detail.value });
  },

  onValidDaysInput(e) {
    this.setData({ validDays: e.detail.value });
  },

  onCardValidUntilChange(e) {
    this.setData({ cardValidUntil: e.detail.value });
  },

  onCountInput(e) {
    this.setData({ count: e.detail.value });
  },

  onActivateTypeChange(e) {
    const activateTypeIndex = parseInt(e.detail.value, 10);
    this.setData({
      activateTypeIndex,
      activateTypeLabel: TYPE_OPTIONS[activateTypeIndex].label
    });
  },

  onActivateCardNoInput(e) {
    this.setData({ activateCardNo: extractCode(e.detail.value) });
  },

  onActivateHoursInput(e) {
    this.setData({ activateHours: e.detail.value });
  },

  onActivateValidDaysInput(e) {
    this.setData({ activateValidDays: e.detail.value });
  },

  onActivateCardValidUntilChange(e) {
    this.setData({ activateCardValidUntil: e.detail.value });
  },

  onActivateCountInput(e) {
    this.setData({ activateCount: e.detail.value });
  },

  async generateVoucher() {
    const hours = Number(this.data.hours);
    const validDays = Number(this.data.validDays);
    const count = Number(this.data.count);
    if (!count || count <= 0 || count > 50) {
      wx.showToast({ title: '数量需为1-50', icon: 'none' });
      return;
    }
    if (!this.data.cardValidUntil) {
      wx.showToast({ title: '请选择卡片有效期', icon: 'none' });
      return;
    }

    const mode = MODE_OPTIONS[this.data.modeIndex].value;
    const type = TYPE_OPTIONS[this.data.typeIndex].value;
    if (mode === 'active') {
      if (!hours || hours <= 0) {
        wx.showToast({ title: '小时数需大于0', icon: 'none' });
        return;
      }
      if (!validDays || validDays <= 0) {
        wx.showToast({ title: '充值后有效天数需大于0', icon: 'none' });
        return;
      }
    }

    await service.generateVoucher({
      type: mode === 'inactive' ? 'blank' : type,
      hours: mode === 'inactive' ? 0 : hours,
      validDays: mode === 'inactive' ? 0 : validDays,
      cardValidUntil: this.data.cardValidUntil,
      count,
      redeemLimitType: type === 'trial' ? 'once_lifetime' : 'unlimited',
      status: mode
    });
    wx.showToast({ title: mode === 'inactive' ? '空卡已生成' : '已生成', icon: 'success' });
    this.loadVouchers();
  },

  scanActivateCard() {
    wx.scanCode({
      onlyFromCamera: false,
      success: (res) => {
        const activateCardNo = extractCode(res.result);
        if (!activateCardNo) {
          wx.showToast({ title: '未识别到卡号', icon: 'none' });
          return;
        }
        this.setData({ activateCardNo });
      },
      fail: () => {
        wx.showToast({ title: '扫码已取消', icon: 'none' });
      }
    });
  },

  async activateVouchers() {
    const cardNo = this.data.activateCardNo;
    const hours = Number(this.data.activateHours);
    const validDays = Number(this.data.activateValidDays);
    const count = Number(this.data.activateCount || 1);
    if (!cardNo) {
      wx.showToast({ title: '请输入起始卡号', icon: 'none' });
      return;
    }
    if (!hours || hours <= 0) {
      wx.showToast({ title: '小时数需大于0', icon: 'none' });
      return;
    }
    if (!validDays || validDays <= 0) {
      wx.showToast({ title: '充值后有效天数需大于0', icon: 'none' });
      return;
    }
    if (!this.data.activateCardValidUntil) {
      wx.showToast({ title: '请选择卡片有效期', icon: 'none' });
      return;
    }
    if (!count || count <= 0 || count > 50) {
      wx.showToast({ title: '激活数量需为1-50', icon: 'none' });
      return;
    }

    const type = TYPE_OPTIONS[this.data.activateTypeIndex].value;
    const result = await service.activateVouchers({
      cardNo,
      count,
      type,
      hours,
      validDays,
      cardValidUntil: this.data.activateCardValidUntil,
      redeemLimitType: type === 'trial' ? 'once_lifetime' : 'unlimited'
    });
    if (!result.success) {
      wx.showToast({ title: result.error || '激活失败', icon: 'none' });
      return;
    }

    wx.showToast({ title: '已激活', icon: 'success' });
    this.loadVouchers();
  },

  startEdit(e) {
    const id = e.currentTarget.dataset.id;
    const voucher = this.data.vouchers.find(item => item._id === id);
    if (!voucher) return;
    const editTypeIndex = Math.max(TYPE_OPTIONS.findIndex(item => item.value === voucher.type), 0);
    this.setData({
      editingVoucherId: id,
      editTypeIndex,
      editTypeLabel: TYPE_OPTIONS[editTypeIndex].label,
      editHours: voucher.hours,
      editValidDays: voucher.validDays,
      editCardValidUntil: voucher.cardValidUntil,
      editRemark: voucher.remark || ''
    }, () => {
      this.applyTabFilter();
    });
  },

  cancelEdit() {
    this.setData({ editingVoucherId: '' }, () => {
      this.applyTabFilter();
    });
  },

  onEditTypeChange(e) {
    const editTypeIndex = parseInt(e.detail.value, 10);
    this.setData({
      editTypeIndex,
      editTypeLabel: TYPE_OPTIONS[editTypeIndex].label
    });
  },

  onEditHoursInput(e) {
    this.setData({ editHours: e.detail.value });
  },

  onEditValidDaysInput(e) {
    this.setData({ editValidDays: e.detail.value });
  },

  onEditCardValidUntilChange(e) {
    this.setData({ editCardValidUntil: e.detail.value });
  },

  onEditRemarkInput(e) {
    this.setData({ editRemark: e.detail.value });
  },

  async saveEdit() {
    const id = this.data.editingVoucherId;
    const hours = Number(this.data.editHours);
    const validDays = Number(this.data.editValidDays);
    if (!id) return;
    if (!hours || hours <= 0) {
      wx.showToast({ title: '小时数需大于0', icon: 'none' });
      return;
    }
    if (!validDays || validDays <= 0) {
      wx.showToast({ title: '充值后有效天数需大于0', icon: 'none' });
      return;
    }
    if (!this.data.editCardValidUntil) {
      wx.showToast({ title: '请选择卡片有效期', icon: 'none' });
      return;
    }

    const type = TYPE_OPTIONS[this.data.editTypeIndex].value;
    const res = await service.updateVoucher(id, {
      type,
      hours,
      validDays,
      cardValidUntil: this.data.editCardValidUntil,
      remark: this.data.editRemark,
      redeemLimitType: type === 'trial' ? 'once_lifetime' : 'unlimited'
    });
    if (res && res.success === false) {
      wx.showToast({ title: res.error || '保存失败', icon: 'none' });
      return;
    }
    wx.showToast({ title: '已保存', icon: 'success' });
    this.setData({ editingVoucherId: '' });
    this.loadVouchers();
  },

  async setPending(e) {
    await this.updateVoucherStatus(e.currentTarget.dataset.id, 'pending', '已转待处理');
  },

  async restoreActive(e) {
    await this.updateVoucherStatus(e.currentTarget.dataset.id, 'active', '已恢复');
  },

  async updateVoucherStatus(id, status, toastTitle) {
    const res = await service.updateVoucher(id, { status });
    if (res && res.success === false) {
      wx.showToast({ title: res.error || '更新失败', icon: 'none' });
      return;
    }
    wx.showToast({ title: toastTitle, icon: 'success' });
    this.loadVouchers();
  },

  deleteVoucher(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '删除卡片',
      content: '删除后列表不再显示，但后台数据会保留用于追溯。',
      success: async (res) => {
        if (!res.confirm) return;
        const result = await service.deleteVoucher(id);
        if (result && result.success === false) {
          wx.showToast({ title: result.error || '删除失败', icon: 'none' });
          return;
        }
        wx.showToast({ title: '已删除', icon: 'success' });
        this.loadVouchers();
      }
    });
  },

  copyVoucher(e) {
    const { code } = e.currentTarget.dataset;
    const text = `兑换码：${code}\n兑换路径：/pages/mine/redeem?code=${code}`;
    wx.setClipboardData({
      data: text,
      success: () => {
        wx.showToast({ title: '已复制', icon: 'success' });
      }
    });
  },

  printVoucher(e) {
    const id = e.currentTarget.dataset.id;
    const voucher = this.data.vouchers.find(item => item._id === id);
    if (!voucher) {
      wx.showToast({ title: '未找到卡片', icon: 'none' });
      return;
    }

    const receipt = buildReceipt(voucher);
    wx.setClipboardData({
      data: receipt,
      success: () => {
        wx.showModal({
          title: '小票内容已复制',
          content: '打印功能后面统一接入，现在先保留小票文本用于核对卡片内容。',
          showCancel: false
        });
      }
    });
  }
});
