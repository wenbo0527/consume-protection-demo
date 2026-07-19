// 全部 Mock 数据集中管理,便于维护

export interface Customer {
  id: string
  name: string
  idCardMask: string
  phone: string
  creditStatus: 'normal' | 'overdue' | 'frozen'
  loanBalance: number
  loanCount: number
  overdueCount: number
  maxOverdueDays: number
  riskTags: ('blacklist' | 'complaint' | 'agent' | 'threat' | 'normal')[]
  tagSources: string[]
  complaintCount6m: number
  lastComplaintTime?: string
  lastComplaintType?: string
  ongoingTickets: { id: string; type: string; node: string; handler: string }[]
  complaintHistory: { id: string; date: string; type: string; status: string }[]
}

export interface Ticket {
  id: string
  type: 'consult' | 'complaint' | 'external' | 'mediate' | 'issue' | 'suggest' | 'praise'
  typeLabel: string
  category: string
  reason: string
  urgency: 'special' | 'urgent' | 'normal'
  status: 'pending' | 'todo' | 'processing' | 'transfer' | 'closing' | 'closed'
  statusLabel: string
  channel: string
  customerId: string
  customerName: string
  description: string
  isRegulator: boolean
  createdAt: string
  handler: string
  timeline: { time: string; action: string; operator: string }[]
}

export interface ReviewProject {
  id: string
  type: 'newProduct' | 'marketing' | 'change'
  typeLabel: string
  title?: string                 // (审计追溯用)
  productName: string
  applicant: string
  dept: string
  applyTime: string
  status: 'draft' | 'fill' | 'inReview' | 'revise' | 'archive'
  statusLabel: string
  reviewer?: string
  conclusion?: string
  ticketId?: string              // 关联工单(审计追溯用)
  reviewStage?: string           // 当前审查阶段
}

export interface AlertItem {
  id: string
  type: 'volume' | 'regulator' | 'collection'
  typeLabel: string
  level: 'urgent' | 'warning' | 'info'
  title: string
  desc: string
  triggerTime: string
  status: 'alert_open' | 'alert_handle' | 'alert_done' | 'alert_ignore' | 'alert_upgrade' | 'alert_verified'
  relatedTicket?: string
  /** 工作流验证通过后填充(P1-2 之后) */
  verifiedAt?: string
  verifiedByInstance?: string
}

export interface BlackListItem {
  id: string
  name: string
  idCardMask: string
  phone: string
  type: 'blacklist' | 'complaintDB' | 'abnormalAgent'
  typeLabel: string
  reason: string
  source: string
  effectiveAt: string
  expireAt: string
  isPermanent: boolean
  status: 'active' | 'expiring' | 'expired'
}

export interface KnowledgeItem {
  id: string
  title: string
  category: 'rule' | 'script' | 'product' | 'review'
  categoryLabel: string
  content: string
  source: string
  updatedAt: string
  status: 'active' | 'pending' | 'offline'
  views: number
  /** 来源 scene:rule/script/product/review 来自原始 mock,后续可用 */
  scene?: string
  relatedCategories?: string[]
  relatedReasons?: string[]
  summary?: string
  tags?: string[]
  author?: string
}

export interface Complaint {
  id: string
  title: string
  status: 'received' | 'investigating' | 'mediating' | 'closed'
  statusLabel: string
  progress: number
  submitTime: string
  expectedTime: string
  type: string
}

