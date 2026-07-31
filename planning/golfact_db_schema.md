# Golfact 数据库字段表

> 基于微信云开发 CloudBase（文档型 NoSQL），字段类型使用 TypeScript/JS 习惯描述。
> `_id`、`createTime`、`updateTime` 为云数据库默认字段，不再逐个列出。
> 所有金额/价格单位：人民币元，使用整数分存储或保留两位小数字符串均可；本表采用 `number` 元。
> **SaaS 预留**：除 `admins`、`coach_accounts` 等账号类集合外，业务集合均包含 `tenantId` 字段，默认 `'golfact_default'`，未来多租户扩展时只需按 tenantId 隔离数据。

---

## 1. users（用户表）

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| openid | string | 是 | - | 微信用户唯一标识 |
| unionid | string | 否 | - | 微信 unionid，多应用互通时使用 |
| nickname | string | 否 | - | 微信昵称 |
| avatarUrl | string | 否 | - | 微信头像 URL |
| name | string | 否 | - | 真实姓名（后台维护） |
| phone | string | 否 | - | 手机号（后台维护或微信授权） |
| role | string | 是 | 'user' | user / coach / admin |
| memberLevel | string | 否 | 'normal' | 会员等级标识，关联 settings.memberLevels |
| remainingHours | number | 是 | 0 | 剩余可预约小时数 |
| totalRechargedHours | number | 是 | 0 | 累计充值小时数 |
| totalTrainedHours | number | 是 | 0 | 累计训练小时数 |
| totalSpent | number | 是 | 0 | 累计充值金额（元） |
| currentNoShowCount | number | 是 | 0 | 当前缴费周期内临时爽约次数 |
| noShowPenaltyMode | string | 否 | null | 用户单独爽约惩罚模式：actual / ratio，null 走全局 |
| noShowPenaltyValue | number | 否 | null | 用户单独惩罚值（actual=小时数，ratio=百分比） |
| status | string | 是 | 'active' | active / inactive / blacklisted |
| golfStats | object | 否 | {} | { last5Best, last5Avg, personalBest, roundsCount } |
| remark | string | 否 | - | 后台备注 |

---

## 2. admins（管理员账号）

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| username | string | 是 | - | 登录用户名 |
| passwordHash | string | 是 | - | bcrypt 加盐哈希 |
| name | string | 否 | - | 姓名 |
| role | string | 是 | 'admin' | admin / superadmin |
| status | string | 是 | 'active' | active / inactive |
| lastLoginAt | Date | 否 | - | 最后登录时间 |

---

## 3. coach_accounts（教练登录账号）

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| username | string | 是 | - | 登录用户名 |
| passwordHash | string | 是 | - | bcrypt 加盐哈希 |
| coachId | string | 是 | - | 关联 coaches._id |
| status | string | 是 | 'active' | active / inactive |
| lastLoginAt | Date | 否 | - | 最后登录时间 |

---

## 4. coaches（教练信息）

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| name | string | 是 | - | 教练姓名 |
| photoUrl | string | 否 | - | 照片 URL |
| intro | string | 否 | - | 简介 |
| tags | string[] | 否 | [] | 专长标签，如 ["短杆", "推杆", "青少年"] |
| hourlyRate | number | 否 | 0 | 课时单价（元/小时），0 表示统一价 |
| useGlobalRate | boolean | 是 | true | 是否使用全局教练单价 |
| displayOrder | number | 是 | 0 | 展示排序 |
| status | string | 是 | 'active' | active / inactive |

---

## 5. bays（打位）

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| code | string | 是 | - | 打位编号，如 A1、A2 |
| name | string | 是 | - | 打位名称 |
| description | string | 否 | - | 描述 |
| status | string | 是 | 'active' | active / maintenance / inactive |
| displayOrder | number | 是 | 0 | 排序 |

---

