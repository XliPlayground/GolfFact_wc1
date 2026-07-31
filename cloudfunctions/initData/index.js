// cloudfunctions/initData/index.js
const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const TENANT_ID = 'golfact_default';

const COLLECTIONS = [
  'users',
  'admins',
  'coach_accounts',
  'coaches',
  'bays',
  'bay_time_slots',
  'products',
  'product_categories',
  'activities',
  'activity_records',
  'scorecards',
  'courses',
  'holes',
  'coach_bills',
  'points_records',
  'recharge_records',
  'recharge_vouchers',
  'access_codes',
  'settings',
  'appointments'
];

async function ensureCollections() {
  for (const name of COLLECTIONS) {
    try {
      await db.createCollection(name);
      console.log(`collection ${name} created`);
    } catch (err) {
      if (err.errCode === -502005) {
        console.log(`collection ${name} already exists`);
      } else {
        console.error(`createCollection ${name} error:`, err);
      }
    }
  }
}

async function clearCollections() {
  for (const name of COLLECTIONS) {
    try {
      let hasMore = true;
      while (hasMore) {
        const res = await db.collection(name).limit(100).get();
        hasMore = res.data.length > 0;
        for (const doc of res.data) {
          await db.collection(name).doc(doc._id).remove();
        }
      }
    } catch (err) {
      console.warn(`clear ${name} error:`, err);
    }
  }
}