// ============ 客户数据 ============
export const customers: Customer[] = [
  {
    id: 'C001', name: '刘建国', idCardMask: '110101********6234', phone: '138****5621',
    creditStatus: 'overdue', loanBalance: 86420.50, loanCount: 2, overdueCount: 1, maxOverdueDays: 45,
    riskTags: ['blacklist', 'complaint'], tagSources: ['投诉信息库', '征信系统'],
    complaintCount6m: 4, lastComplaintTime: '2026-07-10 14:32', lastComplaintType: '催收频次',
    ongoingTickets: [
      { id: 'GD-20260715-0007', type: '监管转办', node: '待接收', handler: '张敏' },
      { id: 'GD-20260712-0001', type: '投诉', node: '待关单', handler: '张敏' }
    ],
    complaintHistory: [
      { id: 'GD-20260102-0023', date: '2026-06-12', type: '催收频次', status: '已关单' },
      { id: 'GD-20260402-0011', date: '2026-05-08', type: '息费争议', status: '已关单' },
      { id: 'GD-20260601-0034', date: '2026-04-22', type: '协商还款', status: '已关单' }
    ]
  },
  {
    id: 'C002', name: '孙丽华', idCardMask: '320106********4521', phone: '139****8810',
    creditStatus: 'normal', loanBalance: 35200.00, loanCount: 1, overdueCount: 0, maxOverdueDays: 0,
    riskTags: ['agent'], tagSources: ['声纹识别'],
    complaintCount6m: 2, lastComplaintTime: '2026-06-28 10:15', lastComplaintType: '身份核验',
    ongoingTickets: [
      { id: 'GD-20260714-0003', type: '咨询', node: '处理中', handler: '张敏' },
      { id: 'GD-20260710-0019', type: '外部转办', node: '处理中', handler: '李伟' }
    ],
    complaintHistory: [{ id: 'GD-20260210-0009', date: '2026-06-28', type: '身份核验', status: '已关单' }]
  },
  {
    id: 'C003', name: '周志远', idCardMask: '440305********7711', phone: '136****2233',
    creditStatus: 'overdue', loanBalance: 156800.00, loanCount: 3, overdueCount: 2, maxOverdueDays: 92,
    riskTags: ['threat', 'complaint'], tagSources: ['呼叫中心备注', '投诉信息库'],
    complaintCount6m: 6, lastComplaintTime: '2026-07-14 16:48', lastComplaintType: '扬言投诉',
    ongoingTickets: [
      { id: 'GD-20260714-0008', type: '投诉', node: '处理中', handler: '张敏' },
      { id: 'GD-20260713-0021', type: '投诉', node: '处理中', handler: '张敏' },
      { id: 'GD-20260709-0015', type: '投诉', node: '处理中', handler: '张敏' }
    ],
    complaintHistory: [
      { id: 'GD-20260315-0012', date: '2026-07-01', type: '催收频次', status: '处理中' },
      { id: 'GD-20260501-0067', date: '2026-06-15', type: '息费争议', status: '已关单' }
    ]
  },
  {
    id: 'C004', name: '吴敏', idCardMask: '510104********8801', phone: '188****9090',
    creditStatus: 'frozen', loanBalance: 0, loanCount: 1, overdueCount: 1, maxOverdueDays: 180,
    riskTags: ['blacklist'], tagSources: ['法院失信'],
    complaintCount6m: 0,
    ongoingTickets: [],
    complaintHistory: []
  },
  {
    id: 'C005', name: '陈冬梅', idCardMask: '370102********3356', phone: '137****4422',
    creditStatus: 'normal', loanBalance: 12800.00, loanCount: 1, overdueCount: 0, maxOverdueDays: 0,
    riskTags: ['normal'], tagSources: [],
    complaintCount6m: 0,
    ongoingTickets: [],
    complaintHistory: []
  }
]