## 6. bay_time_slots（打位时段配置）

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| bayId | string | 是 | - | 关联 bays._id |
| date | string | 是 | - | 日期，YYYY-MM-DD |
| startTime | string | 是 | - | 开始时间，HH:MM |
| endTime | string | 是 | - | 结束时间，HH:MM |
| type | string | 是 | 'self' | self（自助）/ teaching（教学） |
| basePrice | number | 是 | 0 | 基础价格（元） |
| discount | number | 是 | 1 | 折扣，如 0.8 表示 8 折 |
| finalPrice | number | 是 | 0 | 折后价格（元），可自动计算 |
| slotMinutes | number | 是 | 30 | 每段时长（分钟） |
| capacity | number | 是 | 1 | 可预约人数，教学通常为 1 |
| isOpen | boolean | 是 | true | 是否开放预约 |
| accessCodeId | string | 否 | - | 关联 access_codes._id，自助时段使用 |
| coachId | string | 否 | - | 教学时段可指定教练 |

---

## 7. appointments（预约记录）

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| userId | string | 是 | - | 关联 users._id |
| bayId | string | 是 | - | 关联 bays._id |
| timeSlotId | string | 是 | - | 关联 bay_time_slots._id |
| type | string | 是 | - | self（自助）/ teaching（培训） |
| coachId | string | 否 | - | 关联 coaches._id，预约时可选教练 |
| coachHours | number | 否 | 0 | 教练上课时长（小时），用于教练对账 |
| coachRate | number | 否 | 0 | 本次教练课时单价（快照） |
| date | string | 是 | - | 预约日期 YYYY-MM-DD |
| startTime | string | 是 | - | 开始时间 HH:MM |
| endTime | string | 是 | - | 结束时间 HH:MM |
| duration | number | 是 | - | 时长（小时） |
| slots | number | 是 | - | 占用时段段数，每段 30 分钟 |
| requirements | object | 否 | {} | 需求：prepareBalls, prepareClubs, prepareWater, prepareSnacks, ashtray, visitorCount |
| basePrice | number | 是 | 0 | 预约时基础价格 |
| discount | number | 是 | 1 | 预约时折扣 |
| finalPrice | number | 是 | 0 | 预约时折后价格 |
| status | string | 是 | 'booked' | booked / checked_in / cancelled / no_show / completed |
| cancelledAt | Date | 否 | - | 取消时间 |
| isNoShow | boolean | 是 | false | 是否判定为爽约 |
| noShowPenaltyMode | string | 否 | - | 实际使用 mode：actual / ratio |
| noShowPenaltyValue | number | 否 | - | 实际使用值 |
| deductedHours | number | 是 | 0 | 实际扣除小时数 |
| accessCode | string | 否 | - | 自助预约显示的门禁密码（快照） |
| visitorCount | number | 是 | 1 | 到访人数 |
| remark | string | 否 | - | 备注 |

---

## 8. products（商品）

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| name | string | 是 | - | 商品名称 |
| categoryId | string | 是 | - | 关联 product_categories._id |
| price | number | 是 | 0 | 价格（元） |
| originalPrice | number | 否 | - | 划线原价 |
| unit | string | 否 | '件' | 单位 |
| imageUrl | string | 否 | - | 商品图片 |
| description | string | 否 | - | 描述 |
| stock | number | 是 | 0 | 库存数量，仅展示 |
| status | string | 是 | 'on_sale' | on_sale / off_sale |
| displayOrder | number | 是 | 0 | 排序 |

---

## 9. product_categories（商品分类）

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| name | string | 是 | - | 分类名称：水、点心、衣服、装备等 |
| icon | string | 否 | - | 图标 |
| displayOrder | number | 是 | 0 | 排序 |
| status | string | 是 | 'active' | active / inactive |

---

## 10. activities（下场活动 / 会员赛）

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| title | string | 是 | - | 标题 |
| type | string | 是 | - | event（下场活动）/ tournament（会员赛） |
| courseId | string | 否 | - | 关联 courses._id |
| startTime | Date | 是 | - | 开始时间 |
| endTime | Date | 否 | - | 结束时间 |
| location | string | 否 | - | 地点 |
| fee | number | 是 | 0 | 费用（元），仅展示 |
| maxParticipants | number | 否 | - | 人数上限 |
| participants | string[] | 是 | [] | 报名用户 userId 列表 |
| status | string | 是 | 'upcoming' | upcoming / ongoing / completed / cancelled |
| description | string | 否 | - | 活动说明 |
| isPointsEnabled | boolean | 是 | false | 是否计入积分排名 |
| pointsRuleId | string | 否 | - | 关联 settings.pointsRules |

