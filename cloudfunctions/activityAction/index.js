const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

async function getActivity(activityId) {
  const res = await db.collection('activities').doc(activityId).get();
  return res.data;
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

async function registerActivity(event) {
  const { activityId, userId } = event;
  const activity = await getActivity(activityId);
  const user = await getUser(userId);
  const registrations = activity.registrations || [];
  const approvedCount = registrations.filter(item => item.status === 'approved').length;
  const signupEnd = activity.signupEndTime ? new Date(activity.signupEndTime.replace(' ', 'T')) : null;
  const now = new Date();

  if (activity.status !== 'upcoming') return { success: false, message: '活动暂不可报名' };
  if (signupEnd && now > signupEnd) return { success: false, message: '报名已截止' };
  if (activity.maxParticipants && approvedCount >= Number(activity.maxParticipants)) return { success: false, message: '名额已满' };

  const existing = registrations.find(item => item.userId === userId);
  if (existing) {
    if (existing.status === 'rejected') existing.status = 'pending';
    existing.updatedAt = now.toISOString();
  } else {
    registrations.push({
      userId,
      name: user ? (user.name || user.nickname || '会员') : '会员',
      status: 'pending',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    });
  }

  await db.collection('activities').doc(activityId).update({
    data: {
      registrations,
      updateTime: db.serverDate()
    }
  });
  return { success: true };
}

async function updateRegistration(event) {
  const { activityId, userId, status } = event;
  const activity = await getActivity(activityId);
  const registrations = activity.registrations || [];
  const registration = registrations.find(item => item.userId === userId);
  if (!registration) return { success: false, message: '报名不存在' };

  registration.status = status;
  registration.updatedAt = new Date().toISOString();
  const participants = registrations
    .filter(item => item.status === 'approved' || item.status === 'completed')
    .map(item => item.userId);

  await db.collection('activities').doc(activityId).update({
    data: {
      registrations,
      participants,
      updateTime: db.serverDate()
    }
  });
  return { success: true };
}

async function createRecord(event) {
  const data = event.data || {};
  if (!data.activityId) return { success: false, message: '缺少活动' };
  if (!data.userId) return { success: false, message: '缺少会员' };

  const activity = await getActivity(data.activityId);
  const user = await getUser(data.userId);
  const now = new Date().toISOString();
  const holes = data.holes || [];
  const totalPar = Number(data.totalPar || holes.reduce((sum, hole) => sum + Number(hole.par || 0), 0));
  const totalStrokes = Number(data.totalStrokes || holes.reduce((sum, hole) => sum + Number(hole.strokes || 0), 0));
  let scorecard = null;
  let scorecardId = data.scorecardId || '';

  if (scorecardId) {
    try {
      const existing = await db.collection('scorecards').doc(scorecardId).get();
      scorecard = existing.data;
      await db.collection('scorecards').doc(scorecardId).update({
        data: {
          activityId: data.activityId,
          recordedType: 'activity_admin',
          recordedBy: data.recordedBy || 'admin',
          status: 'submitted',
          updateTime: db.serverDate()
        }
      });
    } catch (err) {
      scorecard = null;
    }
  }

  if (!scorecard) {
    scorecard = {
      ...data,
      tenantId: 'golfact_default',
      activityId: data.activityId,
      userId: data.userId,
      playerName: data.playerName || (user ? (user.name || user.nickname || '会员') : '会员'),
      courseId: data.courseId || activity.courseId || '',
      courseName: data.courseName || activity.location || '',
      playDate: data.playDate || String(activity.startTime || '').slice(0, 10),
      holes,
      totalPar,
      totalStrokes,
      scoreToPar: Number(data.scoreToPar !== undefined ? data.scoreToPar : totalStrokes - totalPar),
      totalPutts: Number(data.totalPutts || holes.reduce((sum, hole) => sum + Number(hole.putts || 0), 0)),
      totalPenalties: Number(data.totalPenalties || holes.reduce((sum, hole) => sum + Number(hole.penalties || 0), 0)),
      status: data.status || 'submitted',
      recordedType: data.recordedType || 'activity_admin',
      recordedBy: data.recordedBy || 'admin',
      createdAt: now,
      updatedAt: now,
      createTime: db.serverDate(),
      updateTime: db.serverDate()
    };
    const scorecardRes = await db.collection('scorecards').add({ data: scorecard });
    scorecardId = scorecardRes._id;
  }

  const activityRecord = {
    tenantId: 'golfact_default',
    activityId: data.activityId,
    userId: data.userId,
    scorecardId,
    totalStrokes,
    netScore: Number(data.netScore || 0),
    status: data.recordStatus || 'approved',
    recordedBy: data.recordedBy || 'admin',
    createdAt: now,
    createTime: db.serverDate(),
    updateTime: db.serverDate()
  };
  const recordRes = await db.collection('activity_records').add({ data: activityRecord });

  const registrations = activity.registrations || [];
  const registration = registrations.find(item => item.userId === data.userId);
  if (registration && registration.status === 'approved') {
    registration.status = 'completed';
    registration.updatedAt = now;
    await db.collection('activities').doc(data.activityId).update({
      data: {
        registrations,
        updateTime: db.serverDate()
      }
    });
  }

  return {
    success: true,
    data: {
      scorecard: { ...scorecard, _id: scorecardId },
      record: { ...activityRecord, _id: recordRes._id }
    }
  };
}

exports.main = async (event) => {
  try {
    if (event.action === 'register') return registerActivity(event);
    if (event.action === 'updateRegistration') return updateRegistration(event);
    if (event.action === 'createRecord') return createRecord(event);
    return { success: false, message: '未知操作' };
  } catch (err) {
    console.error('activityAction error:', err);
    return { success: false, message: err.message };
  }
};
