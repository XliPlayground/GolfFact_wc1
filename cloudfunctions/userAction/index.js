const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const _ = db.command;
const TENANT_ID = 'golfact_default';

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function adjustHours(event) {
  const userId = event.userId;
  const delta = Number(event.hoursDelta || 0);
  if (!userId) return { success: false, error: '缺少会员 ID' };
  if (!delta) return { success: false, error: '调整小时数不能为0' };

  const userRes = await db.collection('users').doc(userId).get();
  const user = userRes.data;
  if (!user) return { success: false, error: '用户不存在' };

  const currentHours = Number(user.remainingHours || 0);
  const nextHours = Number(Math.max(currentHours + delta, 0).toFixed(2));
  const positiveDelta = delta > 0 ? delta : 0;
  const now = new Date().toISOString();

  await db.collection('users').doc(userId).update({
    data: {
      remainingHours: nextHours,
      totalRechargedHours: positiveDelta ? _.inc(positiveDelta) : _.inc(0),
      updateTime: db.serverDate()
    }
  });

  const record = {
    tenantId: TENANT_ID,
    userId,
    hours: delta,
    remainingHours: positiveDelta,
    expiryDate: formatDate(new Date()),
    status: 'adjustment',
    source: 'manual_adjust',
    adminId: event.adminId || 'admin',
    remark: event.reason || '手动调整',
    createdAt: now,
    createTime: db.serverDate(),
    updateTime: db.serverDate()
  };
  const recordRes = await db.collection('recharge_records').add({ data: record });

  return {
    success: true,
    data: {
      user: {
        ...user,
        remainingHours: nextHours,
        totalRechargedHours: Number(user.totalRechargedHours || 0) + positiveDelta
      },
      record: { ...record, _id: recordRes._id }
    }
  };
}

async function createRecharge(event) {
  const userId = event.userId;
  const hours = Number(event.hours || 0);
  if (!userId) return { success: false, error: '缺少会员 ID' };
  if (!hours || hours <= 0) return { success: false, error: '充值小时数必须大于0' };
  if (!event.expiryDate) return { success: false, error: '缺少到期日' };

  const userRes = await db.collection('users').doc(userId).get();
  const user = userRes.data;
  if (!user) return { success: false, error: '用户不存在' };

  const now = new Date().toISOString();
  const record = {
    tenantId: TENANT_ID,
    userId,
    hours,
    usedHours: 0,
    remainingHours: hours,
    expiryDate: event.expiryDate,
    amount: 0,
    paymentMethod: 'offline',
    receivedBy: event.adminId || 'admin',
    adminId: event.adminId || 'admin',
    source: 'admin_recharge',
    status: 'valid',
    remark: event.remark || '',
    createdAt: now,
    createTime: db.serverDate(),
    updateTime: db.serverDate()
  };
  const recordRes = await db.collection('recharge_records').add({ data: record });

  await db.collection('users').doc(userId).update({
    data: {
      remainingHours: _.inc(hours),
      totalRechargedHours: _.inc(hours),
      updateTime: db.serverDate()
    }
  });

  return {
    success: true,
    data: {
      user: {
        ...user,
        remainingHours: Number(user.remainingHours || 0) + hours,
        totalRechargedHours: Number(user.totalRechargedHours || 0) + hours
      },
      record: { ...record, _id: recordRes._id }
    }
  };
}

exports.main = async (event) => {
  try {
    if (event.action === 'createRecharge') return createRecharge(event);
    if (event.action === 'adjustHours') return adjustHours(event);
    return { success: false, error: '未知操作' };
  } catch (err) {
    console.error('userAction error:', err);
    return { success: false, error: err.message || '会员操作失败' };
  }
};