// ============ 工单数据 ============
export const tickets: Ticket[] = [
  {
    id: 'GD-20260715-0007', type: 'external', typeLabel: '监管转办', category: '债务催收', reason: '催收频次',
    urgency: 'special', status: 'todo', statusLabel: '待接收', channel: '12378',
    customerId: 'C001', customerName: '刘建国',
    description: '客户投诉每日电话催收超5次，要求停止催收',
    isRegulator: true, createdAt: '2026-07-15 09:21', handler: '待分派',
    timeline: [
      { time: '2026-07-15 09:21', action: '监管系统转办,自动建单', operator: '系统' },
      { time: '2026-07-15 09:22', action: '三维标签自动打标完成', operator: '规则引擎' }
    ]
  },
  {
    id: 'GD-20260714-0008', type: 'complaint', typeLabel: '投诉', category: '债务催收', reason: '扬言投诉',
    urgency: 'urgent', status: 'processing', statusLabel: '处理中', channel: '电话',
    customerId: 'C003', customerName: '周志远',
    description: '客户对催收话术不满,扬言向媒体曝光',
    isRegulator: false, createdAt: '2026-07-14 16:48', handler: '李伟',
    timeline: [
      { time: '2026-07-14 16:48', action: '坐席接听建单', operator: '张敏' },
      { time: '2026-07-14 17:02', action: '分流至业务执行台', operator: '规则引擎' },
      { time: '2026-07-14 17:30', action: '李伟接收并开始处理', operator: '李伟' }
    ]
  },
  {
    id: 'GD-20260714-0003', type: 'consult', typeLabel: '咨询', category: '贷款', reason: '额度查询',
    urgency: 'normal', status: 'processing', statusLabel: '处理中', channel: '在线客服',
    customerId: 'C002', customerName: '孙丽华',
    description: '咨询当前可用额度及还款方式',
    isRegulator: false, createdAt: '2026-07-14 11:05', handler: '张敏',
    timeline: [{ time: '2026-07-14 11:05', action: '在线会话建单', operator: '张敏' }]
  },
  {
    id: 'GD-20260713-0021', type: 'complaint', typeLabel: '投诉', category: '定价收费', reason: '息费争议',
    urgency: 'urgent', status: 'processing', statusLabel: '处理中', channel: '电话',
    customerId: 'C003', customerName: '周志远',
    description: '客户对逾期罚息计算存在异议',
    isRegulator: false, createdAt: '2026-07-13 14:30', handler: '张敏',
    timeline: [{ time: '2026-07-13 14:30', action: '建单完成', operator: '张敏' }]
  },
  {
    id: 'GD-20260712-0001', type: 'complaint', typeLabel: '投诉', category: '债务催收', reason: '催收频次',
    urgency: 'urgent', status: 'closing', statusLabel: '待关单', channel: '电话',
    customerId: 'C001', customerName: '刘建国',
    description: '客户投诉电话催收时间过早(早7点前)',
    isRegulator: false, createdAt: '2026-07-12 09:15', handler: '张敏',
    timeline: [
      { time: '2026-07-12 09:15', action: '建单', operator: '张敏' },
      { time: '2026-07-12 10:30', action: '停催申请已通过,催收停止', operator: '李伟' },
      { time: '2026-07-15 16:00', action: '客户确认满意,可关单', operator: '张敏' }
    ]
  },
  {
    id: 'GD-20260711-0044', type: 'issue', typeLabel: '信息开具', category: '其他', reason: '结清证明',
    urgency: 'normal', status: 'closed', statusLabel: '已关单', channel: 'APP',
    customerId: 'C005', customerName: '陈冬梅',
    description: '客户申请开具贷款结清证明',
    isRegulator: false, createdAt: '2026-07-11 13:42', handler: '张敏',
    timeline: [
      { time: '2026-07-11 13:42', action: '建单', operator: '系统' },
      { time: '2026-07-11 14:00', action: '证明开具完成,关单', operator: '张敏' }
    ]
  },
  {
    id: 'GD-20260710-0019', type: 'external', typeLabel: '外部转办', category: '债务催收', reason: '12345转办',
    urgency: 'urgent', status: 'processing', statusLabel: '处理中', channel: '12345',
    customerId: 'C002', customerName: '孙丽华',
    description: '12345热线转办:客户对协商方案不满意',
    isRegulator: true, createdAt: '2026-07-10 10:00', handler: '李伟',
    timeline: [{ time: '2026-07-10 10:00', action: '监管台账Excel上传,自动建单', operator: '张敏' }]
  },
  {
    id: 'GD-20260709-0015', type: 'complaint', typeLabel: '投诉', category: '个人金融信息', reason: '信息泄露',
    urgency: 'special', status: 'processing', statusLabel: '处理中', channel: '电话',
    customerId: 'C003', customerName: '周志远',
    description: '客户怀疑个人信息被第三方获取',
    isRegulator: false, createdAt: '2026-07-09 15:22', handler: '张敏',
    timeline: [{ time: '2026-07-09 15:22', action: '建单,升级至审查人员', operator: '系统' }]
  },
  {
    id: 'GD-20260708-0008', type: 'mediate', typeLabel: '调解', category: '债务催收', reason: '调解申请',
    urgency: 'normal', status: 'closed', statusLabel: '已关单', channel: '线下',
    customerId: 'C001', customerName: '刘建国',
    description: '客户申请人民调解委员会介入',
    isRegulator: false, createdAt: '2026-07-08 09:30', handler: '李伟',
    timeline: [
      { time: '2026-07-08 09:30', action: '建单', operator: '张敏' },
      { time: '2026-07-08 14:00', action: '调解协议签署', operator: '李伟' },
      { time: '2026-07-08 17:00', action: '关单', operator: '李伟' }
    ]
  }
]

