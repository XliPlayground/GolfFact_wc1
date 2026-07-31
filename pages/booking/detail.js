const service = require('../../utils/service');

function formatDateTime(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  const pad = n => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function getConfirmUntil(appointment, confirmHours) {
  if (!appointment.date || !appointment.endTime) return '-';
  const end = new Date(`${appointment.date}T${appointment.endTime}:00`);
  if (Number.isNaN(end.getTime())) return '-';
  return formatDateTime(new Date(end.getTime() + confirmHours * 60 * 60 * 1000));
}

Page({
  data: {
    appointment: null,
    statusText: '',
    typeText: '',
    bayName: '',
    coachName: '',
    requirementsText: '',
    ashtrayText: '',
    confirmUntilText: '',
    createdAtText: '',
    settledAtText: '',
    hasAccessCode: false,
    showCancel: false
  },

  onLoad(options) {
    this.loadDetail(options.id);
  },

  async loadDetail(id) {
    if (!id) {
      wx.showToast({ title: '缺少预约ID', icon: 'none' });
      return;
    }

    const [user, bays, coaches, settings] = await Promise.all([
      service.getCurrentUser(),
      service.getBays(),
      service.getCoaches(),
      service.getSettings()
    ]);
    const appointments = await service.getAppointments(user._id);
    const appointment = (appointments || []).find(item => item._id === id);
    if (!appointment) {
      wx.showToast({ title: '预约不存在', icon: 'none' });
      return;
    }

    const bay = (bays || []).find(item => item._id === appointment.bayId);
    const coach = (coaches || []).find(item => item._id === appointment.coachId);
    const statusMap = {
      booked: '待使用',
      completed: '已完成',
      cancelled: '已取消',
      no_show: '爽约'
    };
    const settlementMap = {
      pending: '待确认',
      manual: '老板已确认完成',
      auto_no_dispute: '超时无异议完成',
      no_show: '爽约结算',
      cancelled: '已取消'
    };
    const requirementMap = {
      prepareBalls: '准备球',
      prepareClubs: '准备杆',
      prepareWater: '准备水',
      prepareSnacks: '准备茶点'
    };
    const requirements = appointment.requirements || {};
    const requirementList = requirements.list || [];
    const confirmHours = settings.noShowRule?.settlementConfirmHours || 48;

    this.setData({
      appointment: {
        ...appointment,
        settlementText: settlementMap[appointment.settlementMode] || '待确认',
        visitorCountText: `${requirements.visitorCount || 1}人`,
        deductedHoursText: `${appointment.deductedHours || appointment.duration || 0}小时`,
        extraPenaltyText: `${appointment.extraPenaltyHours || 0}小时`
      },
      statusText: statusMap[appointment.status] || appointment.status,
      typeText: appointment.type === 'teaching' ? '教练课' : '自助练习',
      bayName: bay ? bay.name : '-',
      coachName: coach ? coach.name : '-',
      requirementsText: requirementList.length ? requirementList.map(item => requirementMap[item] || item).join('、') : '无',
      ashtrayText: requirements.ashtray === 'prepare' ? '准备烟灰缸' : '不需要',
      confirmUntilText: getConfirmUntil(appointment, confirmHours),
      createdAtText: formatDateTime(appointment.createdAt),
      settledAtText: formatDateTime(appointment.settledAt),
      hasAccessCode: Boolean(appointment.accessCode),
      showCancel: appointment.status === 'booked'
    });
  },

  cancelAppointment() {
    const appointment = this.data.appointment;
    if (!appointment) return;

    wx.showModal({
      title: '取消预约',
      content: '确定要取消吗？开场前 2 小时内取消可能按规则处理。',
      success: async (res) => {
        if (!res.confirm) return;
        const result = await service.updateAppointmentStatus(appointment._id, 'cancelled');
        if (result && result.success === false) {
          wx.showToast({ title: result.error || '取消失败', icon: 'none' });
          return;
        }
        wx.showToast({ title: '已取消', icon: 'success' });
        this.loadDetail(appointment._id);
      }
    });
  }
});
