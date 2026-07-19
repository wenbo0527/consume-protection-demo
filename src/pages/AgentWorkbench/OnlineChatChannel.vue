<template>
  <div class="cp-page">
    <div class="cp-page-header">
      <div>
        <h1 class="cp-page-title">在线客服</h1>
        <div class="cp-page-subtitle">实时聊天会话 · 多渠道(Web/微信公众号)· 多轮消息</div>
      </div>
      <a-space>
        <a-tag color="arcoblue">活动会话 {{ activeChats.length }}</a-tag>
        <a-button type="primary">
          <icon-plus /> 模拟新会话
        </a-button>
      </a-space>
    </div>

    <a-row :gutter="16">
      <!-- 左:会话列表 -->
      <a-col :span="8">
        <a-card title="会话列表">
          <a-empty v-if="!chats.length" description="无活跃会话" />
          <div
            v-for="c in chats"
            :key="c.id"
            :class="['cp-chat-item', { 'cp-chat-active': c.id === selectedId }]"
            @click="selectedId = c.id"
          >
            <div style="display: flex; justify-content: space-between">
              <b>{{ c.customerName }}</b>
              <a-tag size="small" :color="statusColor(c.status)">{{ statusLabel(c.status) }}</a-tag>
            </div>
            <div style="font-size: 12px; color: var(--cp-text-tertiary); margin-top: 4px">
              {{ c.lastMessage || '(暂无消息)' }}
            </div>
            <div style="display: flex; justify-content: space-between; margin-top: 6px; font-size: 11px; color: var(--cp-text-tertiary)">
              <span>{{ c.channel }}</span>
              <span v-if="c.unread" style="color: var(--cp-warning)">{{ c.unread }} 条未读</span>
              <span>{{ relativeTime(c.lastTime) }}</span>
            </div>
          </div>
        </a-card>
      </a-col>

      <!-- 右:会话内容 -->
      <a-col :span="16">
        <a-card v-if="selectedChat" :title="`与 ${selectedChat.customerName} 沟通中`">
          <template #extra>
            <a-space>
              <a-tag color="arcoblue">{{ selectedChat.channel }}</a-tag>
              <a-button size="mini">转人工</a-button>
              <a-button size="mini" status="danger" @click="onCloseChat">结束会话</a-button>
            </a-space>
          </template>

          <div class="cp-chat-window">
            <div v-for="m in selectedChat.messages" :key="m.id" :class="['cp-msg', `cp-msg-${m.from}`]">
              <div style="display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--cp-text-tertiary); margin-bottom: 2px">
                <span>{{ m.from === 'agent' ? '坐席' : m.from === 'system' ? '系统' : '客户' }}</span>
                <span>{{ m.time }}</span>
              </div>
              <div class="cp-msg-bubble">{{ m.content }}</div>
            </div>
          </div>

          <a-divider />

          <div style="display: flex; gap: 8px">
            <a-input v-model="draft" placeholder="输入回复(模拟)"
              @keydown.enter="onSend" />
            <a-button type="primary" @click="onSend">发送</a-button>
          </div>

          <!-- 快捷回复 -->
          <div style="margin-top: 8px">
            <span style="font-size: 12px; color: var(--cp-text-tertiary)">快捷: </span>
            <a-tag
              v-for="q in QUICK_REPLIES"
              :key="q"
              style="cursor: pointer; margin-right: 4px"
              @click="draft = q"
            >{{ q }}</a-tag>
          </div>
        </a-card>
        <a-empty v-else description="请选择一个会话" />
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { Message } from '@arco-design/web-vue'

interface ChatMessage {
  id: string
  from: 'agent' | 'customer' | 'system'
  content: string
  time: string
}

interface ChatSession {
  id: string
  customerId: string
  customerName: string
  channel: 'Web' | '微信' | '小程序'
  status: 'new' | 'active' | 'closed'
  messages: ChatMessage[]
  unread: number
  lastMessage: string
  lastTime: string
}

const QUICK_REPLIES = ['您好,请问有什么可以帮您?', '请稍等,我为您查询', '感谢您的来电,请问您方便转接吗?']

