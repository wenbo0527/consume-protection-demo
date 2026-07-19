<template>
  <div class="cp-page">
    <div class="cp-page-header">
      <div>
        <h1 class="cp-page-title">审查标准维护</h1>
        <div class="cp-page-subtitle">审查执行时强制关联标准清单,逐项确认后方可提交</div>
      </div>
      <a-button type="primary"><icon-plus /> 新增审查标准</a-button>
    </div>

    <a-tabs default-active-key="product">
      <a-tab-pane key="product" title="产品审查标准">
        <div class="cp-card" style="padding: 0">
          <a-table :data="product" :pagination="false">
            <template #columns>
              <a-table-column title="审查项" data-index="item" />
              <a-table-column title="审查依据" data-index="basis" />
              <a-table-column title="通过/不通过" data-index="result">
                <template #cell>
                  <a-space>
                    <a-tag color="green">通过</a-tag>
                    <a-tag color="red">不通过</a-tag>
                  </a-space>
                </template>
              </a-table-column>
              <a-table-column title="状态">
                <template #cell><a-tag color="green">生效</a-tag></template>
              </a-table-column>
              <a-table-column title="操作">
                <template #cell>
                  <a-space>
                    <a-button size="small">编辑</a-button>
                    <a-button size="small" status="danger">下架</a-button>
                  </a-space>
                </template>
              </a-table-column>
            </template>
          </a-table>
        </div>
      </a-tab-pane>
      <a-tab-pane key="marketing" title="营销审查标准">
        <a-empty description="暂无营销审查标准" />
      </a-tab-pane>
      <a-tab-pane key="change" title="变更审查标准">
        <a-empty description="暂无变更审查标准" />
      </a-tab-pane>
    </a-tabs>
  </div>
</template>

<script setup lang="ts">
const product = [
  { item: '利率合规性', basis: '《商业银行互联网贷款管理办法》第18条' },
  { item: '客户适当性', basis: '《关于加强金融消费者权益保护的指导意见》' },
  { item: '信息披露完整性', basis: '《商业银行理财业务监督管理办法》' },
  { item: '数据安全合规', basis: '《个人信息保护法》第6条' },
  { item: '投诉应急预案', basis: '《银行业保险业消费投诉处理管理办法》' }
]
</script>