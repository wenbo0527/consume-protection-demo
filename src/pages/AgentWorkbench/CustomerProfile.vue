<template>
  <div class="cp-page" v-if="customer">
    <!-- ========== 通话中 Banner(接通后由 ?call=1 触发) ========== -->
    <div v-if="inCall" class="cp-call-banner">
      <div class="cp-call-banner-left">
        <span class="cp-call-dot" />
        <span class="cp-call-status">通话中</span>
        <span class="cp-call-duration mono">{{ callDurationText }}</span>
        <span class="cp-call-target">· {{ customer.name }} · {{ customer.phone }}</span>
      </div>
      <div class="cp-call-banner-right">
        <a-button size="small" type="primary" @click="quickCreateTicket">
          <icon-plus /> 快速建工单
        </a-button>
        <a-button size="small" @click="openStartWorkflow">
          <icon-send /> 发起业务工作流
        </a-button>
        <a-button size="small" type="primary" status="danger" @click="hangup">
          <icon-close /> 挂断通话
        </a-button>
        <a-button size="small" @click="$router.push('/agent/desk')">
          <icon-left /> 返回工作台
        </a-button>
      </div>
    </div>

    <a-page-header :title="customer.name + ' - 客户画像'" :subtitle="`客户编号 ${customer.id} · ${customer.idCardMask}`">
      <template #back-icon><icon-left /></template>
      <template #extra>
        <a-space>
          <a-button @click="$router.back()">返回</a-button>
          <a-button @click="openStartWorkflow">
            <icon-send /> 发起业务工作流
          </a-button>
          <a-button type="primary" :disabled="!customer.ongoingTickets.length">
            <icon-phone /> 拨号 ({{ customer.ongoingTickets.length }})
          </a-button>
        </a-space>
      </template>
    </a-page-header>

    <!-- 顶部预警(不可关闭) - 由 useTagRuleStore 驱动(P2-9) -->
    <a-alert v-if="alertLevel" :type="alertLevel.type" show-icon style="margin-bottom: 16px">
      <template #title>{{ alertLevel.title }}</template>
      <template #content>
        <div style="margin-top: 4px">
          建议处置:
          <a-tag v-for="a in alertLevel.actions" :key="a" :color="alertLevel.type === 'error' ? 'red' : 'orange'" style="margin-left: 4px">{{ a }}</a-tag>
        </div>
      </template>
    </a-alert>

    <!-- 标签联动:限制呼入 + 自动升级 -->
    <a-alert v-if="restrictNotes.length" type="warning" show-icon style="margin-bottom: 12px">
      <template #title>呼入/呼出限制</template>
      <template #content>
        <div v-for="(n, i) in restrictNotes" :key="i" style="margin-top: 2px">{{ n }}</div>
      </template>
    </a-alert>
    <a-alert v-if="upgradeNotes.length" type="error" show-icon style="margin-bottom: 12px">
      <template #title>自动升级规则命中</template>
      <template #content>
        <div v-for="(n, i) in upgradeNotes" :key="i" style="margin-top: 2px">{{ n }}</div>
        <div style="margin-top: 8px">
          <a-button size="small" status="danger" @click="triggerAutoUpgrade">
            <icon-send /> 一键升级到管理层
          </a-button>
        </div>
      </template>
    </a-alert>

    <!-- 关键指标条 -->
    <div class="cp-stat-row" style="margin-bottom: 16px">
      <div class="cp-stat-card">
        <div class="cp-stat-label">授信状态</div>
        <div class="cp-stat-value" style="font-size: 14px">
          <a-tag :color="statusColor(customer.creditStatus)" size="medium">{{ statusMap[customer.creditStatus] }}</a-tag>
        </div>
      </div>
      <div class="cp-stat-card">
        <div class="cp-stat-label">在贷余额</div>
        <div class="cp-stat-value mono">¥{{ customer.loanBalance.toLocaleString() }}</div>
      </div>
      <div class="cp-stat-card">
        <div class="cp-stat-label">逾期借据</div>
        <div class="cp-stat-value mono" :style="{ color: customer.overdueCount ? 'var(--cp-danger)' : '' }">{{ customer.overdueCount }} 笔</div>
      </div>
      <div class="cp-stat-card">
        <div class="cp-stat-label">最长逾期</div>
        <div class="cp-stat-value mono" :style="{ color: customer.maxOverdueDays > 30 ? 'var(--cp-danger)' : '' }">{{ customer.maxOverdueDays }} 天</div>
      </div>
      <div class="cp-stat-card">
        <div class="cp-stat-label">风险标签</div>
        <div class="cp-stat-value" style="font-size: 14px">
          <risk-tag v-for="t in customer.riskTags" :key="t" :type="t" />
          <span v-if="!customer.riskTags.length" style="color: var(--cp-text-tertiary)">无</span>
        </div>
      </div>
    </div>

    <!-- ============ 一级 Tab ============ -->
    <a-tabs default-active-key="profile" type="rounded">
      <!-- ============ Tab 1: 客户画像 ============ -->
      <a-tab-pane key="profile" title="客户画像">
        <!-- 二级 Tab:征信 / 基础信息 -->
        <a-tabs default-active-key="credit" type="rounded" size="small">
          <!-- 1.1 征信 -->
          <a-tab-pane key="credit" title="征信">
            <!-- Mock 状态切换(开发态) -->
            <div style="margin-bottom: 12px; padding: 8px 12px; background: var(--cp-bg-soft); border-radius: 4px; display: flex; align-items: center; gap: 8px">
              <span style="font-size: 12px; color: var(--cp-text-tertiary)">DEV Mock 状态切换:</span>
              <a-radio-group v-model="creditStatus" type="button" size="small">
                <a-radio-button value="none">无报告</a-radio-button>
                <a-radio-button value="no_permission">无权限</a-radio-button>
                <a-radio-button value="available">查得报告</a-radio-button>
              </a-radio-group>
            </div>

            <!-- 无报告 -->
            <div v-if="creditStatus === 'none'" class="cp-card" style="padding: 60px 20px; text-align: center">
              <icon-file style="font-size: 48px; color: var(--cp-text-quaternary)" />
              <div style="margin-top: 12px; font-size: 14px; color: var(--cp-text-secondary)">暂无征信报告</div>
              <div style="margin-top: 4px; font-size: 12px; color: var(--cp-text-tertiary)">客户尚未授权查询征信信息</div>
              <a-button type="primary" style="margin-top: 16px">
                <icon-plus /> 申请查询授权
              </a-button>
            </div>

            <!-- 无权限 -->
            <div v-else-if="creditStatus === 'no_permission'" class="cp-card" style="padding: 60px 20px; text-align: center">
              <icon-lock style="font-size: 48px; color: var(--cp-warning)" />
              <div style="margin-top: 12px; font-size: 14px; color: var(--cp-text-secondary)">无权限查看征信报告</div>
              <div style="margin-top: 4px; font-size: 12px; color: var(--cp-text-tertiary)">当前角色未授予征信查询权限,请联系管理员</div>
              <a-button type="primary" style="margin-top: 16px">
                <icon-user /> 申请权限
              </a-button>
            </div>

            <!-- 查得报告 -->
            <div v-else-if="creditStatus === 'available'">
              <!-- 报告基本信息 -->
              <div class="cp-card" style="padding: 16px 20px; margin-bottom: 12px">
                <div style="display: flex; justify-content: space-between; align-items: center">
                  <h3 class="cp-section-title" style="margin: 0">征信报告基本信息</h3>
                  <a-tag color="green" size="small">报告可用</a-tag>
                </div>
                <a-descriptions :column="3" size="small" style="margin-top: 12px">
                  <a-descriptions-item label="查询时间">{{ creditReport.generateTime }}</a-descriptions-item>
                  <a-descriptions-item label="查询机构">{{ creditReport.queryOrg }}</a-descriptions-item>
                  <a-descriptions-item label="有效期至">{{ creditReport.validUntil }}</a-descriptions-item>
                  <a-descriptions-item label="信用评分">
                    <span class="mono" style="font-weight: 600; color: var(--cp-success)">{{ creditReport.creditScore }}</span>
                    <a-tag color="green" size="small" style="margin-left: 6px">{{ creditReport.creditLevel }}</a-tag>
                  </a-descriptions-item>
                  <a-descriptions-item label="查询原因">{{ creditReport.queryReason }}</a-descriptions-item>
                  <a-descriptions-item label="近6月查询">{{ creditReport.recentQueries }} 次</a-descriptions-item>
                </a-descriptions>
              </div>

              <!-- 信贷记录摘要 -->
              <h3 class="cp-section-title">信贷记录摘要</h3>
              <div class="cp-stat-row" style="grid-template-columns: repeat(4, 1fr); margin-bottom: 12px">
                <div class="cp-stat-card">
                  <div class="cp-stat-label">信用卡账户</div>
                  <div class="cp-stat-value mono">{{ creditReport.creditCardAccounts }}</div>
                </div>
                <div class="cp-stat-card">
                  <div class="cp-stat-label">贷款账户</div>
                  <div class="cp-stat-value mono">{{ creditReport.loanAccounts }}</div>
                </div>
                <div class="cp-stat-card">
                  <div class="cp-stat-label">逾期账户</div>
                  <div class="cp-stat-value mono" :style="{ color: creditReport.overdueAccounts ? 'var(--cp-danger)' : '' }">{{ creditReport.overdueAccounts }}</div>
                </div>
                <div class="cp-stat-card">
                  <div class="cp-stat-label">最长逾期</div>
                  <div class="cp-stat-value mono" :style="{ color: creditReport.maxOverdueDays > 30 ? 'var(--cp-danger)' : '' }">{{ creditReport.maxOverdueDays }} 天</div>
                </div>
              </div>

              <!-- 查询记录 -->
              <div class="cp-card" style="padding: 16px 20px; margin-bottom: 12px">
                <h3 class="cp-section-title">查询记录</h3>
                <a-table :data="creditReport.queryHistory" :pagination="false" size="small">
                  <template #columns>
                    <a-table-column title="查询日期" data-index="date" />
                    <a-table-column title="查询机构" data-index="org" />
                    <a-table-column title="查询原因" data-index="reason" />
                    <a-table-column title="查询类型">
                      <template #cell="{ record }">
                        <a-tag size="small">{{ record.type }}</a-tag>
                      </template>
                    </a-table-column>
                  </template>
                </a-table>
              </div>

              <!-- 异议信息 -->
              <div class="cp-card" style="padding: 16px 20px">
                <h3 class="cp-section-title">异议信息</h3>
                <div v-if="creditReport.disputes.length">
                  <div v-for="d in creditReport.disputes" :key="d.date" class="cp-dispute">
                    <div style="display: flex; justify-content: space-between">
                      <span style="font-weight: 500">{{ d.content }}</span>
                      <a-tag size="small" :color="d.status === '已处理' ? 'green' : 'orange'">{{ d.status }}</a-tag>
                    </div>
                    <div style="font-size: 12px; color: var(--cp-text-tertiary); margin-top: 4px">{{ d.date }} · {{ d.result || '处理中' }}</div>
                  </div>
                </div>
                <a-empty v-else size="small" description="无异议记录" />
              </div>
            </div>
          </a-tab-pane>

          <!-- 1.2 基础信息 -->
          <a-tab-pane key="basic" title="基础信息">
            <a-row :gutter="16">
              <a-col :span="16">
                <div class="cp-card" style="padding: 20px 24px">
                  <h3 class="cp-section-title">身份信息</h3>
                  <a-descriptions :column="2" bordered size="small">
                    <a-descriptions-item label="姓名">{{ customer.name }}</a-descriptions-item>
                    <a-descriptions-item label="性别">{{ basic.gender }}</a-descriptions-item>
                    <a-descriptions-item label="年龄">{{ basic.age }} 岁</a-descriptions-item>
                    <a-descriptions-item label="客户编号">{{ customer.id }}</a-descriptions-item>
                    <a-descriptions-item label="身份证号" :span="2">{{ customer.idCardMask }}</a-descriptions-item>
                    <a-descriptions-item label="身份证有效期">{{ basic.idValidUntil }}</a-descriptions-item>
                    <a-descriptions-item label="户籍">{{ basic.domicile }}</a-descriptions-item>
                    <a-descriptions-item label="手机号" :span="2">{{ customer.phone }}</a-descriptions-item>
                    <a-descriptions-item label="用户状态">
                      <a-tag color="green" size="small">{{ basic.userStatus }}</a-tag>
                    </a-descriptions-item>
                    <a-descriptions-item label="VIP等级">
                      <a-tag color="gold" size="small">VIP{{ basic.vipLevel }}</a-tag>
                    </a-descriptions-item>
                  </a-descriptions>
                </div>

                <div class="cp-card" style="padding: 20px 24px; margin-top: 12px">
                  <h3 class="cp-section-title">风险评估</h3>
                  <a-row :gutter="16">
                    <a-col :span="8">
                      <div style="padding: 12px; background: var(--cp-bg-soft); border-radius: 4px; text-align: center">
                        <div style="font-size: 11px; color: var(--cp-text-tertiary)">综合风险评分</div>
                        <div class="mono" style="font-size: 22px; font-weight: 600; color: var(--cp-warning); margin-top: 4px">{{ basic.riskScore }}</div>
                        <a-tag color="orange" size="small">中等</a-tag>
                      </div>
                    </a-col>
                    <a-col :span="8">
                      <div style="padding: 12px; background: var(--cp-bg-soft); border-radius: 4px; text-align: center">
                        <div style="font-size: 11px; color: var(--cp-text-tertiary)">违约概率</div>
                        <div class="mono" style="font-size: 22px; font-weight: 600; color: var(--cp-danger); margin-top: 4px">{{ basic.defaultProb }}%</div>
                        <a-tag color="red" size="small">高</a-tag>
                      </div>
                    </a-col>
                    <a-col :span="8">
                      <div style="padding: 12px; background: var(--cp-bg-soft); border-radius: 4px; text-align: center">
                        <div style="font-size: 11px; color: var(--cp-text-tertiary)">客户价值等级</div>
                        <div class="mono" style="font-size: 22px; font-weight: 600; color: var(--cp-brand); margin-top: 4px">{{ basic.valueLevel }}</div>
                        <a-tag color="blue" size="small">高价值</a-tag>
                      </div>
                    </a-col>
                  </a-row>
                </div>

                <div class="cp-card" style="padding: 20px 24px; margin-top: 12px">
                  <h3 class="cp-section-title">行为特征</h3>
                  <a-row :gutter="16">
                    <a-col :span="12">
                      <div class="cp-behavior-item">
                        <icon-mobile style="color: var(--cp-brand)" />
                        <div style="flex: 1">
                          <div style="font-size: 12px; color: var(--cp-text-tertiary)">常用设备</div>
                          <div style="font-size: 13px; font-weight: 500">iPhone 15 Pro · 188****9090</div>
                        </div>
                      </div>
                      <div class="cp-behavior-item">
                        <icon-location style="color: var(--cp-brand)" />
                        <div style="flex: 1">
                          <div style="font-size: 12px; color: var(--cp-text-tertiary)">常用地址</div>
                          <div style="font-size: 13px; font-weight: 500">{{ basic.commonAddress }}</div>
                        </div>
                      </div>
                    </a-col>
                    <a-col :span="12">
                      <div class="cp-behavior-item">
                        <icon-clock-circle style="color: var(--cp-brand)" />
                        <div style="flex: 1">
                          <div style="font-size: 12px; color: var(--cp-text-tertiary)">活跃时段</div>
                          <div style="font-size: 13px; font-weight: 500">{{ basic.activeTime }}</div>
                        </div>
                      </div>
                      <div class="cp-behavior-item">
                        <icon-thumbs-up style="color: var(--cp-brand)" />
                        <div style="flex: 1">
                          <div style="font-size: 12px; color: var(--cp-text-tertiary)">偏好渠道</div>
                          <div style="font-size: 13px; font-weight: 500">{{ basic.preferredChannel }}</div>
                        </div>
                      </div>
                    </a-col>
                  </a-row>
                </div>
              </a-col>

              <a-col :span="8">
                <div class="cp-card" style="padding: 20px">
                  <h3 class="cp-section-title">风险标签</h3>
                  <div v-if="customer.riskTags.length" style="display: flex; flex-direction: column; gap: 8px">
                    <div v-for="(tag, idx) in customer.riskTags" :key="tag" class="cp-tag-row">
                      <risk-tag :type="tag" />
                      <div style="flex: 1; font-size: 12px; color: var(--cp-text-tertiary)">
                        来源:{{ customer.tagSources[idx] || '系统' }}
                      </div>
                    </div>
                  </div>
                  <a-empty v-else size="small" description="无风险标签" />
                </div>

                <div class="cp-card" style="padding: 20px; margin-top: 12px">
                  <h3 class="cp-section-title">近 6 月投诉</h3>
                  <div style="text-align: center; padding: 8px 0">
                    <div class="mono" style="font-size: 32px; font-weight: 600; color: var(--cp-text)">{{ customer.complaintCount6m }}</div>
                    <div style="font-size: 12px; color: var(--cp-text-tertiary); margin-top: 4px">次投诉 · 上次 {{ customer.lastComplaintTime }}</div>
                    <div style="font-size: 12px; color: var(--cp-text-tertiary)">类型:{{ customer.lastComplaintType || '无' }}</div>
                  </div>
                  <a-link @click="activeTab = 'collection'">查看催收记录 →</a-link>
                </div>
              </a-col>
            </a-row>
          </a-tab-pane>
        </a-tabs>
      </a-tab-pane>

      <!-- ============ Tab 2: 产品 ============ -->
      <a-tab-pane key="product" title="产品">
        <!-- 客户概览 -->
        <div class="cp-stat-row" style="grid-template-columns: repeat(4, 1fr); margin-bottom: 12px">
          <div class="cp-stat-card">
            <div class="cp-stat-label">历史最大逾期</div>
            <div class="cp-stat-value mono" :style="{ color: customer.maxOverdueDays > 30 ? 'var(--cp-danger)' : '' }">{{ customer.maxOverdueDays }} 天</div>
          </div>
          <div class="cp-stat-card">
            <div class="cp-stat-label">当前总在贷</div>
            <div class="cp-stat-value mono">¥{{ customer.loanBalance.toLocaleString() }}</div>
          </div>
          <div class="cp-stat-card">
            <div class="cp-stat-label">总授信额度</div>
            <div class="cp-stat-value mono">¥{{ basic.totalCreditLimit.toLocaleString() }}</div>
          </div>
          <div class="cp-stat-card">
            <div class="cp-stat-label">已用额度</div>
            <div class="cp-stat-value mono">{{ Math.round(customer.loanBalance / basic.totalCreditLimit * 100) }}%</div>
            <a-progress :percent="Math.round(customer.loanBalance / basic.totalCreditLimit * 100)" :show-text="false" :color="customer.loanBalance / basic.totalCreditLimit > 0.8 ? 'var(--cp-danger)' : 'var(--cp-brand)'" />
          </div>
        </div>

        <!-- 产品列表 -->
        <div class="cp-card" style="padding: 0">
          <div class="cp-product-head">
            <h3 class="cp-section-title" style="margin: 0">产品/借据列表</h3>
            <a-space>
              <a-radio-group v-model="productTypeFilter" type="button" size="small">
                <a-radio-button value="">全部</a-radio-button>
                <a-radio-button value="loan">贷款</a-radio-button>
                <a-radio-button value="credit">信用卡</a-radio-button>
              </a-radio-group>
            </a-space>
          </div>
          <a-table :data="filteredProducts" :pagination="false">
            <template #columns>
              <a-table-column title="借据号" data-index="contractNo" />
              <a-table-column title="产品" data-index="productName" />
              <a-table-column title="放款金额" data-index="amount">
                <template #cell="{ record }"><span class="mono">¥{{ record.amount.toLocaleString() }}</span></template>
              </a-table-column>
              <a-table-column title="剩余本金" data-index="remainingPrincipal">
                <template #cell="{ record }"><span class="mono">¥{{ record.remainingPrincipal.toLocaleString() }}</span></template>
              </a-table-column>
              <a-table-column title="剩余应还">
                <template #cell="{ record }">
                  <span class="mono">¥{{ record.remainingTotal.toLocaleString() }}</span>
                  <a-tooltip v-if="record.remainingPenalty" content="含本金罚息+利息罚息">
                    <icon-exclamation-circle style="color: var(--cp-warning); margin-left: 4px" />
                  </a-tooltip>
                </template>
              </a-table-column>
              <a-table-column title="当前期/总期">
                <template #cell="{ record }">
                  <span class="mono">{{ record.currentPeriod }}/{{ record.periods }}</span>
                </template>
              </a-table-column>
              <a-table-column title="逾期天数">
                <template #cell="{ record }">
                  <span class="mono" :style="{ color: record.overdueDays > 0 ? 'var(--cp-danger)' : '' }">{{ record.overdueDays }}</span>
                </template>
              </a-table-column>
              <a-table-column title="状态">
                <template #cell="{ record }">
                  <a-tag :color="record.contractStatus === '正常' ? 'green' : record.contractStatus === '逾期' ? 'red' : 'gray'">{{ record.contractStatus }}</a-tag>
                </template>
              </a-table-column>
              <a-table-column title="操作">
                <template #cell>
                  <a-space :size="4">
                    <a-button size="small" @click="showDisbursement = true">放款信息</a-button>
                    <a-button size="small" @click="showRepayment = true">还款信息</a-button>
                  </a-space>
                </template>
              </a-table-column>
            </template>
          </a-table>
        </div>

        <!-- 放款信息抽屉 -->
        <a-drawer v-model:visible="showDisbursement" title="放款信息" :width="520">
          <a-descriptions :column="1" bordered size="small">
            <a-descriptions-item label="放款流水号">FK-20260415-001</a-descriptions-item>
            <a-descriptions-item label="放款时间">2026-04-15 14:32:08</a-descriptions-item>
            <a-descriptions-item label="放款渠道">银行转账</a-descriptions-item>
            <a-descriptions-item label="收款账户">招商银行 ****5678</a-descriptions-item>
            <a-descriptions-item label="到账时间">2026-04-15 14:32:15</a-descriptions-item>
            <a-descriptions-item label="手续费">¥0.00</a-descriptions-item>
            <a-descriptions-item label="借据起始日">2026-04-15</a-descriptions-item>
            <a-descriptions-item label="借据结束日">2027-04-15</a-descriptions-item>
          </a-descriptions>
        </a-drawer>

        <!-- 还款信息抽屉 -->
        <a-drawer v-model:visible="showRepayment" title="还款信息" :width="520">
          <a-descriptions :column="1" bordered size="small">
            <a-descriptions-item label="应还款日">每月 15 日</a-descriptions-item>
            <a-descriptions-item label="当期待还">¥3,250.00</a-descriptions-item>
            <a-descriptions-item label="应还本金">¥2,800.00</a-descriptions-item>
            <a-descriptions-item label="应还利息">¥450.00</a-descriptions-item>
            <a-descriptions-item label="当月实还">¥3,250.00</a-descriptions-item>
            <a-descriptions-item label="实际还款日">2026-07-15</a-descriptions-item>
            <a-descriptions-item label="最大逾期天数">0</a-descriptions-item>
            <a-descriptions-item label="还款状态"><a-tag color="green">正常</a-tag></a-descriptions-item>
          </a-descriptions>
        </a-drawer>
      </a-tab-pane>

      <!-- ============ Tab 3: 催收记录 ============ -->
      <a-tab-pane key="collection" title="催收记录">
        <!-- 催收概览 -->
        <div class="cp-stat-row" style="grid-template-columns: repeat(4, 1fr); margin-bottom: 12px">
          <div class="cp-stat-card">
            <div class="cp-stat-label">总记录</div>
            <div class="cp-stat-value mono">{{ collectionSummary.totalRecords }}</div>
          </div>
          <div class="cp-stat-card">
            <div class="cp-stat-label">成功率</div>
            <div class="cp-stat-value mono" style="color: var(--cp-success)">{{ collectionSummary.successRate }}%</div>
          </div>
          <div class="cp-stat-card">
            <div class="cp-stat-label">承诺金额</div>
            <div class="cp-stat-value mono">¥{{ collectionSummary.totalPromiseAmount.toLocaleString() }}</div>
          </div>
          <div class="cp-stat-card">
            <div class="cp-stat-label">实际回款</div>
            <div class="cp-stat-value mono" style="color: var(--cp-brand)">¥{{ collectionSummary.totalActualPayment.toLocaleString() }}</div>
          </div>
        </div>

        <!-- 难度分布 -->
        <div class="cp-card" style="padding: 16px 20px; margin-bottom: 12px">
          <h3 class="cp-section-title">难度与阶段分布</h3>
          <a-row :gutter="16">
            <a-col :span="12">
              <div style="font-size: 12px; color: var(--cp-text-tertiary); margin-bottom: 6px">难度分布</div>
              <div v-for="(v, k) in collectionSummary.difficultyDistribution" :key="k" style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px">
                <a-tag :color="k === 'easy' ? 'green' : k === 'medium' ? 'orange' : 'red'" size="small">{{ k === 'easy' ? '容易' : k === 'medium' ? '中等' : '困难' }}</a-tag>
                <div style="flex: 1; height: 6px; background: var(--cp-bg-soft); border-radius: 3px; overflow: hidden">
                  <div :style="{ width: (v / collectionSummary.totalRecords * 100) + '%', height: '100%', background: k === 'easy' ? 'var(--cp-success)' : k === 'medium' ? 'var(--cp-warning)' : 'var(--cp-danger)' }"></div>
                </div>
                <span class="mono" style="min-width: 30px; text-align: right">{{ v }}</span>
              </div>
            </a-col>
            <a-col :span="12">
              <div style="font-size: 12px; color: var(--cp-text-tertiary); margin-bottom: 6px">阶段分布</div>
              <div v-for="(v, k) in collectionSummary.stageDistribution" :key="k" style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px">
                <a-tag color="blue" size="small">M{{ k }}</a-tag>
                <div style="flex: 1; height: 6px; background: var(--cp-bg-soft); border-radius: 3px; overflow: hidden">
                  <div :style="{ width: (v / collectionSummary.totalRecords * 100) + '%', height: '100%', background: 'var(--cp-brand)' }"></div>
                </div>
                <span class="mono" style="min-width: 30px; text-align: right">{{ v }}</span>
              </div>
            </a-col>
          </a-row>
        </div>

        <!-- 催收记录 -->
        <div class="cp-card" style="padding: 0">
          <a-table :data="collectionRecords" :pagination="{ pageSize: 5 }">
            <template #columns>
              <a-table-column title="催收日期" data-index="date" />
              <a-table-column title="催收类型">
                <template #cell="{ record }"><a-tag size="small">{{ record.type }}</a-tag></template>
              </a-table-column>
              <a-table-column title="催收员" data-index="collector" />
              <a-table-column title="联系结果">
                <template #cell="{ record }">
                  <a-tag :color="record.result === '承诺还款' ? 'green' : 'orange'" size="small">{{ record.result }}</a-tag>
                </template>
              </a-table-column>
              <a-table-column title="承诺金额">
                <template #cell="{ record }">
                  <span v-if="record.promiseAmount" class="mono">¥{{ record.promiseAmount.toLocaleString() }}</span>
                  <span v-else>-</span>
                </template>
              </a-table-column>
              <a-table-column title="难度">
                <template #cell="{ record }">
                  <a-tag :color="record.difficulty === '容易' ? 'green' : record.difficulty === '中等' ? 'orange' : 'red'" size="small">{{ record.difficulty }}</a-tag>
                </template>
              </a-table-column>
              <a-table-column title="标签">
                <template #cell="{ record }">
                  <a-tag v-for="t in record.tags" :key="t" size="small" style="margin: 1px">{{ t }}</a-tag>
                </template>
              </a-table-column>
            </template>
          </a-table>
        </div>
      </a-tab-pane>

      <!-- ============ Tab 4: 营销记录 ============ -->
      <a-tab-pane key="marketing" title="营销记录">
        <div class="cp-stat-row" style="grid-template-columns: repeat(4, 1fr); margin-bottom: 12px">
          <div class="cp-stat-card">
            <div class="cp-stat-label">成功营销</div>
            <div class="cp-stat-value mono" style="color: var(--cp-success)">5</div>
          </div>
          <div class="cp-stat-card">
            <div class="cp-stat-label">进行中</div>
            <div class="cp-stat-value mono" style="color: var(--cp-warning)">2</div>
          </div>
          <div class="cp-stat-card">
            <div class="cp-stat-label">失败</div>
            <div class="cp-stat-value mono" style="color: var(--cp-danger)">1</div>
          </div>
          <div class="cp-stat-card">
            <div class="cp-stat-label">总体成功率</div>
            <div class="cp-stat-value mono" style="color: var(--cp-brand)">71%</div>
          </div>
        </div>

        <div class="cp-card" style="padding: 0">
          <div class="cp-product-head">
            <h3 class="cp-section-title" style="margin: 0">营销活动记录</h3>
            <a-radio-group v-model="marketingFilter" type="button" size="small">
              <a-radio-button value="">全部</a-radio-button>
              <a-radio-button value="成功">成功</a-radio-button>
              <a-radio-button value="进行中">进行中</a-radio-button>
              <a-radio-button value="失败">失败</a-radio-button>
            </a-radio-group>
          </div>
          <a-table :data="filteredMarketing" :pagination="{ pageSize: 8 }">
            <template #columns>
              <a-table-column title="活动名称" data-index="name" />
              <a-table-column title="类型">
                <template #cell="{ record }">
                  <a-tag :color="marketingTypeColor(record.type)" size="small">{{ record.type }}</a-tag>
                </template>
              </a-table-column>
              <a-table-column title="渠道" data-index="channel" />
              <a-table-column title="状态">
                <template #cell="{ record }">
                  <a-tag :color="record.status === '成功' ? 'green' : record.status === '进行中' ? 'orange' : 'red'" size="small">{{ record.status }}</a-tag>
                </template>
              </a-table-column>
              <a-table-column title="响应率">
                <template #cell="{ record }">
                  <div style="display: flex; align-items: center; gap: 6px">
                    <div style="width: 60px; height: 4px; background: var(--cp-bg-soft); border-radius: 2px; overflow: hidden">
                      <div :style="{ width: record.responseRate + '%', height: '100%', background: record.responseRate >= 70 ? 'var(--cp-success)' : record.responseRate >= 40 ? 'var(--cp-warning)' : 'var(--cp-danger)' }"></div>
                    </div>
                    <span class="mono">{{ record.responseRate }}%</span>
                  </div>
                </template>
              </a-table-column>
              <a-table-column title="参与时间" data-index="time" />
              <a-table-column title="操作">
                <template #cell><a-button size="small">详情</a-button></template>
              </a-table-column>
            </template>
          </a-table>
        </div>
      </a-tab-pane>

      <!-- ============ Tab 5: 历史切片 ============ -->
      <a-tab-pane key="history" title="历史切片">
        <div class="cp-card" style="padding: 20px 24px">
          <h3 class="cp-section-title">历史切片查询</h3>
          <a-row :gutter="12" style="margin-bottom: 12px">
            <a-col :span="6">
              <a-select v-model="historyModel" placeholder="选择数据模型">
                <a-option value="customer_basic">客户基础信息</a-option>
                <a-option value="product_info">产品信息</a-option>
                <a-option value="credit_records">征信记录</a-option>
                <a-option value="loan_records">用信记录</a-option>
                <a-option value="collection_records">催收记录</a-option>
                <a-option value="marketing_records">营销记录</a-option>
              </a-select>
            </a-col>
            <a-col :span="6">
              <a-date-picker v-model="historyDate" placeholder="选择查询日期" style="width: 100%" />
            </a-col>
            <a-col :span="6">
              <a-select v-model="historyView" placeholder="视图">
                <a-option value="table">表格视图</a-option>
                <a-option value="timeline">时间线视图</a-option>
                <a-option value="tree">树形视图</a-option>
                <a-option value="card">卡片视图</a-option>
              </a-select>
            </a-col>
            <a-col :span="6">
              <a-button type="primary" long @click="showHistorySample = true">
                <icon-search /> 查询
              </a-button>
            </a-col>
          </a-row>

          <a-alert v-if="showHistorySample" type="success" show-icon>
            <template #title>查询成功 · 共 12 条切片记录</template>
            <template #content>
              <div style="margin-top: 4px">最近变化:2026-07-10 在贷余额由 ¥92,000 → ¥86,420(归还本金)</div>
              <div style="margin-top: 6px">
                <a-tag color="green" size="small">新增 0</a-tag>
                <a-tag color="orange" size="small">修改 3</a-tag>
                <a-tag color="red" size="small">删除 0</a-tag>
                <a-tag color="gray" size="small">未变 9</a-tag>
                <a-button size="small" style="margin-left: 8px">对比 2 个切片</a-button>
                <a-button size="small">导出 Excel</a-button>
              </div>
            </template>
          </a-alert>

          <div v-if="showHistorySample" style="margin-top: 16px">
            <a-table :data="historySample" :pagination="{ pageSize: 6 }" size="small">
              <template #columns>
                <a-table-column title="切片时间" data-index="time" />
                <a-table-column title="数据模型" data-index="model" />
                <a-table-column title="变化">
                  <template #cell="{ record }">
                    <a-tag :color="record.change === '新增' ? 'green' : record.change === '修改' ? 'orange' : record.change === '删除' ? 'red' : 'gray'" size="small">{{ record.change }}</a-tag>
                  </template>
                </a-table-column>
                <a-table-column title="字段" data-index="field" />
                <a-table-column title="原值" data-index="before" />
                <a-table-column title="新值" data-index="after" />
                <a-table-column title="操作人" data-index="operator" />
              </template>
            </a-table>
          </div>
        </div>
      </a-tab-pane>
    </a-tabs>

    <!-- 发起业务工作流弹窗(通话/非通话态均可触发) -->
    <start-workflow-modal
      v-model:visible="workflowModalVisible"
      :customer-id="customer.id"
      :customer-name="customer.name"
      :ticket-id="customer.ongoingTickets?.[0]?.id"
      :initiator-name="'张敏'"
      :initiator-role="'agent'"
    />
  </div>
  <a-empty v-else description="客户不存在" />
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { customers } from '@/mock/data'
import RiskTag from '@/components/RiskTag.vue'
import StartWorkflowModal from '@/components/StartWorkflowModal.vue'
import { useWorkbenchStore } from '@/stores/workbench'
import { useTagRuleStore, RiskTag as RiskTagType } from '@/stores/tagRule'
import { useWorkflowStore } from '@/stores/workflow'
import { Message } from '@arco-design/web-vue'

