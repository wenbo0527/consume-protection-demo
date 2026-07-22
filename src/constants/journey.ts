// 消保系统 · 用户旅程说明(讲解辅助,不触发业务)
// v3 起:每个角色旅程拆成「阶段」,每阶段包含 3 块:
//   - summary: 阶段简述
//   - pains: 现状卡点(基于用户提供的痛点文档)
//   - demo: 对应演示位置(只读跳转)
//
// ⚠️ 本文件是讲解页的数据源,严禁引入 store / 副作用。
//    修改本文件不需要重启服务,讲解页是纯静态渲染。

import type { RoleKey } from '@/stores/user'

// 重新导出,让消费方可以从本文件拿到统一类型
export type { RoleKey }

export interface JourneyDemoLink {
  /** 跳转目标路由 */
  path: string
  /** 链接按钮显示文字 */
  label: string
}

export interface JourneyPhase {
  /** 阶段编号(A1/B2/C3 等) */
  code: string
  /** 阶段标题 */
  title: string
  /** 阶段简述 */
  summary: string
  /** 现状卡点(原文摘录,不做改动) */
  pains?: string[]
  /** 对应演示位置(只读跳转) */
  demos: JourneyDemoLink[]
}

export interface JourneySection {
  /** 大段代号(A/B/C) */
  code: 'A' | 'B' | 'C' | 'D'
  /** 大段标题(呼入/外呼/非通话/...) */
  title: string
  /** 大段描述 */
  desc: string
  phases: JourneyPhase[]
}

export interface JourneyRole {
  roleKey: RoleKey
  roleName: string
  username: string
  /** 章节列表 */
  sections: JourneySection[]
  /** 角色级痛点总览 */
  keyPains: { title: string; level: '🔴' | '🟡'; note?: string }[]
}

/** ============================================================
 *  角色 1:一线坐席
 *  来源: .trae/documents/一线坐席客服用户旅程图(坐席视角)v3
 *  ============================================================ */
