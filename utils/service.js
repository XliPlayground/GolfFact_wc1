// utils/service.js
// 数据服务层：优先云数据库，失败回退 mock

const db = require('./db');
const mock = require('./mock');

const USE_CLOUD = true; // 云函数和数据库初始化完成后使用云端，失败自动回退 mock
const CLOUD_ENV = 'cloud1-d8gwt560627562aff';
const TENANT_ID = 'golfact_default';

function normalizeSettings(rows) {
  if (!Array.isArray(rows)) return rows || {};
  if (rows.length === 0) return mock.getSettings();

  return rows.reduce((settings, row) => {
    if (row.key) {
      settings[row.key] = row.value;
    }
    return settings;
  }, {});
}

async function tryCloud(cloudFn, fallbackFn) {
  if (!USE_CLOUD) {
    return fallbackFn();
  }
  try {
    const res = await cloudFn();
    if (res.success) return res.data;
    return fallbackFn();
  } catch (err) {
    console.warn('cloud fallback:', err);
    return fallbackFn();
  }
}

async function tryCloudWrite(cloudFn, fallbackFn) {
  if (!USE_CLOUD) {
    return fallbackFn();
  }
  try {
    const res = await cloudFn();
    if (res.success) return res;
    return fallbackFn();
  } catch (err) {
    console.warn('cloud write fallback:', err);
    return fallbackFn();
  }
}

async function getCloudOpenid() {
  const cached = wx.getStorageSync('cloud_openid');
  if (cached) return cached;
  const app = typeof getApp === 'function' ? getApp() : null;
  if (app && app.globalData && app.globalData.openid) return app.globalData.openid;
  try {
    const res = await wx.cloud.callFunction({ name: 'login' });
    const openid = res.result && res.result.openid;
    if (openid) {
      wx.setStorageSync('cloud_openid', openid);
      return openid;
    }
  } catch (err) {
    console.warn('getCloudOpenid fallback:', err);
  }
  return '';
}

async function callVoucherAction(data) {
  const res = await wx.cloud.callFunction({
    name: 'voucherAction',
    config: { env: CLOUD_ENV },
    data
  });
  return res.result || { success: false, error: '卡片操作失败' };
}

async function callUserAction(data) {
  const res = await wx.cloud.callFunction({
    name: 'userAction',
    data
  });
  return res.result || { success: false, error: '会员操作失败' };
}

async function callAppointmentAction(data) {
  const res = await wx.cloud.callFunction({
    name: 'appointmentAction',
    data
  });
  return res.result || { success: false, error: '预约操作失败' };
}

function buildDefaultCloudUser(openid) {
  return {
    openid,
    nickname: '微信会员',
    name: '',
    phone: '',
    role: 'user',
    memberLevel: 'normal',
    remainingHours: 0,
    totalRechargedHours: 0,
    totalTrainedHours: 0,
    totalSpent: 0,
    currentNoShowCount: 0,
    status: 'active',
    coachIds: [],
    tenantId: TENANT_ID
  };
}

function withoutId(data) {
  const { _id, ...rest } = data || {};
  return rest;
}

function getScorecardTime(card) {
  return new Date(card.playDate || card.updatedAt || card.createdAt || card.createTime || 0).getTime();
}

function buildUserNameMap(users) {
  return (users || []).reduce((map, user) => {
    map[user._id] = user.name || user.nickname || '会员';
    return map;
  }, {});
}