// ============ 审查立项 ============
export const reviewProjects: ReviewProject[] = [
  {
    id: 'SC-2026-0078', type: 'newProduct', typeLabel: '新产品立项',
    productName: '速贷宝 Pro (年化利率 18%)',
    applicant: '零售金融部·李晓', dept: '零售金融部',
    applyTime: '2026-07-14 11:20', status: 'inReview', statusLabel: '审查中',
    reviewer: '王芳'
  },
  {
    id: 'SC-2026-0077', type: 'marketing', typeLabel: '营销活动立项',
    productName: '7月免息分期活动',
    applicant: '市场部·张磊', dept: '市场部',
    applyTime: '2026-07-13 16:00', status: 'inReview', statusLabel: '待审查'
  },
  {
    id: 'SC-2026-0076', type: 'change', typeLabel: '产品变更立项',
    productName: '信用贷额度调整规则',
    applicant: '风控部·陈静', dept: '风控部',
    applyTime: '2026-07-12 10:30', status: 'revise', statusLabel: '待修改',
    reviewer: '王芳'
  },
  {
    id: 'SC-2026-0075', type: 'newProduct', typeLabel: '新产品立项',
    productName: '房抵贷 (经营贷)',
    applicant: '零售金融部·李晓', dept: '零售金融部',
    applyTime: '2026-07-10 14:00', status: 'archive', statusLabel: '已归档',
    reviewer: '王芳', conclusion: '审查通过,同意上线'
  },
  {
    id: 'SC-2026-0074', type: 'marketing', typeLabel: '营销活动立项',
    productName: '新户首单立减活动',
    applicant: '市场部·张磊', dept: '市场部',
    applyTime: '2026-07-08 09:15', status: 'fill', statusLabel: '任务填写'
  }
]

// ============ 预警 ============
export const alerts: AlertItem[] = [
  {
    id: 'AL-2026-0512', type: 'volume', typeLabel: '投诉量异常',
    level: 'urgent', title: '今日投诉量超阈值 35%',
    desc: '当日投诉量 162 件,阈值 120 件,主要集中在"催收频次"类',
    triggerTime: '2026-07-15 14:00', status: 'alert_open', relatedTicket: ''
  },
  {
    id: 'AL-2026-0511', type: 'regulator', typeLabel: '监管件超时',
    level: 'urgent', title: '监管件 GD-20260709-0015 临近超时',
    desc: '工单已处理 5 天,剩余 2 天即将超时(监管件处理时限7天)',
    triggerTime: '2026-07-15 09:00', status: 'alert_open', relatedTicket: 'GD-20260709-0015'
  },
  {
    id: 'AL-2026-0510', type: 'collection', typeLabel: '催收频次超限',
    level: 'warning', title: '客户 C003 周志远 月度催收触达 28 次',
    desc: '超过监管上限 20 次/月,建议立即停催',
    triggerTime: '2026-07-14 18:30', status: 'alert_handle', relatedTicket: 'GD-20260714-0008'
  },
  {
    id: 'AL-2026-0509', type: 'regulator', typeLabel: '监管件超时',
    level: 'warning', title: '12345转办件超时预警',
    desc: '工单 GD-20260708-0099 处理时长已达 6 天',
    triggerTime: '2026-07-14 10:00', status: 'alert_done', relatedTicket: 'GD-20260708-0099'
  },
  {
    id: 'AL-2026-0508', type: 'volume', typeLabel: '投诉量异常',
    level: 'warning', title: '客服组 3 班次投诉量偏高',
    desc: '较日均高 42%,需关注服务质量',
    triggerTime: '2026-07-13 16:30', status: 'alert_upgrade'
  },
  {
    id: 'AL-2026-0507', type: 'collection', typeLabel: '催收频次超限',
    level: 'info', title: '客户 C001 刘建国 接近频次上限',
    desc: '月度催收触达 18 次,上限 20 次',
    triggerTime: '2026-07-12 11:00', status: 'alert_verified', relatedTicket: 'GD-20260712-0001'
  }
]

