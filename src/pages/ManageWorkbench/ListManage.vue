<template>
  <div class="cp-page">
    <div class="cp-page-header">
      <div>
        <h1 class="cp-page-title">名单管理</h1>
        <div class="cp-page-subtitle">黑名单 / 投诉信息库 / 异常代理库 · 含有效期管理</div>
      </div>
      <a-space>
        <a-button><icon-upload /> 批量导入</a-button>
        <a-button type="primary"><icon-plus /> 新增名单</a-button>
      </a-space>
    </div>

    <a-tabs default-active-key="blacklist">
      <a-tab-pane key="blacklist" title="黑名单">
        <div class="cp-card" style="padding: 0">
          <a-table :data="filterList('blacklist')" :pagination="{ pageSize: 8 }">
            <template #columns>
              <a-table-column title="姓名" data-index="name" />
              <a-table-column title="身份证" data-index="idCardMask" />
              <a-table-column title="手机号" data-index="phone" />
              <a-table-column title="原因" data-index="reason" />
              <a-table-column title="来源" data-index="source" />
              <a-table-column title="生效时间" data-index="effectiveAt" />
              <a-table-column title="到期时间">
                <template #cell="{ record }">
                  <span v-if="record.isPermanent" style="color: var(--cp-text-tertiary)">永久</span>
                  <span v-else :class="{ 'cp-pulse': record.status === 'expiring' }" :style="{ color: record.status === 'expiring' ? 'var(--cp-warning)' : 'inherit' }">
                    {{ record.expireAt }}
                  </span>
                </template>
              </a-table-column>
              <a-table-column title="状态">
                <template #cell="{ record }">
                  <a-tag v-if="record.status === 'active'" color="green">生效中</a-tag>
                  <a-tag v-else-if="record.status === 'expiring'" color="orange">即将到期</a-tag>
                  <a-tag v-else color="gray">已失效</a-tag>
                </template>
              </a-table-column>
              <a-table-column title="操作">
                <template #cell>
                  <a-space :size="4">
                    <a-button size="small">续期</a-button>
                    <a-button size="small" status="danger">删除(需审批)</a-button>
                  </a-space>
                </template>
              </a-table-column>
            </template>
          </a-table>
        </div>
      </a-tab-pane>
      <a-tab-pane key="complaintDB" title="投诉信息库">
        <a-table :data="filterList('complaintDB')" :pagination="{ pageSize: 8 }">
          <template #columns>
            <a-table-column title="姓名" data-index="name" />
            <a-table-column title="身份证" data-index="idCardMask" />
            <a-table-column title="原因" data-index="reason" />
            <a-table-column title="到期时间" data-index="expireAt" />
            <a-table-column title="状态">
              <template #cell="{ record }">
                <a-tag v-if="record.status === 'active'" color="green">生效</a-tag>
                <a-tag v-else-if="record.status === 'expiring'" color="orange">即将到期</a-tag>
                <a-tag v-else color="gray">已失效</a-tag>
              </template>
            </a-table-column>
          </template>
        </a-table>
      </a-tab-pane>
      <a-tab-pane key="abnormalAgent" title="异常代理库">
        <a-table :data="filterList('abnormalAgent')" :pagination="{ pageSize: 8 }">
          <template #columns>
            <a-table-column title="姓名" data-index="name" />
            <a-table-column title="身份证" data-index="idCardMask" />
            <a-table-column title="原因" data-index="reason" />
            <a-table-column title="到期时间" data-index="expireAt" />
            <a-table-column title="状态">
              <template #cell="{ record }">
                <a-tag v-if="record.status === 'active'" color="green">生效</a-tag>
                <a-tag v-else-if="record.status === 'expiring'" color="orange">即将到期</a-tag>
                <a-tag v-else color="red">已失效</a-tag>
              </template>
            </a-table-column>
          </template>
        </a-table>
      </a-tab-pane>
    </a-tabs>
  </div>
</template>

<script setup lang="ts">
import { blackList } from '@/mock/data'

function filterList(type: string) {
  return blackList.filter(b => b.type === type)
}
</script>