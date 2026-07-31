// utils/db.js
// 微信云开发数据库封装

const CLOUD_ENV = 'cloud1-d8gwt560627562aff';
const TENANT_ID = 'golfact_default';

class DbService {
  constructor() {
    this.db = wx.cloud.database({ env: CLOUD_ENV });
    this._ = this.db.command;
  }

  // 通用查询
  async query(collection, where = {}) {
    try {
      const res = await this.db.collection(collection).where(where).get();
      return { success: true, data: res.data };
    } catch (err) {
      console.error(`query ${collection} error:`, err);
      return { success: false, error: err.message };
    }
  }

  // 根据 ID 查询
  async getById(collection, id) {
    try {
      const res = await this.db.collection(collection).doc(id).get();
      return { success: true, data: res.data };
    } catch (err) {
      console.error(`getById ${collection} error:`, err);
      return { success: false, error: err.message };
    }
  }

  // 新增
  async add(collection, data) {
    try {
      const res = await this.db.collection(collection).add({
        data: {
          ...data,
          tenantId: TENANT_ID,
          createTime: this.db.serverDate(),
          updateTime: this.db.serverDate()
        }
      });
      return { success: true, id: res._id };
    } catch (err) {
      console.error(`add ${collection} error:`, err);
      return { success: false, error: err.message };
    }
  }

  // 更新
  async update(collection, id, data) {
    try {
      await this.db.collection(collection).doc(id).update({
        data: {
          ...data,
          updateTime: this.db.serverDate()
        }
      });
      return { success: true };
    } catch (err) {
      console.error(`update ${collection} error:`, err);
      return { success: false, error: err.message };
    }
  }

  // 按指定 ID 创建或覆盖
  async set(collection, id, data) {
    try {
      await this.db.collection(collection).doc(id).set({
        data: {
          ...data,
          tenantId: TENANT_ID,
          createTime: data.createTime || this.db.serverDate(),
          updateTime: this.db.serverDate()
        }
      });
      return { success: true, id };
    } catch (err) {
      console.error(`set ${collection} error:`, err);
      return { success: false, error: err.message };
    }
  }

  // 删除
  async remove(collection, id) {
    try {
      await this.db.collection(collection).doc(id).remove();
      return { success: true };
    } catch (err) {
      console.error(`remove ${collection} error:`, err);
      return { success: false, error: err.message };
    }
  }

  // 带 tenantId 的查询条件
  withTenant(where = {}) {
    return { ...where, tenantId: TENANT_ID };
  }
}

module.exports = new DbService();
