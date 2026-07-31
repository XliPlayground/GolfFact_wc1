// pages/booking/index.js
const service = require('../../utils/service');
const mock = require('../../utils/mock');

Page({
  data: {
    dates: [],
    bays: [],
    coaches: [],
    slots: [],
    selectedDate: '',
    selectedBayId: '',
    bookingType: 'self',
    selectedCoachId: '',
    selectedSlots: [],
    requirements: [
      { label: '准备球', value: 'prepareBalls', checked: false },
      { label: '准备杆', value: 'prepareClubs', checked: false },
      { label: '准备水', value: 'prepareWater', checked: false },
      { label: '准备茶点', value: 'prepareSnacks', checked: false }
    ],
    visitorCount: 1,
    visitorOptions: [],
    smoking: 'none',
    ashtrayNoneChecked: true,
    ashtrayChecked: false,
    minSlots: 2,
    totalPrice: 0,
    deductedHours: 0,
    rangeStartIndex: null,
    rangeEndIndex: null,
    rangeHint: '先选择开始时间，再选择结束时间',
    selectedRangeText: '',
    hasSelectedSlots: false,
    showEmptySummary: true,
    showCoachSelector: false,
    showNoLinkedCoaches: false,
    showSelectedRangeText: false,
    showRangeReset: false,
    selectedDurationText: '',
    showSlotsEmpty: false,
    slotsEmptyText: '',
    submitButtonClass: 'btn-primary disabled',
    selfTypeClass: 'type-item active',
    teachingTypeClass: 'type-item'
  },

  async onLoad() {
    const settings = await service.getSettings();
    const user = await service.getCurrentUser();
    const dates = mock.getDates(7).map(date => {
      const d = new Date(date);
      const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      return {
        date,
        week: weekDays[d.getDay()],
        day: `${d.getMonth() + 1}/${d.getDate()}`
      };
    });

    let bays = (await service.getBays()).filter(item => item.status === 'active');
    if (bays.length === 0) {
      bays = mock.getBays().filter(item => item.status === 'active');
    }
    const coaches = await service.getLinkedCoaches(user._id);

    this.setData({
      dates,
      selectedDate: dates[0].date,
      bays,
      coaches,
      selectedCoachId: coaches.length > 0 ? coaches[0]._id : '',
      minSlots: settings.bookingRules?.minSlots || 2
    });

    if (bays.length > 0) {
      this.setData({ selectedBayId: bays[0]._id });
    }

    this.refreshStaticClasses();
    this.refreshVisitorOptions();
    this.loadSlots();
  },

  async loadSlots() {
    const { selectedDate, selectedBayId, bookingType } = this.data;
    let slots = await service.getTimeSlots(selectedDate, selectedBayId);
    if (!Array.isArray(slots) || slots.length === 0) {
      slots = this.buildFallbackSlots(selectedDate, selectedBayId);
    }
    
    // 培训模式下只显示教学时段，自助模式下只显示自助时段
    slots = slots.filter(s => s.type === bookingType && s.isOpen !== false);
    
    // 恢复选择状态
    const selectedIds = this.data.selectedSlots.map(s => s._id);
    slots = slots.map(s => ({
      ...s,
      selected: selectedIds.includes(s._id)
    }));
    slots = this.decorateSlots(slots);

    this.setData({
      slots,
      showSlotsEmpty: slots.length === 0,
      slotsEmptyText: bookingType === 'teaching' ? '暂无教学时段，请切换自助练球或联系老板排课。' : '暂无可约时段，请联系老板生成当天时段。'
    });
    this.calculateSummary();
  },

  buildFallbackSlots(date, bayId) {
    if (!date || !bayId) return [];
    const rows = [];
    for (let h = 5; h < 24; h++) {
      for (let m = 0; m < 60; m += 30) {
        const startTime = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        const endMin = m + 30;
        const endH = endMin >= 60 ? h + 1 : h;
        const endM = endMin >= 60 ? 0 : endMin;
        const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
        const isTeaching = h >= 17 && h <= 19;
        rows.push({
          _id: `fallback_${bayId}_${date}_${startTime.replace(':', '')}`,
          bayId,
          date,
          startTime,
          endTime,
          slotMinutes: 30,
          type: isTeaching ? 'teaching' : 'self',
          isOpen: true,
          isBooked: false,
          source: 'fallback'
        });
      }
    }
    return rows;
  },

  selectDate(e) {
    this.setData({ 
      selectedDate: e.currentTarget.dataset.date,
      selectedSlots: [],
      rangeStartIndex: null,
      rangeEndIndex: null,
      rangeHint: '先选择开始时间，再选择结束时间',
      selectedRangeText: '',
      showSelectedRangeText: false,
      showRangeReset: false
    }, () => {
      this.refreshStaticClasses();
      this.loadSlots();
    });
  },

  selectBay(e) {
    this.setData({ 
      selectedBayId: e.currentTarget.dataset.id,
      selectedSlots: [],
      rangeStartIndex: null,
      rangeEndIndex: null,
      rangeHint: '先选择开始时间，再选择结束时间',
      selectedRangeText: '',
      showSelectedRangeText: false,
      showRangeReset: false
    }, () => {
      this.refreshStaticClasses();
      this.loadSlots();
    });
  },

  selectType(e) {
    const type = e.currentTarget.dataset.type;
    const selectedCoachId = type === 'teaching' && this.data.coaches.length > 0
      ? this.data.coaches[0]._id
      : '';
    this.setData({ 
      bookingType: type,
      selectedCoachId,
      selectedSlots: [],
      rangeStartIndex: null,
      rangeEndIndex: null,
      rangeHint: '先选择开始时间，再选择结束时间',
      selectedRangeText: '',
      showSelectedRangeText: false,
      showRangeReset: false
    }, () => {
      this.refreshStaticClasses();
      this.loadSlots();
    });
  },

  selectCoach(e) {
    this.setData({ selectedCoachId: e.currentTarget.dataset.id }, () => {
      this.refreshStaticClasses();
    });
  },

  selectSlot(e) {
    const index = parseInt(e.currentTarget.dataset.index, 10);
    const slot = this.data.slots[index];

    if (!slot) return;
    
    if (slot.isBooked) {
      wx.showToast({ title: '该时段已被预约', icon: 'none' });
      return;
    }
    if (!slot.isOpen) {
      wx.showToast({ title: '该时段暂不可约', icon: 'none' });
      return;
    }

    const slots = [...this.data.slots];
    const { rangeStartIndex, rangeEndIndex } = this.data;
    let nextStart = rangeStartIndex;
    let nextEnd = rangeEndIndex;
    let rangeHint = '';

    if (rangeStartIndex === null || rangeEndIndex !== null) {
      nextStart = index;
      nextEnd = null;
      rangeHint = `开始：${slot.startTime}，请选择结束时间`;
    } else {
      const start = Math.min(rangeStartIndex, index);
      const end = Math.max(rangeStartIndex, index);
      if (!this.isAvailableRange(start, end, slots)) {
        wx.showToast({ title: '区间内有已约时段', icon: 'none' });
        return;
      }
      nextStart = start;
      nextEnd = end;
      rangeHint = `${slots[start].startTime} - ${slots[end].endTime}`;
    }

    const selectedSlots = this.applyRangeSelection(slots, nextStart, nextEnd);
    const decoratedSlots = this.decorateSlots(slots);

    this.setData({
      slots: decoratedSlots,
      selectedSlots,
      rangeStartIndex: nextStart,
      rangeEndIndex: nextEnd,
      rangeHint,
      selectedRangeText: this.formatSelectedRangeText(selectedSlots, nextEnd),
      showSelectedRangeText: selectedSlots.length > 0,
      showRangeReset: selectedSlots.length > 0
    });
    this.calculateSummary();
  },

  isAvailableRange(start, end, slots) {
    for (let i = start; i <= end; i++) {
      const item = slots[i];
      if (!item || item.isBooked || !item.isOpen) return false;
    }
    return true;
  },

  applyRangeSelection(slots, start, end) {
    const selectedSlots = [];
    slots.forEach((item, index) => {
      const isSelected = end === null ? index === start : index >= start && index <= end;
      item.selected = isSelected;
      if (isSelected) selectedSlots.push(item);
    });
    return selectedSlots;
  },

  clearSlotSelection() {
    const slots = this.data.slots.map(item => ({
      ...item,
      selected: false
    }));
    this.setData({
      slots: this.decorateSlots(slots),
      selectedSlots: [],
      rangeStartIndex: null,
      rangeEndIndex: null,
      rangeHint: '先选择开始时间，再选择结束时间',
      selectedRangeText: '',
      showSelectedRangeText: false,
      showRangeReset: false
    });
    this.calculateSummary();
  },

  formatSelectedRangeText(selectedSlots, rangeEndIndex) {
    if (selectedSlots.length === 0) return '';
    if (rangeEndIndex === null) {
      return `已选开始：${selectedSlots[0].startTime}`;
    }
    return `${selectedSlots[0].startTime} - ${selectedSlots[selectedSlots.length - 1].endTime}`;
  },

  onRequirementsChange(e) {
    const values = e.detail.value;
    const requirements = this.data.requirements.map(item => ({
      ...item,
      checked: values.includes(item.value)
    }));
    this.setData({ requirements });
  },

  selectVisitorCount(e) {
    this.setData({ visitorCount: parseInt(e.currentTarget.dataset.count, 10) }, () => {
      this.refreshVisitorOptions();
    });
  },

  onSmokingChange(e) {
    const smoking = e.detail.value;
    this.setData({
      smoking,
      ashtrayNoneChecked: smoking === 'none',
      ashtrayChecked: smoking === 'ashtray'
    });
  },

  calculateSummary() {
    const { selectedSlots } = this.data;
    const duration = selectedSlots.length * 0.5;
    const totalPrice = 0;
    
    let deductedHours = duration;
    
    this.setData({
      totalPrice,
      deductedHours,
      hasSelectedSlots: selectedSlots.length > 0,
      showEmptySummary: selectedSlots.length === 0,
      selectedDurationText: selectedSlots.length > 0 ? `${duration} 小时` : '',
      submitButtonClass: selectedSlots.length < this.data.minSlots ? 'btn-primary disabled' : 'btn-primary'
    });
  },

  refreshStaticClasses() {
    const dates = this.data.dates.map(item => ({
      ...item,
      className: item.date === this.data.selectedDate ? 'date-item active' : 'date-item'
    }));
    const bays = this.data.bays.map(item => ({
      ...item,
      className: item._id === this.data.selectedBayId ? 'bay-item active' : 'bay-item'
    }));
    const coaches = this.data.coaches.map(item => ({
      ...item,
      className: item._id === this.data.selectedCoachId ? 'coach-item active' : 'coach-item'
    }));

    this.setData({
      dates,
      bays,
      coaches,
      selfTypeClass: this.data.bookingType === 'self' ? 'type-item active' : 'type-item',
      teachingTypeClass: this.data.bookingType === 'teaching' ? 'type-item active' : 'type-item',
      showCoachSelector: this.data.bookingType === 'teaching',
      showNoLinkedCoaches: this.data.bookingType === 'teaching' && coaches.length === 0
    });
  },

  decorateSlots(slots) {
    return slots.map(item => {
      const classes = ['slot-item'];
      if (item.selected) classes.push('selected');
      if (item.isBooked || !item.isOpen) classes.push('disabled');
      return {
        ...item,
        className: classes.join(' ')
      };
    });
  },

  refreshVisitorOptions() {
    const visitorOptions = [1, 2, 3, 4].map(count => ({
      count,
      className: count === this.data.visitorCount ? 'visitor-option active' : 'visitor-option'
    }));
    this.setData({ visitorOptions });
  },

  goToConfirm() {
    const { selectedSlots, minSlots, bookingType, selectedCoachId } = this.data;
    if (selectedSlots.length < minSlots) {
      wx.showToast({ title: `请选择开始和结束，至少 ${minSlots} 段`, icon: 'none' });
      return;
    }
    if (!this.isContinuousSelection(selectedSlots)) {
      wx.showToast({ title: '请选择连续时段', icon: 'none' });
      return;
    }
    if (bookingType === 'teaching' && !selectedCoachId) {
      wx.showToast({ title: '请选择已关联教练', icon: 'none' });
      return;
    }

    const bookingData = {
      date: this.data.selectedDate,
      bayId: this.data.selectedBayId,
      type: this.data.bookingType,
      coachId: this.data.selectedCoachId,
      slots: this.data.selectedSlots,
      requirements: this.data.requirements.filter(r => r.checked).map(r => r.value),
      visitorCount: this.data.visitorCount,
      ashtray: this.data.smoking === 'ashtray',
      totalPrice: this.data.totalPrice,
      deductedHours: this.data.deductedHours
    };

    wx.setStorageSync('booking_temp_data', bookingData);
    wx.navigateTo({ url: '/pages/booking/confirm' });
  },

  isContinuousSelection(selectedSlots) {
    const sorted = [...selectedSlots].sort((a, b) => a.startTime.localeCompare(b.startTime));
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i - 1].endTime !== sorted[i].startTime) return false;
    }
    return true;
  }
});