const chats = reactive<ChatSession[]>([
  {
    id: 'CHAT-20260715-0001',
    customerId: 'C004',
    customerName: '吴芳',
    channel: 'Web',
    status: 'active',
    messages: [
      { id: 'm1', from: 'customer', content: '你好,我想咨询还款方式', time: '2026-07-15 14:30' },
      { id: 'm2', from: 'agent', content: '您好,我是张敏,请告诉我您想分几期?', time: '2026-07-15 14:31' },
      { id: 'm3', from: 'customer', content: '我想分 6 期,可以吗?', time: '2026-07-15 14:32' }
    ],
    unread: 1,
    lastMessage: '我想分 6 期,可以吗?',
    lastTime: '2026-07-15 14:32'
  },
  {
    id: 'CHAT-20260715-0002',
    customerId: 'C002',
    customerName: '孙丽华',
    channel: '微信',
    status: 'active',
    messages: [
      { id: 'm1', from: 'customer', content: '请问征信修复进度?', time: '2026-07-15 15:00' }
    ],
    unread: 0,
    lastMessage: '请问征信修复进度?',
    lastTime: '2026-07-15 15:00'
  }
])

const selectedId = ref<string>('CHAT-20260715-0001')
const draft = ref('')

const selectedChat = computed(() => chats.find(c => c.id === selectedId.value) || null)
const activeChats = computed(() => chats.filter(c => c.status !== 'closed'))

function onSend() {
  if (!draft.value.trim() || !selectedChat.value) return
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const time = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`
  selectedChat.value.messages.push({
    id: `m${Date.now()}`,
    from: 'agent',
    content: draft.value,
    time
  })
  selectedChat.value.lastMessage = draft.value
  selectedChat.value.lastTime = time
  draft.value = ''
  // 模拟客户回复
  setTimeout(() => {
    const replies = ['好的,谢谢!', '收到', '请继续', '嗯嗯']
    const reply = replies[Math.floor(Math.random() * replies.length)]
    selectedChat.value?.messages.push({
      id: `m${Date.now()}`,
      from: 'customer',
      content: reply,
      time: `${time.slice(0, 11)}${pad(new Date().getHours())}:${pad(new Date().getMinutes())}`
    })
  }, 1200)
}

function onCloseChat() {
  if (!selectedChat.value) return
  selectedChat.value.status = 'closed'
  Message.success('会话已关闭')
}

function statusColor(s: string) {
  return ({ new: 'red', active: 'arcoblue', closed: 'gray' })[s] || 'gray'
}
function statusLabel(s: string) {
  return ({ new: '新', active: '进行中', closed: '已关闭' })[s] || s
}
function relativeTime(at: string) {
  const diff = Date.now() - new Date(at).getTime()
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
  return at.slice(5, 10)
}
</script>

<style scoped>
.cp-chat-item {
  padding: 10px 12px;
  border-radius: 6px;
  cursor: pointer;
  margin-bottom: 8px;
  border: 1px solid var(--cp-border-light);
  transition: all 0.2s;
}
.cp-chat-item:hover {
  background: var(--cp-bg-soft);
}
.cp-chat-active {
  border-color: var(--cp-brand);
  background: rgba(20, 148, 232, 0.06);
}
.cp-chat-window {
  max-height: 400px;
  min-height: 320px;
  overflow-y: auto;
  padding: 8px;
  background: var(--cp-bg-soft);
  border-radius: 6px;
}
.cp-msg {
  margin-bottom: 12px;
}
.cp-msg-customer {
  text-align: left;
}
.cp-msg-agent {
  text-align: right;
}
.cp-msg-system {
  text-align: center;
}
.cp-msg-bubble {
  display: inline-block;
  max-width: 70%;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.5;
  word-break: break-word;
}
.cp-msg-customer .cp-msg-bubble {
  background: #fff;
  border: 1px solid var(--cp-border-light);
  text-align: left;
}
.cp-msg-agent .cp-msg-bubble {
  background: var(--cp-brand);
  color: #fff;
}
.cp-msg-system .cp-msg-bubble {
  background: transparent;
  color: var(--cp-text-tertiary);
  font-size: 12px;
}
</style>
