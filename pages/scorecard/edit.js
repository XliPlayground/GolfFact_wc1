const service = require('../../utils/service');
const mock = require('../../utils/mock');

const NUMBER_OPTIONS = Array.from({ length: 11 }, (_, index) => index);
const PLACEHOLDER_COURSE = { _id: '', name: '请选择球场', pars: [] };

function getStrokeOptions(par) {
  const max = Math.max(Number(par || 4) * 2, 1);
  return Array.from({ length: max + 1 }, (_, index) => index);
}

function clampStrokesToDoublePar(strokes, par) {
  const number = Number.isFinite(Number(strokes)) ? Number(strokes) : Number(par || 4);
  return Math.max(0, Math.min(Number(par || 4) * 2, number));
}

function matchCourseByLocation(courses, location) {
  const text = String(location || '').trim();
  if (!text) return 0;
  const index = courses.findIndex((course, courseIndex) => {
    if (courseIndex === 0) return false;
    return text.indexOf(course.name) >= 0 || course.name.indexOf(text) >= 0;
  });
  return index >= 0 ? index : 0;
}

Page({
  data: {
    scorecardId: '',
    activityId: '',
    recordedBy: '',
    isReadOnly: false,
    editable: true,
    user: null,
    courses: [PLACEHOLDER_COURSE],
    holes: [],
    numberOptions: NUMBER_OPTIONS,
    courseOptions: [PLACEHOLDER_COURSE.name],
    courseIndex: 0,
    courseId: '',
    courseName: '',
    courseNameText: '选择球场名称',
    playDate: '',
    totalPar: 0,
    scoreToParText: 'E',
    totalStrokes: 0,
    totalPutts: 0,
    totalPenalties: 0,
    autosaveText: '尚未保存'
  },

  async onLoad(options) {
    await this.loadCourses();
    const user = await this.resolveUser(options.userId);
    const isReadOnly = options.readonly === '1';
    this.setData({
      activityId: options.activityId || '',
      recordedBy: options.recordedBy || '',
      isReadOnly,
      editable: !isReadOnly
    });
    if (options.id) {
      await this.loadExistingScorecard(user, options.id);
      return;
    }

    await this.createNewScorecard(user);
  },

  async loadCourses() {
    const courses = await service.getCourses();
    const list = [PLACEHOLDER_COURSE, ...(courses || [])];
    this.setData({
      courses: list,
      courseOptions: list.map(item => item.name)
    });
  },

  async resolveUser(userId) {
    if (!userId) return service.getCurrentUser();
    const users = await service.getUsers();
    const user = (users || []).find(item => item._id === userId);
    return user || service.getCurrentUser();
  },

  async createNewScorecard(user) {
    const playDate = mock.getToday();
    const scorecardId = `sc_${user._id}_${Date.now()}`;
    const activity = await this.getActivity(this.data.activityId);
    const courseIndex = activity && activity.courseId
      ? this.findCourseIndexById(activity.courseId)
      : (activity ? matchCourseByLocation(this.data.courses, activity.location) : 0);
    const matchedCourse = this.data.courses[courseIndex] || PLACEHOLDER_COURSE;
    const courseName = courseIndex > 0
      ? matchedCourse.name
      : (activity && activity.location ? activity.location : '');
    const courseNameText = courseName || '选择球场名称';
    const pars = courseIndex > 0
      ? matchedCourse.pars
      : Array.from({ length: 18 }, () => 4);
    const holes = [];

    for (let i = 1; i <= 18; i++) {
      const par = pars[i - 1] || 4;
      holes.push({
        holeNumber: i,
        par,
        strokes: par,
        resultText: this.getHoleResultText(par, par),
        resultClass: 'result-tag par',
        strokeOptions: getStrokeOptions(par),
        putts: 2,
        penalties: 0,
        strokesIndex: par,
        puttsIndex: 2,
        penaltiesIndex: 0
      });
    }

    this.setData({
      user,
      scorecardId,
      playDate,
      courseIndex,
      courseId: matchedCourse._id || '',
      courseName,
      courseNameText,
      holes
    });
    this.calculateTotal();
    this.saveDraft();
  },

  findCourseIndexById(courseId) {
    const index = this.data.courses.findIndex(item => item._id === courseId);
    return index >= 0 ? index : 0;
  },

  async getActivity(activityId) {
    if (!activityId) return null;
    const activities = await service.getActivities();
    return (activities || []).find(item => item._id === activityId) || null;
  },

  async loadExistingScorecard(user, scorecardId) {
    const scorecards = await service.getScorecards(user._id);
    const scorecard = (scorecards || []).find(item => item._id === scorecardId);
    if (!scorecard) {
      wx.showToast({ title: '记分卡不存在', icon: 'none' });
      this.createNewScorecard(user);
      return;
    }

    const holes = this.normalizeHoles(scorecard.holes || []);
    const courseIndex = scorecard.courseId
      ? this.findCourseIndexById(scorecard.courseId)
      : this.data.courseOptions.findIndex(item => item === scorecard.courseName);
    const matchedCourse = this.data.courses[courseIndex] || PLACEHOLDER_COURSE;

    this.setData({
      user,
      scorecardId,
      playDate: scorecard.playDate || mock.getToday(),
      holes,
      courseIndex: courseIndex >= 0 ? courseIndex : 0,
      courseId: matchedCourse._id || scorecard.courseId || '',
      courseName: scorecard.courseName === '未选择球场' ? '' : (scorecard.courseName || ''),
      courseNameText: scorecard.courseName && scorecard.courseName !== '未选择球场' ? scorecard.courseName : '选择球场名称',
      autosaveText: this.data.isReadOnly ? '秋の认证记录' : (scorecard.status === 'draft' ? '已载入草稿' : '已载入记录')
    });
    this.calculateTotal();
  },

  normalizeHoles(savedHoles) {
    const holes = [];
    for (let i = 1; i <= 18; i++) {
      const saved = savedHoles.find(item => item.holeNumber === i) || {};
      const par = Number(saved.par || 4);
      const strokes = clampStrokesToDoublePar(saved.strokes, par);
      const putts = this.clampScore(saved.putts, 2);
      const penalties = this.clampScore(saved.penalties, 0);
      holes.push({
        holeNumber: i,
        par,
        strokes,
        resultText: this.getHoleResultText(par, strokes),
        resultClass: this.getHoleResultClass(par, strokes),
        strokeOptions: getStrokeOptions(par),
        putts,
        penalties,
        strokesIndex: strokes,
        puttsIndex: putts,
        penaltiesIndex: penalties
      });
    }
    return holes;
  },

  clampScore(value, fallback) {
    const number = Number.isFinite(Number(value)) ? Number(value) : fallback;
    return Math.max(0, Math.min(10, number));
  },

  onCourseChange(e) {
    if (this.data.isReadOnly) return;
    const courseIndex = parseInt(e.detail.value, 10);
    const course = this.data.courses[courseIndex] || PLACEHOLDER_COURSE;
    const courseName = course.name || '';
    const holes = this.applyCoursePars(this.data.holes, courseIndex);
    this.setData({
      courseIndex,
      courseId: courseIndex === 0 ? '' : (course._id || ''),
      courseName: courseIndex === 0 ? '' : courseName,
      courseNameText: courseIndex === 0 ? '选择球场名称' : courseName,
      holes
    });
    this.calculateTotal();
    this.saveDraft();
  },

  applyCoursePars(holes, courseIndex) {
    const pars = (this.data.courses[courseIndex] && this.data.courses[courseIndex].pars) || [];
    if (pars.length === 0) return holes;
    return holes.map((hole, index) => {
      const par = pars[index] || hole.par || 4;
      const strokes = clampStrokesToDoublePar(hole.strokes, par);
      return {
        ...hole,
        par,
        strokes,
        resultText: this.getHoleResultText(par, strokes),
        resultClass: this.getHoleResultClass(par, strokes),
        strokesIndex: strokes,
        strokeOptions: getStrokeOptions(par)
      };
    });
  },

  useLocationCourse() {
    if (this.data.isReadOnly) return;
    wx.getLocation({
      type: 'gcj02',
      success: res => {
        const courseName = `当前位置球场 ${res.latitude.toFixed(4)},${res.longitude.toFixed(4)}`;
        this.setData({
          courseIndex: 0,
          courseName,
          courseNameText: courseName
        });
        this.saveDraft();
        wx.showToast({ title: '已记录位置', icon: 'success' });
      },
      fail: () => {
        wx.showToast({ title: '无法获取位置', icon: 'none' });
      }
    });
  },

  onScorePickerChange(e) {
    if (this.data.isReadOnly) return;
    const { index, field } = e.currentTarget.dataset;
    const value = NUMBER_OPTIONS[parseInt(e.detail.value, 10)] || 0;
    const holes = [...this.data.holes];
    const hole = holes[index];
    const nextValue = field === 'strokes' ? clampStrokesToDoublePar(value, hole.par) : value;

    holes[index][field] = nextValue;
    holes[index][`${field}Index`] = nextValue;
    if (field === 'strokes') {
      holes[index].resultText = this.getHoleResultText(hole.par, nextValue);
      holes[index].resultClass = this.getHoleResultClass(hole.par, nextValue);
    }

    this.setData({ holes });
    this.calculateTotal();
    this.saveDraft();
  },

  calculateTotal() {
    const totalPar = this.data.holes.reduce((sum, h) => sum + Number(h.par || 0), 0);
    const totalStrokes = this.data.holes.reduce((sum, h) => sum + h.strokes, 0);
    const totalPutts = this.data.holes.reduce((sum, h) => sum + h.putts, 0);
    const totalPenalties = this.data.holes.reduce((sum, h) => sum + h.penalties, 0);
    const scoreToPar = totalPar ? totalStrokes - totalPar : 0;
    const scoreToParText = scoreToPar === 0 ? 'E' : (scoreToPar > 0 ? `+${scoreToPar}` : `${scoreToPar}`);
    this.setData({ totalPar, scoreToParText, totalStrokes, totalPutts, totalPenalties });
  },

  getHoleResultText(par, strokes) {
    const score = Number(strokes || 0);
    const basePar = Number(par || 4);
    if (!score) return '-';
    if (score === 1) return '一杆进洞';
    if (score <= basePar - 3) return '一只鸡';
    if (score === basePar - 2) return '鹰';
    if (score === basePar - 1) return '鸟';
    if (score === basePar) return 'Par';
    if (score >= basePar * 2) return '双Par';
    return `+${score - basePar}`;
  },

  getHoleResultClass(par, strokes) {
    const text = this.getHoleResultText(par, strokes);
    if (text === '一杆进洞') return 'result-tag hole-in-one';
    if (text === '一只鸡') return 'result-tag one-chicken';
    if (text === '鹰') return 'result-tag eagle';
    if (text === '鸟') return 'result-tag birdie';
    if (text === 'Par') return 'result-tag par';
    return 'result-tag over';
  },

  buildScorecard(status) {
    return {
      _id: this.data.scorecardId,
      userId: this.data.user._id,
      activityId: this.data.activityId,
      courseId: this.data.courseId,
      courseName: this.data.courseName || '未选择球场',
      playDate: this.data.playDate,
      holes: this.data.holes.map(hole => ({
        holeNumber: hole.holeNumber,
        par: hole.par,
        strokes: hole.strokes,
        putts: hole.putts,
        penalties: hole.penalties
      })),
      totalPar: this.data.totalPar,
      totalStrokes: this.data.totalStrokes,
      scoreToPar: this.data.totalStrokes - this.data.totalPar,
      totalPutts: this.data.totalPutts,
      totalPenalties: this.data.totalPenalties,
      status,
      recordedType: this.data.activityId ? 'activity_admin' : 'live',
      recordedBy: this.data.recordedBy || ''
    };
  },

  async saveDraft() {
    if (this.data.isReadOnly || !this.data.user || !this.data.scorecardId) return;
    await service.upsertScorecard(this.buildScorecard('draft'));
    const now = new Date();
    const autosaveText = `已自动保存 ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    this.setData({ autosaveText });
  },

  async submitScorecard() {
    if (this.data.isReadOnly) return;
    if (!this.data.courseName) {
      wx.showToast({ title: '请选择球场', icon: 'none' });
      return;
    }

    await service.upsertScorecard(this.buildScorecard('submitted'));
    if (this.data.activityId) {
      await service.createActivityRecord({
        activityId: this.data.activityId,
        userId: this.data.user._id,
        scorecardId: this.data.scorecardId,
        totalStrokes: this.data.totalStrokes,
        netScore: this.data.totalStrokes - this.data.totalPar,
        totalPar: this.data.totalPar,
        status: 'approved',
        recordedBy: this.data.recordedBy || 'admin'
      });
    }

    wx.showToast({
      title: '保存成功',
      icon: 'success',
      success: () => {
        setTimeout(() => {
          wx.navigateBack();
        }, 1000);
      }
    });
  }
});
