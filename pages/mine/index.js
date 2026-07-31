// pages/mine/index.js
const service = require('../../utils/service');

function isDefaultWechatName(name) {
  return !name || name === '微信会员' || name === '游客';
}

Page({
  data: {
    user: {},
    userDisplayName: '游客',
    userInitial: '客',
    avatarUrl: '',
    showAvatarImage: false,
    showAvatarInitial: true,
    nicknameDraft: '',
    profileHintText: '点头像和昵称后自动保存',
    userPhoneText: '未绑定手机号',
    memberLevelName: '',
    remainingHoursText: '0',
    pendingHoursText: '0',
    nearestExpiry: '-',
    nearestExpiryLabel: '暂无有效期',
    expiryStateText: '',
    pendingAppointmentHours: 0,
    showBindPhone: true,
    showManualPhoneInput: false,
    manualPhone: ''
  },

  onLoad() {
    this.loadData();
  },

  onShow() {
    this.loadData();
  },

  async loadData() {
    try {
      const settings = await service.getSettings();
      const user = await service.getCurrentUser();
      const safeUser = user || {};
      const memberLevels = settings.memberLevels || [];
      const memberLevel = memberLevels.find(item => item.level === safeUser.memberLevel);
      const profileName = safeUser.name || safeUser.nickname || '';
      const needsProfile = !safeUser.avatarUrl || isDefaultWechatName(profileName);

      this.setData({
        user: safeUser,
        userDisplayName: profileName || '微信会员',
        userInitial: (profileName || '微').slice(0, 1),
        avatarUrl: safeUser.avatarUrl || '',
        showAvatarImage: !!safeUser.avatarUrl,
        showAvatarInitial: !safeUser.avatarUrl,
        nicknameDraft: isDefaultWechatName(profileName) ? '' : profileName,
        userPhoneText: safeUser.phone || '未绑定手机号',
        showBindPhone: !safeUser.phone,
        showManualPhoneInput: false,
        manualPhone: safeUser.phone || '',
        memberLevelName: memberLevel ? memberLevel.name : '普通会员',
        remainingHoursText: String(Number(safeUser.remainingHours || 0))
      });

      this.showProfileGuideIfNeeded(needsProfile);

      const pendingAppointmentHours = safeUser._id ? await service.getPendingAppointmentHours(safeUser._id) : 0;
      const recharges = safeUser._id ? (await service.getRecharges(safeUser._id)).filter(row => row.status === 'valid') : [];
      
      let nearestExpiry = '-';
      let nearestExpiryLabel = '暂无有效期';
      let expiryStateText = '';
      if (recharges.length > 0) {
        const sorted = recharges.sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
        nearestExpiry = sorted[0].expiryDate;
        nearestExpiryLabel = nearestExpiry.slice(5).replace('-', '月') + '日';
        const daysLeft = Math.ceil((new Date(`${nearestExpiry}T00:00:00`).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
        expiryStateText = daysLeft >= 0 ? `${daysLeft}天后到期` : '已过期';
      }

      this.setData({
        pendingHoursText: String(pendingAppointmentHours),
        nearestExpiry,
        nearestExpiryLabel,
        expiryStateText,
        pendingAppointmentHours
      });
    } catch (err) {
      console.warn('mine loadData failed:', err);
      this.setData({
        user: {},
        userDisplayName: '游客',
        userInitial: '客',
        avatarUrl: '',
        showAvatarImage: false,
        showAvatarInitial: true,
        nicknameDraft: '',
        userPhoneText: '未绑定手机号',
        showBindPhone: true,
        showManualPhoneInput: false,
        manualPhone: '',
        memberLevelName: '普通会员',
        remainingHoursText: '0',
        pendingHoursText: '0',
        nearestExpiry: '-',
        nearestExpiryLabel: '暂无有效期',
        expiryStateText: '',
        pendingAppointmentHours: 0
      });
    }
  },

  goTo(e) {
    wx.navigateTo({ url: e.currentTarget.dataset.url });
  },

  goToAdmin() {
    wx.navigateTo({ url: '/pages/admin/login' });
  },

  showProfileGuideIfNeeded(needsProfile) {
    if (!needsProfile || wx.getStorageSync('profile_guide_seen')) return;
    wx.setStorageSync('profile_guide_seen', true);
    wx.showModal({
      title: '完善微信资料',
      content: '已通过微信身份进入小程序。点击头像选择微信头像，再填写昵称并保存。',
      showCancel: false,
      confirmText: '知道了'
    });
  },

  async onChooseAvatar(e) {
    const avatarUrl = e.detail && e.detail.avatarUrl;
    if (!avatarUrl) return;
    this.setData({
      avatarUrl,
      showAvatarImage: true,
      showAvatarInitial: false,
      profileHintText: '头像保存中'
    }, () => {
      this.autoSaveProfile('avatar');
    });
  },

  onNicknameInput(e) {
    this.setData({
      nicknameDraft: e.detail.value,
      profileHintText: '昵称保存中'
    }, () => {
      this.autoSaveProfile('nickname');
    });
  },

  uploadAvatar(localPath) {
    if (!localPath || localPath.indexOf('http') === 0 || localPath.indexOf('cloud://') === 0) {
      return Promise.resolve(localPath);
    }
    const user = this.data.user || {};
    return new Promise(resolve => {
      wx.cloud.uploadFile({
        cloudPath: `avatars/${user._id || 'user'}_${Date.now()}.jpg`,
        filePath: localPath,
        success: res => resolve(res.fileID || localPath),
        fail: err => {
          console.warn('upload avatar failed:', err);
          resolve(localPath);
        }
      });
    });
  },

  async autoSaveProfile() {
    const nickname = String(this.data.nicknameDraft || '').trim();
    const avatarUrl = this.data.avatarUrl || '';
    if (!nickname && !avatarUrl) return;

    const user = this.data.user || {};
    const savedAvatarUrl = avatarUrl ? await this.uploadAvatar(avatarUrl) : (user.avatarUrl || '');
    const patch = {
      ...user,
      avatarUrl: savedAvatarUrl
    };
    if (nickname) {
      patch.name = nickname;
      patch.nickname = nickname;
    }

    const result = await service.saveUser(patch);
    if (!result.success) {
      this.setData({ profileHintText: '资料保存失败，稍后再试' });
      return;
    }
    this.setData({
      profileHintText: '资料已自动保存',
      avatarUrl: savedAvatarUrl,
      showAvatarImage: !!savedAvatarUrl,
      showAvatarInitial: !savedAvatarUrl,
      user: {
        ...user,
        ...patch
      },
      userDisplayName: nickname || user.name || user.nickname || '微信会员',
      userInitial: (nickname || user.name || user.nickname || '微').slice(0, 1)
    });
  },

  onBindPhoneTap() {
    wx.showToast({ title: '请在弹窗中授权手机号', icon: 'none' });
  },

  async bindPhone(e) {
    const code = e.detail && e.detail.code;
    if (!code) {
      wx.showToast({ title: '未授权手机号', icon: 'none' });
      return;
    }
    const result = await service.bindPhone(code);
    wx.showToast({
      title: result.success ? '已绑定手机号' : (result.message || '绑定失败'),
      icon: result.success ? 'success' : 'none'
    });
    if (result.success) this.loadData();
  },

  showManualPhone() {
    this.setData({ showManualPhoneInput: true });
  },

  onManualPhoneInput(e) {
    this.setData({ manualPhone: e.detail.value });
  },

  async saveManualPhone() {
    const phone = String(this.data.manualPhone || '').trim();
    if (!/^1\d{10}$/.test(phone)) {
      wx.showToast({ title: '请输入11位手机号', icon: 'none' });
      return;
    }
    const user = this.data.user || {};
    const result = await service.saveUser({
      ...user,
      phone
    });
    wx.showToast({
      title: result.success ? '已保存手机号' : '保存失败',
      icon: result.success ? 'success' : 'none'
    });
    if (result.success) this.loadData();
  }
});