const route = useRoute()
const router = useRouter()
const wb = useWorkbenchStore()
const customer = computed(() => customers.find(c => c.id === route.params.id))

// 通话中快速建工单/发起工作流
const workflowModalVisible = ref(false)
function quickCreateTicket() {
  if (!customer.value) return
  router.push(`/agent/ticket-create?customerId=${customer.value.id}&from=call`)
}
function openStartWorkflow() {
  workflowModalVisible.value = true
}

// 是否处于通话中(由 AgentDesk 接通后跳过来)
const inCall = computed(() => route.query.call === '1' && !!wb.call)

function formatDuration(s: number) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}
const callDuration = ref(0)
let callTimer: any = null
let isMounted = false

onMounted(() => {
  isMounted = true
  // 接通状态下启动计时器,实时刷新通话时长显示
  if (inCall.value) {
    callDuration.value = wb.call ? Math.floor((Date.now() - wb.call.startAt) / 1000) : 0
    callTimer = setInterval(() => {
      // 卸载后定时器仍在跑,加守卫避免访问响应式 state
      if (!isMounted) {
        if (callTimer) { clearInterval(callTimer); callTimer = null }
        return
      }
      if (wb.call) callDuration.value = Math.floor((Date.now() - wb.call.startAt) / 1000)
    }, 1000)
  }
})
onUnmounted(() => {
  isMounted = false
  if (callTimer) {
    clearInterval(callTimer)
    callTimer = null
  }
})