const AGENT_JOURNEY: JourneyRole = {
  roleKey: 'agent',
  roleName: '一线坐席',
  username: '张敏',
  sections: [
    {
      code: 'A',
      title: 'A. 呼入(Inbound)',
      desc: '坐席接听来电,处理投诉、咨询、监管件。',
      phases: [
        {
          code: 'A1',
          title: '来电记录区 + 打标',
          summary:
            '坐席在主工作台顶部看到今日所有来电列表,并对未接听、拒绝、超时 5 秒三种情况打标(填原因)。',
          pains: [
            '来电记录与工单系统不互通',
            '无未接/拒绝/超时打标能力,漏接客户无回访触发',
            '未接听/拒绝打标后,需自动生成回访工单'
          ],
          demos: [
            { path: '/agent/desk', label: '坐席工作台(看今日来电区)' },
            { path: '/agent/todo', label: '我的待办(看自动生成的回访工单)' }
          ]
        },
        {
          code: 'A2',
          title: '来电弹屏',
          summary: '系统弹屏提示客户来电,弹屏含客户标签、风险、命中规则。',
          pains: ['电话工作台与工单系统割裂(原系统阶段问题)', '新前端调老后端,改需求改 3 个地方'],
          demos: [{ path: '/agent/desk', label: '坐席工作台(模拟来电)' }]
        },
        {
          code: 'A3',
          title: '接听 / 拒接',
          summary: '接通跳转客户画像;拒接时弹窗填原因并打标;5 秒内未接听自动打标。',
          pains: ['拒接需要带原因', '5 秒内未接听需要系统自动打标(接入质检统计)'],
          demos: [{ path: '/agent/desk', label: '坐席工作台(弹屏接通/拒接)' }]
        },
        {
          code: 'A4',
          title: '客户画像',
          summary: '5 个 Tab:画像(含征信)、产品、催收记录、营销记录、历史切片。',
          pains: [
            '画像仅零散标签,分散在老客服+新工单,定义不统一',
            '缺少"非预留号码信息"',
            '投诉历史:新工单有,老客服也有,不互通'
          ],
          demos: [
            { path: '/agent/customer/C003', label: '客户画像示例:周志远' },
            { path: '/agent/customer-search', label: '客户画像查询(列表)' }
          ]
        },
        {
          code: 'A5',
          title: '边通话边操作(核心作业区)',
          summary:
            '通话中 4 类操作:知识检索 / 快速建工单 / 发起业务工作流 / 通话小结。',
          pains: [
            '知识库:边听边查(通话 banner 入口)',
            '建工单:三维打标 + 重复工单检测(已有)',
            '业务工作流:停催/协商/征信/转调解/延期(已有)',
            '通话小结:录音与工单需关联'
          ],
          demos: [
            { path: '/agent/knowledge', label: '知识检索' },
            { path: '/agent/ticket-create', label: '快速建工单(三维打标)' }
          ]
        },
        {
          code: 'A6',
          title: '挂断 → 话后整理',
          summary:
            '完善工单记录 / 确认流转方向(关单/转派/协办) / 标记客户承诺 / 发送短信通知。',
          pains: ['5 分钟黄金期补全字段,目前直接跳回工作台'],
          demos: [{ path: '/agent/todo', label: '我的待办(已处理的工单)' }]
        }
      ]
    },
    {
      code: 'B',
      title: 'B. 外呼(Outbound)',
      desc: '坐席主动拨出,9 类外呼任务。',
      phases: [
        {
          code: 'B1',
          title: '进入待办列表',
          summary: '9 类外呼任务来源:投诉回访/停催到期/协商到期/承诺兑现/未接回访/拒绝回访/OA 回写/管理层指令/低分回访。',
          pains: ['分单规则残缺,仅剩 1 条规则', '呼入段打标的"未接/拒绝"自动生成回访工单,联动到此处'],
          demos: [{ path: '/agent/todo', label: '我的待办(全部外呼任务)' }]
        },
        {
          code: 'B2',
          title: '拨号',
          summary: '状态机:拨号中 / 已接通 / 未接通 / 忙音 / 拒接(呼入段同步过来的打标记录会附在该客户画像)。',
          pains: ['当前状态机只有 idle/ringing/oncall/wrapup,无 dialing/no-answer'],
          demos: [{ path: '/agent/desk', label: '坐席工作台(拨号按钮)' }]
        },
        {
          code: 'B3',
          title: '外呼接通 → 客户画像',
          summary: '标注"外呼"banner,显示上次沟通记录、工单处理进度、催收记录、承诺兑现状态。',
          pains: ['前序坐席承诺查不到,只能凭客户口述', '该客户是否有"未接/拒绝/超时"打标记录'],
          demos: [
            { path: '/agent/customer/C001', label: '客户画像示例:刘建国' },
            { path: '/agent/customer/C003', label: '客户画像示例:周志远(高风险)' }
          ]
        },
        {
          code: 'B4',
          title: '通话 → 同步操作',
          summary:
            '回访记录 / 满意度采集 / 工单更新 / 承诺标记(金额+日期) / 纾困沟通。',
          pains: ['承诺无自动到期提醒', '纾困方案线下 WPS 登记'],
          demos: [{ path: '/agent/ticket/GD-20260714-0008', label: '工单详情示例(外呼后回写)' }]
        },
        {
          code: 'B5',
          title: '通话结束 → 话后整理',
          summary:
            '更新工单状态 / 标记承诺(到期提醒) / 触发后续动作 / 发送短信 / 进入下一个待办。',
          pains: ['承诺到期提醒当前缺失'],
          demos: [{ path: '/agent/todo', label: '我的待办(下一个任务)' }]
        }
      ]
    },
    {
      code: 'C',
      title: 'C. 非通话任务',
      desc: '坐席不接电话时:工单流转 / 知识检索 / 批量作业 / 接收指令。',
      phases: [
        {
          code: 'C1',
          title: '工单流转',
          summary: '关单 / 转派 / 协办 / 升级 / 结案统计(风险点/升级投诉/有责判定)。',
          pains: ['催收转诉和客服转诉两套割裂流程'],
          demos: [{ path: '/agent/ticket/GD-20260714-0008', label: '工单详情(流转按钮)' }]
        },
        {
          code: 'C2',
          title: '知识检索',
          summary: '4 类内容:新产品知识 / 业务规则 / 话术模板 / 报送数据。',
          pains: ['知识库不自动更新(新产品上线后坐席不知道新规则)'],
          demos: [{ path: '/agent/knowledge', label: '知识检索' }]
        },
        {
          code: 'C3a',
          title: '批量作业 · 监管转诉建单',
          summary: '上传监管台账 Excel → 自动解析 → 身份匹配 → 批量建单(单次 ≤ 13000 条)。',
          pains: ['身份匹配困难(明文 ↔ 掩码)', '内外网不互通,只能手打录入'],
          demos: [{ path: '/agent/reg-import', label: '监管转诉建单' }]
        },
        {
          code: 'C3b',
          title: '批量作业 · 批量开票/开证明',
          summary: '批量开票:平台借据号 ↔ 资方借据号匹配 + 金额调整;批量开证明:单次 vs 批量对比。',
          pains: ['批量开票无系统批量上传入口', '平台借据号与资方借据号无对应关系,人工匹配'],
          demos: [{ path: '/agent/batch', label: '批量作业' }]
        },
        {
          code: 'C4',
          title: '接收管理层指令',
          summary: '顶部 InstructionCenter banner:管理层下发的临时指令 / 分单规则变更通知。',
          pains: ['当前规则砍到只剩 1 条'],
          demos: [{ path: '/agent/desk', label: '坐席工作台(顶部指令 banner)' }]
        }
      ]
    }
  ],
  keyPains: [
    { title: '无未接/拒绝/超时打标,漏接客户无回访触发(v3 新增)', level: '🔴' },
    { title: '来电记录与工单系统不互通', level: '🔴' },
    { title: '画像零散,看不到完整情况', level: '🔴' },
    { title: '知识查不到,边听边翻 Excel 找条款', level: '🔴' },
    { title: '数据不实时,T+2 无法满足协商试算', level: '🔴' },
    { title: '批量操作全手工(13000 条逐户手工)', level: '🔴' },
    { title: '录音与工单无法关联', level: '🟡' },
    { title: '纾困方案线下 WPS 登记', level: '🟡' }
  ]
}