---

## 11. activity_records（会员赛成绩记录）

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| activityId | string | 是 | - | 关联 activities._id |
| userId | string | 是 | - | 关联 users._id |
| scorecardId | string | 否 | - | 关联 scorecards._id |
| totalStrokes | number | 是 | 0 | 总杆数 |
| netScore | number | 否 | - | 净杆数 |
| rank | number | 否 | - | 名次 |
| points | number | 是 | 0 | 获得积分 |
| status | string | 是 | 'pending' | pending / approved / rejected |
| recordedBy | string | 否 | - | 记录人 adminId（老板后台录入） |
| recordedAt | Date | 否 | - | 录入时间 |
| remark | string | 否 | - | 备注 |

---

## 12. courses（高尔夫球场）

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| name | string | 是 | - | 场地名称 |
| province | string | 否 | - | 省份 |
| city | string | 否 | - | 城市 |
| address | string | 否 | - | 详细地址 |
| latitude | string | 否 | - | 纬度 |
| longitude | string | 否 | - | 经度 |
| holeCount | number | 是 | 18 | 洞数，默认 18 |
| pars | number[] | 是 | [] | 每洞标准杆，优先支持 18 洞 |
| totalPar | number | 是 | 72 | 标准杆总数 |
| features | string | 否 | - | 场地特点 |
| holeMaps | object[] | 否 | [] | 每洞地图/图片 URL 占位，含 holeNumber、par、mapUrl、note |
| dataSource | string | 是 | 'manual' | manual / mock_seed / osm / api_import |
| status | string | 是 | 'active' | active / inactive |

---

## 13. holes（球场洞信息）

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| courseId | string | 是 | - | 关联 courses._id |
| holeNumber | number | 是 | - | 洞号 1-18 |
| par | number | 是 | - | 标准杆 |
| distance | number | 否 | - | 距离（码） |
| handicapIndex | number | 否 | - | 难度序号 |

---

## 14. scorecards（下场记分卡）

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| userId | string | 是 | - | 关联 users._id |
| courseId | string | 是 | - | 关联 courses._id |
| activityId | string | 否 | - | 关联 activities._id（如果是比赛） |
| playDate | string | 是 | - | 打球日期 YYYY-MM-DD |
| holes | array | 是 | [] | 每洞记录 [{holeNumber, strokes, putts, penalties, fairwayHit}] |
| totalStrokes | number | 是 | 0 | 总杆数 |
| totalPutts | number | 是 | 0 | 总推杆数 |
| status | string | 是 | 'draft' | draft / submitted / approved / deleted |
| recordedType | string | 是 | 'live' | live（实时记录）/ retro（事后补填） |
| deletedAt | Date | 否 | - | 自己记录软删除时间；秋の认证记录不可由会员删除 |
| remark | string | 否 | - | 备注 |

---

## 15. coach_bills（教练账单）

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| coachId | string | 是 | - | 关联 coaches._id |
| coachAccountId | string | 是 | - | 关联 coach_accounts._id |
| periodStart | string | 是 | - | 周期开始日期 YYYY-MM-DD |
| periodEnd | string | 是 | - | 周期结束日期 YYYY-MM-DD |
| items | array | 是 | [] | 明细 [{appointmentId, date, hours, rate, amount}] |
| totalHours | number | 是 | 0 | 总课时 |
| totalAmount | number | 是 | 0 | 总金额（元） |
| status | string | 是 | 'pending' | pending（待讨薪）/ paid（已拨付） |
| paidAt | Date | 否 | - | 拨付时间 |
| paidBy | string | 否 | - | 拨付人 adminId |
| remark | string | 否 | - | 备注 |

---

