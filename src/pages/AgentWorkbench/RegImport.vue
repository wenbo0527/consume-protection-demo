<template>
  <div class="cp-page">
    <div class="cp-page-header">
      <div>
        <h1 class="cp-page-title">监管转诉自动建单</h1>
        <div class="cp-page-subtitle">上传监管台账 Excel · 自动解析匹配 · 支持 ≤5 万条/次</div>
      </div>
    </div>

    <a-row :gutter="16">
      <a-col :span="14">
        <div class="cp-card" style="padding: 24px">
          <h3 class="cp-section-title">第 1 步:上传 Excel</h3>
          <a-upload
            :auto-upload="false"
            :limit="1"
            accept=".xlsx,.xls"
            list-type="picture-card"
          >
            <template #upload-button>
              <div class="cp-upload-area">
                <icon-upload size="32" />
                <div style="margin-top: 8px; font-size: 13px">点击上传监管台账</div>
                <div style="font-size: 11px; color: var(--cp-text-tertiary)">支持 12378 / 12345 / 信访转办</div>
              </div>
            </template>
          </a-upload>

          <a-divider />

          <h3 class="cp-section-title">第 2 步:匹配进度</h3>
          <a-steps :current="2" direction="vertical" size="small" style="margin-top: 12px">
            <a-step title="Excel 解析完成">
              <template #description>已解析 12,847 条记录</template>
            </a-step>
            <a-step title="身份匹配中">
              <template #description>已匹配 11,562 / 12,847 (90%)</template>
            </a-step>
            <a-step title="匹配完成" description="等待人工确认" />
            <a-step title="批量建单" />
          </a-steps>

          <a-divider />

          <h3 class="cp-section-title">匹配结果预览</h3>
          <a-table :data="preview" :pagination="false" size="small">
            <template #columns>
              <a-table-column title="序号" data-index="idx" :width="60" />
              <a-table-column title="客户姓名" data-index="name" />
              <a-table-column title="身份证" data-index="idCard" />
              <a-table-column title="匹配状态" data-index="match">
                <template #cell="{ record }">
                  <a-tag v-if="record.match === 'success'" color="green" size="small">匹配成功</a-tag>
                  <a-tag v-else-if="record.match === 'fail'" color="red" size="small">客户不存在</a-tag>
                  <a-tag v-else color="gray" size="small">非本司客户</a-tag>
                </template>
              </a-table-column>
              <a-table-column title="操作">
                <template #cell="{ record }">
                  <a-button v-if="record.match !== 'success'" size="small">补录</a-button>
                </template>
              </a-table-column>
            </template>
          </a-table>
        </div>
      </a-col>

      <a-col :span="10">
        <div class="cp-card" style="padding: 20px">
          <h3 class="cp-section-title">匹配统计</h3>
          <div class="cp-stat-row">
            <div class="cp-stat-card">
              <div class="cp-stat-label">总记录</div>
              <div class="cp-stat-value mono">12,847</div>
            </div>
            <div class="cp-stat-card">
              <div class="cp-stat-label">匹配成功</div>
              <div class="cp-stat-value mono" style="color: var(--cp-success)">11,562</div>
              <div class="cp-stat-extra">90%</div>
            </div>
            <div class="cp-stat-card">
              <div class="cp-stat-label">匹配失败</div>
              <div class="cp-stat-value mono" style="color: var(--cp-danger)">893</div>
              <div class="cp-stat-extra">7%</div>
            </div>
            <div class="cp-stat-card">
              <div class="cp-stat-label">非本司客户</div>
              <div class="cp-stat-value mono" style="color: var(--cp-text-tertiary)">392</div>
              <div class="cp-stat-extra">3%</div>
            </div>
          </div>

          <a-divider />
          <h3 class="cp-section-title">补录流程</h3>
          <a-timeline>
            <a-timeline-item label="导出失败清单" dot-color="red">
              <div style="font-size: 13px">下载 893 条失败记录 Excel</div>
              <a-button size="small" type="primary" style="margin-top: 6px">
                <icon-download /> 下载清单
              </a-button>
            </a-timeline-item>
            <a-timeline-item label="补录方式 A: 系统内逐条补录" dot-color="blue">
              <div style="font-size: 13px; color: var(--cp-text-secondary)">在系统中补充客户信息后重新匹配</div>
            </a-timeline-item>
            <a-timeline-item label="补录方式 B: 修改 Excel 后重新上传" dot-color="blue">
              <div style="font-size: 13px; color: var(--cp-text-secondary)">补全信息后上传,自动重新匹配</div>
            </a-timeline-item>
            <a-timeline-item label="非本司客户单独导出" dot-color="gray">
              <div style="font-size: 13px; color: var(--cp-text-secondary)">不创建工单,导出清单供人工核实</div>
            </a-timeline-item>
          </a-timeline>
        </div>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
const preview = [
  { idx: 1, name: '王某某', idCard: '110101********0011', match: 'success' },
  { idx: 2, name: '李某某', idCard: '320106********1102', match: 'fail' },
  { idx: 3, name: '张某某', idCard: '440305********2204', match: 'success' },
  { idx: 4, name: '赵某某', idCard: '510104********3306', match: 'other' },
  { idx: 5, name: '钱某某', idCard: '370102********4408', match: 'success' },
  { idx: 6, name: '孙某某', idCard: '110101********5510', match: 'fail' }
]
</script>

<style scoped>
.cp-section-title { font-size: 14px; font-weight: 600; margin: 0 0 12px; color: var(--cp-text); }
.cp-upload-area {
  width: 100%; height: 100px;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  color: var(--cp-text-tertiary);
}
</style>