/** ============================================================
 *  角色 2:业务支撑岗
 *  来源: .trae/documents/消保支撑岗用户旅程图(支撑岗视角)
 *  ============================================================ */
const BUSINESS_JOURNEY: JourneyRole = {
  roleKey: 'business',
  roleName: '业务支撑岗',
  username: '李伟',
  sections: [
    {
      code: 'A',
      title: 'A. 进入待办工单列表',
      desc: '支撑岗的一天:从待办工单到业务执行。',
      phases: [
        {
          code: 'A1',
          title: '工单来源',
          summary:
            '7 类工单:证明开具 / 发票开具 / 合同出具 / 纾困方案 / 息费减免审批 / 试算查询 / 平台对接。',
          pains: ['分单规则残缺,仅剩 1 条规则', '纾困方案工单当前在 WPS,不在工单系统内'],
          demos: [
            { path: '/business/desk', label: '业务执行台(主页)' },
            { path: '/business/pending', label: '待办列表' }
          ]
        },
        {
          code: 'A2',
          title: '查看工单详情 + 客户信息',
          summary: '工单内容 + 客户信息 + 坐席备注。',
          pains: [
            '前序坐席沟通记录查不到',
            'T+2 数据无法满足审批时效',
            '录音与工单不关联'
          ],
          demos: [{ path: '/business/pending', label: '待办列表(点击工单查看详情)' }]
        }
      ]
    },
    {
      code: 'B',
      title: 'B. 执行业务操作',
      desc: '支撑岗核心作业区 — 6 类业务执行。',
      phases: [
        {
          code: 'B1',
          title: '证明开具',
          summary: '选证明类型/日期 → 输入邮箱 → 核对 → 开具(自带电子签章)。',
          pains: ['仅支持单个客户操作,批量需求无法满足'],
          demos: [{ path: '/business/billing', label: '票据合同管理(证明开具)' }]
        },
        {
          code: 'B2',
          title: '发票开具',
          summary:
            '单客:输入身份证 → 选介质 → 查金额 → 提交。批量:平台借据号 ↔ 资方借据号 + 金额调整(利息/罚息/复利/违约金四字段)。',
          pains: [
            '13000 条逐户手工操作,人工匹配借据号',
            '金额拆分规则未统一,不同人拆分方式不同',
            '系统无批量上传入口',
            '批量开票计算逻辑仍未确定'
          ],
          demos: [{ path: '/business/billing', label: '票据合同管理(发票开具)' }]
        },
        {
          code: 'B3',
          title: '合同出具',
          summary: '调取借款合同影像 → 确认合同信息 → 出具给客户。',
          pains: ['调取合同没有专门的系统记录,需跟系统侧单独沟通'],
          demos: [{ path: '/business/billing', label: '票据合同管理(合同出具)' }]
        },
        {
          code: 'B4',
          title: '纾困方案处理',
          summary: '简单停催 → 客服直接操作;较长停催 → 流转指定人员;重组/分期 → 评估→OA 审批;司法调解 → 转案件管理系统。',
          pains: ['现状:线下 WPS 登记→人工评估→人工回复(不及时)', '理想:工单系统内全流程'],
          demos: [{ path: '/business/stop-coll', label: '停催停扣申请(代表简单纾困)' }]
        },
        {
          code: 'B5',
          title: '审批流转(息费减免)',
          summary:
            '息费 10 万以上 → 审批到总裁办;10 万以下 → 部门总经理;内部作业流转 → 工单系统内审批。',
          pains: [
            '现状:先在万斯表格登记 → 专人手工登录 OA 创建审批单',
            '手动粘贴介质信息,跨系统操作繁琐',
            'OA 审批完成 → 结果回写不完整'
          ],
          demos: [{ path: '/business/apply', label: '业务申请审批(代表审批流)' }]
        },
        {
          code: 'B6',
          title: '试算查询',
          summary: '调用核心系统试算接口:违约金 / 罚息 / 利息 / 提前还款 / 再分期。',
          pains: ['T+2 数据无法满足实时试算', '手工试算效率低,客户量大'],
          demos: [{ path: '/business/negotiate', label: '协商还款(试算入口)' }]
        },
        {
          code: 'B7',
          title: '平台对接(转接类工单)',
          summary: '向外转:转给京东/美团/蚂蚁(携程未上线);向内转:接收 12345 政务平台工单。',
          pains: ['12345 工单目前由同事每日人工统计', '处理结果依赖粘贴到工单'],
          demos: [{ path: '/business/transfer', label: '转诉与调解' }]
        }
      ]
    },
    {
      code: 'C',
      title: 'C. 完成操作 → 更新工单 → 通知客户',
      desc: '支撑岗工作收尾。',
      phases: [
        {
          code: 'C1',
          title: '更新工单状态 + 回写结果',
          summary: '处理完成 / 待审批 / 已结案;回写处理结果到工单。',
          demos: [{ path: '/business/pending', label: '待办列表(已处理)' }]
        },
        {
          code: 'C2',
          title: '发送短信 / 邮件通知客户',
          summary: '已迁移(系统内直接操作)。',
          demos: [{ path: '/business/desk', label: '业务执行台' }]
        }
      ]
    }
  ],
  keyPains: [
    { title: '批量开票全手工(13000 条逐户)', level: '🔴' },
    { title: '拆分规则未统一,不同人拆分方式不同', level: '🔴' },
    { title: '纾困方案线下 WPS 登记', level: '🔴' },
    { title: 'OA 审批手工(万斯表格 → 手工登录 OA)', level: '🔴' },
    { title: '数据时效不足(T+2 无法满足审批)', level: '🔴' },
    { title: '前序坐席沟通记录不可查', level: '🟡' },
    { title: '分单规则残缺(仅剩 1 条)', level: '🟡' }
  ]
}

