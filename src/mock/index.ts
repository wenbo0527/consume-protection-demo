// Mock 数据统一入口(架构改进)
// 全部内容从 data.ts 转发,后续将逐步拆分为多个领域文件(customers.ts / tickets.ts / alerts.ts / knowledge.ts / reviews.ts)
// 当前所有用 `from '@/mock/data'` 的代码,可以平滑切换到 `from '@/mock'`

// 类型
export type { Customer, Ticket, ReviewProject, AlertItem, BlackListItem, KnowledgeItem, Complaint } from './data'

// 数据(运行时实际数据来自 data.ts)
export {
  customers,
  tickets,
  reviewProjects,
  alerts,
  blackList,
  knowledge,
  reviewStandards,
  batchJobs,
  tagSystem,
  myComplaints
} from './data'

// data_ext(规则 / 名单)
export { dispatchRules, alertRules, listRules } from './data_ext'
