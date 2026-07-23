// 满意度评价 mock(管理层视角)
// 1. 评分 1-5
// 2. 工单关联
// 3. 处理人/处理时长/不满意原因/客户留言

export interface FeedbackItem {
  id: string
  ticketId: string
  customer: string
  customerPhone: string
  handler: string
  handlerRole: 'agent' | 'business' | 'review'
  rating: number
  reason: string
  comment: string
  submittedAt: string
  /** 是否已追访 */
  followedUp: boolean
  /** 是否构成回退工单(评分 ≤ 2) */
  reverted: boolean
}

export const mockFeedbacks: FeedbackItem[] = [
  {
    id: 'FB-20260714-0001',
    ticketId: 'GD-20260714-0008',
    customer: '赵志强',
    customerPhone: '188****8821',
    handler: '李伟',
    handlerRole: 'business',
    rating: 1,
    reason: '处理结果不接受',
    comment: '我已经解释了三天,客服一直在敷衍,没人真正解决我的退费诉求。',
    submittedAt: '2026-07-14 14:30',
    followedUp: false,
    reverted: true
  },
  {
    id: 'FB-20260713-0001',
    ticketId: 'GD-20260713-0021',
    customer: '吴美琴',
    customerPhone: '139****5562',
    handler: '李伟',
    handlerRole: 'business',
    rating: 2,
    reason: '处理速度慢',
    comment: '提交投诉后等了 5 天才有人联系我,而且回复非常模板化。',
    submittedAt: '2026-07-13 17:15',
    followedUp: false,
    reverted: true
  },
  {
    id: 'FB-20260712-0001',
    ticketId: 'GD-20260712-0001',
    customer: '陈福来',
    customerPhone: '136****2233',
    handler: '张敏',
    handlerRole: 'agent',
    rating: 2,
    reason: '未解决核心问题',
    comment: '客服只是告诉我"会跟进",但直到评分时也没人联系我。',
    submittedAt: '2026-07-12 09:45',
    followedUp: false,
    reverted: true
  },
  {
    id: 'FB-20260711-0001',
    ticketId: 'GD-20260711-0015',
    customer: '孙亚琴',
    customerPhone: '138****7711',
    handler: '王芳',
    handlerRole: 'review',
    rating: 4,
    reason: '处理尚可,有改进空间',
    comment: '处理速度还行,但回复话术有点生硬。',
    submittedAt: '2026-07-11 16:20',
    followedUp: true,
    reverted: false
  },
  {
    id: 'FB-20260710-0001',
    ticketId: 'GD-20260710-0078',
    customer: '胡海涛',
    customerPhone: '135****4422',
    handler: '张敏',
    handlerRole: 'agent',
    rating: 5,
    reason: '非常满意',
    comment: '客服小张非常专业,主动帮我处理了征信异议,非常感谢!',
    submittedAt: '2026-07-10 11:30',
    followedUp: true,
    reverted: false
  },
  {
    id: 'FB-20260709-0001',
    ticketId: 'GD-20260709-0032',
    customer: '李秀英',
    customerPhone: '139****0011',
    handler: '李伟',
    handlerRole: 'business',
    rating: 3,
    reason: '一般',
    comment: '问题解决了,但花了好几通电话。',
    submittedAt: '2026-07-09 15:00',
    followedUp: true,
    reverted: false
  }
]