// ============ 名单 ============
export const blackList: BlackListItem[] = [
  { id: 'BL-0001', name: '吴敏', idCardMask: '510104********8801', phone: '188****9090', type: 'blacklist', typeLabel: '黑名单', reason: '法院失信被执行人', source: '法院对接', effectiveAt: '2026-05-20', expireAt: '永久', isPermanent: true, status: 'active' },
  { id: 'BL-0002', name: '刘建国', idCardMask: '110101********6234', phone: '138****5621', type: 'complaintDB', typeLabel: '投诉信息库', reason: '6个月内投诉4次,含扬言倾向', source: '投诉信息库', effectiveAt: '2026-07-10', expireAt: '2026-10-10', isPermanent: false, status: 'expiring' },
  { id: 'BL-0003', name: '周志远', idCardMask: '440305********7711', phone: '136****2233', type: 'complaintDB', typeLabel: '投诉信息库', reason: '扬言投诉高风险客户', source: '投诉信息库', effectiveAt: '2026-07-14', expireAt: '2026-08-14', isPermanent: false, status: 'active' },
  { id: 'BL-0004', name: '高某某', idCardMask: '320106********1102', phone: '139****0001', type: 'abnormalAgent', typeLabel: '异常代理', reason: '声纹异常,疑似他人代办', source: '声纹识别', effectiveAt: '2026-06-15', expireAt: '2026-07-15', isPermanent: false, status: 'expired' },
  { id: 'BL-0005', name: '王某某', idCardMask: '440305********2204', phone: '136****0204', type: 'abnormalAgent', typeLabel: '异常代理', reason: '通话内容异常,身份核验未通过', source: '人工标注', effectiveAt: '2026-07-01', expireAt: '2026-09-01', isPermanent: false, status: 'active' }
]

