// pages/shop/detail.js
const service = require('../../utils/service');

Page({
  data: {
    product: {}
  },

  async onLoad(options) {
    const products = await service.getProducts();
    const product = products.find(p => p._id === options.id && p.status === 'on_sale') || {};
    this.setData({ product });
  }
});
