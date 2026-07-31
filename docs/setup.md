# Golfact 部署与配置说明

## 已配置信息

- AppID: `wx46f87cd028af7e8b`
- 云开发环境 ID: `cloud1-d8gwt560627562aff`

## 首次运行步骤

### 1. 导入项目

1. 打开微信开发者工具
2. 选择「导入项目」
3. 项目目录选择本文件夹
4. AppID 会自动识别为 `wx46f87cd028af7e8b`

### 2. 开通云开发

1. 点击工具栏「云开发」按钮
2. 确认环境 ID 为 `cloud1-d8gwt560627562aff`
3. 开通完成后回到开发者工具

### 3. 关联云开发环境

1. 在左侧文件树找到 `cloudfunctions` 文件夹
2. 右键点击 `cloudfunctions`
3. 选择「关联环境」
4. 选择环境：`cloud1-d8gwt560627562aff`

> 如果遇到 `Error: please select an env in the editor (cloudfunctionRoot)`，说明还没有关联环境，必须先执行这一步。

### 4. 部署初始化云函数

1. 在左侧文件树找到 `cloudfunctions/initData`
2. 右键点击 `initData`
3. 选择「创建并部署：云端安装依赖」
4. 用同样方式部署：
   - `cloudfunctions/login`
   - `cloudfunctions/bindPhone`
   - `cloudfunctions/activityAction`
   - `cloudfunctions/voucherAction`
   - `cloudfunctions/userAction`
   - `cloudfunctions/appointmentAction`
4. 等待部署完成

### 4. 运行初始化云函数

1. 打开「云开发」控制台
2. 进入「云函数」→「initData」
3. 点击「测试」
4. 如果返回 `{ "success": true, "message": "数据库初始化完成" }`，说明成功

### 5. 切换到云数据库模式

当前代码已切到云数据库优先模式：

- `utils/service.js`：`USE_CLOUD = true`
- `app.js`：`mockMode = false`

如果云函数或数据库权限还没配置好，页面会自动回退本地 mock，但真实多人同步不会生效。

### 5.1 充时与扣时账本规则

- 老板后台直接充时会写入 `recharge_records`，并同步增加 `users.remainingHours`。
- 充时卡扫码兑换也会写入 `recharge_records`，状态为 `valid`。
- 用户预约时会从 `recharge_records` 中按到期日从早到晚扣减，并把扣减明细保存到预约的 `deductionDetails`。
- 取消预约时按 `deductionDetails` 退回原充值记录；爽约追加扣时同样按最早到期记录扣减。

### 6. 配置数据库权限

在云开发控制台 → 数据库中，为每个集合设置权限：

| 集合 | 权限建议 |
|------|---------|
| users | 仅创建者可读写自己的，管理员可读所有 |
| appointments | 仅创建者可读写自己的，管理员可读写 |
| recharge_records | 仅创建者可读自己的，管理员可读写 |
| scorecards | 仅创建者可读写自己的，管理员可读写 |
| settings/bays/coaches/products/... | 所有用户可读，管理员可读写 |

### 7. 创建索引

在云开发控制台为以下字段创建索引（可选但建议）：

- `users.openid`（唯一）
- `appointments.userId`
- `appointments.bayId`
- `appointments.date`
- `bay_time_slots.bayId`
- `bay_time_slots.date`
- `recharge_records.userId`
- `recharge_vouchers.token`（建议唯一）
- `recharge_vouchers.cardNo`（建议唯一）
- `recharge_vouchers.status`

## 管理员登录

- 用户名: `admin`
- 密码: `123456`

生产环境务必修改密码并加盐哈希存储。

## 注意事项

- 当前为演示版本，部分功能使用 mock 数据
- 微信支付未接入，所有费用线下处理
- 门锁联动功能已预留接口，待后续对接
