// pages/booking/confirm.js
const service = require('../../utils/service');

Page({
  data: {
    booking: {},
    user: {},
    coaches: [],
    bayName: '',
    coachName: '',
    timeRange: '',
    requirementsText: ''
  },

  async onLoad() {
    const booking = wx.getStorageSync('booking_temp_data') || {};
    const user = await service.getCurrentUser();
    const bays = await service.getBays();
    const coaches = await service.getCoaches();
    const settings = await service.getSettings();
    
    const bay = bays.find(b => b._id === booking.bayId);
    const coach = coaches.find(c => c._id === booking.coachId);
    
    const requirementMap = {
      prepareBalls: '准备球',
      prepareClubs: '准备杆',
      prepareWater: '准备水',
      prepareSnacks: '准备茶点'
    };

    const slots = booking.slots || [];
    const timeRange = slots.length > 0 
      ? `${slots[0].startTime} - ${slots[slots.length - 1].endTime}`
      : '';

    this.setData({
      booking,
      user,
      coaches,
      bayName: bay?.name || '',
      coachName: coach?.name || '',
      timeRange,
      requirementsText: (booking.requirements || []).map(r => requirementMap[r]).join('、'),
      accessCode: settings.accessCode?.code || ''
    });
  },

  goBack() {
    wx.navigateBack();
  },

  async submitBooking() {
    const { booking, user, coaches } = this.data;
    const bookingSlots = booking.slots || [];

    if (bookingSlots.length === 0) {
      wx.showToast({ title: '请选择预约时段', icon: 'none' });
      return;
    }
    
    if (user.remainingHours < booking.deductedHours) {
      wx.showToast({ title: '剩余时长不足', icon: 'none' });
      return;
    }

    const slotIds = bookingSlots.map(s => s._id);
    
    // 计算教练课时单价
    let coachRate = 0;
    if (booking.coachId) {
      const coach = coaches.find(c => c._id === booking.coachId);
      coachRate = coach?.hourlyRate || 0;
    }
    
    const appointmentData = {
      userId: user._id,
      bayId: booking.bayId,
      timeSlotIds: slotIds,
      type: booking.type,
      coachId: booking.coachId,
      coachRate,
      date: booking.date,
      startTime: bookingSlots[0].startTime,
      endTime: bookingSlots[bookingSlots.length - 1].endTime,
      duration: booking.deductedHours,
      slots: bookingSlots.length,
      requirements: {
        list: booking.requirements,
        visitorCount: booking.visitorCount,
        ashtray: booking.ashtray
      },
      basePrice: booking.totalPrice,
      discount: 1,
      finalPrice: booking.totalPrice,
      deductedHours: booking.deductedHours,
      accessCode: booking.type === 'self' ? this.data.accessCode : null
    };

    await service.createAppointment(appointmentData);
    
    wx.showToast({
      title: '预约成功',
      icon: 'success',
      success: () => {
        setTimeout(() => {
          wx.switchTab({ url: '/pages/mine/index' });
        }, 1500);
      }
    });
  }
});