/** ============================================================
 *  角色 3:消保审查人员(精简版,用于讲解)
 *  ============================================================ */
const REVIEW_JOURNEY: JourneyRole = {
  roleKey: 'review',
  roleName: '消保审查人员',
  username: '王芳',
  sections: [
    {
      code: 'A',
      title: 'A. 立项 / 审查',
      desc: '新产品/营销/变更上线前消保审查。',
      phases: [
        {
          code: 'A1',
          title: '待审查立项',
          summary: '审查排期 + 关联产品/营销活动/制度。',
          demos: [{ path: '/review/pending', label: '待审查立项' }]
        },
        {
          code: 'A2',
          title: '创建立项',
          summary: '填立项单 → 选审查标准 → 进入执行。',
          demos: [{ path: '/review/create', label: '创建立项' }]
        },
        {
          code: 'A3',
          title: '审查执行 + 归档',
          summary: '逐项对照标准 → 评分 → 归档(自动同步知识库 → 通知坐席)。',
          demos: [{ path: '/review/execute/R-2026-0001', label: '审查执行示例' }]
        }
      ]
    },
    {
      code: 'B',
      title: 'B. 标准维护 / 追溯 / 承诺',
      desc: '审查的标准与下游协同。',
      phases: [
        {
          code: 'B1',
          title: '审查标准维护',
          summary: '标准条目 CRUD(支持手动/整改/监管来源)。',
          demos: [{ path: '/review/standards', label: '审查标准' }]
        },
        {
          code: 'B2',
          title: '审查追溯',
          summary: '历史审查记录查询,审计链。',
          demos: [{ path: '/review/audit-trail', label: '审查追溯' }]
        },
        {
          code: 'B3',
          title: '投诉管控承诺跟踪',
          summary: '归档后同步投诉管控目标,自动生成 follow-up 工单。',
          demos: [{ path: '/review/promises', label: '投诉管控承诺跟踪' }]
        }
      ]
    }
  ],
  keyPains: [
    { title: '审查归档 → 知识库同步链路需稳定', level: '🔴' },
    { title: '审查追溯独立页需完善', level: '🟡' }
  ]
}

