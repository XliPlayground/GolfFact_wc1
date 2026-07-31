const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const _ = db.command;
const TENANT_ID = 'golfact_default';
const VOUCHER_COLLECTION = 'recharge_vouchers';
const RECHARGE_COLLECTION = 'recharge_records';

async function ensureCollection(name) {
  try {
    await db.createCollection(name);
  } catch (err) {
    if (err && err.errCode !== -502005) {
      const message = String(err.message || err.errMsg || '');
      if (message.indexOf('already exists') < 0 && message.indexOf('collection already exists') < 0) {
        throw err;
      }
    }
  }
}

async function ensureVoucherCollections() {
  await ensureCollection(VOUCHER_COLLECTION);
  await ensureCollection(RECHARGE_COLLECTION);
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDateAfterDays(days) {
  const date = new Date();
  date.setDate(date.getDate() + Number(days || 0));
  return formatDate(date);
}

function normalizeCode(value) {
  return String(value || '').trim().toUpperCase();
}

function incrementCardNo(cardNo, offset) {
  const value = normalizeCode(cardNo);
  if (!offset) return value;
  const match = value.match(/^(.*?)(\d+)$/);
  if (!match) return `${value}-${offset + 1}`;
  return `${match[1]}${String(Number(match[2]) + offset).padStart(match[2].length, '0')}`;
}

function generateRedeemCode(seq) {
  const random = Math.random().toString(36).slice(2, 10).toUpperCase();
  const timestamp = Date.now().toString(36).toUpperCase();
  return `GF-${timestamp}-${String(seq).padStart(4, '0')}-${random}`;
}

function isVoucherExpired(voucher) {
  if (!voucher.cardValidUntil) return false;
  return new Date(`${voucher.cardValidUntil}T23:59:59`).getTime() < Date.now();
}

async function getVoucherByCode(code) {
  const normalizedCode = normalizeCode(code);
  if (!normalizedCode) return null;

  const byToken = await db.collection('recharge_vouchers')
    .where({ tenantId: TENANT_ID, token: normalizedCode })
    .limit(1)
    .get();
  if (byToken.data[0]) return byToken.data[0];

  const byCardNo = await db.collection('recharge_vouchers')
    .where({ tenantId: TENANT_ID, cardNo: normalizedCode })
    .limit(1)
    .get();
  return byCardNo.data[0] || null;
}

async function getUser(userId) {
  if (!userId) return null;
  try {
    const res = await db.collection('users').doc(userId).get();
    return res.data;
  } catch (err) {
    return null;
  }
}

async function generate(event) {
  await ensureVoucherCollections();
  const options = event.options || {};
  const count = Math.min(Math.max(Number(options.count || 1), 1), 50);
  const now = new Date().toISOString();
  const totalRes = await db.collection('recharge_vouchers').where({ tenantId: TENANT_ID }).count();
  const baseSeq = Number(totalRes.total || 0);
  const created = [];
  const cardValidUntil = options.cardValidUntil || getDateAfterDays(options.cardValidDays || 365);
  const cardNos = [];

  for (let i = 0; i < count; i++) {
    const seq = baseSeq + i + 1;
    const cardNo = options.cardNo ? incrementCardNo(options.cardNo, i) : `GF${String(seq).padStart(6, '0')}`;
    cardNos.push(cardNo);
  }

  for (const cardNo of cardNos) {
    const exists = await db.collection('recharge_vouchers')
      .where({ tenantId: TENANT_ID, cardNo })
      .limit(1)
      .get();
    if (exists.data[0]) return { success: false, error: `卡号 ${cardNo} 已存在` };
  }

  for (let i = 0; i < cardNos.length; i++) {
    const seq = baseSeq + i + 1;
    const cardNo = cardNos[i];
    const voucher = {
      tenantId: TENANT_ID,
      cardNo,
      token: options.token ? normalizeCode(options.token) : generateRedeemCode(seq),
      type: options.type || 'sale',
      hours: Number(options.hours || 0),
      validDays: Number(options.validDays || 180),
      cardValidUntil,
      fixedExpiryDate: options.fixedExpiryDate || '',
      faceValue: Number(options.faceValue || 0),
      redeemLimitType: options.redeemLimitType || 'unlimited',
      status: options.status || 'active',
      usedByUserId: '',
      usedAt: '',
      remark: options.remark || '',
      createdAt: now,
      updatedAt: now,
      createTime: db.serverDate(),
      updateTime: db.serverDate()
    };
    const res = await db.collection('recharge_vouchers').add({ data: voucher });
    created.push({ ...voucher, _id: res._id });
  }

  return { success: true, data: count === 1 ? created[0] : created };
}

async function update(event) {
  await ensureVoucherCollections();
  const { id, patch = {} } = event;
  if (!id) return { success: false, error: '缺少卡片 ID' };

  const current = await db.collection('recharge_vouchers').doc(id).get();
  const voucher = current.data;
  if (!voucher) return { success: false, error: '卡片不存在' };
  if (voucher.status === 'used' && patch.status && patch.status !== 'used') {
    return { success: false, error: '已使用卡不能改回其他状态' };
  }

  const next = {
    ...patch,
    updatedAt: new Date().toISOString(),
    updateTime: db.serverDate()
  };
  if (patch.hours !== undefined) next.hours = Number(patch.hours || 0);
  if (patch.validDays !== undefined) next.validDays = Number(patch.validDays || 0);

  await db.collection('recharge_vouchers').doc(id).update({ data: next });
  return { success: true, data: { ...voucher, ...next, updateTime: undefined } };
}

async function deleteVoucher(event) {
  return update({
    id: event.id,
    patch: {
      status: 'deleted',
      deletedAt: new Date().toISOString()
    }
  });
}

async function extend(event) {
  if (!event.cardValidUntil) return { success: false, error: '请选择新的卡片有效期' };
  return update({
    id: event.id,
    patch: { cardValidUntil: event.cardValidUntil }
  });
}

async function activate(event) {
  await ensureVoucherCollections();
  const options = event.options || {};
  const count = Math.min(Math.max(Number(options.count || 1), 1), 50);
  const startCardNo = normalizeCode(options.cardNo);
  if (!startCardNo) return { success: false, error: '缺少起始卡号' };

  const cardNos = [];
  for (let i = 0; i < count; i++) {
    cardNos.push(incrementCardNo(startCardNo, i));
  }

  const found = [];
  for (const cardNo of cardNos) {
    const res = await db.collection('recharge_vouchers')
      .where({ tenantId: TENANT_ID, cardNo })
      .limit(1)
      .get();
    const voucher = res.data[0];
    if (!voucher) return { success: false, error: `未找到卡片 ${cardNo}` };
    if (voucher.status === 'used') return { success: false, error: `${cardNo} 已兑换，不能激活` };
    if (voucher.status === 'active' && Number(voucher.hours || 0) > 0) {
      return { success: false, error: `${cardNo} 已激活` };
    }
    found.push(voucher);
  }

  const now = new Date().toISOString();
  const activated = [];
  for (const voucher of found) {
    const patch = {
      type: options.type || 'sale',
      hours: Number(options.hours || 0),
      validDays: Number(options.validDays || 180),
      cardValidUntil: options.cardValidUntil || voucher.cardValidUntil || getDateAfterDays(365),
      fixedExpiryDate: options.fixedExpiryDate || '',
      redeemLimitType: options.redeemLimitType || 'unlimited',
      status: 'active',
      activatedAt: now,
      updatedAt: now,
      updateTime: db.serverDate(),
      remark: options.remark || voucher.remark || ''
    };
    await db.collection('recharge_vouchers').doc(voucher._id).update({ data: patch });
    activated.push({ ...voucher, ...patch, updateTime: undefined });
  }

  return { success: true, data: activated };
}

async function redeem(event) {
  await ensureVoucherCollections();
  const voucher = await getVoucherByCode(event.code);
  if (!voucher) return { success: false, error: '兑换卡不存在' };
  if (voucher.status === 'used') return { success: false, error: '该卡已兑换' };
  if (voucher.status === 'redeeming') return { success: false, error: '该卡正在兑换，请稍后刷新' };
  if (voucher.status === 'pending') return { success: false, error: '该卡暂未开放兑换' };
  if (voucher.status !== 'active') return { success: false, error: '该卡未激活' };
  if (isVoucherExpired(voucher)) return { success: false, error: '该卡已过期，请联系老板延期' };

  const user = await getUser(event.userId);
  if (!user) return { success: false, error: '用户不存在' };

  if (voucher.redeemLimitType === 'once_lifetime') {
    const usedSameType = await db.collection('recharge_vouchers')
      .where({
        tenantId: TENANT_ID,
        type: voucher.type,
        usedByUserId: user._id,
        status: 'used'
      })
      .limit(1)
      .get();
    if (usedSameType.data[0]) return { success: false, error: '该权益每人仅限一次' };
  }

  const latest = await db.collection('recharge_vouchers').doc(voucher._id).get();
  if (latest.data.status !== 'active') return { success: false, error: '该卡已被处理，请刷新后重试' };
  const lockRes = await db.collection('recharge_vouchers')
    .where({ tenantId: TENANT_ID, _id: voucher._id, status: 'active' })
    .update({
      data: {
        status: 'redeeming',
        redeemingByUserId: user._id,
        redeemingAt: new Date().toISOString(),
        updateTime: db.serverDate()
      }
    });
  if (!lockRes.stats || lockRes.stats.updated !== 1) {
    return { success: false, error: '该卡正在兑换或已被处理，请刷新后重试' };
  }

  const now = new Date().toISOString();
  const expiryDate = voucher.fixedExpiryDate || getDateAfterDays(voucher.validDays || 180);
  const hours = Number(voucher.hours || 0);
  const recharge = {
    tenantId: TENANT_ID,
    userId: user._id,
    hours,
    remainingHours: hours,
    expiryDate,
    status: 'valid',
    source: 'voucher',
    voucherId: voucher._id,
    voucherCardNo: voucher.cardNo,
    adminId: 'voucher',
    remark: voucher.remark || '',
    createdAt: now,
    createTime: db.serverDate(),
    updateTime: db.serverDate()
  };
  const rechargeRes = await db.collection('recharge_records').add({ data: recharge });

  await db.collection('users').doc(user._id).update({
    data: {
      remainingHours: _.inc(hours),
      totalRechargedHours: _.inc(hours),
      updateTime: db.serverDate()
    }
  });

  const voucherPatch = {
    status: 'used',
    usedByUserId: user._id,
    usedAt: now,
    rechargeRecordId: rechargeRes._id,
    updatedAt: now,
    updateTime: db.serverDate()
  };
  await db.collection('recharge_vouchers').doc(voucher._id).update({ data: voucherPatch });

  return {
    success: true,
    data: {
      voucher: { ...voucher, ...voucherPatch, updateTime: undefined },
      recharge: { ...recharge, _id: rechargeRes._id, updateTime: undefined }
    }
  };
}

async function getQr(event) {
  await ensureVoucherCollections();
  const { id, cardNo, token } = event;
  if (!id && !cardNo && !token) return { success: false, error: '缺少卡片 ID 或卡号' };

  let voucher = null;
  if (id) {
    try {
      const current = await db.collection('recharge_vouchers').doc(id).get();
      voucher = current.data;
    } catch (err) {
      voucher = null;
    }
  }
  if (!voucher && cardNo) {
    const byCardNo = await db.collection('recharge_vouchers')
      .where({ tenantId: TENANT_ID, cardNo: normalizeCode(cardNo) })
      .limit(1)
      .get();
    voucher = byCardNo.data[0] || null;
  }
  if (!voucher && token) {
    const byToken = await db.collection('recharge_vouchers')
      .where({ tenantId: TENANT_ID, token: normalizeCode(token) })
      .limit(1)
      .get();
    voucher = byToken.data[0] || null;
  }
  if (!voucher) return { success: false, error: '云端找不到这张卡。请先重新生成云端卡片，或确认 voucherAction 云函数部署成功后刷新列表。' };
  if (voucher.qrFileID) return { success: true, data: { qrFileID: voucher.qrFileID, qrScene: voucher.qrScene || '' } };
  if (!voucher.token) return { success: false, error: '卡片缺少兑换码' };

  const scene = `cardNo=${voucher.cardNo}`;
  if (scene.length > 32) return { success: false, error: '兑换码过长，无法生成小程序码' };

  const codeRes = await cloud.openapi.wxacode.getUnlimited({
    scene,
    page: 'pages/mine/redeem',
    checkPath: false
  });
  if (!codeRes || !codeRes.buffer) return { success: false, error: '生成小程序码失败' };

  const uploadRes = await cloud.uploadFile({
    cloudPath: `voucher_qr/${voucher._id}_${Date.now()}.jpg`,
    fileContent: codeRes.buffer
  });
  const qrFileID = uploadRes.fileID;
  await db.collection('recharge_vouchers').doc(id).update({
    data: {
      qrFileID,
      qrScene: scene,
      updatedAt: new Date().toISOString(),
      updateTime: db.serverDate()
    }
  });
  return { success: true, data: { qrFileID, qrScene: scene } };
}

exports.main = async (event) => {
  try {
    if (event.action === 'ping') return { success: true, data: { name: 'voucherAction', time: new Date().toISOString() } };
    if (event.action === 'generate') return generate(event);
    if (event.action === 'update') return update(event);
    if (event.action === 'delete') return deleteVoucher(event);
    if (event.action === 'extend') return extend(event);
    if (event.action === 'activate') return activate(event);
    if (event.action === 'redeem') return redeem(event);
    if (event.action === 'getQr') return getQr(event);
    return { success: false, error: '未知操作' };
  } catch (err) {
    console.error('voucherAction error:', err);
    return { success: false, error: err.message || '卡片操作失败' };
  }
};
