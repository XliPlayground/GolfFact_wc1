// pages/ranking/index.js
const service = require('../../utils/service');

const TAB_OPTIONS = [
  { label: '近5场最佳', value: 'last5Best' },
  { label: '近5场平均', value: 'last5Avg' },
  { label: '历史最好', value: 'personalBest' }
];

const HONOR_ORDER = ['eagle', 'birdie', 'holeInOne', 'par', 'oneChicken'];
const DEFAULT_HONORS = [
  { key: 'eagle', title: '鹰王', name: '暂无', valueText: '0只' },
  { key: 'birdie', title: '鸟王', name: '暂无', valueText: '0只' },
  { key: 'holeInOne', title: '一杆进洞王', name: '暂无', valueText: '0次' },
  { key: 'par', title: 'Par王', name: '暂无', valueText: '0洞' },
  { key: 'oneChicken', title: '一只鸡王', name: '暂无', valueText: '0只' }
];
const HONOR_TITLE_KEYS = {
  '鹰王': 'eagle',
  '鸟王': 'birdie',
  '一杆进洞王': 'holeInOne',
  'Par王': 'par',
  '一只鸡王': 'oneChicken'
};

function decorateTabs(activeTab) {
  return TAB_OPTIONS.map(item => ({
    ...item,
    className: item.value === activeTab ? 'tab active' : 'tab'
  }));
}

function normalizeHonors(honors) {
  const rows = (honors || []).map(item => ({
    ...item,
    key: item.key || HONOR_TITLE_KEYS[item.title] || ''
  }));
  const mergedRows = DEFAULT_HONORS.map(defaultItem => ({
    ...defaultItem,
    ...(rows.find(item => item.key === defaultItem.key) || {})
  }));
  mergedRows.sort((a, b) => HONOR_ORDER.indexOf(a.key) - HONOR_ORDER.indexOf(b.key));
  return {
    top: mergedRows.filter(item => item.key === 'eagle' || item.key === 'birdie'),
    bottom: mergedRows.filter(item => item.key === 'holeInOne' || item.key === 'par' || item.key === 'oneChicken')
  };
}

Page({
  data: {
    activeTab: 'last5Best',
    tabs: decorateTabs('last5Best'),
    honorsTop: DEFAULT_HONORS.slice(0, 2),
    honorsBottom: DEFAULT_HONORS.slice(2),
    rankings: []
  },

  onLoad() {
    this.loadData();
  },

  switchTab(e) {
    const activeTab = e.currentTarget.dataset.tab;
    this.setData({ activeTab, tabs: decorateTabs(activeTab) }, () => {
      this.loadData();
    });
  },

  async loadData() {
    try {
      const [honors, rankings] = await Promise.all([
        service.getCertifiedHonors(),
        service.getRankings(this.data.activeTab)
      ]);
      const honorGroups = normalizeHonors(honors);
      this.setData({
        honorsTop: honorGroups.top,
        honorsBottom: honorGroups.bottom,
        rankings: (rankings || []).map(item => ({
          ...item,
          className: item.isMe ? 'ranking-item me' : 'ranking-item'
        }))
      });
    } catch (err) {
      console.warn('ranking loadData failed:', err);
      const honorGroups = normalizeHonors([]);
      this.setData({
        honorsTop: honorGroups.top,
        honorsBottom: honorGroups.bottom,
        rankings: []
      });
    }
  }
});