function buildCloudRankings(users, scorecards, currentUser, type = 'last5Best') {
  const userMap = buildUserNameMap(users);
  const grouped = {};
  (scorecards || [])
    .filter(card => card.status === 'submitted' && card.userId && Number(card.totalStrokes || 0) > 0)
    .forEach(card => {
      if (!grouped[card.userId]) grouped[card.userId] = [];
      grouped[card.userId].push(card);
    });

  return Object.keys(grouped)
    .map(userId => {
      const records = grouped[userId].sort((a, b) => getScorecardTime(b) - getScorecardTime(a));
      const last5 = records.slice(0, 5).map(card => Number(card.totalStrokes || 0));
      const allScores = records.map(card => Number(card.totalStrokes || 0));
      const stats = {
        last5Best: Math.min(...last5),
        last5Avg: Math.round(last5.reduce((sum, value) => sum + value, 0) / last5.length),
        personalBest: Math.min(...allScores)
      };
      return {
        _id: userId,
        name: userMap[userId] || '会员',
        stats,
        value: stats[type] || stats.last5Best,
        isMe: currentUser && currentUser._id === userId
      };
    })
    .filter(item => Number.isFinite(item.value))
    .sort((a, b) => a.value - b.value);
}

function buildCloudCertifiedHonors(users, scorecards) {
  const userMap = buildUserNameMap(users);
  const counters = {};
  (scorecards || [])
    .filter(card => card.status === 'submitted')
    .forEach(card => {
      if (!counters[card.userId]) {
        counters[card.userId] = {
          userId: card.userId,
          name: userMap[card.userId] || '会员',
          holeInOne: 0,
          eagle: 0,
          birdie: 0,
          par: 0,
          oneChicken: 0
        };
      }
      (card.holes || []).forEach(hole => {
        const strokes = Number(hole.strokes || 0);
        const par = Number(hole.par || 4);
        if (!strokes || !par) return;
        if (strokes === 1) counters[card.userId].holeInOne += 1;
        if (strokes === par - 2) counters[card.userId].eagle += 1;
        if (strokes === par - 1) counters[card.userId].birdie += 1;
        if (strokes === par) counters[card.userId].par += 1;
        if (strokes <= par - 3) counters[card.userId].oneChicken += 1;
      });
    });

  const rows = Object.values(counters);
  const fallback = {
    holeInOne: { key: 'holeInOne', title: '一杆进洞王', name: '暂无', valueText: '0次' },
    eagle: { key: 'eagle', title: '鹰王', name: '暂无', valueText: '0只' },
    birdie: { key: 'birdie', title: '鸟王', name: '暂无', valueText: '0只' },
    par: { key: 'par', title: 'Par王', name: '暂无', valueText: '0洞' },
    oneChicken: { key: 'oneChicken', title: '一只鸡王', name: '暂无', valueText: '0只' }
  };

  function pick(key, unit) {
    const winner = rows.slice().sort((a, b) => b[key] - a[key])[0];
    if (!winner || !winner[key]) return null;
    return { name: winner.name, valueText: `${winner[key]}${unit}` };
  }

  return [
    { ...fallback.eagle, ...(pick('eagle', '只') || {}) },
    { ...fallback.birdie, ...(pick('birdie', '只') || {}) },
    { ...fallback.holeInOne, ...(pick('holeInOne', '次') || {}) },
    { ...fallback.par, ...(pick('par', '洞') || {}) },
    { ...fallback.oneChicken, ...(pick('oneChicken', '只') || {}) }
  ];
}

