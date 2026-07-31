// pages/index/index.js
const service = require('../../utils/service');

const TAB_PATHS = [
  '/pages/index/index',
  '/pages/booking/index',
  '/pages/scorecard/index',
  '/pages/ranking/index',
  '/pages/mine/index'
];

function getEmptyCertification() {
  return {
    holeInOne: 0,
    eagle: 0,
    birdie: 0,
    par: 0,
    oneChicken: 0
  };
}

function getCardTime(card) {
  return new Date(card.playDate || card.updatedAt || card.createdAt || 0).getTime();
}

Page({
  data: {
    site: {},
    user: {},
    userDisplayName: '游客',
    memberLevelName: '',
    remainingHoursText: '0',
    pendingHoursText: '0',
    pendingAppointmentHours: 0,
    certification: getEmptyCertification(),
    recentScores: [],
    chartSegments: [],
    hasRecentScores: false,
    showChartEmpty: true,
    activities: [],
    quickLinks: [
      { name: '立即预约', icon: '⛳', path: '/pages/booking/index' },
      { name: '小店吧', icon: '🥤', path: '/pages/shop/index' },
      { name: '教练', icon: '👤', path: '/pages/coach/index' },
      { name: '下场活动', icon: '🏆', path: '/pages/activity/index?type=event' }
    ]
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
      const remainingHours = Number(safeUser.remainingHours || 0);
      const memberLevels = settings.memberLevels || [];
      const memberLevel = memberLevels.find(item => item.level === safeUser.memberLevel);

      this.setData({
        site: settings.site || {},
        user: safeUser,
        userDisplayName: safeUser.nickname || safeUser.name || '游客',
        memberLevelName: memberLevel ? memberLevel.name : '普通会员',
        remainingHoursText: String(remainingHours)
      });

      const pendingAppointmentHours = safeUser._id ? await service.getPendingAppointmentHours(safeUser._id) : 0;
      const scorecards = safeUser._id ? await service.getScorecards(safeUser._id) : [];
      const scoreSummary = this.buildScoreSummary(scorecards || []);
      const activities = (await service.getActivities()).slice(0, 3);

      this.setData({
        pendingHoursText: String(pendingAppointmentHours),
        pendingAppointmentHours,
        certification: scoreSummary.certification,
        recentScores: scoreSummary.recentScores,
        chartSegments: scoreSummary.chartSegments,
        hasRecentScores: scoreSummary.recentScores.length > 0,
        showChartEmpty: scoreSummary.recentScores.length === 0,
        activities
      });
    } catch (err) {
      console.warn('index loadData failed:', err);
      this.setData({
        site: { notice: '欢迎预约打球' },
        userDisplayName: '游客',
        memberLevelName: '普通会员',
        remainingHoursText: '0',
        pendingHoursText: '0',
        pendingAppointmentHours: 0,
        certification: getEmptyCertification(),
        recentScores: [],
        chartSegments: [],
        hasRecentScores: false,
        showChartEmpty: true,
        activities: []
      });
    }
  },

  buildScoreSummary(scorecards) {
    const certification = getEmptyCertification();
    const submittedCards = (scorecards || [])
      .filter(card => card.status === 'submitted')
      .sort((a, b) => getCardTime(b) - getCardTime(a));

    submittedCards.forEach(card => {
      (card.holes || []).forEach(hole => {
        const strokes = Number(hole.strokes || 0);
        const par = Number(hole.par || 4);
        if (!strokes || !par) return;
        if (strokes === 1) certification.holeInOne += 1;
        if (strokes === par - 2) certification.eagle += 1;
        if (strokes === par - 1) certification.birdie += 1;
        if (strokes === par) certification.par += 1;
        if (strokes <= par - 3) certification.oneChicken += 1;
      });
    });

    const recentScores = submittedCards
      .slice(0, 10)
      .reverse()
      .map((card, index) => ({
        label: String(index + 1),
        value: Number(card.totalStrokes || 0),
        dateText: card.playDate ? card.playDate.slice(5) : ''
      }))
      .filter(item => item.value > 0);

    return {
      certification,
      recentScores: this.decorateChartPoints(recentScores),
      chartSegments: this.buildChartSegments(recentScores)
    };
  },

  decorateChartPoints(scores) {
    if (scores.length === 0) return [];
    const values = scores.map(item => item.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = Math.max(max - min, 1);
    return scores.map((item, index) => {
      const left = scores.length === 1 ? 50 : (index / (scores.length - 1)) * 100;
      const top = 12 + ((max - item.value) / range) * 116;
      return {
        ...item,
        pointStyle: `left:${left}%;top:${top}rpx;`
      };
    });
  },

  buildChartSegments(scores) {
    const points = this.decorateChartPoints(scores);
    const segments = [];
    for (let i = 0; i < points.length - 1; i++) {
      const left = parseFloat(points[i].pointStyle.match(/left:([0-9.]+)%/)[1]);
      const top = parseFloat(points[i].pointStyle.match(/top:([0-9.]+)rpx/)[1]);
      const nextLeft = parseFloat(points[i + 1].pointStyle.match(/left:([0-9.]+)%/)[1]);
      const nextTop = parseFloat(points[i + 1].pointStyle.match(/top:([0-9.]+)rpx/)[1]);
      const dx = nextLeft - left;
      const dy = nextTop - top;
      const width = Math.sqrt(dx * dx * 4 + dy * dy);
      const angle = Math.atan2(dy, dx * 2) * 180 / Math.PI;
      segments.push({
        style: `left:${left}%;top:${top}rpx;width:${width}rpx;transform:rotate(${angle}deg);`
      });
    }
    return segments;
  },

  navigate(path) {
    if (!path) return;
    const cleanPath = path.split('?')[0];
    if (TAB_PATHS.includes(cleanPath)) {
      wx.switchTab({ url: cleanPath });
      return;
    }
    wx.navigateTo({ url: path });
  },

  onQuickTap(e) {
    const path = e.currentTarget.dataset.path;
    this.navigate(path);
  },

  goBooking() {
    this.navigate('/pages/booking/index');
  },

  goToMine() {
    this.navigate('/pages/mine/index');
  },

  goToActivity(e) {
    const id = e.currentTarget.dataset.id;
    this.navigate(`/pages/activity/index?id=${id}`);
  }
});
