const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const _ = db.command;
const TENANT_ID = 'golfact_default';

async function getNoShowMultiplier() {
  const res = await db.collection('settings')
    .where({ tenantId: TENANT_ID, key: 'noShowRule' })
    .limit(1)
    .get();
  const value = res.data[0] && res.data[0].value;
  return Number(value && value.noShowMultiplier) || 1.5;
}

async function getSettlementConfirmHours() {
  const res = await db.collection('settings')
    .where({ tenantId: TENANT_ID, key: 'noShowRule' })
    .limit(1)
    .get();
  const value = res.data[0] && res.data[0].value;
  return Number(value && value.settlementConfirmHours) || 48;
}

async function updateSlots(slotIds, isBooked) {
  for (const slotId of slotIds || []) {
    await db.collection('bay_time_slots').doc(slotId).update({
      data: {
        isBooked,
        updateTime: db.serverDate()
      }
    });
  }
}

async function getValidRechargeRecords(userId) {
  const today = new Date();
  const todayText = today.toISOString().slice(0, 10);
  const res = await db.collection('recharge_records')
    .where({ tenantId: TENANT_ID, userId, status: 'valid' })
    .limit(100)
    .get();
  return (res.data || [])
    .filter(item => Number(item.remainingHours || 0) > 0)
    .filter(item => !item.expiryDate || item.expiryDate >= todayText)
    .sort((a, b) => String(a.expiryDate || '9999-12-31').localeCompare(String(b.expiryDate || '9999-12-31')));
}

async function deductRechargeRecords(userId, hours, reason) {
  let remaining = Number(hours || 0);
  const details = [];
  if (remaining <= 0) return details;

  const records = await getValidRechargeRecords(userId);
  const available = records.reduce((sum, item) => sum + Number(item.remainingHours || 0), 0);
  if (available + 0.0001 < remaining) {
    throw new Error('可用充值记录余额不足，请刷新后重试');
  }

  for (const record of records) {
    if (remaining <= 0) break;
    const recordRemaining = Number(record.remainingHours || 0);
    const used = Number(Math.min(recordRemaining, remaining).toFixed(2));
    const nextRemaining = Number((recordRemaining - used).toFixed(2));
    const nextUsed = Number((Number(record.usedHours || 0) + used).toFixed(2));
    await db.collection('recharge_records').doc(record._id).update({
      data: {
        remainingHours: nextRemaining,
        usedHours: nextUsed,
        status: nextRemaining <= 0 ? 'used_up' : 'valid',
        lastDeductReason: reason || 'appointment',
        updateTime: db.serverDate()
      }
    });
    details.push({
      rechargeRecordId: record._id,
      hours: used,
      beforeRemainingHours: recordRemaining,
      afterRemainingHours: nextRemaining,
      expiryDate: record.expiryDate || ''
    });
    remaining = Number((remaining - used).toFixed(2));
  }

  return details;
}

async function refundRechargeRecords(details) {
  for (const detail of details || []) {
    if (!detail.rechargeRecordId || Number(detail.hours || 0) <= 0) continue;
    const res = await db.collection('recharge_records').doc(detail.rechargeRecordId).get();
    const record = res.data;
    if (!record) continue;
    const hours = Number(detail.hours || 0);
    const nextRemaining = Number((Number(record.remainingHours || 0) + hours).toFixed(2));
    const nextUsed = Number(Math.max(Number(record.usedHours || 0) - hours, 0).toFixed(2));
    await db.collection('recharge_records').doc(detail.rechargeRecordId).update({
      data: {
        remainingHours: nextRemaining,
        usedHours: nextUsed,
        status: 'valid',
        updateTime: db.serverDate()
      }
    });
  }
}

async function createAppointment(event) {
  const data = event.data || {};
  if (!data.userId) return { success: false, error: '缺少会员 ID' };
  if (!data.bayId) return { success: false, error: '缺少打位' };
  if (!Array.isArray(data.timeSlotIds) || data.timeSlotIds.length === 0) {
    return { success: false, error: '缺少预约时段' };
  }

  const slotRows = [];
  for (const slotId of data.timeSlotIds) {
    const slotRes = await db.collection('bay_time_slots').doc(slotId).get();
    const slot = slotRes.data;
    if (!slot || !slot.isOpen || slot.isBooked) return { success: false, error: '部分时段不可预约，请重新选择' };
    slotRows.push({ ...slot, _id: slotId });
  }

  slotRows.sort((a, b) => String(a.startTime || '').localeCompare(String(b.startTime || '')));
  if (slotRows.length < 2) return { success: false, error: '至少选择连续两个时段' };
  const first = slotRows[0];
  const sameContext = slotRows.every(slot => slot.date === first.date && slot.bayId === first.bayId && slot.type === first.type);
  if (!sameContext) return { success: false, error: '请选择同一天、同打位、同类型的连续时段' };
  for (let i = 1; i < slotRows.length; i++) {
    if (slotRows[i - 1].endTime !== slotRows[i].startTime) {
      return { success: false, error: '预约时段必须连续，不能间隔选择' };
    }
  }

  const deductedHours = Number(data.deductedHours || data.duration || 0);
  const duration = Number(data.duration || deductedHours || 0);
  const deductionDetails = deductedHours > 0
    ? await deductRechargeRecords(data.userId, deductedHours, 'appointment_create')
    : [];
  const appointment = {
    ...data,
    tenantId: TENANT_ID,
    originalDeductedHours: deductedHours,
    deductionDetails,
    coachHours: data.coachId ? duration : 0,
    coachRate: data.coachId ? Number(data.coachRate || 0) : 0,
    status: 'booked',
    settlementMode: 'pending',
    createdAt: new Date().toISOString(),
    createTime: db.serverDate(),
    updateTime: db.serverDate()
  };
  const appointmentRes = await db.collection('appointments').add({ data: appointment });

  await updateSlots(data.timeSlotIds, true);
  if (deductedHours > 0) {
    await db.collection('users').doc(data.userId).update({
      data: {
        remainingHours: _.inc(-Math.abs(deductedHours)),
        totalTrainedHours: _.inc(duration),
        updateTime: db.serverDate()
      }
    });
  }

  return { success: true, data: { ...appointment, _id: appointmentRes._id } };
}

