// utils/mock.js
// Mock 数据层，用于账号和云环境就绪前本地演示

const STORAGE_KEYS = {
  USERS: 'mock_users',
  CURRENT_USER: 'mock_current_user',
  BAYS: 'mock_bays',
  SLOTS: 'mock_time_slots',
  APPOINTMENTS: 'mock_appointments',
  PRODUCTS: 'mock_products',
  CATEGORIES: 'mock_categories',
  COACHES: 'mock_coaches',
  ACTIVITIES: 'mock_activities',
  ACTIVITY_RECORDS: 'mock_activity_records',
  SCORECARDS: 'mock_scorecards',
  COURSES: 'mock_courses',
  SETTINGS: 'mock_settings',
  RECHARGES: 'mock_recharges',
  VOUCHERS: 'mock_recharge_vouchers',
  SLOTS_VERSION: 'mock_slots_version'
};

const MOCK_SLOTS_VERSION = '20260730_05_24_paired_booked';

const MOCK_CERTIFIED_SCORECARD_ID = 'sc_mock_certified_zhangsan_001';

const DEFAULT_COURSE_PARS = Array.from({ length: 18 }, () => 4);
const DEFAULT_NINE_PARS = Array.from({ length: 9 }, () => 4);

const JINGJINJI_COURSE_SEEDS = [
  ['course_bj_beijing_gc', '北京高尔夫俱乐部', '北京', '北京', '顺义区'],
  ['course_bj_country', '北京乡村高尔夫俱乐部', '北京', '北京', '顺义区'],
  ['course_bj_beichen', '北京北辰高尔夫俱乐部', '北京', '北京', '朝阳区'],
  ['course_bj_huanggang', '北京黄港国际高尔夫俱乐部', '北京', '北京', '朝阳区'],
  ['course_bj_grand_canal', '北京大运河高尔夫俱乐部', '北京', '北京', '通州区'],
  ['course_bj_longxi', '北京龙熙温泉高尔夫俱乐部', '北京', '北京', '大兴区'],
  ['course_bj_orient_pearl', '北京东方明珠乡村高尔夫俱乐部', '北京', '北京', '顺义区'],
  ['course_bj_changyang', '北京长阳国际高尔夫俱乐部', '北京', '北京', '房山区'],
  ['course_bj_golden_river', '北京金色河畔高尔夫俱乐部', '北京', '北京', '朝阳区'],
  ['course_bj_orient_sun_city', '北京东方太阳城高尔夫俱乐部', '北京', '北京', '顺义区'],
  ['course_bj_honghua', '北京鸿华国际高尔夫俱乐部', '北京', '北京', '朝阳区'],
  ['course_bj_cbd', '北京CBD国际高尔夫俱乐部', '北京', '北京', '朝阳区'],
  ['course_bj_lake_9', '北湖9号国际高尔夫俱乐部', '北京', '北京', '朝阳区'],
  ['course_bj_reignwood', '华彬庄园国际高尔夫俱乐部', '北京', '北京', '昌平区'],
  ['course_bj_yanqi_lake', '通盈雁栖湖高尔夫俱乐部', '北京', '北京', '怀柔区'],
  ['course_bj_nicklaus', '北京尼克劳斯俱乐部', '北京', '北京', '通州区'],
  ['course_bj_qinghewan', '清河湾高尔夫乡村俱乐部', '北京', '北京', '昌平区'],
  ['course_bj_tianan_holiday', '北京天安假日高尔夫俱乐部', '北京', '北京', '大兴区'],
  ['course_bj_orient_tianxing', '北京东方天星乡村俱乐部', '北京', '北京', '朝阳区'],
  ['course_bj_jindi', '北京金帝高尔夫俱乐部', '北京', '北京', '房山区'],
  ['course_bj_yuyang', '北京渔阳国际高尔夫俱乐部', '北京', '北京', '平谷区'],
  ['course_bj_yanxi', '北京燕西高尔夫俱乐部', '北京', '北京', '海淀区'],
  ['course_bj_bojueyuan', '北京伯爵园高尔夫俱乐部', '北京', '北京', '顺义区'],
  ['course_tj_international_hot_spring', '天津国际温泉高尔夫球会', '天津', '天津', '空港经济区'],
  ['course_tj_warner', '天津华纳国际高尔夫俱乐部', '天津', '天津', '滨海新区'],
  ['course_tj_panshan', '天津蓟县盘山高尔夫俱乐部', '天津', '天津', '蓟州区'],
  ['course_tj_yangliuqing', '天津杨柳青森林高尔夫球会', '天津', '天津', '西青区'],
  ['course_tj_tuanbo_lake', '天津松江团泊湖高尔夫俱乐部', '天津', '天津', '静海区'],
  ['course_tj_kingkey', '天津京基乡村高尔夫俱乐部', '天津', '天津', '津南区'],
  ['course_tj_longhai', '天津生态城国际乡村俱乐部', '天津', '天津', '滨海新区'],
  ['course_tj_aroma', '天津阿罗马高尔夫俱乐部', '天津', '天津', '滨海新区'],
  ['course_tj_binhai_forest', '天津滨海森林高尔夫俱乐部', '天津', '天津', '滨海新区'],
  ['course_hebei_huatang', '华堂国际高尔夫俱乐部', '河北', '廊坊', '三河'],
  ['course_hebei_zhuozhou_jingnan', '涿州京南乡村俱乐部', '河北', '保定', '涿州'],
  ['course_hebei_tokyo_abc', '涿州东京都高尔夫俱乐部ABC场', '河北', '保定', '涿州'],
  ['course_hebei_jingdu_ab', '涿州京都高尔夫俱乐部AB场', '河北', '保定', '涿州'],
  ['course_hebei_jingdu_cdef', '涿州京都高尔夫俱乐部CDEF场', '河北', '保定', '涿州'],
  ['course_hebei_zhongcheng', '石家庄众诚国际高尔夫俱乐部', '河北', '石家庄', ''],
  ['course_hebei_fenghe', '廊坊凤河国际高尔夫俱乐部', '河北', '廊坊', ''],
  ['course_hebei_elite_a', '新奥艾力枫社高尔夫俱乐部A场', '河北', '廊坊', ''],
  ['course_hebei_elite_b', '新奥艾力枫社高尔夫俱乐部B场', '河北', '廊坊', ''],
  ['course_hebei_songshi', '松石高尔夫俱乐部', '河北', '廊坊', ''],
  ['course_hebei_qhd_poly', '秦皇岛保利高尔夫俱乐部', '河北', '秦皇岛', ''],
  ['course_hebei_gold_coast_forest', '荣盛黄金海岸森林高尔夫俱乐部', '河北', '秦皇岛', ''],
  ['course_hebei_meilu', '美芦庄园高尔夫球会', '河北', '保定', ''],
  ['course_hebei_tangshan_nanhu', '唐山南湖国际高尔夫俱乐部', '河北', '唐山', ''],
  ['course_hebei_caofeidian_wetland', '唐山曹妃甸湿地国际高尔夫俱乐部', '河北', '唐山', ''],
  ['course_hebei_caofei_lake', '唐山曹妃湖高尔夫俱乐部', '河北', '唐山', ''],
  ['course_hebei_cangzhou_mingren', '沧州名人高尔夫俱乐部', '河北', '沧州', ''],
  ['course_hebei_hutuohe', '石家庄滹沱河高尔夫俱乐部', '河北', '石家庄', ''],
  ['course_hebei_jinghua', '京华高尔夫俱乐部', '河北', '廊坊', '燕郊'],
  ['course_hebei_dazong', '大宗高尔夫俱乐部', '河北', '廊坊', '燕郊']
];

function buildCourse(id, name, province, city, pars, features, address = '', latitude = '', longitude = '') {
  const holeCount = pars.length;
  return {
    _id: id,
    name,
    province,
    city,
    address,
    latitude,
    longitude,
    holeCount,
    pars,
    totalPar: pars.reduce((sum, par) => sum + Number(par || 0), 0),
    features,
    holeMaps: pars.map((par, index) => ({
      holeNumber: index + 1,
      par,
      mapUrl: '',
      note: ''
    })),
    dataSource: 'mock_seed',
    status: 'active',
    createdAt: '2026-07-31T00:00:00.000Z',
    updatedAt: '2026-07-31T00:00:00.000Z'
  };
}

