const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const TENANT_ID = 'golfact_default';

exports.main = async (event) => {
  try {
    const wxContext = cloud.getWXContext();
    const code = event.code;
    if (!code) return { success: false, message: '缺少手机号授权 code' };

    const phoneRes = await cloud.openapi.phonenumber.getPhoneNumber({ code });
    const phoneInfo = phoneRes.phoneInfo || {};
    const phone = phoneInfo.phoneNumber || phoneInfo.purePhoneNumber || '';
    if (!phone) return { success: false, message: '未获取到手机号' };

    const userRes = await db.collection('users').where({
      tenantId: TENANT_ID,
      openid: wxContext.OPENID
    }).get();

    if (userRes.data[0]) {
      await db.collection('users').doc(userRes.data[0]._id).update({
        data: {
          phone,
          updateTime: db.serverDate()
        }
      });
      return { success: true, phone };
    }

    await db.collection('users').add({
      data: {
        tenantId: TENANT_ID,
        openid: wxContext.OPENID,
        nickname: '微信会员',
        name: '',
        phone,
        role: 'user',
        memberLevel: 'normal',
        remainingHours: 0,
        totalRechargedHours: 0,
        totalTrainedHours: 0,
        totalSpent: 0,
        currentNoShowCount: 0,
        status: 'active',
        coachIds: [],
        createTime: db.serverDate(),
        updateTime: db.serverDate()
      }
    });
    return { success: true, phone };
  } catch (err) {
    console.error('bindPhone error:', err);
    return { success: false, message: err.message };
  }
};