## 16. points_records（积分流水）

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| userId | string | 是 | - | 关联 users._id |
| type | string | 是 | - | tournament（比赛积分）/ training（训练积分） |
| points | number | 是 | 0 | 积分值，可为负 |
| sourceId | string | 否 | - | 来源 ID，如 activityId / appointmentId |
| sourceType | string | 否 | - | 来源类型 |
| description | string | 否 | - | 说明 |

---

## 17. recharge_records（线下充值记录）

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| userId | string | 是 | - | 关联 users._id |
| tenantId | string | 是 | 'golfact_default' | 租户标识 |
| amount | number | 否 | 0 | 充值金额（元），暂不填写 |
| hours | number | 是 | 0 | 充值小时数 |
| usedHours | number | 是 | 0 | 已用小时数 |
| remainingHours | number | 是 | 0 | 剩余小时数 |
| expiryDate | string | 是 | - | 到期日 YYYY-MM-DD |
| paymentMethod | string | 否 | - | 支付方式：cash / wechat / alipay / transfer |
| receivedBy | string | 否 | - | 收款人 adminId |
| status | string | 是 | 'valid' | valid / expired / used_up |
| remark | string | 否 | - | 备注 |

---

## 18. recharge_voucher_templates（充时卡模板）

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| tenantId | string | 是 | 'golfact_default' | 租户标识 |
| name | string | 是 | - | 模板名称，如 10小时销售卡、3小时体验卡、2小时加油包 |
| type | string | 是 | 'sale' | sale / trial / benefit / custom |
| defaultHours | number | 是 | 0 | 默认充入小时数 |
| validDays | number | 否 | - | 兑换后 N 天有效；与 fixedExpiryDate 二选一 |
| fixedExpiryDate | string | 否 | - | 固定到期日 YYYY-MM-DD |
| faceValue | number | 否 | 0 | 卡面金额，仅用于展示/统计，小程序不过钱 |
| redeemLimitType | string | 是 | 'unlimited' | unlimited / once_lifetime / once_per_user / once_per_period / new_user_only |
| limitPeriodDays | number | 否 | - | once_per_period 时的周期天数 |
| memberLevelLimit | string[] | 否 | [] | 限定会员等级，空数组表示不限 |
| requiresSecretCode | boolean | 是 | false | 是否需要输入额外刮刮码；当前默认一码即兑 |
| status | string | 是 | 'active' | active / inactive |
| remark | string | 否 | - | 备注 |

---

## 19. recharge_voucher_batches（充时卡批次）

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| tenantId | string | 是 | 'golfact_default' | 租户标识 |
| batchNo | string | 是 | - | 批次号，如 202608-A |
| templateId | string | 否 | - | 默认模板，预制空卡可为空 |
| cardPrefix | string | 否 | - | 卡号前缀，如 GF202608 |
| startSeq | number | 是 | 1 | 起始序号 |
| count | number | 是 | 0 | 制卡数量 |
| status | string | 是 | 'draft' | draft / generated / partially_active / active / closed |
| generatedBy | string | 是 | - | 生成管理员 adminId |
| generatedAt | Date | 是 | - | 生成时间 |
| remark | string | 否 | - | 备注 |

---

## 20. recharge_vouchers（充时卡 / 权益码）

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| tenantId | string | 是 | 'golfact_default' | 租户标识 |
| batchId | string | 否 | - | 关联 recharge_voucher_batches._id |
| templateId | string | 否 | - | 关联 recharge_voucher_templates._id |
| cardNo | string | 是 | - | 卡号，可连号递增 |
| token | string | 是 | - | 二维码 token，长随机字符串，不可猜 |
| secretCodeHash | string | 否 | - | 额外刮刮码哈希；当前一码即兑可为空 |
| type | string | 是 | 'sale' | sale / trial / benefit / custom |
| hours | number | 是 | 0 | 兑换后充入小时数 |
| validDays | number | 否 | - | 兑换后 N 天有效 |
| cardValidUntil | string | 是 | - | 卡片本身有效期 YYYY-MM-DD；过期后不可兑换，后台可延期 |
| fixedExpiryDate | string | 否 | - | 固定到期日 YYYY-MM-DD |
| faceValue | number | 否 | 0 | 卡面金额，仅展示/统计 |
| redeemLimitType | string | 是 | 'unlimited' | unlimited / once_lifetime / once_per_user / once_per_period / new_user_only |
| limitPeriodDays | number | 否 | - | 周期限制天数 |
| memberLevelLimit | string[] | 否 | [] | 可兑换会员等级限制 |
| requiresSecretCode | boolean | 是 | false | 是否需要额外刮刮码；当前默认一码即兑 |
| status | string | 是 | 'inactive' | inactive / active / pending / used / deleted |
| activatedByAdminId | string | 否 | - | 激活管理员 |
| activatedAt | Date | 否 | - | 激活时间 |
| soldByAdminId | string | 否 | - | 销售/发放管理员 |
| usedByUserId | string | 否 | - | 兑换用户 |
| usedAt | Date | 否 | - | 兑换时间 |
| rechargeRecordId | string | 否 | - | 兑换成功后关联 recharge_records._id |
| remark | string | 否 | - | 备注 |