function buildRegionalCourse([id, name, province, city, address]) {
  const front = { name: '前9', pars: DEFAULT_NINE_PARS, totalPar: 36 };
  const back = { name: '后9', pars: DEFAULT_NINE_PARS, totalPar: 36 };
  const pars = [...front.pars, ...back.pars];
  return {
    ...buildCourse(
      id,
      name,
      province,
      city,
      pars,
      '京津冀球场库第一版；逐洞标准杆为 Par36+36 占位，老板可在后台按实际记分卡修正。',
      address
    ),
    nineHoleCourses: [front, back],
    courseCombinations: [{
      name: '前9+后9',
      parts: ['前9', '后9'],
      pars,
      holeCount: 18,
      totalPar: 72
    }],
    dataSource: 'regional_seed_2026'
  };
}

function getDefaultCourses() {
  return [
    buildCourse(
      'course_golfact_range',
      'Golfact 练习场',
      '上海',
      '上海',
      [4, 4, 3, 5, 4, 4, 3, 5, 4, 4, 4, 3, 5, 4, 4, 3, 5, 4],
      '练习场活动示范球场，适合室外打位与会员练习记录。'
    ),
    buildCourse(
      'course_shanghai_silport',
      '上海旭宝高尔夫俱乐部',
      '上海',
      '上海',
      [4, 5, 4, 3, 4, 4, 5, 3, 4, 4, 4, 3, 5, 4, 4, 5, 3, 4],
      '华东常见会员活动球场，球道变化丰富，适合活动成绩录入示范。'
    ),
    buildCourse(
      'course_shanghai_sheshan',
      '上海佘山高尔夫俱乐部',
      '上海',
      '上海',
      [4, 5, 3, 4, 4, 4, 5, 3, 4, 4, 4, 5, 3, 4, 4, 3, 5, 4],
      '锦标赛知名球场，起伏和水障碍较多，适合秋の认证示范。'
    ),
    buildCourse(
      'course_shanghai_links',
      '上海林克司高尔夫乡村俱乐部',
      '上海',
      '上海',
      [4, 4, 5, 3, 4, 4, 3, 5, 4, 5, 4, 4, 3, 4, 5, 4, 3, 4],
      '林克司风格示范球场，风向和球道策略影响较明显。'
    ),
    buildCourse(
      'course_other_default',
      '其他球场',
      '',
      '',
      DEFAULT_COURSE_PARS,
      '临时占位球场。公共数据缺失时可先用默认标准杆，老板后续手动维护。'
    ),
    ...JINGJINJI_COURSE_SEEDS.map(buildRegionalCourse)
  ];
}

function buildMockCertifiedScorecard() {
  const pars = [4, 5, 4, 3, 4, 4, 5, 3, 4, 4, 4, 3, 5, 4, 4, 5, 3, 4];
  const strokes = [4, 4, 5, 3, 3, 4, 5, 2, 4, 5, 4, 3, 4, 4, 6, 5, 3, 4];
  const holes = pars.map((par, index) => ({
    holeNumber: index + 1,
    par,
    strokes: strokes[index],
    putts: index % 3 === 0 ? 1 : 2,
    penalties: index === 14 ? 1 : 0
  }));
  const totalPar = holes.reduce((sum, hole) => sum + hole.par, 0);
  const totalStrokes = holes.reduce((sum, hole) => sum + hole.strokes, 0);
  const totalPutts = holes.reduce((sum, hole) => sum + hole.putts, 0);
  const totalPenalties = holes.reduce((sum, hole) => sum + hole.penalties, 0);

  return {
    _id: MOCK_CERTIFIED_SCORECARD_ID,
    userId: 'user_001',
    activityId: 'act_001',
    courseName: '上海旭宝高尔夫俱乐部',
    playDate: '2026-07-26',
    holes,
    totalPar,
    totalStrokes,
    scoreToPar: totalStrokes - totalPar,
    totalPutts,
    totalPenalties,
    status: 'submitted',
    recordedType: 'activity_admin',
    recordedBy: 'admin',
    createdAt: '2026-07-26T10:30:00.000Z',
    updatedAt: '2026-07-26T10:30:00.000Z'
  };
}

function generateTimeSlots(date) {
  const slots = [];
  const startHour = 5;
  const endHour = 24;
  const bays = getBays();
  
  bays.forEach(bay => {
    for (let h = startHour; h < endHour; h++) {
      for (let m = 0; m < 60; m += 30) {
        const startTime = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        const endMin = m + 30;
        const endH = endMin >= 60 ? h + 1 : h;
        const endM = endMin >= 60 ? 0 : endMin;
        const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
        
        const isTeaching = h >= 17 && h <= 19;
        const isBooked = isMockBookedSlot(bay._id, startTime);
        
        slots.push({
          _id: `slot_${bay._id}_${date}_${startTime.replace(':', '')}`,
          bayId: bay._id,
          date,
          startTime,
          endTime,
          slotMinutes: 30,
          type: isTeaching ? 'teaching' : 'self',
          basePrice: isTeaching ? 280 : 120,
          discount: 1,
          finalPrice: isTeaching ? 280 : 120,
          capacity: 1,
          isOpen: true,
          isBooked,
          coachId: isTeaching ? 'coach_001' : null
        });
      }
    }
  });
  
  return slots;
}

function isMockBookedSlot(bayId, startTime) {
  const bookedMap = {
    bay_001: ['07:00', '07:30', '18:30', '19:00', '22:30', '23:00'],
    bay_002: ['05:30', '06:00', '10:00', '10:30', '15:00', '15:30', '21:00', '21:30']
  };
  return (bookedMap[bayId] || []).includes(startTime);
}

