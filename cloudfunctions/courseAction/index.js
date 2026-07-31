const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const TENANT_ID = 'golfact_default';

const JINGJINJI_COURSE_SEEDS = [
  ['北京高尔夫俱乐部', '北京', '北京', '顺义区'],
  ['北京乡村高尔夫俱乐部', '北京', '北京', '顺义区'],
  ['北京北辰高尔夫俱乐部', '北京', '北京', '朝阳区'],
  ['北京黄港国际高尔夫俱乐部', '北京', '北京', '朝阳区'],
  ['北京大运河高尔夫俱乐部', '北京', '北京', '通州区'],
  ['北京龙熙温泉高尔夫俱乐部', '北京', '北京', '大兴区'],
  ['北京东方明珠乡村高尔夫俱乐部', '北京', '北京', '顺义区'],
  ['北京长阳国际高尔夫俱乐部', '北京', '北京', '房山区'],
  ['北京金色河畔高尔夫俱乐部', '北京', '北京', '朝阳区'],
  ['北京东方太阳城高尔夫俱乐部', '北京', '北京', '顺义区'],
  ['北京鸿华国际高尔夫俱乐部', '北京', '北京', '朝阳区'],
  ['北京CBD国际高尔夫俱乐部', '北京', '北京', '朝阳区'],
  ['北湖9号国际高尔夫俱乐部', '北京', '北京', '朝阳区'],
  ['华彬庄园国际高尔夫俱乐部', '北京', '北京', '昌平区'],
  ['通盈雁栖湖高尔夫俱乐部', '北京', '北京', '怀柔区'],
  ['北京尼克劳斯俱乐部', '北京', '北京', '通州区'],
  ['清河湾高尔夫乡村俱乐部', '北京', '北京', '昌平区'],
  ['北京天安假日高尔夫俱乐部', '北京', '北京', '大兴区'],
  ['北京东方天星乡村俱乐部', '北京', '北京', '朝阳区'],
  ['北京金帝高尔夫俱乐部', '北京', '北京', '房山区'],
  ['北京渔阳国际高尔夫俱乐部', '北京', '北京', '平谷区'],
  ['北京燕西高尔夫俱乐部', '北京', '北京', '海淀区'],
  ['北京伯爵园高尔夫俱乐部', '北京', '北京', '顺义区'],
  ['天津国际温泉高尔夫球会', '天津', '天津', '空港经济区'],
  ['天津华纳国际高尔夫俱乐部', '天津', '天津', '滨海新区'],
  ['天津蓟县盘山高尔夫俱乐部', '天津', '天津', '蓟州区'],
  ['天津杨柳青森林高尔夫球会', '天津', '天津', '西青区'],
  ['天津松江团泊湖高尔夫俱乐部', '天津', '天津', '静海区'],
  ['天津京基乡村高尔夫俱乐部', '天津', '天津', '津南区'],
  ['天津生态城国际乡村俱乐部', '天津', '天津', '滨海新区'],
  ['天津阿罗马高尔夫俱乐部', '天津', '天津', '滨海新区'],
  ['天津滨海森林高尔夫俱乐部', '天津', '天津', '滨海新区'],
  ['华堂国际高尔夫俱乐部', '河北', '廊坊', '三河'],
  ['涿州京南乡村俱乐部', '河北', '保定', '涿州'],
  ['涿州东京都高尔夫俱乐部ABC场', '河北', '保定', '涿州'],
  ['涿州京都高尔夫俱乐部AB场', '河北', '保定', '涿州'],
  ['涿州京都高尔夫俱乐部CDEF场', '河北', '保定', '涿州'],
  ['石家庄众诚国际高尔夫俱乐部', '河北', '石家庄', ''],
  ['廊坊凤河国际高尔夫俱乐部', '河北', '廊坊', ''],
  ['新奥艾力枫社高尔夫俱乐部A场', '河北', '廊坊', ''],
  ['新奥艾力枫社高尔夫俱乐部B场', '河北', '廊坊', ''],
  ['松石高尔夫俱乐部', '河北', '廊坊', ''],
  ['秦皇岛保利高尔夫俱乐部', '河北', '秦皇岛', ''],
  ['荣盛黄金海岸森林高尔夫俱乐部', '河北', '秦皇岛', ''],
  ['美芦庄园高尔夫球会', '河北', '保定', ''],
  ['唐山南湖国际高尔夫俱乐部', '河北', '唐山', ''],
  ['唐山曹妃甸湿地国际高尔夫俱乐部', '河北', '唐山', ''],
  ['唐山曹妃湖高尔夫俱乐部', '河北', '唐山', ''],
  ['沧州名人高尔夫俱乐部', '河北', '沧州', ''],
  ['石家庄滹沱河高尔夫俱乐部', '河北', '石家庄', ''],
  ['京华高尔夫俱乐部', '河北', '廊坊', '燕郊'],
  ['大宗高尔夫俱乐部', '河北', '廊坊', '燕郊']
];