> 二维码内容只包含小程序路径和 token，例如 `/pages/redeem/index?token=...`。小时数、充值后有效天数、卡本身有效期、限制规则必须以后端记录为准，兑换动作通过云函数原子校验并更新，避免重复兑换。`expired` 建议作为按 `cardValidUntil` 计算出的管理视图，不直接作为主状态。

---

## 21. access_codes（门禁密码配置与历史）

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| code | string | 是 | - | 当前密码 |
| type | string | 是 | 'static' | static（固定）/ dynamic（动态，预留） |
| effectiveFrom | Date | 是 | - | 生效时间 |
| effectiveTo | Date | 否 | - | 失效时间，null 表示长期有效 |
| updatedBy | string | 是 | - | 更新人 adminId |
| deviceProvider | string | 否 | - | 门锁厂商，预留：如 'tuya', 'aqara' |
| deviceConfig | object | 否 | {} | 门锁 API 配置，预留 |
| isActive | boolean | 是 | true | 是否当前生效 |

---

## 22. settings（系统配置）

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| key | string | 是 | - | 配置项 key |
| value | any | 是 | - | 配置值 |

### 建议的 settings key

| key | value 结构 | 说明 |
|-----|-----------|------|
| site | {tenantId, name, logoUrl, signboardUrl, phone, address, notice} | 场地品牌信息，管理员后台可配置 |
| theme | {primaryColor: '#22c55e', secondaryColor: '#16a34a'} | 主题色，默认简约绿色 |
| businessHours | {open: '08:00', close: '22:00', slotMinutes: 30} | 默认营业时段、时段粒度 30 分钟 |
| bookingRules | {minSlots: 2, maxDailyHours: 4} | 每次最少 2 段（1 小时），每日最多预约小时数 |
| noShowRule | {thresholdHours: 2, maxPerPeriod: 1, periodMonths: 1, defaultMode: 'ratio', defaultValue: 50} | 爽约规则 |
| memberLevels | [{level, name, minRecharge, minHours, minBookings, discount}] | 会员等级规则 |
| pointsRules | {tournament: {...}, training: {...}} | 积分规则 |
| coachGlobalRate | number | 全局教练课时单价 |
| accessCode | {type: 'static', currentCodeId} | 当前门禁密码配置 |
| discounts | [{name, daysOfWeek, startTime, endTime, discount}] | 时段折扣规则 |

---

## 索引建议

云数据库支持单字段索引，建议为以下字段建立索引：

- `users.openid`（唯一）
- `users.phone`
- `appointments.userId`
- `appointments.bayId`
- `appointments.timeSlotId`
- `appointments.date`
- `appointments.status`
- `bay_time_slots.bayId`
- `bay_time_slots.date`
- `bay_time_slots.type`
- `activities.type`
- `activities.status`
- `scorecards.userId`
- `scorecards.activityId`
- `coach_bills.coachId`
- `coach_bills.status`
- `points_records.userId`
- `points_records.type`
- `recharge_vouchers.token`（唯一）
- `recharge_vouchers.cardNo`（唯一）
- `recharge_vouchers.batchId`
- `recharge_vouchers.status`
- `recharge_vouchers.usedByUserId`