const callDurationText = computed(() => formatDuration(callDuration.value))

function hangup() {
  if (callTimer) { clearInterval(callTimer); callTimer = null }
  wb.hangup()
  wb.activeTask = null
  wb.setIdle()
  Message.success('通话已挂断')
  router.replace('/agent/desk')
}

const activeTab = ref('profile')

const statusMap: Record<string, string> = { normal: '正常', overdue: '逾期', frozen: '冻结' }
function statusColor(s: string) { return s === 'normal' ? 'green' : s === 'overdue' ? 'red' : 'gray' }

const tagLabel: Record<string, string> = {
  blacklist: '黑名单', complaint: '投诉倾向', agent: '异常代理', threat: '扬言倾向', normal: '正常'
}

// 接入 useTagRuleStore:命中规则返回弹窗预警;P2-9 改造
const tagRule = useTagRuleStore()
const wf = useWorkflowStore()

const alertLevel = computed(() => {
  if (!customer.value) return null
  return tagRule.firstAlert(customer.value.riskTags as RiskTagType[])
})

const restrictNotes = computed(() => {
  if (!customer.value) return []
  return tagRule.restrictNotes(customer.value.riskTags as RiskTagType[])
})

const upgradeNotes = computed(() => {
  if (!customer.value) return []
  return tagRule.autoUpgradeNotes(customer.value.riskTags as RiskTagType[])
})