function initMockData() {
  // 场地配置
  if (!wx.getStorageSync(STORAGE_KEYS.SETTINGS)) {
    wx.setStorageSync(STORAGE_KEYS.SETTINGS, {
      site: {
        tenantId: 'golfact_default',
        name: 'Golfact 高尔夫练习场',
        logoUrl: '',
        signboardUrl: '',
        phone: '13800138000',
        address: '上海市浦东新区',
        notice: '欢迎预约打球，请提前 2 小时取消预约'
      },
      theme: {
        primaryColor: '#22C55E'
      },
      businessHours: {
        open: '05:00',
        close: '24:00',
        slotMinutes: 30
      },
      bookingRules: {
        minSlots: 2,
        maxDailyHours: 4
      },
      noShowRule: {
        thresholdHours: 2,
        maxPerPeriod: 1,
        periodMonths: 1,
        defaultMode: 'ratio',
        defaultValue: 50,
        settlementConfirmHours: 48,
        noShowMultiplier: 1.5
      },
      coachGlobalRate: 300,
      memberLevels: [
        { level: 'normal', name: '普通会员', minRecharge: 0, discount: 1 },
        { level: 'silver', name: '银卡会员', minRecharge: 3000, discount: 0.95 },
        { level: 'gold', name: '金卡会员', minRecharge: 8000, discount: 0.9 }
      ],
      accessCode: {
        type: 'static',
        code: '888888'
      }
    });
  } else {
    const settings = wx.getStorageSync(STORAGE_KEYS.SETTINGS);
    settings.businessHours = {
      ...(settings.businessHours || {}),
      open: '05:00',
      close: '24:00',
      slotMinutes: 30
    };
    settings.noShowRule = {
      settlementConfirmHours: 48,
      noShowMultiplier: 1.5,
      ...(settings.noShowRule || {})
    };
    wx.setStorageSync(STORAGE_KEYS.SETTINGS, settings);
  }

  // 当前用户
  if (!wx.getStorageSync(STORAGE_KEYS.CURRENT_USER)) {
    const currentUser = {
      _id: 'user_001',
      openid: 'mock_openid_001',
      nickname: '高尔夫爱好者',
      avatarUrl: '',
      name: '张三',
      phone: '13800138001',
      role: 'user',
      memberLevel: 'silver',
      coachIds: ['coach_001'],
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
      }
    };
    wx.setStorageSync(STORAGE_KEYS.CURRENT_USER, currentUser);
  }

  // 用户列表
  if (!wx.getStorageSync(STORAGE_KEYS.USERS)) {
    wx.setStorageSync(STORAGE_KEYS.USERS, [
      wx.getStorageSync(STORAGE_KEYS.CURRENT_USER),
      {
        _id: 'user_002',
        openid: 'mock_openid_002',
        nickname: '练习会员',
        avatarUrl: '',
        name: '李四',
        phone: '13800138002',
        role: 'user',
        memberLevel: 'normal',
        coachIds: ['coach_002'],
        remainingHours: 3,
        totalRechargedHours: 8,
        totalTrainedHours: 5,
        totalSpent: 0,
        currentNoShowCount: 0,
        status: 'active',
        golfStats: {
          last5Best: 82,
          last5Avg: 86,
          personalBest: 80,
          roundsCount: 3
        }
      }
    ]);
  }

  // 打位
  if (!wx.getStorageSync(STORAGE_KEYS.BAYS)) {
    wx.setStorageSync(STORAGE_KEYS.BAYS, [
      { _id: 'bay_001', code: 'A1', name: '1号打位', status: 'active', displayOrder: 1 },
      { _id: 'bay_002', code: 'A2', name: '2号打位', status: 'active', displayOrder: 2 }
    ]);
  }

  // 教练
  if (!wx.getStorageSync(STORAGE_KEYS.COACHES)) {
    wx.setStorageSync(STORAGE_KEYS.COACHES, [
      {
        _id: 'coach_001',
        name: '李教练',
        photoUrl: '',
        intro: '10年教学经验，擅长短杆和推杆',
        tags: ['短杆', '推杆'],
        hourlyRate: 300,
        useGlobalRate: true,
        status: 'active'
      },
      {
        _id: 'coach_002',
        name: '王教练',
        photoUrl: '',
        intro: '青少年高尔夫培训专家',
        tags: ['青少年', '体能'],
        hourlyRate: 350,
        useGlobalRate: false,
        status: 'active'
      }
    ]);
  }

  // 商品分类
  if (!wx.getStorageSync(STORAGE_KEYS.CATEGORIES)) {
    wx.setStorageSync(STORAGE_KEYS.CATEGORIES, [
      { _id: 'cat_001', name: '水', displayOrder: 1, status: 'active' },
      { _id: 'cat_002', name: '点心', displayOrder: 2, status: 'active' },
      { _id: 'cat_003', name: '衣服', displayOrder: 3, status: 'active' },
      { _id: 'cat_004', name: '装备', displayOrder: 4, status: 'active' }
    ]);
  }

  // 商品
  if (!wx.getStorageSync(STORAGE_KEYS.PRODUCTS)) {
    wx.setStorageSync(STORAGE_KEYS.PRODUCTS, [
      { _id: 'prod_001', name: '矿泉水', categoryId: 'cat_001', price: 5, unit: '瓶', stock: 100, status: 'on_sale' },
      { _id: 'prod_002', name: '运动饮料', categoryId: 'cat_001', price: 8, unit: '瓶', stock: 80, status: 'on_sale' },
      { _id: 'prod_003', name: '能量棒', categoryId: 'cat_002', price: 12, unit: '根', stock: 50, status: 'on_sale' },
      { _id: 'prod_004', name: '高尔夫手套', categoryId: 'cat_004', price: 68, unit: '只', stock: 20, status: 'on_sale' }
    ]);
  }

  // 充值记录
  if (!wx.getStorageSync(STORAGE_KEYS.RECHARGES)) {
    wx.setStorageSync(STORAGE_KEYS.RECHARGES, [
      {
        _id: 'recharge_001',
        userId: 'user_001',
        hours: 20,
        usedHours: 12.5,
        remainingHours: 7.5,
        expiryDate: '2026-12-31',
        amount: 0,
        status: 'valid',
        createdAt: '2026-07-01T10:00:00.000Z'
      },
      {
        _id: 'recharge_002',
        userId: 'user_001',
        hours: 10,
        usedHours: 5,
        remainingHours: 5,
        expiryDate: '2026-09-30',
        amount: 0,
        status: 'valid',
        createdAt: '2026-07-15T10:00:00.000Z'
      }
    ]);
  }

  // 充时卡/权益码
  if (!wx.getStorageSync(STORAGE_KEYS.VOUCHERS)) {
    wx.setStorageSync(STORAGE_KEYS.VOUCHERS, []);
  }

  // 预约记录
  if (!wx.getStorageSync(STORAGE_KEYS.APPOINTMENTS)) {
    wx.setStorageSync(STORAGE_KEYS.APPOINTMENTS, []);
  }

  // 记分卡记录
  if (!wx.getStorageSync(STORAGE_KEYS.SCORECARDS)) {
    wx.setStorageSync(STORAGE_KEYS.SCORECARDS, []);
  }
  ensureMockCertifiedScorecard();

  // 球场基础库
  if (!wx.getStorageSync(STORAGE_KEYS.COURSES)) {
    wx.setStorageSync(STORAGE_KEYS.COURSES, getDefaultCourses());
  }
  ensureMockCourses();

  // 活动成绩记录
  if (!wx.getStorageSync(STORAGE_KEYS.ACTIVITY_RECORDS)) {
    wx.setStorageSync(STORAGE_KEYS.ACTIVITY_RECORDS, []);
  }

  // 生成未来 7 天的时段
  const existingSlots = wx.getStorageSync(STORAGE_KEYS.SLOTS) || [];
  const slotsVersion = wx.getStorageSync(STORAGE_KEYS.SLOTS_VERSION);
  const shouldRegenerateSlots = slotsVersion !== MOCK_SLOTS_VERSION || existingSlots.length === 0 || !existingSlots.some(slot => slot.startTime === '05:00');
  if (shouldRegenerateSlots) {
    const slots = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      slots.push(...generateTimeSlots(dateStr));
    }
    wx.setStorageSync(STORAGE_KEYS.SLOTS, slots);
    wx.setStorageSync(STORAGE_KEYS.SLOTS_VERSION, MOCK_SLOTS_VERSION);
  }

  // 活动
  if (!wx.getStorageSync(STORAGE_KEYS.ACTIVITIES)) {
    wx.setStorageSync(STORAGE_KEYS.ACTIVITIES, [
      {
        _id: 'act_001',
        title: '周末下场活动',
        type: 'event',
        courseId: 'course_shanghai_silport',
        location: '上海旭宝高尔夫俱乐部',
        startTime: '2026-07-26T07:00:00.000Z',
        endTime: '2026-07-26T15:00:00.000Z',
        signupStartTime: '2026-07-10T00:00:00.000Z',
        signupEndTime: '2026-07-25T18:00:00.000Z',
        itinerary: '07:00 集合出发，09:00 开球，14:00 简餐复盘。',
        meal: '含赛后简餐和饮品',
        fee: 880,
        maxParticipants: 20,
        registrations: [
          {
            userId: 'user_001',
            name: '张三',
            status: 'approved',
            createdAt: '2026-07-18T10:00:00.000Z',
            updatedAt: '2026-07-18T10:30:00.000Z'
          }
        ],
        participants: ['user_001'],
        status: 'upcoming',
        description: '周日上午下场，费用含球童小费'
      }
    ]);
  }
  ensureMockActivityDefaults();
}

function ensureMockCertifiedScorecard() {
  const scorecards = wx.getStorageSync(STORAGE_KEYS.SCORECARDS) || [];
  const exists = scorecards.some(item => item._id === MOCK_CERTIFIED_SCORECARD_ID);
  if (exists) return;
  scorecards.push(buildMockCertifiedScorecard());
  wx.setStorageSync(STORAGE_KEYS.SCORECARDS, scorecards);
}

function ensureMockActivityDefaults() {
  const activities = wx.getStorageSync(STORAGE_KEYS.ACTIVITIES) || [];
  const activity = activities.find(item => item._id === 'act_001');
  if (!activity) return;
  const registrations = activity.registrations || [
    {
      userId: 'user_001',
      name: '张三',
      status: 'approved',
      createdAt: '2026-07-18T10:00:00.000Z',
      updatedAt: '2026-07-18T10:30:00.000Z'
    }
  ];
  Object.assign(activity, {
    location: activity.location || '上海旭宝高尔夫俱乐部',
    courseId: activity.courseId || 'course_shanghai_silport',
    endTime: activity.endTime || '2026-07-26T15:00:00.000Z',
    signupStartTime: activity.signupStartTime || '2026-07-10T00:00:00.000Z',
    signupEndTime: activity.signupEndTime || '2026-07-25T18:00:00.000Z',
    itinerary: activity.itinerary || '07:00 集合出发，09:00 开球，14:00 简餐复盘。',
    meal: activity.meal || '含赛后简餐和饮品',
    registrations,
    participants: registrations.filter(item => item.status === 'approved').map(item => item.userId)
  });
  wx.setStorageSync(STORAGE_KEYS.ACTIVITIES, activities);
}