/** ============================================================
 *  角色 4:消保管理层(精简版,用于讲解)
 *  ============================================================ */
const MANAGE_JOURNEY: JourneyRole = {
  roleKey: 'manage',
  roleName: '消保管理层',
  username: '陈强',
  sections: [
    {
      code: 'A',
      title: 'A. 事前防线 — 防住投诉 + 搭好舞台',
      desc:
        '管理者唯一横跨三阶段的角色,事前要"防住投诉"(预警、识别、知识库) + "搭好舞台"(规则、权限)。',
      phases: [
        {
          code: 'A0',
          title: '驾驶舱(全局入口)',
          summary: 'KPI / 趋势 / 工单分布 / 监管件超时看板 — 管理者第一眼要看的位置。',
          demos: [{ path: '/manage/dashboard', label: '驾驶舱' }]
        },
        {
          code: 'A1',
          title: '预警监控',
          summary:
            '投诉量异常监测 / 监管件升级预警 / 催收频次超限预警 / 重复投诉预警 — 规则引擎打底(Phase 2)→ AI 辅助增强(Phase 3)。',
          pains: [
            '无预警能力,投诉量异常靠人工发现',
            '监管件超时靠人工盯,盯漏导致升级',
            '同业:招联"天罡客户洞察系统"60+ 业务场景实时洞察'
          ],
          demos: [{ path: '/manage/alert', label: '预警处置' }]
        },
        {
          code: 'A2',
          title: '黑名单管理',
          summary:
            '投诉特例名单 / 营销黑名单 / 异常代理库 / 敏感词库 — 整合后推送客户中心。',
          pains: [
            '名单分散在不同系统,定义不统一',
            '客服和催收都给客户打标签,标签分散、定义不统一',
            '同业:奇富年干预 12 万+ 黑产用户,黑产投诉占比下降 54%'
          ],
          demos: [{ path: '/manage/lists', label: '名单管理' }]
        },
        {
          code: 'A3',
          title: '知识库管理',
          summary:
            '新产品知识 / 业务规则 / 话术模板 / 报送数据 — Phase 1 系统化,Phase 2 AI 增强(协议变更自动提取),Phase 3 知识图谱自动更新。',
          pains: [
            '线下 Excel 手动维护,检索和更新效率低',
            'OA 走消保审查流程,但知识库不会自动获取更新',
            '手动向各部门收集更新,更新不及时'
          ],
          demos: [{ path: '/manage/knowledge', label: '知识管理' }]
        },
        {
          code: 'A4',
          title: '分单规则配置',
          summary:
            '渠道 × 类型 × 紧急度分单规则的维护和调整 — Phase 0 先恢复原有规则,Phase 1 再优化。',
          pains: ['规则砍到只剩 1 条(按来源渠道分单)', '之前为均衡分单砍掉了多数规则,需要恢复多规则'],
          demos: [{ path: '/manage/rules', label: '规则配置' }]
        },
        {
          code: 'A5',
          title: '预警阈值设置',
          summary:
            '投诉量阈值 / 监管件超时天数 / 催收频次上限 — 各类预警规则的阈值配置和启停管理(Phase 2 随预警引擎建设)。',
          demos: [{ path: '/manage/rules', label: '规则配置' }]
        },
        {
          code: 'A6',
          title: '标签体系维护',
          summary:
            '投诉标签 → 根因标签 → 整改标签三级体系 — Phase 2 起 5 大类 15 小类,Phase 3 完整版 9 大类 45 小类。',
          pains: ['无投诉 → 根因 → 整改三级下钻,无法溯源归因'],
          demos: [{ path: '/manage/rules', label: '规则配置(标签联动)' }]
        },
        {
          code: 'A7',
          title: '权限管理',
          summary:
            '各工作台的角色权限 / 数据权限 / 操作权限 — 外包人员仅开放短期切片数据查看。',
          pains: ['✅ 已迁移新工单系统'],
          demos: [{ path: '/manage/role-config', label: '角色权限' }]
        }
      ]
    },
    {
      code: 'B',
      title: 'B. 事中管控 — 管住过程',
      desc:
        '管理者事中要"管住过程"——质检、审批、监管转诉建单、排班,确保投诉处理不出事。',
      phases: [
        {
          code: 'B1',
          title: '质检管理',
          summary:
            '语音质检(催收/客服全量) / 文本质检(工单/在线) / 实时质检(通话中违规话术提醒) / 关键词识别 / 情绪识别。',
          pains: [
            '总行质检存储量少,出结果需 2-3 天,速度慢',
            '关键词识别准确率低,仍需人工抽检',
            '无法识别客户文明表达的愤怒情绪',
            '无法识别非常规违规话术(如"反弹反弹")',
            '通话录音与工单无法自动关联,质检需人工交叉匹配',
            '理想:以"质检中台"向总行提需求(Phase 3 扩展至营销+客服+情绪)'
          ],
          demos: [{ path: '/manage/quality', label: '质检管理' }]
        },
        {
          code: 'B2',
          title: '审批流转',
          summary:
            '息费减免审批(10 万以上到总裁办,10 万以下到部门总经理)/ 停催申请审批 / OA 审批 → 结果回写工单。',
          pains: [
            '专人手工登录 OA 系统创建审批单',
            '手动粘贴介质信息,跨系统操作繁琐',
            'OA 审批完成 → 结果回写不完整',
            '资金类审批统一复用 OA 公共流程,部门内部作业流转保留在工单系统内'
          ],
          demos: [{ path: '/manage/workflow-monitor', label: '工单流转监控(含审批)' }]
        },
        {
          code: 'B3',
          title: '监管转诉建单',
          summary:
            '监管 / 12378 / 12345 / 黑猫名单批量建单 + 处理时效监控(监管要求 15 个工作日)。',
          pains: [
            '手动下载 Excel → 在新工单逐条建单(单次最多 13000 条逐户手工)',
            '身份匹配困难(监管台账明文 vs 老客服掩码)',
            '内外网不互通,无合规中转媒介',
            '外网云桌面账号已批但受阻 2 个月',
            '处理时效无系统统计,所有统计需人工做'
          ],
          demos: [
            { path: '/manage/reg-import', label: '监管转诉建单' },
            { path: '/manage/dashboard', label: '监管件时效看板(驾驶舱)' }
          ]
        },
        {
          code: 'B4',
          title: '排班管理',
          summary: '客服坐席排班(班次多、含节假日值班) / 外包人员排班。',
          pains: ['现状:纯人工排班,无系统功能'],
          demos: [{ path: '/manage/ops', label: '运营管理(排班)' }]
        },
        {
          code: 'B5',
          title: '工单流转监控',
          summary:
            '工单流程节点配置 + 实例流转监控 — 实时看流转进度 / 卡点 / 超时。',
          demos: [
            { path: '/manage/workflow-config', label: '工单流程配置' },
            { path: '/manage/workflow-monitor', label: '工单流转监控' }
          ]
        }
      ]
    },
    {
      code: 'C',
      title: 'C. 事后治理 — 看住效果',
      desc:
        '管理者事后要"看住效果"——溯源归因、整改追踪、考核评价、看板管理、月度考核培训。',
      phases: [
        {
          code: 'C1',
          title: '溯源归因',
          summary:
            '三级标签体系(投诉标签 → 根因标签 → 整改标签,三级下钻) + 投诉根因分析 + 整改任务派发 + 知识库回流。',
          pains: [
            '投诉处理完了就完了,同样的投诉会反复来',
            '不能说清是哪个产品、哪个环节、什么原因引发的',
            '投诉按什么分类的,没有统一标准',
            '溯源归因是结案之后的独立动作,不是工单流转的附属品',
            '没有这一层,投诉永远是"处理完了就完了"',
            '同业:TRS 浦发 6 大客服分析因子覆盖 3000+ 标签,识别准确率 90%'
          ],
          demos: [{ path: '/manage/rectify', label: '溯源整改' }]
        },
        {
          code: 'C2',
          title: '整改追踪',
          summary: '整改任务派发 → 部门认领 → 完成确认 → 效果验证 → 整改结论回流到坐席知识库。',
          pains: [
            '投诉反映的问题有没有推动业务整改?不知道',
            '整改后投诉量降了吗?不知道',
            '最大的卡点 — 没有闭环'
          ],
          demos: [{ path: '/manage/rectify', label: '溯源整改(整改追踪)' }]
        },
        {
          code: 'C3',
          title: '考核评价',
          summary: '投诉处理时效 / 重复投诉率 / 整改完成率 / 考核结果与部门绩效挂钩。',
          pains: [
            '无系统统计功能,所有统计需人工做',
            '工单对接回复时效、处理时效无法统计',
            '无法识别滞留工单,及时预警',
            '重复投诉率统计 — 无',
            '理想:Phase 3 考核闭环(指标与绩效挂钩)'
          ],
          demos: [{ path: '/manage/quality', label: '质检管理(含绩效)' }]
        },
        {
          code: 'C4',
          title: '看板管理',
          summary:
            '北极星指标:监管件占比(投诉升级为监管件的比例)↓ / 投诉总量↓ / 重复投诉率↓ / 结案时效↓ / 一次性解决率↑。',
          pains: [
            '手动拉报表,无系统看板',
            '投诉量突然涨了,多久能发现?靠人工',
            '监管来检查要求提供数据,准备多久?靠人工拉',
            '看板分工:公司级部门管理报表 → BI 系统;业务监控基础报表 → 新客服系统驾驶舱;外包人员仅开放短期切片数据'
          ],
          demos: [{ path: '/manage/dashboard', label: '驾驶舱(看板)' }]
        },
        {
          code: 'C5',
          title: '月度考核/培训',
          summary: '客服考核(知识库关联出题) / 培训管理。',
          pains: [
            '人工出题考核,无系统支撑',
            '培训管理 — 无系统功能',
            '理想:Phase 3 知识库关联出题 + 考核系统'
          ],
          demos: [{ path: '/manage/ops', label: '运营管理(培训)' }]
        },
        {
          code: 'C6',
          title: '贷中清退 / 票据合同',
          summary: '贷中清退修复/清除/关闭;票据合同开具。',
          demos: [
            { path: '/manage/exit', label: '贷中清退' },
            { path: '/manage/billing', label: '票据合同' }
          ]
        }
      ]
    }
  ],
  keyPains: [
    { title: '预警能力为零 — 投诉量异常、监管件超时全靠人工发现', level: '🔴' },
    { title: '名单分散不统一 — 黑名单/投诉特例/敏感词分散在不同系统', level: '🔴' },
    { title: '知识库全手动 — 线下 Excel 维护,新产品上线不自动更新', level: '🔴' },
    { title: '分单规则残缺 — 仅剩 1 条规则,工单分配效率极低', level: '🔴' },
    { title: '标签体系未建 — 无投诉 → 根因 → 整改三级下钻', level: '🔴' },
    { title: '质检能力不足 — 总行存储少/出结果慢(2-3 天)/准确率低', level: '🔴' },
    { title: '审批手工操作 — 专人手工登录 OA 创建审批单,手动粘贴介质', level: '🔴' },
    { title: '监管转诉全手工 — 13000 条逐户建单+身份匹配+内外网不互通', level: '🔴' },
    { title: '溯源归因未建 — 投诉处理完了就完了,不知道根因', level: '🔴' },
    { title: '整改追踪未建 — 整改效果?投诉量下降?不知道', level: '🔴' },
    { title: '考核评价未建 — 时效/重复投诉率/整改完成率无法统计', level: '🟡' },
    { title: '看板管理未建 — 手动拉报表,异常靠人工发现', level: '🟡' },
    { title: '排班纯人工 — 无系统功能,班次多含节假日值班', level: '🟡' },
    { title: '月度考核人工 — 人工出题考核,无系统支撑', level: '🟡' }
  ]
}

