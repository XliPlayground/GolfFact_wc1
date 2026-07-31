const service = require('../../utils/service');

function getToday() {
  return new Date().toISOString().split('T')[0];
}

function emptyBayForm() {
  return { _id: '', code: '', name: '', displayOrder: '1', status: 'active' };
}

function decorateSlot(slot) {
  const typeText = slot.type === 'teaching' ? '教学' : '自助';
  const openText = slot.isOpen ? '开放' : '关闭';
  const bookedText = slot.isBooked ? '已约' : '空闲';
  return {
    ...slot,
    typeText,
    openText,
    bookedText,
    slotClass: `slot-card ${slot.isOpen ? 'open' : 'closed'} ${slot.isBooked ? 'booked' : ''}`
  };
}

Page({
  data: {
    bays: [],
    slots: [],
    selectedDate: getToday(),
    bayIndex: 0,
    selectedBayName: '请选择打位',
    bayForm: emptyBayForm(),
    slotTypeOptions: ['自助', '教学'],
    editingBay: false,
    showSlotEmpty: true
  },

  onLoad() {
    this.loadData();
  },

  onShow() {
    this.loadData();
  },

  async loadData() {
    const rawBays = await service.getBays();
    const bays = (rawBays || [])
      .filter(item => item.status !== 'deleted')
      .sort((a, b) => Number(a.displayOrder || 0) - Number(b.displayOrder || 0))
      .map(item => ({
        ...item,
        statusText: item.status === 'active' ? '启用' : '停用'
      }));
    const bayIndex = Math.min(this.data.bayIndex, Math.max(bays.length - 1, 0));
    const selectedBay = bays[bayIndex];
    this.setData({
      bays,
      bayIndex,
      selectedBayName: selectedBay ? selectedBay.name : '请选择打位'
    }, () => {
      this.loadSlots();
    });
  },

  async loadSlots() {
    const bay = this.data.bays[this.data.bayIndex];
    if (!bay) {
      this.setData({ slots: [], showSlotEmpty: true });
      return;
    }
    const slots = await service.getTimeSlots(this.data.selectedDate, bay._id);
    const decorated = (slots || [])
      .sort((a, b) => String(a.startTime || '').localeCompare(String(b.startTime || '')))
      .map(decorateSlot);
    this.setData({
      slots: decorated,
      showSlotEmpty: decorated.length === 0
    });
  },

  onDateChange(e) {
    this.setData({ selectedDate: e.detail.value }, () => {
      this.loadSlots();
    });
  },

  onBayChange(e) {
    const bayIndex = parseInt(e.detail.value, 10);
    const bay = this.data.bays[bayIndex];
    this.setData({
      bayIndex,
      selectedBayName: bay ? bay.name : '请选择打位'
    }, () => {
      this.loadSlots();
    });
  },

  newBay() {
    this.setData({ bayForm: emptyBayForm(), editingBay: true });
  },

  editBay(e) {
    const bay = this.data.bays.find(item => item._id === e.currentTarget.dataset.id);
    if (!bay) return;
    this.setData({
      bayForm: {
        _id: bay._id,
        code: bay.code || '',
        name: bay.name || '',
        displayOrder: String(bay.displayOrder || 1),
        status: bay.status || 'active'
      },
      editingBay: true
    });
  },

  onBayInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({
      bayForm: {
        ...this.data.bayForm,
        [field]: e.detail.value
      }
    });
  },

  toggleBayStatus() {
    const nextStatus = this.data.bayForm.status === 'active' ? 'inactive' : 'active';
    this.setData({
      bayForm: {
        ...this.data.bayForm,
        status: nextStatus
      }
    });
  },

  async saveBay() {
    const form = this.data.bayForm;
    if (!form.name || !form.code) {
      wx.showToast({ title: '请填写编号和名称', icon: 'none' });
      return;
    }
    await service.saveBay({
      ...form,
      displayOrder: Number(form.displayOrder || 0)
    });
    wx.showToast({ title: '已保存', icon: 'success' });
    this.setData({ editingBay: false, bayForm: emptyBayForm() });
    this.loadData();
  },

  async deleteBay(e) {
    await service.deleteBay(e.currentTarget.dataset.id);
    wx.showToast({ title: '已删除', icon: 'success' });
    this.loadData();
  },

  async toggleSlotOpen(e) {
    const slot = this.data.slots.find(item => item._id === e.currentTarget.dataset.id);
    if (!slot) return;
    if (slot.isBooked) {
      wx.showToast({ title: '已预约时段不能直接关闭', icon: 'none' });
      return;
    }
    await service.saveTimeSlot({
      ...slot,
      isOpen: !slot.isOpen
    });
    this.loadSlots();
  },

  async switchSlotType(e) {
    const slot = this.data.slots.find(item => item._id === e.currentTarget.dataset.id);
    if (!slot) return;
    const nextType = slot.type === 'teaching' ? 'self' : 'teaching';
    await service.saveTimeSlot({
      ...slot,
      type: nextType
    });
    this.loadSlots();
  },

  async generateDaySlots() {
    const bay = this.data.bays[this.data.bayIndex];
    if (!bay) {
      wx.showToast({ title: '请选择打位', icon: 'none' });
      return;
    }
    if (this.data.slots.length > 0) {
      wx.showToast({ title: '当天已有时段', icon: 'none' });
      return;
    }
    for (let h = 5; h < 24; h++) {
      for (let m = 0; m < 60; m += 30) {
        const startTime = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        const endMin = m + 30;
        const endH = endMin >= 60 ? h + 1 : h;
        const endM = endMin >= 60 ? 0 : endMin;
        const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
        await service.saveTimeSlot({
          bayId: bay._id,
          date: this.data.selectedDate,
          startTime,
          endTime,
          slotMinutes: 30,
          type: h >= 17 && h <= 19 ? 'teaching' : 'self',
          basePrice: 0,
          discount: 1,
          finalPrice: 0,
          capacity: 1,
          isOpen: true,
          isBooked: false,
          coachId: ''
        });
      }
    }
    wx.showToast({ title: '已生成时段', icon: 'success' });
    this.loadSlots();
  }
});
