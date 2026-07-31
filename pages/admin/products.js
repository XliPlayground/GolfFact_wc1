const service = require('../../utils/service');

function emptyProductForm() {
  return {
    _id: '',
    name: '',
    categoryId: '',
    price: '',
    unit: '件',
    stock: '',
    description: '',
    imageUrl: '',
    status: 'on_sale'
  };
}

function emptyCategoryForm() {
  return { _id: '', name: '', displayOrder: '1', status: 'active' };
}

Page({
  data: {
    categories: [],
    products: [],
    categoryForm: emptyCategoryForm(),
    productForm: emptyProductForm(),
    categoryIndex: 0,
    categoryPickerText: '请选择分类',
    editingCategory: false,
    editingProduct: false,
    showProductEmpty: true
  },

  onLoad() {
    this.loadData();
  },

  onShow() {
    this.loadData();
  },

  async loadData() {
    const [rawCategories, rawProducts] = await Promise.all([
      service.getCategories(),
      service.getProducts()
    ]);
    const categories = (rawCategories || [])
      .filter(item => item.status !== 'deleted')
      .sort((a, b) => Number(a.displayOrder || 0) - Number(b.displayOrder || 0));
    const categoryMap = {};
    categories.forEach(item => {
      categoryMap[item._id] = item.name;
    });
    const products = (rawProducts || [])
      .filter(item => item.status !== 'deleted')
      .map(item => ({
        ...item,
        categoryName: categoryMap[item.categoryId] || '未分类',
        statusText: item.status === 'on_sale' ? '展示中' : '已下架'
      }));
    this.setData({
      categories,
      products,
      showProductEmpty: products.length === 0
    });
  },

  newCategory() {
    this.setData({ categoryForm: emptyCategoryForm(), editingCategory: true });
  },

  editCategory(e) {
    const category = this.data.categories.find(item => item._id === e.currentTarget.dataset.id);
    if (!category) return;
    this.setData({
      categoryForm: {
        _id: category._id,
        name: category.name || '',
        displayOrder: String(category.displayOrder || 1),
        status: category.status || 'active'
      },
      editingCategory: true
    });
  },

  onCategoryInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({
      categoryForm: {
        ...this.data.categoryForm,
        [field]: e.detail.value
      }
    });
  },

  async saveCategory() {
    const form = this.data.categoryForm;
    if (!form.name) {
      wx.showToast({ title: '请填写分类名称', icon: 'none' });
      return;
    }
    await service.saveCategory({
      ...form,
      displayOrder: Number(form.displayOrder || 0)
    });
    wx.showToast({ title: '已保存分类', icon: 'success' });
    this.setData({ editingCategory: false, categoryForm: emptyCategoryForm() });
    this.loadData();
  },

  newProduct() {
    const firstCategory = this.data.categories[0];
    this.setData({
      productForm: {
        ...emptyProductForm(),
        categoryId: firstCategory ? firstCategory._id : ''
      },
      categoryIndex: 0,
      categoryPickerText: firstCategory ? firstCategory.name : '请选择分类',
      editingProduct: true
    });
  },

  editProduct(e) {
    const product = this.data.products.find(item => item._id === e.currentTarget.dataset.id);
    if (!product) return;
    const categoryIndex = Math.max(this.data.categories.findIndex(item => item._id === product.categoryId), 0);
    const category = this.data.categories[categoryIndex];
    this.setData({
      productForm: {
        _id: product._id,
        name: product.name || '',
        categoryId: product.categoryId || '',
        price: String(product.price || 0),
        unit: product.unit || '件',
        stock: String(product.stock || 0),
        description: product.description || '',
        imageUrl: product.imageUrl || '',
        status: product.status || 'on_sale'
      },
      categoryIndex,
      categoryPickerText: category ? category.name : '请选择分类',
      editingProduct: true
    });
  },

  onProductInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({
      productForm: {
        ...this.data.productForm,
        [field]: e.detail.value
      }
    });
  },

  onProductCategoryChange(e) {
    const categoryIndex = parseInt(e.detail.value, 10);
    const category = this.data.categories[categoryIndex];
    this.setData({
      categoryIndex,
      categoryPickerText: category ? category.name : '请选择分类',
      productForm: {
        ...this.data.productForm,
        categoryId: category ? category._id : ''
      }
    });
  },

  toggleProductStatus() {
    const status = this.data.productForm.status === 'on_sale' ? 'off_sale' : 'on_sale';
    this.setData({
      productForm: {
        ...this.data.productForm,
        status
      }
    });
  },

  async saveProduct() {
    const form = this.data.productForm;
    if (!form.name) {
      wx.showToast({ title: '请填写商品名称', icon: 'none' });
      return;
    }
    await service.saveProduct({
      ...form,
      price: Number(form.price || 0),
      stock: Number(form.stock || 0)
    });
    wx.showToast({ title: '已保存商品', icon: 'success' });
    this.setData({ editingProduct: false, productForm: emptyProductForm() });
    this.loadData();
  },

  async quickToggleProduct(e) {
    const product = this.data.products.find(item => item._id === e.currentTarget.dataset.id);
    if (!product) return;
    await service.saveProduct({
      ...product,
      status: product.status === 'on_sale' ? 'off_sale' : 'on_sale'
    });
    this.loadData();
  },

  async deleteProduct(e) {
    await service.deleteProduct(e.currentTarget.dataset.id);
    wx.showToast({ title: '已删除', icon: 'success' });
    this.loadData();
  }
});
