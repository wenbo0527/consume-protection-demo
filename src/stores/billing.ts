// 票据合同开具 store(P2-7)
// 合同模板 / 合同生成 / 票据(收据/发票) / 贷后发送 / 归档

import { defineStore } from 'pinia'

// ============ 类型 ============

export type DocType = 'contract' | 'receipt' | 'invoice' | 'settlement' | 'notice'
export type DocStatus = 'drafting' | 'issued' | 'signed' | 'sent' | 'archived'
export type DeliveryChannel = 'email' | 'wechat' | 'hand' | 'registered_mail'

export interface ContractTemplate {
  id: string
  name: string                          // '借款合同 v3.2'
  type: DocType
  /** 占位符定义 */
  fields: { key: string; label: string; example: string }[]
  /** 模板内容(用 {{key}} 占位) */
  body: string
  /** 创建时间 */
  createdAt: string
}

export interface BillingDoc {
  id: string                           // BD-20260715-0001
  type: DocType
  templateId: string
  customerId: string
  customerName: string
  /** 对应借据/工单/清退单的 ID */
  refType: 'loan' | 'ticket' | 'exit_case' | 'review'
  refId: string
  /** 实际填充的字段值 */
  fields: Record<string, string>
  /** 生成的最终文本 */
  renderedBody: string
  status: DocStatus
  /** 发送渠道 + 收件信息 */
  delivery?: { channel: DeliveryChannel; target: string; at: string }
  signerAt?: string                       // 客户签字时间
  archivedAt?: string
  createdAt: string
  updatedAt: string
}

// ============ utils ============

function nowStr() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const STORAGE_KEY = 'cp_billing_data'

function loadPersisted(): { templates: ContractTemplate[]; docs: BillingDoc[] } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const arr = JSON.parse(raw)
      if (arr && Array.isArray(arr.templates)) return arr
    }
  } catch { /* 静默 */ }
  return buildSeed()
}

function savePersisted(state: { templates: ContractTemplate[]; docs: BillingDoc[] }) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch { /* 静默 */ }
}

function buildSeed() {
  const templates: ContractTemplate[] = [
    {
      id: 'TPL-CONTRACT-001',
      name: '个人借款合同 v3.2',
      type: 'contract',
      fields: [
        { key: 'contractNo', label: '合同编号', example: 'C-2026-xxxxxxx' },
        { key: 'customerName', label: '借款人', example: '张三' },
        { key: 'idCardMask', label: '身份证', example: '110101********1234' },
        { key: 'loanAmount', label: '借款金额', example: '¥100,000' },
        { key: 'rate', label: '年利率', example: '12.6%' },
        { key: 'term', label: '借款期限', example: '12 个月' },
        { key: 'signDate', label: '签约日期', example: '2026-07-15' }
      ],
      body: `# 个人借款合同

合同编号:{{contractNo}}
借款人(甲方):{{customerName}}
身份证号:{{idCardMask}}
出借人(乙方):xxx 消费金融有限公司

一、借款金额
  甲方向乙方借款人民币 {{loanAmount}} 元(大写:壹拾万元整)。

二、利率与期限
  借款年利率:{{rate}};借款期限:{{term}};自 {{signDate}} 起算。

三、还款方式
  等额本息,每月 20 日还款。

四、违约责任
  借款人未按约定还款的,出借人有权按照合同约定收取违约金并主张律师费、诉讼费。

五、其他
  本合同自双方签字之日起生效。

甲方:{{customerName}}                          乙方:xxx 消费金融
日期:{{signDate}}
`,
      createdAt: '2026-01-15'
    },
    {
      id: 'TPL-NOTICE-001',
      name: '清退通知书 v1.0',
      type: 'notice',
      fields: [
        { key: 'customerName', label: '客户姓名', example: '赵建国' },
        { key: 'loanBalance', label: '待结清金额', example: '¥268,900' },
        { key: 'deadline', label: '宽限期', example: '2026-08-01' },
        { key: 'action', label: '处置方案', example: '要求结清全部' }
      ],
      body: `尊敬的 {{customerName}} 先生/女士:

根据您与本公司签订的借款合同,因触发清退条件,本公司决定对您的贷款进行清退处置。

待结清金额:{{loanBalance}}
处置方案:{{action}}
宽限期至:{{deadline}}

请您在宽限期内完成结清,逾期本公司将依法处置抵押物/提起诉讼。

xxx 消费金融有限公司
2026-07-15
`,
      createdAt: '2026-02-01'
    },
    {
      id: 'TPL-INVOICE-001',
      name: '结清证明 v1.0',
      type: 'invoice',
      fields: [
        { key: 'customerName', label: '客户姓名', example: '刘建国' },
        { key: 'loanId', label: '借据号', example: 'L-2024-0035' },
        { key: 'settledAmount', label: '结清金额', example: '¥128,400' },
        { key: 'settleDate', label: '结清日期', example: '2026-07-12' }
      ],
      body: `# 结清证明

兹证明 {{customerName}} 先生/女士(身份证号留存于借款档案),借款合同 {{loanId}},已于 {{settleDate}} 全部结清,结清金额 {{settledAmount}}(大写:壹拾贰万捌仟肆佰元整)。

自结清之日起,本笔借款所产生的全部义务履行完毕,双方债权债务关系终止,本公司不再向您主张任何权利。

特此证明。

xxx 消费金融有限公司
{{settleDate}}
`,
      createdAt: '2026-03-01'
    }
  ]

  const docs: BillingDoc[] = [
    {
      id: 'BD-20260715-0001',
      type: 'contract',
      templateId: 'TPL-CONTRACT-001',
      customerId: 'C002',
      customerName: '孙丽华',
      refType: 'loan',
      refId: 'L-2025-0033',
      fields: {
        contractNo: 'C-2026-20260712-0099',
        customerName: '孙丽华',
        idCardMask: '320106********4521',
        loanAmount: '¥30,000',
        rate: '10.8%',
        term: '6 个月',
        signDate: '2026-07-12'
      },
      renderedBody: '(生成内容已渲染)',
      status: 'sent',
      delivery: { channel: 'email', target: 'sunlh****@mail.com', at: '2026-07-12 14:30' },
      signerAt: '2026-07-12 14:30',
      createdAt: '2026-07-12 14:00',
      updatedAt: '2026-07-12 14:30'
    },
    {
      id: 'BD-20260714-0002',
      type: 'notice',
      templateId: 'TPL-NOTICE-001',
      customerId: 'C006',
      customerName: '赵建国',
      refType: 'exit_case',
      refId: 'EC-20260715-0001',
      fields: {
        customerName: '赵建国',
        loanBalance: '¥268,900',
        deadline: '2026-08-01',
        action: '要求结清全部'
      },
      renderedBody: '(生成内容已渲染)',
      status: 'sent',
      delivery: { channel: 'registered_mail', target: '徐州市xx区xx街道', at: '2026-07-15 17:00' },
      createdAt: '2026-07-15 16:50',
      updatedAt: '2026-07-15 17:00'
    },
    {
      id: 'BD-20260712-0003',
      type: 'invoice',
      templateId: 'TPL-INVOICE-001',
      customerId: 'C001',
      customerName: '刘建国',
      refType: 'exit_case',
      refId: 'EC-20260712-0003',
      fields: {
        customerName: '刘建国',
        loanId: 'L-2024-0035',
        settledAmount: '¥128,400',
        settleDate: '2026-07-12'
      },
      renderedBody: '(生成内容已渲染)',
      status: 'issued',
      createdAt: '2026-07-12 14:30',
      updatedAt: '2026-07-12 14:30'
    }
  ]

  return { templates, docs }
}

