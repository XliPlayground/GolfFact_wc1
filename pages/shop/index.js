// pages/shop/index.js
const service = require('../../utils/service');

Page({
  data: {
    categories: [],
    products: [],
    selectedCategory: ''
  },

  async onLoad() {
    const categories = await service.getCategories();
    this.setData({ 
      categories,
      selectedCategory: categories[0]?._id || ''
    });
    this.loadProducts();
  },

  async loadProducts() {
    const products = await service.getProducts(this.data.selectedCategory);
    this.setData({ products: (products || []).filter(item => item.status === 'on_sale') });
  },

  selectCategory(e) {
    this.setData({ selectedCategory: e.currentTarget.dataset.id }, () => {
      this.loadProducts();
    });
  },

  goDetail(e) {
    wx.navigateTo({ url: `/pages/shop/detail?id=${e.currentTarget.dataset.id}` });
  }
});