/** ============================================================
 *  角色 5:消费者(精简版)
 *  ============================================================ */
const CONSUMER_JOURNEY: JourneyRole = {
  roleKey: 'consumer',
  roleName: '消费者',
  username: '赵先生',
  sections: [
    {
      code: 'A',
      title: 'A. 自助服务',
      desc: '消费者端能力。',
      phases: [
        {
          code: 'A1',
          title: '我的投诉(进度查询)',
          summary: '工单进度条 / 当前阶段 / 预计处理时间。',
          demos: [{ path: '/consumer/complaints', label: '我的投诉' }]
        },
        {
          code: 'A2',
          title: '满意度评价',
          summary: '结案后 7 天内评分,≤2 星自动创建回访工单。',
          demos: [{ path: '/consumer/feedback', label: '满意度评价' }]
        }
      ]
    }
  ],
  keyPains: [
    { title: '催办按钮(7 天限频)未实现', level: '🟡' },
    { title: '补充材料上传表单未完善', level: '🟡' }
  ]
}

export const JOURNEY_MAP: Record<RoleKey, JourneyRole> = {
  agent: AGENT_JOURNEY,
  business: BUSINESS_JOURNEY,
  review: REVIEW_JOURNEY,
  manage: MANAGE_JOURNEY,
  consumer: CONSUMER_JOURNEY
}