// ============ 知识库(场景化) ============
// 新增字段:relatedCategories/relatedReasons 用于工单场景匹配,scene 用于场景聚合
export const knowledge: (KnowledgeItem & { relatedCategories: string[]; relatedReasons: string[]; scene: string })[] = [
  {
    id: 'K001', title: '催收频次合规标准 (2026版)', category: 'rule', categoryLabel: '业务规则',
    content: '根据《消费金融公司催收行为指引》,个人贷款月催收频次不超过 20 次,日催收频次不超过 3 次。早 8:00 前、晚 21:00 后不得催收。',
    source: '消保审查·SC-2026-0075', updatedAt: '2026-07-10', status: 'active', views: 1248,
    relatedCategories: ['债务催收'], relatedReasons: ['催收频次'], scene: '催收频次'
  },
  {
    id: 'K002', title: '征信异议处理话术模板', category: 'script', categoryLabel: '话术模板',
    content: '尊敬的客户,您申请的征信异议已受理,我们将在 5 个工作日内完成核实并反馈。我们会调取您的征信报告进行核对,如信息有误将在 5 个工作日内向征信机构申请更正...',
    source: '消保审查·SC-2026-0072', updatedAt: '2026-07-08', status: 'active', views: 856,
    relatedCategories: ['个人金融信息'], relatedReasons: ['征信异议'], scene: '征信异议'
  },
  {
    id: 'K003', title: '速贷宝 Pro 产品介绍', category: 'product', categoryLabel: '新产品知识',
    content: '额度 1-30 万,年化利率 18%-24%,支持 3/6/12 期灵活还款。准入:22-55 周岁,征信良好。',
    source: '消保审查·SC-2026-0078', updatedAt: '2026-07-14', status: 'pending', views: 0,
    relatedCategories: ['贷款'], relatedReasons: ['额度查询', '产品咨询'], scene: '贷款产品'
  },
  {
    id: 'K004', title: '协商还款方案风险提示', category: 'rule', categoryLabel: '业务规则',
    content: '协商方案签订后客户违约需自动恢复催收,并通知原处理坐席。建议方案期限不超过 6 个月,违约后 7 天内必须跟进。',
    source: '消保审查·SC-2026-0070', updatedAt: '2026-07-05', status: 'active', views: 645,
    relatedCategories: ['债务催收'], relatedReasons: ['协商还款'], scene: '协商还款'
  },
  {
    id: 'K005', title: '扬言客户应急处理流程', category: 'script', categoryLabel: '话术模板',
    content: '听到扬言时:1)立即稳定客户情绪,避免激化;2)记录关键信息(时间、地点、媒体);3)通知组长;4)考虑转接紧急处理流程;5)24 小时内回访跟踪。',
    source: '消保审查·SC-2026-0068', updatedAt: '2026-06-28', status: 'active', views: 732,
    relatedCategories: ['债务催收'], relatedReasons: ['扬言投诉'], scene: '扬言客户'
  },
  {
    id: 'K006', title: '息费争议处理规范', category: 'rule', categoryLabel: '业务规则',
    content: '客户对息费计算有异议时,需调取借据台账、还款记录、合同条款进行核对。如计算无误,提供详细计算明细;如有错误,立即提交 OA 审批调整。',
    source: '消保审查·SC-2026-0065', updatedAt: '2026-06-25', status: 'active', views: 528,
    relatedCategories: ['定价收费'], relatedReasons: ['息费争议'], scene: '息费争议'
  },
  {
    id: 'K007', title: '结清证明开具流程', category: 'rule', categoryLabel: '业务规则',
    content: '客户已结清贷款的,可线上自助开具结清证明。需验证:①贷款状态已结清;②无未结清借据。审核通过后 1 个工作日内出具。',
    source: '消保审查·SC-2026-0060', updatedAt: '2026-06-15', status: 'active', views: 412,
    relatedCategories: ['其他'], relatedReasons: ['结清证明'], scene: '结清证明'
  },
  {
    id: 'K008', title: '代理识别核查要点', category: 'script', categoryLabel: '话术模板',
    content: '接到疑似代理代办时:1)要求客户提供本人身份证号后四位;2)询问合同信息;3)对比声纹;4)询问近期交易记录。任一项不符即转接反欺诈流程。',
    source: '消保审查·SC-2026-0058', updatedAt: '2026-06-10', status: 'active', views: 367,
    relatedCategories: ['个人金融信息'], relatedReasons: ['身份核验'], scene: '异常代理'
  }
]

