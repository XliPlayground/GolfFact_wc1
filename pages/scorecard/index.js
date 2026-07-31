// pages/scorecard/index.js
const service = require('../../utils/service');

Page({
  data: {
    activeTab: 'self',
    tabs: [
      { label: '自己记录', value: 'self', className: 'tab active' },
      { label: '秋の认证', value: 'certified', className: 'tab' }
    ],
    allScorecards: [],
    scorecards: [],
    showCreateButton: true,
    showEmpty: true,
    emptyText: '暂无记分卡记录'
  },

  onLoad() {
    this.loadData();
  },

  onShow() {
    this.loadData();
  },

  async loadData() {
    const user = await service.getCurrentUser();
    const scorecards = await service.getScorecards(user._id);
    const userCards = (scorecards || [])
      .map(item => ({
        ...item,
        statusText: item.status === 'draft' ? '草稿' : '已保存',
        courseName: item.courseName || '未选择球场',
        scoreToParText: this.formatScoreToPar(item.scoreToPar),
        typeText: this.isCertifiedCard(item) ? '秋の认证' : '自己记录',
        canDelete: !this.isCertifiedCard(item)
      }));

    this.setData({ allScorecards: userCards }, () => {
      this.applyTab();
    });
  },

  isCertifiedCard(card) {
    return card.recordedType === 'activity_admin' || card.recordedBy === 'admin' || !!card.activityId;
  },

  formatScoreToPar(value) {
    const number = Number(value || 0);
    if (number === 0) return 'E';
    return number > 0 ? `+${number}` : String(number);
  },

  decorateTabs(activeTab) {
    return this.data.tabs.map(item => ({
      ...item,
      className: item.value === activeTab ? 'tab active' : 'tab'
    }));
  },

  applyTab() {
    const activeTab = this.data.activeTab;
    const scorecards = this.data.allScorecards
      .filter(item => activeTab === 'certified' ? this.isCertifiedCard(item) : !this.isCertifiedCard(item))
      .map(item => ({
        ...item,
        isReadOnly: activeTab === 'certified'
      }))
      .sort((a, b) => new Date(b.updatedAt || b.playDate || 0) - new Date(a.updatedAt || a.playDate || 0));

    this.setData({
      tabs: this.decorateTabs(activeTab),
      scorecards,
      showCreateButton: activeTab === 'self',
      showEmpty: scorecards.length === 0,
      emptyText: activeTab === 'certified' ? '暂无秋の认证记录' : '暂无自己记录'
    });
  },

  switchTab(e) {
    const activeTab = e.currentTarget.dataset.tab;
    this.setData({ activeTab }, () => {
      this.applyTab();
    });
  },

  createScorecard() {
    wx.navigateTo({ url: '/pages/scorecard/edit' });
  },

  editScorecard(e) {
    const id = e.currentTarget.dataset.id;
    const readonly = e.currentTarget.dataset.readonly;
    const isReadOnly = readonly === true || readonly === 'true';
    const url = isReadOnly ? `/pages/scorecard/edit?id=${id}&readonly=1` : `/pages/scorecard/edit?id=${id}`;
    wx.navigateTo({ url });
  },

  async deleteScorecard(e) {
    const id = e.currentTarget.dataset.id;
    const user = await service.getCurrentUser();
    wx.showModal({
      title: '删除记分卡',
      content: '删除后不会在自己记录里显示',
      success: async res => {
        if (!res.confirm) return;
        const result = await service.deleteScorecard(id, user._id);
        wx.showToast({
          title: result.success ? '已删除' : (result.message || '删除失败'),
          icon: result.success ? 'success' : 'none'
        });
        if (result.success) this.loadData();
      }
    });
  }
});
