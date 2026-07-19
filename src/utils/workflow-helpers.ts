// 工作流实例 → 表格行 映射工具
// 减少业务页面 copy-paste 的 statusMap / statusLabel

import { WorkflowInstance } from '@/stores/workflow'

export type InstanceRow = {
  id: string
  customerName: string
  customerId: string
  ticketId?: string
  status: string
  statusColor: string
  statusRaw: string
  createdAt: string
  expireAt: string
  currentNodeName: string
  relatedTicketStatus?: string
  /** 业务页面专有字段:停催类型 / 协商方案 / 转诉平台 / 异议类型等 */
  [k: string]: any
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  running: { label: '审批中', color: 'blue' },
  approved: { label: '已审批', color: 'green' },
  finished: { label: '已完成', color: 'gray' },
  rejected: { label: '已驳回', color: 'red' },
  expired: { label: '已超时', color: 'orange' }
}

const NODE_NAME_MAP: Record<string, string> = {
  apply: '申请',
  approve: '审批',
  execute: '执行',
  notify: '通知',
  auto: '自动',
  archive: '归档',
  sync: '同步',
  effective: '生效',
  submit: '受理'
}

/** 通用:状态 → 标签 + 颜色 */
export function mapInstanceStatus(s: string): { label: string; color: string } {
  return STATUS_MAP[s] || { label: s, color: 'gray' }
}

/** 通用:节点 code → 中文名 */
export function mapNodeName(code: string): string {
  return NODE_NAME_MAP[code] || code
}

/** 把工作流实例映射为表格 row(基础字段) */
export function mapInstanceToRow(inst: WorkflowInstance): InstanceRow {
  const status = mapInstanceStatus(inst.status)
  return {
    id: inst.id,
    customerName: inst.customerName || '-',
    customerId: inst.customerId || '',
    ticketId: inst.ticketId,
    status: status.label,
    statusColor: status.color,
    statusRaw: inst.status,
    createdAt: inst.createdAt,
    expireAt: inst.expireAt || '-',
    currentNodeName: mapNodeName(inst.currentNode),
    relatedTicketStatus: inst.relatedTicketStatus
  }
}

/** 取首个 execution 的 payload */
export function getPayload(inst: WorkflowInstance, code: string = 'apply') {
  return inst.executions.find(e => e.nodeCode === code)?.payload
}

/** 取首个审批节点 execution */
export function getApproveExecution(inst: WorkflowInstance) {
  return inst.executions.find(e => e.nodeCode === 'approve')
}

/** 通用 stop_collection 业务字段 */
export function enrichStopCollectionRow(inst: WorkflowInstance): InstanceRow {
  const row = mapInstanceToRow(inst)
  const payload = getPayload(inst)
  row.type = payload?.syncStopDeduct === '是' ? '停催+停扣' : '停催'
  row.period = payload?.period || '-'
  row.approval = getApproveExecution(inst)?.operator || '-'
  return row
}

/** 通用 negotiate 业务字段 */
export function enrichNegotiateRow(inst: WorkflowInstance): InstanceRow {
  const row = mapInstanceToRow(inst)
  const payload = getPayload(inst)
  row.period = payload?.plan || '-'
  return row
}

/** 通用 transfer_mediate 业务字段 */
export function enrichTransferMediateRow(inst: WorkflowInstance): InstanceRow {
  const row = mapInstanceToRow(inst)
  const payload = getPayload(inst)
  row.platform = payload?.platform || '金融调解委员会'
  row.intent = '有意'
  return row
}

/** 通用 credit_objection 业务字段 */
export function enrichCreditObjectionRow(inst: WorkflowInstance): InstanceRow {
  const row = mapInstanceToRow(inst)
  const payload = getPayload(inst)
  row.dispute = payload?.dispute || '征信异议'
  return row
}