// ============ 审查标准(逐项) ============
export const reviewStandards: {
  id: string; category: string; item: string; basis: string; required: boolean
}[] = [
  { id: 'S001', category: '产品审查', item: '利率合规性', basis: '《商业银行互联网贷款管理办法》第18条', required: true },
  { id: 'S002', category: '产品审查', item: '客户适当性', basis: '《金融消费者权益保护指导意见》第5条', required: true },
  { id: 'S003', category: '产品审查', item: '信息披露完整性', basis: '《商业银行理财业务监督管理办法》', required: true },
  { id: 'S004', category: '产品审查', item: '数据安全合规', basis: '《个人信息保护法》第6条', required: true },
  { id: 'S005', category: '产品审查', item: '投诉应急预案', basis: '《银行业保险业消费投诉处理管理办法》', required: true },
  { id: 'S006', category: '产品审查', item: '营销宣传合规', basis: '《广告法》第9条', required: false },
  { id: 'S007', category: '产品审查', item: '合同条款清晰', basis: '《合同法》第39条', required: false },
  { id: 'M001', category: '营销审查', item: '目标客群明确', basis: '《关于加强金融消费者权益保护》', required: true },
  { id: 'M002', category: '营销审查', item: '奖励机制透明', basis: '《反不正当竞争法》', required: true },
  { id: 'M003', category: '营销审查', item: '无虚假宣传', basis: '《广告法》第28条', required: true },
  { id: 'C001', category: '变更审查', item: '变更影响范围评估', basis: '内部变更管理制度', required: true },
  { id: 'C002', category: '变更审查', item: '存量客户通知方案', basis: '《个人信息保护法》第39条', required: true },
  { id: 'C003', category: '变更审查', item: '风险提示更新', basis: '《商业银行理财业务监督管理办法》', required: true }
]

// ============ 批量作业(重试机制) ============
export const batchJobs: {
  id: string; type: string; totalCount: number; successCount: number; failedCount: number;
  status: 'processing' | 'partial' | 'done' | 'warning'; createdAt: string; creator: string;
  failedItems?: { idx: number; reason: string; retryCount: number }[]
}[] = [
  {
    id: 'BJ-20260715-0001', type: '批量开票', totalCount: 320, successCount: 318, failedCount: 2,
    status: 'partial', createdAt: '2026-07-15 10:30', creator: '张敏',
    failedItems: [
      { idx: 87, reason: '客户税号格式错误', retryCount: 2 },
      { idx: 156, reason: '借据未结清,不可开票', retryCount: 3 }
    ]
  },
  {
    id: 'BJ-20260712-0003', type: '批量开证明', totalCount: 156, successCount: 156, failedCount: 0,
    status: 'done', createdAt: '2026-07-12 14:00', creator: '张敏'
  }
]

// ============ 标签体系 ============
export const tagSystem: {
  id: string; name: string; category: string; definition: string; triggerRule: string;
  action: string; needApproval: boolean; status: 'active' | 'pending'
}[] = [
  { id: 'T001', name: '黑名单', category: '风险标签', definition: '法院失信被执行人或重大违约客户', triggerRule: '法院数据同步命中', action: '限制呼入/呼出+醒目提示', needApproval: true, status: 'active' },
  { id: 'T002', name: '投诉倾向', category: '风险标签', definition: '近6个月投诉≥3次', triggerRule: '投诉次数统计', action: '来电黄色提示+进入投诉信息库', needApproval: false, status: 'active' },
  { id: 'T003', name: '异常代理', category: '风险标签', definition: '声纹识别异常或核身未通过', triggerRule: '声纹系统命中', action: '开启录音+关联代理历史', needApproval: false, status: 'active' },
  { id: 'T004', name: '扬言', category: '风险标签', definition: '历史工单中含扬言倾向关键词', triggerRule: 'NLP标注命中', action: '转紧急处理+通知组长', needApproval: true, status: 'active' },
  { id: 'T005', name: '催收敏感词', category: '业务标签', definition: '客户在催收触达中表达过激情绪', triggerRule: '催收外呼标注', action: '降级催收频次', needApproval: false, status: 'active' }
]

// ============ 我的投诉(客户视角) ============
export const myComplaints: Complaint[] = [
  { id: 'GD-20260712-0001', title: '电话催收时间过早', status: 'investigating', statusLabel: '处理中', progress: 70, submitTime: '2026-07-12 09:15', expectedTime: '2026-07-19', type: '催收频次' },
  { id: 'GD-20260515-0078', title: '息费计算有误', status: 'mediating', statusLabel: '调解中', progress: 50, submitTime: '2026-05-15 14:22', expectedTime: '2026-05-30', type: '息费争议' },
  { id: 'GD-20260402-0033', title: '个人信息核对', status: 'closed', statusLabel: '已结案', progress: 100, submitTime: '2026-04-02 10:30', expectedTime: '2026-04-15', type: '信息查询' }
]