function normalizeCourse(data) {
  const pars = parseCoursePars(data.pars || data.parsText || DEFAULT_COURSE_PARS);
  const holeCount = Number(data.holeCount || pars.length || 18);
  const nineHoleCourses = Array.isArray(data.nineHoleCourses) ? data.nineHoleCourses : [];
  const courseCombinations = Array.isArray(data.courseCombinations) ? data.courseCombinations : [];
  return {
    name: data.name || '未命名球场',
    province: data.province || '',
    city: data.city || '',
    address: data.address || '',
    latitude: data.latitude || '',
    longitude: data.longitude || '',
    holeCount,
    pars,
    totalPar: pars.reduce((sum, par) => sum + Number(par || 0), 0),
    nineHoleCourses,
    courseCombinations,
    features: data.features || '',
    holeMaps: (data.holeMaps || pars.map((par, index) => ({
      holeNumber: index + 1,
      par,
      mapUrl: '',
      note: ''
    }))).map((hole, index) => ({
      holeNumber: hole.holeNumber || index + 1,
      par: Number(hole.par || pars[index] || 4),
      mapUrl: hole.mapUrl || '',
      note: hole.note || ''
    })),
    dataSource: data.dataSource || 'manual',
    status: data.status || 'active'
  };
}

function parseCoursePars(value) {
  if (Array.isArray(value)) {
    return value.map(item => Number(item || 4)).slice(0, 18);
  }
  const list = String(value || '')
    .split(/[\s,，、/]+/)
    .map(item => Number(item))
    .filter(item => item > 0);
  const pars = list.length > 0 ? list : DEFAULT_COURSE_PARS;
  while (pars.length < 18) pars.push(4);
  return pars.slice(0, 18);
}

function ensureMockCourses() {
  const courses = wx.getStorageSync(STORAGE_KEYS.COURSES) || [];
  const defaults = getDefaultCourses();
  defaults.forEach(defaultCourse => {
    const exists = courses.some(item => item._id === defaultCourse._id || item.name === defaultCourse.name);
    if (!exists) courses.push(defaultCourse);
  });
  wx.setStorageSync(STORAGE_KEYS.COURSES, courses);
}

function getCourses() {
  return (wx.getStorageSync(STORAGE_KEYS.COURSES) || [])
    .filter(item => item.status !== 'deleted')
    .sort((a, b) => String(a.city || '').localeCompare(String(b.city || ''), 'zh-Hans') || String(a.name || '').localeCompare(String(b.name || ''), 'zh-Hans'));
}

function saveCourse(data) {
  const courses = wx.getStorageSync(STORAGE_KEYS.COURSES) || [];
  const now = new Date().toISOString();
  const patch = normalizeCourse(data);
  const index = courses.findIndex(item => item._id === data._id);
  if (index >= 0) {
    courses[index] = {
      ...courses[index],
      ...patch,
      updatedAt: now
    };
    wx.setStorageSync(STORAGE_KEYS.COURSES, courses);
    return { success: true, data: courses[index] };
  }

  const course = {
    _id: `course_${Date.now()}`,
    ...patch,
    createdAt: now,
    updatedAt: now
  };
  courses.push(course);
  wx.setStorageSync(STORAGE_KEYS.COURSES, courses);
  return { success: true, data: course };
}

function deleteCourse(id) {
  const courses = wx.getStorageSync(STORAGE_KEYS.COURSES) || [];
  const course = courses.find(item => item._id === id);
  if (!course) return { success: false, message: '球场不存在' };
  course.status = 'deleted';
  course.updatedAt = new Date().toISOString();
  wx.setStorageSync(STORAGE_KEYS.COURSES, courses);
  return { success: true, data: course };
}

function getSettings() {
  return wx.getStorageSync(STORAGE_KEYS.SETTINGS) || {};
}

function updateSettings(patch) {
  const settings = getSettings();
  const next = {
    ...settings,
    ...patch,
    noShowRule: {
      ...(settings.noShowRule || {}),
      ...(patch.noShowRule || {})
    },
    bookingRules: {
      ...(settings.bookingRules || {}),
      ...(patch.bookingRules || {})
    },
    businessHours: {
      ...(settings.businessHours || {}),
      ...(patch.businessHours || {})
    }
  };
  wx.setStorageSync(STORAGE_KEYS.SETTINGS, next);
  return { success: true, data: next };
}

function getCurrentUser() {
  const user = wx.getStorageSync(STORAGE_KEYS.CURRENT_USER) || null;
  if (user && !user.coachIds) {
    user.coachIds = ['coach_001'];
    wx.setStorageSync(STORAGE_KEYS.CURRENT_USER, user);
  }
  return user;
}

function getUsers() {
  const users = wx.getStorageSync(STORAGE_KEYS.USERS) || [];
  const currentUser = getCurrentUser();
  users.forEach(user => {
    if (!user.coachIds) user.coachIds = user._id === 'user_001' ? ['coach_001'] : [];
    if (!user.status) user.status = 'active';
  });
  if (users.length > 0) wx.setStorageSync(STORAGE_KEYS.USERS, users);
  if (users.length === 0 && currentUser) return [currentUser];
  return users.filter(user => user.status !== 'deleted');
}

function saveUser(data) {
  const users = wx.getStorageSync(STORAGE_KEYS.USERS) || [];
  const now = new Date().toISOString();
  const name = String(data.name || '').trim();
  if (!name) return { success: false, error: '会员姓名不能为空' };

  if (data._id) {
    const user = users.find(item => item._id === data._id);
    if (!user) return { success: false, error: '用户不存在' };
    Object.assign(user, {
      name,
      nickname: data.nickname || name,
      phone: data.phone || '',
      memberLevel: data.memberLevel || user.memberLevel || 'normal',
      status: data.status || user.status || 'active',
      updatedAt: now
    });
    wx.setStorageSync(STORAGE_KEYS.USERS, users);
    syncCurrentUser(user);
    return { success: true, data: user };
  }

  const user = {
    _id: `user_${Date.now()}`,
    openid: '',
    nickname: data.nickname || name,
    avatarUrl: '',
    name,
    phone: data.phone || '',
    role: 'user',
    memberLevel: data.memberLevel || 'normal',
    coachIds: [],
    remainingHours: Number(data.remainingHours || 0),
    totalRechargedHours: Number(data.totalRechargedHours || 0),
    totalTrainedHours: 0,
    totalSpent: 0,
    currentNoShowCount: 0,
    status: data.status || 'active',
    golfStats: {
      last5Best: 0,
      last5Avg: 0,
      personalBest: 0,
      roundsCount: 0
    },
    createdAt: now,
    updatedAt: now
  };
  users.push(user);
  wx.setStorageSync(STORAGE_KEYS.USERS, users);
  return { success: true, data: user };
}

function updateUserStatus(userId, status) {
  const users = wx.getStorageSync(STORAGE_KEYS.USERS) || [];
  const user = users.find(item => item._id === userId);
  if (!user) return { success: false, error: '用户不存在' };
  user.status = status;
  user.updatedAt = new Date().toISOString();
  wx.setStorageSync(STORAGE_KEYS.USERS, users);
  syncCurrentUser(user);
  return { success: true, data: user };
}

function deleteUser(userId) {
  return updateUserStatus(userId, 'deleted');
}

function syncCurrentUser(user) {
  const currentUser = getCurrentUser();
  if (currentUser && currentUser._id === user._id) {
    wx.setStorageSync(STORAGE_KEYS.CURRENT_USER, user);
  }
}

function getLinkedCoaches(userId) {
  const users = getUsers();
  const user = users.find(item => item._id === userId) || getCurrentUser();
  const coachIds = user?.coachIds || [];
  return getCoaches().filter(coach => coachIds.includes(coach._id));
}

function updateUserCoaches(userId, coachIds) {
  const users = getUsers();
  const user = users.find(item => item._id === userId);
  if (!user) return { success: false, error: '用户不存在' };

  user.coachIds = coachIds;
  wx.setStorageSync(STORAGE_KEYS.USERS, users);

  const currentUser = getCurrentUser();
  if (currentUser && currentUser._id === userId) {
    currentUser.coachIds = coachIds;
    wx.setStorageSync(STORAGE_KEYS.CURRENT_USER, currentUser);
  }

  return { success: true, data: user };
}

function getBays() {
  return (wx.getStorageSync(STORAGE_KEYS.BAYS) || []).filter(item => item.status !== 'deleted');
}

function getCoaches() {
  return (wx.getStorageSync(STORAGE_KEYS.COACHES) || []).filter(item => item.status !== 'deleted');
}

function saveBay(data) {
  const bays = wx.getStorageSync(STORAGE_KEYS.BAYS) || [];
  const now = new Date().toISOString();
  const payload = {
    ...data,
    code: data.code || data.name || 'BAY',
    name: data.name || data.code || '未命名打位',
    displayOrder: Number(data.displayOrder || 0),
    status: data.status || 'active',
    updatedAt: now
  };
  if (payload._id) {
    const index = bays.findIndex(item => item._id === payload._id);
    if (index >= 0) bays[index] = { ...bays[index], ...payload };
    else bays.push({ ...payload, createdAt: now });
  } else {
    bays.push({ ...payload, _id: `bay_${Date.now()}`, createdAt: now });
  }
  wx.setStorageSync(STORAGE_KEYS.BAYS, bays);
  return { success: true, data: payload };
}