async function updateAppointmentStatus(event) {
  const { id, status } = event;
  if (!id) return { success: false, error: '缺少预约 ID' };
  if (!status) return { success: false, error: '缺少状态' };

  const res = await db.collection('appointments').doc(id).get();
  const appointment = res.data;
  if (!appointment) return { success: false, error: '预约不存在' };

  const now = new Date().toISOString();
  const patch = {
    status,
    settledAt: now,
    updateTime: db.serverDate()
  };

  if (status === 'cancelled') {
    patch.cancelledAt = now;
    patch.settlementMode = 'cancelled';
    if (appointment.status === 'booked' && !appointment.refundedAt) {
      const refundHours = Number(appointment.deductedHours || appointment.duration || 0);
      if (refundHours > 0) {
        await refundRechargeRecords(appointment.deductionDetails || []);
        await db.collection('users').doc(appointment.userId).update({
          data: {
            remainingHours: _.inc(refundHours),
            totalTrainedHours: _.inc(-Math.abs(Number(appointment.duration || refundHours))),
            updateTime: db.serverDate()
          }
        });
      }
      await updateSlots(appointment.timeSlotIds, false);
      patch.refundedAt = now;
    }
  }

  if (status === 'completed') {
    patch.settlementMode = appointment.settlementMode === 'pending' ? 'manual' : (appointment.settlementMode || 'manual');
  }

  if (status === 'no_show') {
    const multiplier = await getNoShowMultiplier();
    const baseHours = Number(appointment.originalDeductedHours || appointment.duration || appointment.deductedHours || 0);
    const targetDeductedHours = Number((baseHours * multiplier).toFixed(2));
    const extraPenaltyHours = Number(Math.max(targetDeductedHours - Number(appointment.deductedHours || 0), 0).toFixed(2));
    const penaltyDeductionDetails = extraPenaltyHours > 0
      ? await deductRechargeRecords(appointment.userId, extraPenaltyHours, 'appointment_no_show')
      : [];
    patch.isNoShow = true;
    patch.originalDeductedHours = baseHours;
    patch.deductedHours = targetDeductedHours;
    patch.extraPenaltyHours = extraPenaltyHours;
    patch.penaltyDeductionDetails = penaltyDeductionDetails;
    patch.noShowMultiplier = multiplier;
    patch.settlementMode = 'no_show';

    await db.collection('users').doc(appointment.userId).update({
      data: {
        remainingHours: extraPenaltyHours > 0 ? _.inc(-extraPenaltyHours) : _.inc(0),
        currentNoShowCount: _.inc(1),
        updateTime: db.serverDate()
      }
    });
  }

  await db.collection('appointments').doc(id).update({ data: patch });
  return { success: true, data: { ...appointment, ...patch } };
}

async function settleExpiredAppointments() {
  const confirmHours = await getSettlementConfirmHours();
  const res = await db.collection('appointments')
    .where({ tenantId: TENANT_ID, status: 'booked' })
    .limit(100)
    .get();
  const now = new Date();
  let count = 0;

  for (const appointment of res.data || []) {
    if (!appointment.date || !appointment.endTime) continue;
    const end = new Date(`${appointment.date}T${appointment.endTime}:00`);
    if (Number.isNaN(end.getTime())) continue;
    const confirmUntil = new Date(end.getTime() + confirmHours * 60 * 60 * 1000);
    if (now <= confirmUntil) continue;

    await db.collection('appointments').doc(appointment._id).update({
      data: {
        status: 'completed',
        settlementMode: 'auto_no_dispute',
        settledAt: now.toISOString(),
        updateTime: db.serverDate()
      }
    });
    count += 1;
  }

  return { success: true, data: { count } };
}

exports.main = async (event) => {
  try {
    if (!event || !event.action) return settleExpiredAppointments(event || {});
    if (event.action === 'create') return createAppointment(event);
    if (event.action === 'updateStatus') return updateAppointmentStatus(event);
    if (event.action === 'settleExpired') return settleExpiredAppointments(event);
    return { success: false, error: '未知操作' };
  } catch (err) {
    console.error('appointmentAction error:', err);
    return { success: false, error: err.message || '预约操作失败' };
  }
};