/** 命中"自动升级"规则时一键发起 alert_directive 工作流 */
function triggerAutoUpgrade() {
  if (!customer.value) return
  const inst = wf.start({
    kind: 'alert_directive',
    initiator: '系统(标签规则联动)',
    initiatorRole: 'agent',
    customerId: customer.value.id,
    customerName: customer.value.name,
    payload: {
      instruction: upgradeNotes.value.join(';'),
      assignTo: '张敏',
      alertTitle: `标签联动升级 · ${customer.value.name}`,
      source: 'tag-rule-auto-upgrade'
    }
  })
  if (inst) {
    Message.success(`已自动生成指令实例 ${inst.id}`)
  }
}

// ============ 征信 ============
const creditStatus = ref<'none' | 'no_permission' | 'available'>('available')

const creditReport = computed(() => ({
  generateTime: '2026-07-15 14:32',
  queryOrg: '中国人民银行征信中心',
  validUntil: '2026-08-15',
  creditScore: 678,
  creditLevel: 'BBB',
  queryReason: '贷款审批',
  recentQueries: 4,
  creditCardAccounts: 3,
  loanAccounts: 5,
  overdueAccounts: customer.value?.overdueCount || 0,
  maxOverdueDays: customer.value?.maxOverdueDays || 0,
  queryHistory: [
    { date: '2026-07-15', org: '本机构', reason: '贷款审批', type: '机构查询' },
    { date: '2026-05-22', org: '本机构', reason: '贷后管理', type: '机构查询' },
    { date: '2026-04-10', org: '本人', reason: '本人查询', type: '本人查询' },
    { date: '2026-03-05', org: '某银行', reason: '信用卡审批', type: '机构查询' }
  ],
  disputes: customer.value?.riskTags.includes('blacklist')
    ? [{ content: '基本信息错误', date: '2026-06-15', status: '已处理', result: '已更正' }]
    : []
}))