function deleteBay(id) {
  return saveBay({ _id: id, status: 'deleted' });
}

function getTimeSlots(date, bayId, type) {
  let slots = wx.getStorageSync(STORAGE_KEYS.SLOTS) || [];
  if (date) slots = slots.filter(s => s.date === date);
  if (bayId) slots = slots.filter(s => s.bayId === bayId);
  if (type) slots = slots.filter(s => s.type === type);
  return slots;
}

function saveTimeSlot(data) {
  const slots = wx.getStorageSync(STORAGE_KEYS.SLOTS) || [];
  const now = new Date().toISOString();
  const payload = {
    ...data,
    slotMinutes: Number(data.slotMinutes || 30),
    basePrice: Number(data.basePrice || 0),
    discount: Number(data.discount || 1),
    finalPrice: Number(data.finalPrice || data.basePrice || 0),
    capacity: Number(data.capacity || 1),
    isOpen: data.isOpen !== false,
    isBooked: data.isBooked === true,
    updatedAt: now
  };
  if (payload._id) {
    const index = slots.findIndex(item => item._id === payload._id);
    if (index >= 0) slots[index] = { ...slots[index], ...payload };
    else slots.push({ ...payload, createdAt: now });
  } else {
    slots.push({ ...payload, _id: `slot_${Date.now()}`, createdAt: now });
  }
  wx.setStorageSync(STORAGE_KEYS.SLOTS, slots);
  return { success: true, data: payload };
}

