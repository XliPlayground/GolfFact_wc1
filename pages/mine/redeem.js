const service = require('../../utils/service');

function extractCode(rawValue) {
  const value = String(rawValue || '').trim();
  if (!value) return '';

  let decodedValue = value;
  try {
    decodedValue = decodeURIComponent(value);
  } catch (err) {
    decodedValue = value;
  }

  const nestedMatch = decodedValue.match(/[?&]q=([^&#]+)/i);
  if (nestedMatch && nestedMatch[1]) {
    return extractCode(nestedMatch[1]);
  }

  const queryMatch = decodedValue.match(/[?&](code|cardNo)=([^&#]+)/i);
  if (queryMatch && queryMatch[2]) {
    return queryMatch[2].trim().toUpperCase();
  }

  return decodedValue
    .replace(/^.*\/pages\/mine\/redeem\?/i, '')
    .replace(/^code=/i, '')
    .trim()
    .toUpperCase();
}

Page({
  data: {
    code: '',
    autoRedeeming: false,
    redeemButtonText: '确认兑换'
  },

  onLoad(options) {
    const code = extractCode(options.code || options.cardNo || '');
    if (code) {
      this.setData({ code }, () => {
        this.redeem();
      });
    }
  },

  onCodeInput(e) {
    this.setData({ code: extractCode(e.detail.value) });
  },

  scanCode() {
    wx.scanCode({
      onlyFromCamera: false,
      success: (res) => {
        const code = extractCode(res.result);
        if (!code) {
          wx.showToast({ title: '未识别到兑换码', icon: 'none' });
          return;
        }
        this.setData({ code }, () => {
          this.redeem();
        });
      },
      fail: () => {
        wx.showToast({ title: '扫码已取消', icon: 'none' });
      }
    });
  },

  pasteCode() {
    wx.getClipboardData({
      success: (res) => {
        const code = extractCode(res.data);
        if (!code) {
          wx.showToast({ title: '剪贴板没有兑换码', icon: 'none' });
          return;
        }
        this.setData({ code });
        wx.showToast({ title: '已粘贴', icon: 'success' });
      }
    });
  },

  async redeem() {
    if (this.data.autoRedeeming) return;
    if (!this.data.code) {
      wx.showToast({ title: '请输入兑换码', icon: 'none' });
      return;
    }
    this.setData({ autoRedeeming: true, redeemButtonText: '兑换中...' });
    const user = await service.getCurrentUser();
    const result = await service.redeemVoucher(this.data.code, user._id);
    this.setData({ autoRedeeming: false, redeemButtonText: '确认兑换' });
    if (!result.success) {
      wx.showToast({ title: result.error || '兑换失败', icon: 'none' });
      return;
    }
    wx.showToast({
      title: '兑换成功',
      icon: 'success',
      success: () => {
        setTimeout(() => {
          wx.navigateBack();
        }, 1000);
      }
    });
  }
});