// ============ 基础信息 ============
const basic = computed(() => ({
  gender: customer.value?.id.startsWith('C00') ? '男' : '女',
  age: 38,
  domicile: '北京市朝阳区',
  idValidUntil: '2032-08-15',
  userStatus: '正常',
  vipLevel: 2,
  riskScore: 65,
  defaultProb: 28,
  valueLevel: 'A',
  commonAddress: '北京市朝阳区建国路 88 号',
  activeTime: '09:00 - 21:00',
  preferredChannel: 'APP推送',
  totalCreditLimit: 200000
}))

// ============ 产品/借据 ============
const productTypeFilter = ref('')
const showDisbursement = ref(false)
const showRepayment = ref(false)

const productList = computed(() => {
  if (!customer.value) return []
  const c = customer.value
  const list: any[] = []
  for (let i = 0; i < c.loanCount; i++) {
    list.push({
      contractNo: `${c.id}-J0${i + 1}`,
      productName: i === 0 ? '信用贷(消费分期)' : i === 1 ? '现金贷' : '信用卡分期',
      productType: i === 0 ? 'loan' : 'credit',
      amount: c.loanBalance / c.loanCount,
      remainingPrincipal: c.loanBalance / c.loanCount,
      remainingPenalty: c.overdueCount > i ? 320 : 0,
      remainingTotal: c.loanBalance / c.loanCount + (c.overdueCount > i ? 320 : 0),
      currentPeriod: i + 3,
      periods: 12,
      overdueDays: c.overdueCount > i ? c.maxOverdueDays : 0,
      contractStatus: c.overdueCount > i ? '逾期' : c.creditStatus === 'frozen' ? '已结清' : '正常'
    })
  }
  return list
})