// ============ 模板渲染 ============

function renderTemplate(body: string, fields: Record<string, string>): string {
  return body.replace(/\{\{(\w+)\}\}/g, (_, k) => fields[k] || `__未填充[${k}]__`)
}

// ============ Store ============

export const useBillingStore = defineStore('billing', {
  state: () => {
    const init = loadPersisted()
    return {
      templates: init.templates as ContractTemplate[],
      docs: init.docs as BillingDoc[]
    }
  },
  getters: {
    contractCount: (s) => s.docs.filter(d => d.type === 'contract').length,
    invoiceCount: (s) => s.docs.filter(d => d.type === 'invoice').length,
    noticeCount: (s) => s.docs.filter(d => d.type === 'notice').length,
    sentCount: (s) => s.docs.filter(d => d.status === 'sent').length,
    totalContractAmount(s): number {
      return s.docs.filter(d => d.type === 'contract').reduce((a, d) => {
        const amt = d.fields['loanAmount']
        if (!amt) return a
        const num = parseFloat(amt.replace(/[^\d.]/g, ''))
        return a + (isNaN(num) ? 0 : num)
      }, 0)
    }
  },
  actions: {
    persist() {
      savePersisted({ templates: this.templates, docs: this.docs })
    },

    /** 新增模板 */
    addTemplate(input: Omit<ContractTemplate, 'id' | 'createdAt'>): ContractTemplate {
      const id = `TPL-${input.type.toUpperCase()}-${String(Math.floor(Math.random() * 900) + 100)}`
      const t: ContractTemplate = {
        ...input,
        id,
        createdAt: nowStr()
      }
      this.templates.push(t)
      this.persist()
      return t
    },

    /** 创建票据/合同文档 */
    create(input: {
      templateId: string
      customerId: string
      customerName: string
      refType: BillingDoc['refType']
      refId: string
      fields: Record<string, string>
    }): BillingDoc | null {
      const tpl = this.templates.find(t => t.id === input.templateId)
      if (!tpl) return null
      const id = `BD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Math.floor(Math.random() * 9000) + 1000)}`
      const doc: BillingDoc = {
        id,
        type: tpl.type,
        templateId: tpl.id,
        customerId: input.customerId,
        customerName: input.customerName,
        refType: input.refType,
        refId: input.refId,
        fields: input.fields,
        renderedBody: renderTemplate(tpl.body, input.fields),
        status: 'issued',
        createdAt: nowStr(),
        updatedAt: nowStr()
      }
      this.docs.unshift(doc)
      this.persist()
      return doc
    },

    /** 发送(归档前一步) */
    send(id: string, channel: DeliveryChannel, target: string) {
      const d = this.docs.find(x => x.id === id)
      if (!d) return false
      d.delivery = { channel, target, at: nowStr() }
      d.status = 'sent'
      d.updatedAt = nowStr()
      this.persist()
      return true
    },

    /** 签字 */
    sign(id: string) {
      const d = this.docs.find(x => x.id === id)
      if (!d) return false
      d.signerAt = nowStr()
      d.status = 'signed'
      d.updatedAt = nowStr()
      this.persist()
      return true
    },

    /** 归档 */
    archive(id: string) {
      const d = this.docs.find(x => x.id === id)
      if (!d) return false
      d.archivedAt = nowStr()
      d.status = 'archived'
      d.updatedAt = nowStr()
      this.persist()
      return true
    }
  }
})