function buildCourse([name, province, city, address]) {
  return {
    tenantId: TENANT_ID,
    name,
    province,
    city,
    address,
    latitude: '',
    longitude: '',
    holeCount: 18,
    pars: [],
    totalPar: 0,
    nineHoleCourses: [],
    courseCombinations: [],
    parStatus: 'pending',
    features: '京津冀球场名录第一版；逐洞标准杆待老板按真实记分卡维护，维护前不会自动带入记分。',
    dataSource: 'regional_seed_2026',
    status: 'active',
    createTime: db.serverDate(),
    updateTime: db.serverDate()
  };
}

async function importRegionalCourses() {
  const existingRes = await db.collection('courses')
    .where({ tenantId: TENANT_ID })
    .limit(1000)
    .get();
  const existingByName = {};
  (existingRes.data || []).forEach(item => {
    existingByName[item.name] = item;
  });
  let imported = 0;
  let updated = 0;
  let skipped = 0;

  for (const seed of JINGJINJI_COURSE_SEEDS) {
    const name = seed[0];
    const course = buildCourse(seed);
    const existing = existingByName[name];
    if (existing) {
      const pars = existing.pars || [];
      const shouldRepair = existing.dataSource === 'regional_seed_2026' || pars.every(par => Number(par) === 4);
      if (!shouldRepair) {
        skipped += 1;
        continue;
      }
      await db.collection('courses').doc(existing._id).update({
        data: {
          pars: course.pars,
          totalPar: course.totalPar,
          nineHoleCourses: course.nineHoleCourses,
          courseCombinations: course.courseCombinations,
          parStatus: course.parStatus,
          features: course.features,
          dataSource: course.dataSource,
          updateTime: db.serverDate()
        }
      });
      updated += 1;
      continue;
    }
    await db.collection('courses').add({ data: course });
    imported += 1;
    existingByName[name] = course;
  }

  return { success: true, data: { imported, updated, skipped, total: JINGJINJI_COURSE_SEEDS.length } };
}

async function repairRegionalCoursePars() {
  const existingRes = await db.collection('courses')
    .where({ tenantId: TENANT_ID, dataSource: 'regional_seed_2026' })
    .limit(1000)
    .get();
  let updated = 0;
  let skipped = 0;
  for (const existing of existingRes.data || []) {
    const seed = JINGJINJI_COURSE_SEEDS.find(item => item[0] === existing.name);
    if (!seed) {
      skipped += 1;
      continue;
    }
    const course = buildCourse(seed);
    await db.collection('courses').doc(existing._id).update({
      data: {
        pars: course.pars,
        totalPar: course.totalPar,
        nineHoleCourses: course.nineHoleCourses,
        courseCombinations: course.courseCombinations,
        parStatus: course.parStatus,
        features: course.features,
        updateTime: db.serverDate()
      }
    });
    updated += 1;
  }
  return { success: true, data: { updated, skipped } };
}

exports.main = async (event) => {
  try {
    if (event.action === 'importRegionalCourses') return importRegionalCourses();
    if (event.action === 'repairRegionalCoursePars') return repairRegionalCoursePars();
    return { success: false, error: '未知操作' };
  } catch (err) {
    console.error('courseAction error:', err);
    return { success: false, error: err.message || '球场操作失败' };
  }
};