const filteredProducts = computed(() =>
  productTypeFilter.value ? productList.value.filter(p => p.productType === productTypeFilter.value) : productList.value
)

// ============ 催收记录 ============
const collectionSummary = computed(() => ({
  totalRecords: 12,
  successRate: 75,
  totalPromiseAmount: 45000,
  totalActualPayment: 38000,
  averageCollectionDays: 18,
  difficultyDistribution: { easy: 4, medium: 6, hard: 2 },
  stageDistribution: { M1: 5, M2: 4, M3: 3 }
}))

const collectionRecords = ref([
  { date: '2026-07-15', type: '电话催收', collector: '李伟', result: '承诺还款', promiseAmount: 5000, difficulty: '容易', tags: ['配合度高', '还款意愿强'] },
  { date: '2026-07-12', type: '短信催收', collector: '系统', result: '无应答', promiseAmount: 0, difficulty: '困难', tags: ['联系困难', '逃避还款'] },
  { date: '2026-07-10', type: '电话催收', collector: '李伟', result: '承诺还款', promiseAmount: 3000, difficulty: '中等', tags: ['电话有效'] },
  { date: '2026-07-08', type: '电话催收', collector: '王芳', result: '投诉催收方式', promiseAmount: 0, difficulty: '困难', tags: ['投诉催收时间', '投诉催收态度'] },
  { date: '2026-07-05', type: '上门催收', collector: '李伟', result: '承诺还款', promiseAmount: 10000, difficulty: '中等', tags: ['上门有效'] },
  { date: '2026-07-01', type: '电话催收', collector: '李伟', result: '承诺还款', promiseAmount: 8000, difficulty: '容易', tags: ['配合度高'] }
])