function getAppointments(userId) {
  settleExpiredAppointments();
  let list = wx.getStorageSync(STORAGE_KEYS.APPOINTMENTS) || [];
  if (userId) list = list.filter(a => a.userId === userId);
  return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function updateAppointmentStatus(id, status) {
  const appointments = getAppointments();
  const appointment = appointments.find(a => a._id === id);
  if (!appointment) return { success: false, error: '预约不存在' };

  const now = new Date().toISOString();
  const previousStatus = appointment.status;
  appointment.status = status;
  appointment.settledAt = now;
  if (status === 'cancelled') {
    appointment.cancelledAt = now;
    if (previousStatus === 'booked' && !appointment.refundedAt) {
      refundAppointmentHours(appointment);
      releaseAppointmentSlots(appointment);
      appointment.refundedAt = now;
    }
  }
  if (status === 'no_show') {
    appointment.isNoShow = true;
    applyNoShowPenalty(appointment);
  }
  if (status === 'completed') {
    appointment.settlementMode = appointment.settlementMode || 'manual';
  }
  if (status === 'cancelled') {
    appointment.settlementMode = 'cancelled';
  }

  wx.setStorageSync(STORAGE_KEYS.APPOINTMENTS, appointments);
  return { success: true, data: appointment };
}

function updateUserHourBalance(userId, delta, options = {}) {
  const users = wx.getStorageSync(STORAGE_KEYS.USERS) || [];
  const user = users.find(u => u._id === userId) || getCurrentUser();
  if (!user) return null;

  user.remainingHours = Number(Math.max((user.remainingHours || 0) + delta, 0).toFixed(2));
  if (options.totalTrainedDelta) {
    user.totalTrainedHours = Number(Math.max((user.totalTrainedHours || 0) + options.totalTrainedDelta, 0).toFixed(2));
  }
  if (options.totalRechargedDelta) {
    user.totalRechargedHours = Number(Math.max((user.totalRechargedHours || 0) + options.totalRechargedDelta, 0).toFixed(2));
  }

  const index = users.findIndex(u => u._id === user._id);
  if (index >= 0) {
    users[index] = user;
    wx.setStorageSync(STORAGE_KEYS.USERS, users);
  }

  const currentUser = getCurrentUser();
  if (currentUser && currentUser._id === user._id) {
    wx.setStorageSync(STORAGE_KEYS.CURRENT_USER, user);
  }
  return user;
}

function refundAppointmentHours(appointment) {
  const hours = appointment.deductedHours || appointment.duration || 0;
  if (hours <= 0) return;
  updateUserHourBalance(appointment.userId, hours, {
    totalTrainedDelta: -Math.abs(appointment.duration || hours)
  });
}

function releaseAppointmentSlots(appointment) {
  const slotIds = appointment.timeSlotIds || [];
  if (slotIds.length === 0) return;

  const slots = getTimeSlots();
  slotIds.forEach(slotId => {
    const slot = slots.find(s => s._id === slotId);
    if (slot) slot.isBooked = false;
  });
  wx.setStorageSync(STORAGE_KEYS.SLOTS, slots);
}

function getAppointmentEndDate(appointment) {
  if (!appointment.date || !appointment.endTime) return null;
  const end = new Date(`${appointment.date}T${appointment.endTime}:00`);
  return Number.isNaN(end.getTime()) ? null : end;
}

function settleExpiredAppointments() {
  const appointments = wx.getStorageSync(STORAGE_KEYS.APPOINTMENTS) || [];
  const settings = getSettings();
  const confirmHours = settings.noShowRule?.settlementConfirmHours || 48;
  const now = new Date();
  let changed = false;

  appointments.forEach(appointment => {
    if (appointment.status !== 'booked') return;
    const end = getAppointmentEndDate(appointment);
    if (!end) return;

    const confirmUntil = new Date(end.getTime() + confirmHours * 60 * 60 * 1000);
    if (now > confirmUntil) {
      appointment.status = 'completed';
      appointment.settlementMode = 'auto_no_dispute';
      appointment.settledAt = now.toISOString();
      changed = true;
    }
  });

  if (changed) {
    wx.setStorageSync(STORAGE_KEYS.APPOINTMENTS, appointments);
  }
}

function applyNoShowPenalty(appointment) {
  const settings = getSettings();
  const multiplier = settings.noShowRule?.noShowMultiplier || 1.5;
  const baseHours = appointment.originalDeductedHours || appointment.duration || appointment.deductedHours || 0;
  const targetDeductedHours = Number((baseHours * multiplier).toFixed(2));
  const extraPenaltyHours = Number(Math.max(targetDeductedHours - (appointment.deductedHours || 0), 0).toFixed(2));

  appointment.originalDeductedHours = baseHours;
  appointment.deductedHours = targetDeductedHours;
  appointment.extraPenaltyHours = extraPenaltyHours;
  appointment.noShowMultiplier = multiplier;
  appointment.settlementMode = 'no_show';

  if (extraPenaltyHours <= 0) return;
  updateUserHourBalance(appointment.userId, -extraPenaltyHours);

  const users = wx.getStorageSync(STORAGE_KEYS.USERS) || [];
  const user = users.find(u => u._id === appointment.userId);
  if (user) {
    user.currentNoShowCount = (user.currentNoShowCount || 0) + 1;
    wx.setStorageSync(STORAGE_KEYS.USERS, users);
    const currentUser = getCurrentUser();
    if (currentUser && currentUser._id === user._id) {
      wx.setStorageSync(STORAGE_KEYS.CURRENT_USER, user);
    }
  }
}

function createAppointment(data) {
  const appointments = getAppointments();
  
  // 计算教练课时（如果选了教练）
  const appointment = {
    _id: `apt_${Date.now()}`,
    ...data,
    originalDeductedHours: data.deductedHours,
    coachHours: data.coachId ? data.duration : 0,
    coachRate: data.coachId ? (data.coachRate || 0) : 0,
    status: 'booked',
    settlementMode: 'pending',
    createdAt: new Date().toISOString()
  };
  appointments.push(appointment);
  wx.setStorageSync(STORAGE_KEYS.APPOINTMENTS, appointments);
  
  // 标记时段为已占用
  const slots = getTimeSlots();
  data.timeSlotIds.forEach(slotId => {
    const slot = slots.find(s => s._id === slotId);
    if (slot) slot.isBooked = true;
  });
  wx.setStorageSync(STORAGE_KEYS.SLOTS, slots);
  
  // 扣除用户剩余时长
  updateUserHourBalance(data.userId, -Math.abs(data.deductedHours || 0), {
    totalTrainedDelta: data.duration || 0
  });
  
  return appointment;
}

function getProducts(categoryId) {
  let list = (wx.getStorageSync(STORAGE_KEYS.PRODUCTS) || []).filter(item => item.status !== 'deleted');
  if (categoryId) list = list.filter(p => p.categoryId === categoryId);
  return list;
}

function getCategories() {
  return (wx.getStorageSync(STORAGE_KEYS.CATEGORIES) || []).filter(item => item.status !== 'deleted');
}

function saveCategory(data) {
  const categories = wx.getStorageSync(STORAGE_KEYS.CATEGORIES) || [];
  const now = new Date().toISOString();
  const payload = {
    ...data,
    name: data.name || '未命名分类',
    displayOrder: Number(data.displayOrder || 0),
    status: data.status || 'active',
    updatedAt: now
  };
  if (payload._id) {
    const index = categories.findIndex(item => item._id === payload._id);
    if (index >= 0) categories[index] = { ...categories[index], ...payload };
    else categories.push({ ...payload, createdAt: now });
  } else {
    categories.push({ ...payload, _id: `cat_${Date.now()}`, createdAt: now });
  }
  wx.setStorageSync(STORAGE_KEYS.CATEGORIES, categories);
  return { success: true, data: payload };
}

function saveProduct(data) {
  const products = wx.getStorageSync(STORAGE_KEYS.PRODUCTS) || [];
  const now = new Date().toISOString();
  const payload = {
    ...data,
    name: data.name || '未命名商品',
    price: Number(data.price || 0),
    stock: Number(data.stock || 0),
    unit: data.unit || '件',
    status: data.status || 'on_sale',
    updatedAt: now
  };
  if (payload._id) {
    const index = products.findIndex(item => item._id === payload._id);
    if (index >= 0) products[index] = { ...products[index], ...payload };
    else products.push({ ...payload, createdAt: now });
  } else {
    products.push({ ...payload, _id: `prod_${Date.now()}`, createdAt: now });
  }
  wx.setStorageSync(STORAGE_KEYS.PRODUCTS, products);
  return { success: true, data: payload };
}

function deleteProduct(id) {
  return saveProduct({ _id: id, status: 'deleted' });
}

function saveCoach(data) {
  const coaches = wx.getStorageSync(STORAGE_KEYS.COACHES) || [];
  const now = new Date().toISOString();
  const payload = {
    ...data,
    name: data.name || '未命名教练',
    tags: Array.isArray(data.tags) ? data.tags : String(data.tagsText || data.tags || '').split(/[,，、]/).map(item => item.trim()).filter(Boolean),
    hourlyRate: Number(data.hourlyRate || 0),
    useGlobalRate: data.useGlobalRate !== false,
    status: data.status || 'active',
    updatedAt: now
  };
  if (payload._id) {
    const index = coaches.findIndex(item => item._id === payload._id);
    if (index >= 0) coaches[index] = { ...coaches[index], ...payload };
    else coaches.push({ ...payload, createdAt: now });
  } else {
    coaches.push({ ...payload, _id: `coach_${Date.now()}`, createdAt: now });
  }
  wx.setStorageSync(STORAGE_KEYS.COACHES, coaches);
  return { success: true, data: payload };
}

function deleteCoach(id) {
  return saveCoach({ _id: id, status: 'deleted' });
}

function getActivities(type) {
  let list = wx.getStorageSync(STORAGE_KEYS.ACTIVITIES) || [];
  if (type) list = list.filter(a => a.type === type);
  return list.sort((a, b) => new Date(a.startTime || 0) - new Date(b.startTime || 0));
}

function normalizeActivityForm(data) {
  const maxParticipants = Number(data.maxParticipants || 0);
  return {
    title: data.title || '未命名活动',
    type: data.type || 'event',
    courseId: data.courseId || '',
    location: data.location || '',
    startTime: data.startTime || '',
    endTime: data.endTime || '',
    signupStartTime: data.signupStartTime || '',
    signupEndTime: data.signupEndTime || '',
    itinerary: data.itinerary || '',
    meal: data.meal || '',
    fee: Number(data.fee || 0),
    maxParticipants,
    description: data.description || '',
    status: data.status || 'upcoming'
  };
}

function saveActivity(data) {
  const activities = wx.getStorageSync(STORAGE_KEYS.ACTIVITIES) || [];
  const now = new Date().toISOString();
  const index = activities.findIndex(item => item._id === data._id);
  const patch = normalizeActivityForm(data);

  if (index >= 0) {
    activities[index] = {
      ...activities[index],
      ...patch,
      updatedAt: now
    };
    wx.setStorageSync(STORAGE_KEYS.ACTIVITIES, activities);
    return { success: true, data: activities[index] };
  }

  const activity = {
    _id: `act_${Date.now()}`,
    ...patch,
    registrations: [],
    participants: [],
    createdAt: now,
    updatedAt: now
  };
  activities.push(activity);
  wx.setStorageSync(STORAGE_KEYS.ACTIVITIES, activities);
  return { success: true, data: activity };
}

function deleteActivity(id) {
  const activities = wx.getStorageSync(STORAGE_KEYS.ACTIVITIES) || [];
  const index = activities.findIndex(item => item._id === id);
  if (index < 0) return { success: false, message: '活动不存在' };
  activities[index] = {
    ...activities[index],
    status: 'cancelled',
    updatedAt: new Date().toISOString()
  };
  wx.setStorageSync(STORAGE_KEYS.ACTIVITIES, activities);
  return { success: true, data: activities[index] };
}

function updateActivityStatus(id, status) {
  const activities = wx.getStorageSync(STORAGE_KEYS.ACTIVITIES) || [];
  const activity = activities.find(item => item._id === id);
  if (!activity) return { success: false, message: '活动不存在' };
  activity.status = status;
  activity.updatedAt = new Date().toISOString();
  wx.setStorageSync(STORAGE_KEYS.ACTIVITIES, activities);
  return { success: true, data: activity };
}

function registerActivity(activityId, userId) {
  const activities = wx.getStorageSync(STORAGE_KEYS.ACTIVITIES) || [];
  const users = getUsers();
  const activity = activities.find(item => item._id === activityId);
  const user = users.find(item => item._id === userId) || getCurrentUser();
  if (!activity) return { success: false, message: '活动不存在' };

  const now = new Date();
  const signupEnd = activity.signupEndTime ? new Date(activity.signupEndTime) : null;
  const approvedCount = (activity.registrations || []).filter(item => item.status === 'approved').length;
  if (activity.status !== 'upcoming') return { success: false, message: '活动暂不可报名' };
  if (signupEnd && now > signupEnd) return { success: false, message: '报名已截止' };
  if (activity.maxParticipants && approvedCount >= Number(activity.maxParticipants)) return { success: false, message: '名额已满' };

  activity.registrations = activity.registrations || [];
  const existing = activity.registrations.find(item => item.userId === userId);
  if (existing) {
    if (existing.status === 'rejected') {
      existing.status = 'pending';
      existing.updatedAt = now.toISOString();
    }
    wx.setStorageSync(STORAGE_KEYS.ACTIVITIES, activities);
    return { success: true, data: existing };
  }

  const registration = {
    userId,
    name: user.name || user.nickname || '会员',
    status: 'pending',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
  };
  activity.registrations.push(registration);
  wx.setStorageSync(STORAGE_KEYS.ACTIVITIES, activities);
  return { success: true, data: registration };
}

function updateActivityRegistration(activityId, userId, status) {
  const activities = wx.getStorageSync(STORAGE_KEYS.ACTIVITIES) || [];
  const activity = activities.find(item => item._id === activityId);
  if (!activity) return { success: false, message: '活动不存在' };
  activity.registrations = activity.registrations || [];
  const registration = activity.registrations.find(item => item.userId === userId);
  if (!registration) return { success: false, message: '报名不存在' };

  registration.status = status;
  registration.updatedAt = new Date().toISOString();
  activity.participants = activity.registrations
    .filter(item => item.status === 'approved')
    .map(item => item.userId);
  activity.updatedAt = new Date().toISOString();
  wx.setStorageSync(STORAGE_KEYS.ACTIVITIES, activities);
  return { success: true, data: registration };
}

function getRecharges(userId) {
  let list = wx.getStorageSync(STORAGE_KEYS.RECHARGES) || [];
  if (userId) list = list.filter(r => r.userId === userId);
  return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function createRecharge(userId, hours, expiryDate, adminId) {
  const recharges = getRecharges();
  const recharge = {
    _id: `rec_${Date.now()}`,
    userId,
    hours,
    usedHours: 0,
    remainingHours: hours,
    expiryDate,
    amount: 0,
    paymentMethod: 'offline',
    receivedBy: adminId,
    status: 'valid',
    createdAt: new Date().toISOString()
  };
  recharges.push(recharge);
  wx.setStorageSync(STORAGE_KEYS.RECHARGES, recharges);
  
  // 增加用户剩余时长
  const users = wx.getStorageSync(STORAGE_KEYS.USERS) || [];
  const user = users.find(u => u._id === userId) || getCurrentUser();
  if (user) {
    user.remainingHours += hours;
    user.totalRechargedHours += hours;
    const index = users.findIndex(u => u._id === userId);
    if (index >= 0) {
      users[index] = user;
      wx.setStorageSync(STORAGE_KEYS.USERS, users);
    }
    if (user._id === getCurrentUser()._id) {
      wx.setStorageSync(STORAGE_KEYS.CURRENT_USER, user);
    }
  }
  
  return recharge;
}

function adjustUserHours(userId, hoursDelta, reason, adminId) {
  const delta = Number(hoursDelta || 0);
  if (!delta) return { success: false, error: '调整小时数不能为0' };

  const users = wx.getStorageSync(STORAGE_KEYS.USERS) || [];
  const user = users.find(u => u._id === userId);
  if (!user) return { success: false, error: '用户不存在' };

  user.remainingHours = Number(Math.max((user.remainingHours || 0) + delta, 0).toFixed(2));
  if (delta > 0) {
    user.totalRechargedHours = Number(((user.totalRechargedHours || 0) + delta).toFixed(2));
  }

  wx.setStorageSync(STORAGE_KEYS.USERS, users);
  const currentUser = getCurrentUser();
  if (currentUser && currentUser._id === user._id) {
    wx.setStorageSync(STORAGE_KEYS.CURRENT_USER, user);
  }

  const recharges = wx.getStorageSync(STORAGE_KEYS.RECHARGES) || [];
  const record = {
    _id: `adj_${Date.now()}`,
    userId,
    hours: delta,
    remainingHours: delta > 0 ? delta : 0,
    expiryDate: formatDate(new Date()),
    status: 'adjustment',
    source: 'manual_adjust',
    adminId: adminId || 'admin',
    remark: reason || '手动调整',
    createdAt: new Date().toISOString()
  };
  recharges.push(record);
  wx.setStorageSync(STORAGE_KEYS.RECHARGES, recharges);

  return { success: true, data: { user, record } };
}

function generateVoucher(options) {
  const vouchers = wx.getStorageSync(STORAGE_KEYS.VOUCHERS) || [];
  const now = Date.now();
  const count = Number(options.count || 1);
  const created = [];
  const baseSeq = vouchers.length;
  const cardValidUntil = options.cardValidUntil || getDateAfterDays(options.cardValidDays || 365);

  for (let i = 0; i < count; i++) {
    const seq = baseSeq + i + 1;
    const cardNo = options.cardNo ? incrementCardNo(options.cardNo, i) : `GF${String(seq).padStart(6, '0')}`;
    const token = options.token || generateRedeemCode(seq);
    const voucher = {
      _id: `voucher_${now}_${seq}`,
      cardNo,
      token,
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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      remark: options.remark || ''
    };
    vouchers.push(voucher);
    created.push(voucher);
  }

  wx.setStorageSync(STORAGE_KEYS.VOUCHERS, vouchers);
  return { success: true, data: count === 1 ? created[0] : created };
}

function incrementCardNo(cardNo, offset) {
  const value = String(cardNo || '').trim().toUpperCase();
  if (!offset) return value;
  const match = value.match(/^(.*?)(\d+)$/);
  if (!match) return `${value}-${offset + 1}`;

  const prefix = match[1];
  const number = match[2];
  return `${prefix}${String(Number(number) + offset).padStart(number.length, '0')}`;
}

function generateRedeemCode(seq) {
  const random = Math.random().toString(36).slice(2, 10).toUpperCase();
  const timestamp = Date.now().toString(36).toUpperCase();
  return `GF-${timestamp}-${String(seq).padStart(4, '0')}-${random}`;
}

function getVouchers() {
  const vouchers = normalizeVouchers(wx.getStorageSync(STORAGE_KEYS.VOUCHERS) || []);
  wx.setStorageSync(STORAGE_KEYS.VOUCHERS, vouchers);
  return vouchers
    .filter(item => item.status !== 'deleted')
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function normalizeVouchers(vouchers) {
  return vouchers.map(item => ({
    ...item,
    cardValidUntil: item.cardValidUntil || getDateAfterDays(365),
    status: item.status || 'active',
    validDays: Number(item.validDays || 0),
    hours: Number(item.hours || 0)
  }));
}

function isVoucherExpired(voucher) {
  if (!voucher.cardValidUntil) return false;
  return new Date(`${voucher.cardValidUntil}T23:59:59`).getTime() < Date.now();
}

function updateVoucher(id, patch) {
  const vouchers = normalizeVouchers(wx.getStorageSync(STORAGE_KEYS.VOUCHERS) || []);
  const voucher = vouchers.find(item => item._id === id);
  if (!voucher) return { success: false, error: '卡片不存在' };
  if (voucher.status === 'used' && patch.status && patch.status !== 'used') {
    return { success: false, error: '已使用卡不能改回其他状态' };
  }

  Object.assign(voucher, {
    ...patch,
    hours: patch.hours === undefined ? voucher.hours : Number(patch.hours || 0),
    validDays: patch.validDays === undefined ? voucher.validDays : Number(patch.validDays || 0),
    updatedAt: new Date().toISOString()
  });
  wx.setStorageSync(STORAGE_KEYS.VOUCHERS, vouchers);
  return { success: true, data: voucher };
}

function deleteVoucher(id) {
  return updateVoucher(id, { status: 'deleted', deletedAt: new Date().toISOString() });
}

function extendVoucher(id, cardValidUntil) {
  if (!cardValidUntil) return { success: false, error: '请选择新的卡片有效期' };
  return updateVoucher(id, { cardValidUntil });
}

function redeemVoucher(code, userId) {
  const vouchers = normalizeVouchers(wx.getStorageSync(STORAGE_KEYS.VOUCHERS) || []);
  const normalizedCode = String(code || '').trim().toUpperCase();
  const voucher = vouchers.find(item => item.token === normalizedCode || item.cardNo === normalizedCode);

  if (!voucher) return { success: false, error: '兑换卡不存在' };
  if (voucher.status === 'used') return { success: false, error: '该卡已兑换' };
  if (voucher.status === 'pending') return { success: false, error: '该卡暂未开放兑换' };
  if (voucher.status !== 'active') return { success: false, error: '该卡未激活' };
  if (isVoucherExpired(voucher)) return { success: false, error: '该卡已过期，请联系老板延期' };

  const user = getUsers().find(item => item._id === userId) || getCurrentUser();
  if (!user) return { success: false, error: '用户不存在' };

  if (voucher.redeemLimitType === 'once_lifetime') {
    const hasUsedSameType = vouchers.some(item => item.type === voucher.type && item.usedByUserId === user._id);
    if (hasUsedSameType) return { success: false, error: '该权益每人仅限一次' };
  }

  const expiryDate = voucher.fixedExpiryDate || getDateAfterDays(voucher.validDays || 180);
  const recharge = createRecharge(user._id, voucher.hours, expiryDate, 'voucher');

  voucher.status = 'used';
  voucher.usedByUserId = user._id;
  voucher.usedAt = new Date().toISOString();
  voucher.rechargeRecordId = recharge._id;
  wx.setStorageSync(STORAGE_KEYS.VOUCHERS, vouchers);

  return { success: true, data: { voucher, recharge } };
}

function activateVouchers(options) {
  const vouchers = wx.getStorageSync(STORAGE_KEYS.VOUCHERS) || [];
  const count = Number(options.count || 1);
  const startCardNo = String(options.cardNo || '').trim().toUpperCase();
  const cardNos = [];
  const activated = [];

  for (let i = 0; i < count; i++) {
    cardNos.push(incrementCardNo(startCardNo, i));
  }

  for (const cardNo of cardNos) {
    const voucher = vouchers.find(item => String(item.cardNo).toUpperCase() === cardNo);
    if (!voucher) return { success: false, error: `未找到卡片 ${cardNo}` };
    if (voucher.status === 'used') return { success: false, error: `${cardNo} 已兑换，不能激活` };
    if (voucher.status === 'active' && Number(voucher.hours || 0) > 0) {
      return { success: false, error: `${cardNo} 已激活` };
    }
  }

  for (const cardNo of cardNos) {
    const voucher = vouchers.find(item => String(item.cardNo).toUpperCase() === cardNo);
    voucher.type = options.type || 'sale';
    voucher.hours = Number(options.hours || 0);
    voucher.validDays = Number(options.validDays || 180);
    voucher.cardValidUntil = options.cardValidUntil || voucher.cardValidUntil || getDateAfterDays(365);
    voucher.fixedExpiryDate = options.fixedExpiryDate || '';
    voucher.redeemLimitType = options.redeemLimitType || 'unlimited';
    voucher.status = 'active';
    voucher.activatedAt = new Date().toISOString();
    voucher.updatedAt = new Date().toISOString();
    voucher.remark = options.remark || voucher.remark || '';
    activated.push(voucher);
  }

  wx.setStorageSync(STORAGE_KEYS.VOUCHERS, vouchers);
  return { success: true, data: activated };
}

function getDateAfterDays(days) {
  const date = new Date();
  date.setDate(date.getDate() + Number(days || 0));
  return formatDate(date);
}

function getScorecards(userId) {
  let list = wx.getStorageSync(STORAGE_KEYS.SCORECARDS) || [];
  list = list.filter(s => s.status !== 'deleted');
  if (userId) list = list.filter(s => s.userId === userId);
  return list.sort((a, b) => new Date(b.playDate) - new Date(a.playDate));
}

function upsertScorecard(data) {
  const scorecards = wx.getStorageSync(STORAGE_KEYS.SCORECARDS) || [];
  const index = scorecards.findIndex(s => s._id === data._id);
  const next = {
    ...data,
    updatedAt: new Date().toISOString()
  };

  if (index >= 0) {
    scorecards[index] = {
      ...scorecards[index],
      ...next
    };
  } else {
    scorecards.push({
      ...next,
      createdAt: new Date().toISOString()
    });
  }

  wx.setStorageSync(STORAGE_KEYS.SCORECARDS, scorecards);
  return { success: true, data: next };
}

function deleteScorecard(id, userId) {
  const scorecards = wx.getStorageSync(STORAGE_KEYS.SCORECARDS) || [];
  const index = scorecards.findIndex(s => s._id === id && s.userId === userId);
  if (index < 0) return { success: false, message: '记分卡不存在' };
  const scorecard = scorecards[index];
  if (scorecard.recordedType === 'activity_admin' || scorecard.recordedBy === 'admin' || scorecard.activityId) {
    return { success: false, message: '秋の认证记录不能删除' };
  }
  scorecards[index] = {
    ...scorecard,
    status: 'deleted',
    deletedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  wx.setStorageSync(STORAGE_KEYS.SCORECARDS, scorecards);
  return { success: true, data: scorecards[index] };
}

function getActivityRecords(activityId, userId) {
  let list = wx.getStorageSync(STORAGE_KEYS.ACTIVITY_RECORDS) || [];
  if (activityId) list = list.filter(r => r.activityId === activityId);
  if (userId) list = list.filter(r => r.userId === userId);
  return list;
}

function createActivityRecord(data) {
  const records = getActivityRecords();
  records.push({
    _id: `ar_${Date.now()}`,
    ...data,
    recordedAt: new Date().toISOString()
  });
  wx.setStorageSync(STORAGE_KEYS.ACTIVITY_RECORDS, records);
  updateUserGolfStats(data.userId);
  return records[records.length - 1];
}

function getCoachAppointments(coachId) {
  let list = getAppointments();
  return list.filter(a => a.coachId === coachId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function updateUserGolfStats(userId) {
  const records = getActivityRecords(null, userId)
    .filter(r => r.status === 'approved')
    .sort((a, b) => new Date(b.recordedAt) - new Date(a.recordedAt));
  
  if (records.length === 0) return;
  
  const last5 = records.slice(0, 5).map(r => r.totalStrokes);
  const last5Best = Math.min(...last5);
  const last5Avg = Math.round(last5.reduce((a, b) => a + b, 0) / last5.length);
  const personalBest = Math.min(...records.map(r => r.totalStrokes));
  
  const user = getCurrentUser();
  if (user._id === userId) {
    user.golfStats = {
      last5Best,
      last5Avg,
      personalBest,
      roundsCount: records.length
    };
    wx.setStorageSync(STORAGE_KEYS.CURRENT_USER, user);
  }
}

function getRankings(type = 'last5Best') {
  const currentUser = getCurrentUser();
  // mock 多个用户的成绩数据
  const mockUsers = [
    { _id: 'user_001', name: currentUser.name || '张三', stats: { last5Best: 78, last5Avg: 82, personalBest: 76 } },
    { _id: 'user_002', name: '李四', stats: { last5Best: 75, last5Avg: 79, personalBest: 73 } },
    { _id: 'user_003', name: '王五', stats: { last5Best: 80, last5Avg: 84, personalBest: 78 } },
    { _id: 'user_004', name: '赵六', stats: { last5Best: 82, last5Avg: 86, personalBest: 80 } },
    { _id: 'user_005', name: '钱七', stats: { last5Best: 77, last5Avg: 81, personalBest: 75 } }
  ];
  
  return mockUsers
    .map(u => ({ ...u, value: u.stats[type], isMe: u._id === currentUser._id }))
    .sort((a, b) => a.value - b.value);
}

function getCertifiedHonors() {
  const users = getUsers();
  const userMap = {};
  users.forEach(user => {
    userMap[user._id] = user.name || user.nickname || '会员';
  });

  const counters = {};
  const scorecards = (wx.getStorageSync(STORAGE_KEYS.SCORECARDS) || [])
    .filter(card => card.status === 'submitted');

  scorecards.forEach(card => {
    if (!counters[card.userId]) {
      counters[card.userId] = {
        userId: card.userId,
        name: userMap[card.userId] || '会员',
        holeInOne: 0,
        birdie: 0,
        par: 0,
        eagle: 0,
        oneChicken: 0
      };
    }
    (card.holes || []).forEach(hole => {
      const strokes = Number(hole.strokes || 0);
      const par = Number(hole.par || 4);
      if (strokes === 1) counters[card.userId].holeInOne += 1;
      if (strokes === par - 1) counters[card.userId].birdie += 1;
      if (strokes === par) counters[card.userId].par += 1;
      if (strokes === par - 2) counters[card.userId].eagle += 1;
      if (strokes > 0 && strokes <= par - 3) counters[card.userId].oneChicken += 1;
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

  function pick(type, unit) {
    const sorted = rows.slice().sort((a, b) => b[type] - a[type]);
    const winner = sorted[0];
    if (!winner || !winner[type]) return null;
    return {
      name: winner.name,
      valueText: `${winner[type]}${unit}`
    };
  }

  const holeInOne = pick('holeInOne', '次');
  const eagle = pick('eagle', '只');
  const birdie = pick('birdie', '只');
  const par = pick('par', '洞');
  const oneChicken = pick('oneChicken', '只');

  return [
    { ...fallback.eagle, ...(eagle || {}) },
    { ...fallback.birdie, ...(birdie || {}) },
    { ...fallback.holeInOne, ...(holeInOne || {}) },
    { ...fallback.par, ...(par || {}) },
    { ...fallback.oneChicken, ...(oneChicken || {}) }
  ];
}

function formatDate(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatTime(date) {
  const d = new Date(date);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function getToday() {
  return formatDate(new Date());
}

function getDates(days = 7) {
  const dates = [];
  const today = new Date();
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push(formatDate(d));
  }
  return dates;
}

module.exports = {
  initMockData,
  getSettings,
  updateSettings,
  getCurrentUser,
  getUsers,
  saveUser,
  updateUserStatus,
  deleteUser,
  getLinkedCoaches,
  updateUserCoaches,
  getBays,
  saveBay,
  deleteBay,
  getCoaches,
  saveCoach,
  deleteCoach,
  getTimeSlots,
  saveTimeSlot,
  getAppointments,
  updateAppointmentStatus,
  createAppointment,
  getProducts,
  saveProduct,
  deleteProduct,
  getCategories,
  saveCategory,
  getActivities,
  getCourses,
  saveCourse,
  deleteCourse,
  saveActivity,
  deleteActivity,
  updateActivityStatus,
  registerActivity,
  updateActivityRegistration,
  getRecharges,
  createRecharge,
  adjustUserHours,
  generateVoucher,
  getVouchers,
  updateVoucher,
  deleteVoucher,
  extendVoucher,
  redeemVoucher,
  activateVouchers,
  getScorecards,
  upsertScorecard,
  deleteScorecard,
  getActivityRecords,
  createActivityRecord,
  getCoachAppointments,
  getRankings,
  getCertifiedHonors,
  updateUserGolfStats,
  formatDate,
  formatTime,
  getToday,
  getDates
};