async function seedData() {
  // 场地配置
  await db.collection('settings').add({
    data: {
      tenantId: TENANT_ID,
      key: 'site',
      value: {
        tenantId: TENANT_ID,
        name: 'Golfact 高尔夫练习场',
        logoUrl: '',
        signboardUrl: '',
        phone: '13800138000',
        address: '上海市浦东新区',
        notice: '欢迎预约打球，请提前 2 小时取消预约'
      },
      createTime: db.serverDate(),
      updateTime: db.serverDate()
    }
  });

  await db.collection('settings').add({
    data: {
      tenantId: TENANT_ID,
      key: 'theme',
      value: { primaryColor: '#22C55E' },
      createTime: db.serverDate(),
      updateTime: db.serverDate()
    }
  });

  await db.collection('settings').add({
    data: {
      tenantId: TENANT_ID,
      key: 'businessHours',
      value: { open: '08:00', close: '22:00', slotMinutes: 30 },
      createTime: db.serverDate(),
      updateTime: db.serverDate()
    }
  });

  await db.collection('settings').add({
    data: {
      tenantId: TENANT_ID,
      key: 'bookingRules',
      value: { minSlots: 2, maxDailyHours: 4 },
      createTime: db.serverDate(),
      updateTime: db.serverDate()
    }
  });

  await db.collection('settings').add({
    data: {
      tenantId: TENANT_ID,
      key: 'noShowRule',
      value: { thresholdHours: 2, maxPerPeriod: 1, periodMonths: 1, defaultMode: 'ratio', defaultValue: 50 },
      createTime: db.serverDate(),
      updateTime: db.serverDate()
    }
  });

  await db.collection('settings').add({
    data: {
      tenantId: TENANT_ID,
      key: 'memberLevels',
      value: [
        { level: 'normal', name: '普通会员', minRecharge: 0, discount: 1 },
        { level: 'silver', name: '银卡会员', minRecharge: 3000, discount: 0.95 },
        { level: 'gold', name: '金卡会员', minRecharge: 8000, discount: 0.9 }
      ],
      createTime: db.serverDate(),
      updateTime: db.serverDate()
    }
  });

  await db.collection('settings').add({
    data: {
      tenantId: TENANT_ID,
      key: 'accessCode',
      value: { type: 'static', code: '888888' },
      createTime: db.serverDate(),
      updateTime: db.serverDate()
    }
  });

  // 管理员
  await db.collection('admins').add({
    data: {
      username: 'admin',
      passwordHash: '$2b$10$mockhash', // 生产环境必须 bcrypt
      name: '管理员',
      role: 'admin',
      status: 'active',
      createTime: db.serverDate(),
      updateTime: db.serverDate()
    }
  });

  // 用户
  await db.collection('users').add({
    data: {
      openid: 'mock_openid_001',
      nickname: '高尔夫爱好者',
      name: '张三',
      phone: '13800138001',
      role: 'user',
      memberLevel: 'silver',
      remainingHours: 12.5,
      totalRechargedHours: 30,
      totalTrainedHours: 17.5,
      totalSpent: 0,
      currentNoShowCount: 0,
      status: 'active',
      golfStats: {
        last5Best: 78,
        last5Avg: 82,
        personalBest: 76,
        roundsCount: 12
      },
      tenantId: TENANT_ID,
      createTime: db.serverDate(),
      updateTime: db.serverDate()
    }
  });

  // 打位
  await db.collection('bays').add({
    data: { code: 'A1', name: '1号打位', status: 'active', displayOrder: 1, tenantId: TENANT_ID, createTime: db.serverDate(), updateTime: db.serverDate() }
  });
  await db.collection('bays').add({
    data: { code: 'A2', name: '2号打位', status: 'active', displayOrder: 2, tenantId: TENANT_ID, createTime: db.serverDate(), updateTime: db.serverDate() }
  });

  // 教练
  await db.collection('coaches').add({
    data: {
      name: '李教练',
      intro: '10年教学经验，擅长短杆和推杆',
      tags: ['短杆', '推杆'],
      hourlyRate: 300,
      useGlobalRate: true,
      status: 'active',
      tenantId: TENANT_ID,
      createTime: db.serverDate(),
      updateTime: db.serverDate()
    }
  });

  // 商品分类
  const cats = ['水', '点心', '衣服', '装备'];
  for (let i = 0; i < cats.length; i++) {
    await db.collection('product_categories').add({
      data: { name: cats[i], displayOrder: i + 1, status: 'active', tenantId: TENANT_ID, createTime: db.serverDate(), updateTime: db.serverDate() }
    });
  }

  // 商品
  await db.collection('products').add({
    data: { name: '矿泉水', categoryId: '', price: 5, unit: '瓶', stock: 100, status: 'on_sale', tenantId: TENANT_ID, createTime: db.serverDate(), updateTime: db.serverDate() }
  });

  // 充值记录
  const userRes = await db.collection('users').where({ openid: 'mock_openid_001' }).get();
  const userId = userRes.data[0]._id;

  const xubaoPars = [4, 5, 4, 3, 4, 4, 5, 3, 4, 4, 4, 3, 5, 4, 4, 5, 3, 4];
  const courseRes = await db.collection('courses').add({
    data: {
      tenantId: TENANT_ID,
      name: '上海旭宝高尔夫俱乐部',
      province: '上海',
      city: '上海',
      address: '',
      holeCount: 18,
      pars: xubaoPars,
      totalPar: xubaoPars.reduce((sum, par) => sum + par, 0),
      features: '云端示范球场，后续优先补北京、天津、河北球场库。',
      dataSource: 'seed',
      status: 'active',
      createTime: db.serverDate(),
      updateTime: db.serverDate()
    }
  });

  const activityRes = await db.collection('activities').add({
    data: {
      tenantId: TENANT_ID,
      title: '周末下场活动',
      type: 'event',
      courseId: courseRes._id,
      location: '上海旭宝高尔夫俱乐部',
      startTime: '2026-07-26 07:00',
      endTime: '2026-07-26 15:00',
      signupStartTime: '2026-07-10 09:00',
      signupEndTime: '2026-07-25 18:00',
      itinerary: '07:00 集合出发，09:00 开球，14:00 简餐复盘。',
      meal: '含赛后简餐和饮品',
      fee: 880,
      maxParticipants: 20,
      registrations: [
        {
          userId,
          name: '张三',
          status: 'approved',
          createdAt: '2026-07-18T10:00:00.000Z',
          updatedAt: '2026-07-18T10:30:00.000Z'
        }
      ],
      participants: [userId],
      status: 'upcoming',
      description: '周日上午下场，费用含球童小费',
      createTime: db.serverDate(),
      updateTime: db.serverDate()
    }
  });

  const certifiedStrokes = [4, 4, 5, 3, 3, 4, 5, 2, 4, 5, 4, 3, 4, 4, 6, 5, 3, 4];
  const certifiedHoles = xubaoPars.map((par, index) => ({
    holeNumber: index + 1,
    par,
    strokes: certifiedStrokes[index],
    putts: index % 3 === 0 ? 1 : 2,
    penalties: index === 14 ? 1 : 0
  }));
  const totalPar = certifiedHoles.reduce((sum, hole) => sum + hole.par, 0);
  const totalStrokes = certifiedHoles.reduce((sum, hole) => sum + hole.strokes, 0);
  await db.collection('scorecards').add({
    data: {
      tenantId: TENANT_ID,
      userId,
      activityId: activityRes._id,
      courseId: courseRes._id,
      courseName: '上海旭宝高尔夫俱乐部',
      playDate: '2026-07-26',
      holes: certifiedHoles,
      totalPar,
      totalStrokes,
      scoreToPar: totalStrokes - totalPar,
      totalPutts: certifiedHoles.reduce((sum, hole) => sum + hole.putts, 0),
      totalPenalties: certifiedHoles.reduce((sum, hole) => sum + hole.penalties, 0),
      status: 'submitted',
      recordedType: 'activity_admin',
      recordedBy: 'admin',
      createTime: db.serverDate(),
      updateTime: db.serverDate()
    }
  });

  await db.collection('recharge_records').add({
    data: {
      userId,
      tenantId: TENANT_ID,
      amount: 0,
      hours: 20,
      usedHours: 12.5,
      remainingHours: 7.5,
      expiryDate: '2026-12-31',
      status: 'valid',
      createTime: db.serverDate(),
      updateTime: db.serverDate()
    }
  });

  // 生成未来 7 天时段
  const baysRes = await db.collection('bays').limit(10).get();
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];

    for (const bay of baysRes.data) {
      for (let h = 5; h < 24; h++) {
        for (let m = 0; m < 60; m += 30) {
          const startTime = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
          const endMin = m + 30;
          const endH = endMin >= 60 ? h + 1 : h;
          const endM = endMin >= 60 ? 0 : endMin;
          const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
          const isTeaching = (h >= 17 && h <= 19);

          await db.collection('bay_time_slots').add({
            data: {
              bayId: bay._id,
              date: dateStr,
              startTime,
              endTime,
              slotMinutes: 30,
              type: isTeaching ? 'teaching' : 'self',
              basePrice: isTeaching ? 280 : 120,
              discount: 1,
              finalPrice: isTeaching ? 280 : 120,
              capacity: 1,
              isOpen: true,
              isBooked: false,
              coachId: isTeaching ? null : null,
              tenantId: TENANT_ID,
              createTime: db.serverDate(),
              updateTime: db.serverDate()
            }
          });
        }
      }
    }
  }
}

exports.main = async (event, context) => {
  try {
    await ensureCollections();
    await clearCollections();
    await seedData();
    return { success: true, message: '数据库初始化完成' };
  } catch (err) {
    console.error('initData error:', err);
    return { success: false, error: err.message };
  }
};