// ============ 营销记录 ============
const marketingFilter = ref('')
const marketingRecords = ref([
  { name: '7月免息分期活动', type: '产品推广', channel: '短信', status: '成功', responseRate: 85, time: '2026-07-10' },
  { name: '新户首单立减', type: '新产品', channel: 'APP推送', status: '成功', responseRate: 72, time: '2026-07-05' },
  { name: 'VIP客户关怀', type: '客户关怀', channel: '电话', status: '进行中', responseRate: 45, time: '2026-07-12' },
  { name: '现金贷额度升级', type: '交叉销售', channel: '短信', status: '成功', responseRate: 68, time: '2026-07-01' },
  { name: '信用卡分期优惠', type: '产品推广', channel: 'APP推送', status: '失败', responseRate: 22, time: '2026-06-28' },
  { name: '免息券发放', type: '客户关怀', channel: '微信', status: '成功', responseRate: 78, time: '2026-06-20' },
  { name: '会员积分兑换', type: '客户关怀', channel: 'APP推送', status: '进行中', responseRate: 35, time: '2026-06-15' },
  { name: '消费分期活动', type: '产品推广', channel: '短信', status: '成功', responseRate: 64, time: '2026-06-10' }
])

const filteredMarketing = computed(() =>
  marketingFilter.value ? marketingRecords.value.filter(m => m.status === marketingFilter.value) : marketingRecords.value
)