export const JOURNEY_ORDER: RoleKey[] = ['agent', 'business', 'review', 'manage', 'consumer']

/**
 * 角色心智模型(从三段旅程文档提炼,用于 /journey 讲解页头部展示)
 * 每个主要角色一句话总结 + 三个核心动作
 */
export interface RoleMentalModel {
  roleKey: RoleKey
  /** 一句话定位 */
  oneLiner: string
  /** 三个核心动作(短语) */
  actions: string[]
  /** 阶段跨度 */
  scope: string
}

export const ROLE_MENTAL_MODELS: RoleMentalModel[] = [
  {
    roleKey: 'agent',
    oneLiner: '事中处置 — 接住投诉、处理工单,把"火"灭在第一线',
    actions: ['接住投诉', '处理工单', '快速建单'],
    scope: '纯事中'
  },
  {
    roleKey: 'business',
    oneLiner: '事中执行 — 执行业务操作、审批、交付,把工单做成业务结果',
    actions: ['业务执行', '审批流转', '结果交付'],
    scope: '纯事中(通过工单间接接触客户)'
  },
  {
    roleKey: 'manage',
    oneLiner: '唯一横跨三阶段 — 事前防住投诉、事中管住过程、事后看住效果',
    actions: ['防住投诉', '管住过程', '看住效果'],
    scope: '事前 + 事中 + 事后'
  },
  {
    roleKey: 'review',
    oneLiner: '守门人 — 新产品/营销/变更上线前的消保审查,守住合规底线',
    actions: ['立项审查', '标准对照', '归档同步'],
    scope: '事前(审查) + 事后(标准回流)'
  },
  {
    roleKey: 'consumer',
    oneLiner: '被服务者 — 查进度、评满意度、催办,把客户体验反哺回系统',
    actions: ['查进度', '评满意度', '催办'],
    scope: '外部端(自助)'
  }
]