module.exports = {
  // 设置
  async getSettings() {
    const rows = await tryCloud(
      () => db.query('settings', db.withTenant({})),
      () => mock.getSettings()
    );
    return normalizeSettings(rows);
  },

  // 更新系统设置
  async updateSettings(patch) {
    if (!USE_CLOUD) {
      return mock.updateSettings(patch);
    }
    return tryCloudWrite(
      () => db.update('settings', 'settings_runtime_patch', patch),
      () => mock.updateSettings(patch)
    );
  },

  // 当前用户
  async getCurrentUser() {
    if (!USE_CLOUD) {
      return mock.getCurrentUser();
    }
    const openid = await getCloudOpenid();
    if (!openid) return mock.getCurrentUser();

    const users = await tryCloud(
      () => db.query('users', db.withTenant({ openid })),
      () => mock.getCurrentUser()
    );
    if (Array.isArray(users) && users[0]) return users[0];
    if (!Array.isArray(users)) return users;

    const user = buildDefaultCloudUser(openid);
    const created = await tryCloudWrite(
      () => db.add('users', user),
      () => mock.getCurrentUser()
    );
    if (created && created.success && created.id) {
      return { ...user, _id: created.id };
    }
    return mock.getCurrentUser();
  },

  // 用户列表
  async getUsers() {
    return tryCloud(
      () => db.query('users', db.withTenant({})),
      () => mock.getUsers()
    );
  },

  async saveUser(data) {
    if (!USE_CLOUD) {
      return mock.saveUser(data);
    }
    if (data._id) {
      return tryCloudWrite(
        () => db.update('users', data._id, data),
        () => mock.saveUser(data)
      );
    }
    return tryCloudWrite(
      () => db.add('users', data),
      () => mock.saveUser(data)
    );
  },

  async updateUserStatus(userId, status) {
    if (!USE_CLOUD) {
      return mock.updateUserStatus(userId, status);
    }
    return tryCloudWrite(
      () => db.update('users', userId, { status }),
      () => mock.updateUserStatus(userId, status)
    );
  },

  async deleteUser(userId) {
    if (!USE_CLOUD) {
      return mock.deleteUser(userId);
    }
    return this.updateUserStatus(userId, 'deleted');
  },

  async bindPhone(code) {
    if (!USE_CLOUD) {
      return { success: false, message: '本地模式不能绑定手机号' };
    }
    try {
      const res = await wx.cloud.callFunction({
        name: 'bindPhone',
        data: { code }
      });
      return res.result || { success: false, message: '绑定失败' };
    } catch (err) {
      console.warn('bindPhone failed:', err);
      return { success: false, message: err.message || '绑定失败' };
    }
  },

  // 打位
  async getBays() {
    return tryCloud(
      () => db.query('bays', db.withTenant({})),
      () => mock.getBays()
    );
  },

  async saveBay(data) {
    if (!USE_CLOUD) {
      return mock.saveBay(data);
    }
    if (data._id) {
      return tryCloudWrite(
        () => db.update('bays', data._id, withoutId(data)),
        () => mock.saveBay(data)
      );
    }
    return tryCloudWrite(
      () => db.add('bays', data),
      () => mock.saveBay(data)
    );
  },

  async deleteBay(id) {
    if (!USE_CLOUD) {
      return mock.deleteBay(id);
    }
    return tryCloudWrite(
      () => db.update('bays', id, { status: 'deleted' }),
      () => mock.deleteBay(id)
    );
  },

  // 教练
  async getCoaches() {
    return tryCloud(
      () => db.query('coaches', db.withTenant({})),
      () => mock.getCoaches()
    );
  },

  async saveCoach(data) {
    if (!USE_CLOUD) {
      return mock.saveCoach(data);
    }
    const payload = {
      ...data,
      tags: Array.isArray(data.tags) ? data.tags : String(data.tagsText || data.tags || '').split(/[,，、]/).map(item => item.trim()).filter(Boolean),
      hourlyRate: Number(data.hourlyRate || 0),
      useGlobalRate: data.useGlobalRate !== false,
      status: data.status || 'active'
    };
    if (payload._id) {
      return tryCloudWrite(
        () => db.update('coaches', payload._id, withoutId(payload)),
        () => mock.saveCoach(payload)
      );
    }
    return tryCloudWrite(
      () => db.add('coaches', payload),
      () => mock.saveCoach(payload)
    );
  },

  async deleteCoach(id) {
    if (!USE_CLOUD) {
      return mock.deleteCoach(id);
    }
    return tryCloudWrite(
      () => db.update('coaches', id, { status: 'deleted' }),
      () => mock.deleteCoach(id)
    );
  },

  // 当前会员已关联教练
  async getLinkedCoaches(userId) {
    if (!USE_CLOUD) {
      return mock.getLinkedCoaches(userId);
    }

    const users = await this.getUsers();
    const user = (users || []).find(item => item._id === userId);
    const coachIds = user?.coachIds || [];
    if (coachIds.length === 0) return [];

    const coaches = await this.getCoaches();
    return (coaches || []).filter(coach => coachIds.includes(coach._id) && coach.status !== 'inactive' && coach.status !== 'deleted');
  },

  // 更新会员关联教练
  async updateUserCoaches(userId, coachIds) {
    return tryCloudWrite(
      () => db.update('users', userId, { coachIds }),
      () => mock.updateUserCoaches(userId, coachIds)
    );
  },

  // 时段
  async getTimeSlots(date, bayId, type) {
    return tryCloud(
      () => {
        const where = db.withTenant({});
        if (date) where.date = date;
        if (bayId) where.bayId = bayId;
        if (type) where.type = type;
        return db.query('bay_time_slots', where);
      },
      () => mock.getTimeSlots(date, bayId, type)
    );
  },

  async saveTimeSlot(data) {
    if (!USE_CLOUD) {
      return mock.saveTimeSlot(data);
    }
    const payload = {
      ...data,
      slotMinutes: Number(data.slotMinutes || 30),
      basePrice: Number(data.basePrice || 0),
      discount: Number(data.discount || 1),
      finalPrice: Number(data.finalPrice || data.basePrice || 0),
      capacity: Number(data.capacity || 1),
      isOpen: data.isOpen !== false,
      isBooked: data.isBooked === true
    };
    if (payload._id) {
      return tryCloudWrite(
        () => db.update('bay_time_slots', payload._id, withoutId(payload)),
        () => mock.saveTimeSlot(payload)
      );
    }
    return tryCloudWrite(
      () => db.add('bay_time_slots', payload),
      () => mock.saveTimeSlot(payload)
    );
  },

  // 商品
  async getProducts(categoryId) {
    return tryCloud(
      () => {
        const where = db.withTenant({});
        if (categoryId) where.categoryId = categoryId;
        return db.query('products', where);
      },
      () => mock.getProducts(categoryId)
    );
  },

  async saveProduct(data) {
    if (!USE_CLOUD) {
      return mock.saveProduct(data);
    }
    const payload = {
      ...data,
      price: Number(data.price || 0),
      stock: Number(data.stock || 0),
      status: data.status || 'on_sale'
    };
    if (payload._id) {
      return tryCloudWrite(
        () => db.update('products', payload._id, withoutId(payload)),
        () => mock.saveProduct(payload)
      );
    }
    return tryCloudWrite(
      () => db.add('products', payload),
      () => mock.saveProduct(payload)
    );
  },

  async deleteProduct(id) {
    if (!USE_CLOUD) {
      return mock.deleteProduct(id);
    }
    return tryCloudWrite(
      () => db.update('products', id, { status: 'deleted' }),
      () => mock.deleteProduct(id)
    );
  },

  // 商品分类
  async getCategories() {
    return tryCloud(
      () => db.query('product_categories', db.withTenant({})),
      () => mock.getCategories()
    );
  },

  async saveCategory(data) {
    if (!USE_CLOUD) {
      return mock.saveCategory(data);
    }
    const payload = {
      ...data,
      displayOrder: Number(data.displayOrder || 0),
      status: data.status || 'active'
    };
    if (payload._id) {
      return tryCloudWrite(
        () => db.update('product_categories', payload._id, withoutId(payload)),
        () => mock.saveCategory(payload)
      );
    }
    return tryCloudWrite(
      () => db.add('product_categories', payload),
      () => mock.saveCategory(payload)
    );
  },

  // 活动
  async getActivities(type) {
    return tryCloud(
      () => {
        const where = db.withTenant({});
        if (type) where.type = type;
        return db.query('activities', where);
      },
      () => mock.getActivities(type)
    );
  },

  async getCourses() {
    const courses = await tryCloud(
      () => db.query('courses', db.withTenant({})),
      () => mock.getCourses()
    );
    return (courses || []).filter(item => item.status !== 'deleted');
  },

  async saveCourse(data) {
    if (!USE_CLOUD) {
      return mock.saveCourse(data);
    }
    if (data._id) {
      return tryCloudWrite(
        () => db.update('courses', data._id, withoutId(data)),
        () => mock.saveCourse(data)
      );
    }
    return tryCloudWrite(
      () => db.add('courses', data),
      () => mock.saveCourse(data)
    );
  },

  async deleteCourse(id) {
    if (!USE_CLOUD) {
      return mock.deleteCourse(id);
    }
    return tryCloudWrite(
      () => db.update('courses', id, { status: 'deleted' }),
      () => mock.deleteCourse(id)
    );
  },

  async importRegionalCourses() {
    const seeds = mock.getRegionalCourseSeeds();
    if (!USE_CLOUD) {
      const existing = mock.getCourses();
      let imported = 0;
      let updated = 0;
      let skipped = 0;
      for (const seed of seeds) {
        const current = existing.find(item => item.name === seed.name);
        if (current) {
          const pars = current.pars || [];
          const shouldRepair = current.dataSource === 'regional_seed_2026' || pars.every(par => Number(par) === 4);
          if (!shouldRepair) {
            skipped += 1;
            continue;
          }
          await mock.saveCourse({ ...seed, _id: current._id });
          updated += 1;
          continue;
        }
        await mock.saveCourse(seed);
        imported += 1;
      }
      return { success: true, data: { imported, updated, skipped } };
    }

    try {
      const res = await wx.cloud.callFunction({
        name: 'courseAction',
        data: { action: 'importRegionalCourses' }
      });
      return res.result || { success: false, error: '导入失败' };
    } catch (err) {
      console.warn('cloud importRegionalCourses failed:', err);
      return { success: false, error: err.message || '导入失败' };
    }
  },

  async saveActivity(data) {
    if (!USE_CLOUD) {
      return mock.saveActivity(data);
    }
    if (data._id) {
      return tryCloudWrite(
        () => db.update('activities', data._id, data),
        () => mock.saveActivity(data)
      );
    }
    return tryCloudWrite(
      () => db.add('activities', data),
      () => mock.saveActivity(data)
    );
  },

  async deleteActivity(id) {
    if (!USE_CLOUD) {
      return mock.deleteActivity(id);
    }
    return tryCloudWrite(
      () => db.update('activities', id, { status: 'cancelled' }),
      () => mock.deleteActivity(id)
    );
  },

  async updateActivityStatus(id, status) {
    if (!USE_CLOUD) {
      return mock.updateActivityStatus(id, status);
    }
    return tryCloudWrite(
      () => db.update('activities', id, { status }),
      () => mock.updateActivityStatus(id, status)
    );
  },

  async registerActivity(activityId, userId) {
    if (!USE_CLOUD) {
      return mock.registerActivity(activityId, userId);
    }
    try {
      const res = await wx.cloud.callFunction({
        name: 'activityAction',
        data: { action: 'register', activityId, userId }
      });
      return res.result || { success: false, message: '报名失败' };
    } catch (err) {
      console.warn('cloud registerActivity fallback:', err);
      return mock.registerActivity(activityId, userId);
    }
  },

  async updateActivityRegistration(activityId, userId, status) {
    if (!USE_CLOUD) {
      return mock.updateActivityRegistration(activityId, userId, status);
    }
    try {
      const res = await wx.cloud.callFunction({
        name: 'activityAction',
        data: { action: 'updateRegistration', activityId, userId, status }
      });
      return res.result || { success: false, message: '更新失败' };
    } catch (err) {
      console.warn('cloud updateActivityRegistration fallback:', err);
      return mock.updateActivityRegistration(activityId, userId, status);
    }
  },

  // 充值记录
  async getRecharges(userId) {
    return tryCloud(
      () => db.query('recharge_records', db.withTenant({ userId })),
      () => mock.getRecharges(userId)
    );
  },

  // 预约记录
  async getAppointments(userId) {
    if (USE_CLOUD) {
      try {
        await callAppointmentAction({ action: 'settleExpired' });
      } catch (err) {
        console.warn('cloud settleExpired appointments skipped:', err);
      }
    }
    return tryCloud(
      () => db.query('appointments', db.withTenant({ userId })),
      () => mock.getAppointments(userId)
    );
  },

  async getPendingAppointmentHours(userId) {
    if (!userId) return 0;
    try {
      const appointments = await this.getAppointments(userId);
      const pendingHours = (appointments || [])
        .filter(item => item.status === 'booked')
        .reduce((sum, item) => {
          const hours = Number(item.deductedHours || item.duration || 0);
          return sum + (Number.isFinite(hours) ? hours : 0);
        }, 0);
      return Number(pendingHours.toFixed(2));
    } catch (err) {
      console.warn('pending appointment hours fallback:', err);
      return 0;
    }
  },

  // 记分卡记录
  async getScorecards(userId) {
    const scorecards = await tryCloud(
      () => db.query('scorecards', db.withTenant({ userId })),
      () => mock.getScorecards(userId)
    );
    return (scorecards || []).filter(item => item.status !== 'deleted');
  },

  // 全部预约
  async getAllAppointments() {
    if (USE_CLOUD) {
      try {
        await callAppointmentAction({ action: 'settleExpired' });
      } catch (err) {
        console.warn('cloud settleExpired appointments skipped:', err);
      }
    }
    return tryCloud(
      () => db.query('appointments', db.withTenant({})),
      () => mock.getAppointments()
    );
  },

  // 创建预约
  async createAppointment(data) {
    if (!USE_CLOUD) {
      return mock.createAppointment(data);
    }
    try {
      return await callAppointmentAction({ action: 'create', data });
    } catch (err) {
      console.warn('cloud createAppointment fallback:', err);
      return mock.createAppointment(data);
    }
  },

  // 更新预约状态
  async updateAppointmentStatus(id, status) {
    if (!USE_CLOUD) {
      return mock.updateAppointmentStatus(id, status);
    }
    try {
      return await callAppointmentAction({ action: 'updateStatus', id, status });
    } catch (err) {
      console.warn('cloud updateAppointmentStatus fallback:', err);
      return mock.updateAppointmentStatus(id, status);
    }
  },

  // 创建记分卡
  async createScorecard(data) {
    return tryCloudWrite(
      () => db.add('scorecards', data),
      () => {
        const scorecards = wx.getStorageSync('mock_scorecards') || [];
        scorecards.push(data);
        wx.setStorageSync('mock_scorecards', scorecards);
        return { success: true };
      }
    );
  },

  // 保存/更新记分卡草稿
  async upsertScorecard(data) {
    if (!USE_CLOUD) {
      return mock.upsertScorecard(data);
    }

    if (data._id) {
      return tryCloudWrite(
        async () => {
          const existing = await db.getById('scorecards', data._id);
          if (existing.success && existing.data) {
            return db.update('scorecards', data._id, data);
          }
          return db.set('scorecards', data._id, data);
        },
        () => mock.upsertScorecard(data)
      );
    }
    return this.createScorecard(data);
  },

  async deleteScorecard(id, userId) {
    if (!USE_CLOUD) {
      return mock.deleteScorecard(id, userId);
    }
    return tryCloudWrite(
      () => db.update('scorecards', id, { status: 'deleted', deletedAt: new Date().toISOString(), deletedByUserId: userId }),
      () => mock.deleteScorecard(id, userId)
    );
  },

  // 创建充值
  async createRecharge(userId, hours, expiryDate, adminId, remark = '') {
    if (!USE_CLOUD) {
      return mock.createRecharge(userId, hours, expiryDate, adminId);
    }
    try {
      return await callUserAction({ action: 'createRecharge', userId, hours, expiryDate, adminId, remark });
    } catch (err) {
      console.warn('cloud createRecharge fallback:', err);
      return mock.createRecharge(userId, hours, expiryDate, adminId);
    }
  },

  async adjustUserHours(userId, hoursDelta, reason, adminId) {
    if (!USE_CLOUD) {
      return mock.adjustUserHours(userId, hoursDelta, reason, adminId);
    }
    try {
      return await callUserAction({ action: 'adjustHours', userId, hoursDelta, reason, adminId });
    } catch (err) {
      console.warn('cloud adjustUserHours fallback:', err);
      return mock.adjustUserHours(userId, hoursDelta, reason, adminId);
    }
  },

  // 充时卡
  async generateVoucher(options) {
    if (!USE_CLOUD) {
      return mock.generateVoucher(options);
    }
    try {
      return await callVoucherAction({ action: 'generate', options });
    } catch (err) {
      console.warn('cloud generateVoucher failed:', err);
      return { success: false, error: err.message || err.errMsg || '生成卡片失败，请确认 voucherAction 云函数已部署' };
    }
  },

  async getVouchers() {
    return tryCloud(
      async () => {
        const res = await db.query('recharge_vouchers', db.withTenant({}));
        if (!res.success) return res;
        const data = (res.data || [])
          .filter(item => item.status !== 'deleted')
          .sort((a, b) => new Date(b.createdAt || b.createTime || 0) - new Date(a.createdAt || a.createTime || 0));
        return { success: true, data };
      },
      () => mock.getVouchers()
    );
  },

  async updateVoucher(id, patch) {
    if (!USE_CLOUD) {
      return mock.updateVoucher(id, patch);
    }
    try {
      return await callVoucherAction({ action: 'update', id, patch });
    } catch (err) {
      console.warn('cloud updateVoucher failed:', err);
      return { success: false, error: err.message || err.errMsg || '更新卡片失败，请确认 voucherAction 云函数已部署' };
    }
  },

  async deleteVoucher(id) {
    if (!USE_CLOUD) {
      return mock.deleteVoucher(id);
    }
    try {
      return await callVoucherAction({ action: 'delete', id });
    } catch (err) {
      console.warn('cloud deleteVoucher failed:', err);
      return { success: false, error: err.message || err.errMsg || '删除卡片失败，请确认 voucherAction 云函数已部署' };
    }
  },

  async extendVoucher(id, cardValidUntil) {
    if (!USE_CLOUD) {
      return mock.extendVoucher(id, cardValidUntil);
    }
    try {
      return await callVoucherAction({ action: 'extend', id, cardValidUntil });
    } catch (err) {
      console.warn('cloud extendVoucher failed:', err);
      return { success: false, error: err.message || err.errMsg || '延期卡片失败，请确认 voucherAction 云函数已部署' };
    }
  },

  async redeemVoucher(code, userId) {
    if (!USE_CLOUD) {
      return mock.redeemVoucher(code, userId);
    }
    try {
      return await callVoucherAction({ action: 'redeem', code, userId });
    } catch (err) {
      console.warn('cloud redeemVoucher fallback:', err);
      return mock.redeemVoucher(code, userId);
    }
  },

  async activateVouchers(options) {
    if (!USE_CLOUD) {
      return mock.activateVouchers(options);
    }
    try {
      return await callVoucherAction({ action: 'activate', options });
    } catch (err) {
      console.warn('cloud activateVouchers failed:', err);
      return { success: false, error: err.message || err.errMsg || '激活卡片失败，请确认 voucherAction 云函数已部署' };
    }
  },

  async getVoucherQr(voucher) {
    if (!USE_CLOUD) {
      return { success: false, error: '本地模式不能生成小程序码' };
    }
    try {
      const payload = typeof voucher === 'string' ? { id: voucher } : (voucher || {});
      return await callVoucherAction({
        action: 'getQr',
        id: payload._id || payload.id || '',
        cardNo: payload.cardNo || '',
        token: payload.token || ''
      });
    } catch (err) {
      console.warn('cloud getVoucherQr failed:', err);
      const code = err.errCode || err.errcode || '';
      const message = err.message || err.errMsg || String(err);
      const hint = String(code) === '-504002' || message.indexOf('-504002') >= 0
        ? '云函数调用失败：请确认 voucherAction 已部署到 cloud1-d8gwt560627562aff，并选择“上传并部署：云端安装依赖”。'
        : '生成小程序码失败';
      return { success: false, error: `${hint}\n${message}` };
    }
  },

  // 获取教练预约
  async getCoachAppointments(coachId) {
    return tryCloud(
      () => db.query('appointments', db.withTenant({ coachId })),
      () => mock.getCoachAppointments(coachId)
    );
  },

  async getCoachBillSummary(coachId, startDate = '', endDate = '') {
    const [appointments, coaches] = await Promise.all([
      this.getCoachAppointments(coachId),
      this.getCoaches()
    ]);
    const coach = (coaches || []).find(item => item._id === coachId) || {};
    const rows = (appointments || [])
      .filter(item => item.status === 'completed' || item.status === 'no_show')
      .filter(item => !startDate || item.date >= startDate)
      .filter(item => !endDate || item.date <= endDate)
      .sort((a, b) => `${b.date || ''} ${b.startTime || ''}`.localeCompare(`${a.date || ''} ${a.startTime || ''}`))
      .map(item => {
        const hours = Number(item.coachHours || item.duration || 0);
        const rate = Number(item.coachRate || coach.hourlyRate || 0);
        return {
          ...item,
          billHours: hours,
          billRate: rate,
          billAmount: Number((hours * rate).toFixed(2))
        };
      });
    return {
      coach,
      rows,
      totalHours: Number(rows.reduce((sum, item) => sum + item.billHours, 0).toFixed(2)),
      totalAmount: Number(rows.reduce((sum, item) => sum + item.billAmount, 0).toFixed(2))
    };
  },

  // 获取排名
  async getRankings(type) {
    if (!USE_CLOUD) {
      return mock.getRankings(type);
    }
    try {
      const [usersRes, scorecardsRes, currentUser] = await Promise.all([
        db.query('users', db.withTenant({ status: 'active' })),
        db.query('scorecards', db.withTenant({ status: 'submitted' })),
        this.getCurrentUser()
      ]);
      if (!usersRes.success || !scorecardsRes.success) return mock.getRankings(type);
      return buildCloudRankings(usersRes.data, scorecardsRes.data, currentUser, type);
    } catch (err) {
      console.warn('cloud getRankings fallback:', err);
      return mock.getRankings(type);
    }
  },

  async getCertifiedHonors() {
    if (!USE_CLOUD) {
      return mock.getCertifiedHonors();
    }
    try {
      const [usersRes, scorecardsRes] = await Promise.all([
        db.query('users', db.withTenant({ status: 'active' })),
        db.query('scorecards', db.withTenant({ status: 'submitted' }))
      ]);
      if (!usersRes.success || !scorecardsRes.success) return mock.getCertifiedHonors();
      return buildCloudCertifiedHonors(usersRes.data, scorecardsRes.data);
    } catch (err) {
      console.warn('cloud getCertifiedHonors fallback:', err);
      return mock.getCertifiedHonors();
    }
  },

  // 创建活动成绩
  async createActivityRecord(data) {
    if (!USE_CLOUD) {
      return mock.createActivityRecord(data);
    }
    try {
      const res = await wx.cloud.callFunction({
        name: 'activityAction',
        data: { action: 'createRecord', data }
      });
      return res.result || { success: false, message: '保存成绩失败' };
    } catch (err) {
      console.warn('cloud createActivityRecord fallback:', err);
      return mock.createActivityRecord(data);
    }
  }
};