function marketingTypeColor(t: string) {
  return t === '产品推广' ? 'blue' : t === '交叉销售' ? 'green' : t === '新产品' ? 'orange' : 'purple'
}

// ============ 历史切片 ============
const historyModel = ref('customer_basic')
const historyDate = ref('')
const historyView = ref('table')
const showHistorySample = ref(false)

const historySample = [
  { time: '2026-07-10', model: '用信记录', change: '修改', field: '在贷余额', before: '¥92,000', after: '¥86,420', operator: '系统自动' },
  { time: '2026-06-25', model: '征信记录', change: '修改', field: '逾期账户数', before: '1', after: '2', operator: '系统自动' },
  { time: '2026-06-12', model: '客户基础', change: '修改', field: '手机号', before: '138****5621', after: '138****5621', operator: '客户变更' },
  { time: '2026-06-01', model: '用信记录', change: '未变', field: '-', before: '-', after: '-', operator: '-' },
  { time: '2026-05-15', model: '催收记录', change: '新增', field: '催收员', before: '-', after: '李伟', operator: '系统' },
  { time: '2026-05-10', model: '营销记录', change: '新增', field: '响应', before: '-', after: '成功', operator: '系统' }
]
</script>

<style scoped>
.cp-section-title { font-size: 14px; font-weight: 600; margin: 0 0 12px; color: var(--cp-text); }

/* ========== 通话中 Banner ========== */
.cp-call-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  background: linear-gradient(90deg, #00b42a 0%, #23c343 100%);
  color: #fff;
  border-radius: 6px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 180, 42, 0.25);
}
.cp-call-banner-left {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  min-width: 0;
}
.cp-call-banner-right { display: flex; gap: 8px; flex-shrink: 0; }
.cp-call-dot {
  width: 10px; height: 10px; border-radius: 50%;
  background: #fff;
  box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.35);
  animation: cp-call-pulse 1.2s infinite;
}
.cp-call-status { font-weight: 600; letter-spacing: 0.5px; }
.cp-call-duration { font-weight: 700; font-size: 14px; }
.cp-call-target { opacity: 0.92; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
@keyframes cp-call-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

/* 产品头部 */
.cp-product-head {
  padding: 12px 20px;
  border-bottom: 1px solid var(--cp-border-light);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 行为特征 */
.cp-behavior-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 8px 0;
}

/* 风险标签 */
.cp-tag-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: var(--cp-bg-soft);
  border-radius: 4px;
}

/* 异议项 */
.cp-dispute {
  padding: 10px 12px;
  background: var(--cp-bg-soft);
  border-radius: 4px;
  margin-bottom: 8px;
}
</style>