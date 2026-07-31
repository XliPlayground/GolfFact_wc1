const service = require('../../utils/service');

Page({
  data: {
    settlementConfirmHours: 48,
    noShowMultiplier: 1.5
  },

  onLoad() {
    this.loadSettings();
  },

  onShow() {
    this.loadSettings();
  },

  async loadSettings() {
    const settings = await service.getSettings();
    const noShowRule = settings.noShowRule || {};
    this.setData({
      settlementConfirmHours: noShowRule.settlementConfirmHours || 48,
      noShowMultiplier: noShowRule.noShowMultiplier || 1.5
    });
  },

  onConfirmHoursInput(e) {
    this.setData({ settlementConfirmHours: e.detail.value });
  },

  onMultiplierInput(e) {
    this.setData({ noShowMultiplier: e.detail.value });
  },

  async saveSettings() {
    const settlementConfirmHours = Number(this.data.settlementConfirmHours);
    const noShowMultiplier = Number(this.data.noShowMultiplier);

    if (!settlementConfirmHours || settlementConfirmHours <= 0) {
      wx.showToast({ title: '确认窗口需大于0', icon: 'none' });
      return;
    }
    if (!noShowMultiplier || noShowMultiplier < 1) {
      wx.showToast({ title: '爽约倍率不能小于1', icon: 'none' });
      return;
    }

    const result = await service.updateSettings({
      noShowRule: {
        settlementConfirmHours,
        noShowMultiplier
      }
    });

    if (result && result.success === false) {
      wx.showToast({ title: '保存失败', icon: 'none' });
      return;
    }

    wx.showToast({ title: '保存成功', icon: 'success' });
  }
});
