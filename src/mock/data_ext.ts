// 规则配置相关数据,独立文件避免 data.ts 过于臃肿

export const dispatchRules: {
  id: number; priority: number; channel: string; type: string; urgency: string;
  assign: string; enabled: boolean
}[] = [
  { id: 1, priority: 1, channel: '12378', type: '投诉', urgency: '全部', assign: '监管件专员·王芳', enabled: true },
  { id: 2, priority: 2, channel: '12345', type: '投诉', urgency: '全部', assign: '监管件专员·王芳', enabled: true },
  { id: 3, priority: 3, channel: '电话', type: '投诉', urgency: '特急', assign: '高级坐席·张敏', enabled: true },
  { id: 4, priority: 4, channel: '电话', type: '投诉', urgency: '紧急', assign: '客服一组', enabled: true },
  { id: 5, priority: 5, channel: '电话', type: '投诉', urgency: '普通', assign: '客服二组', enabled: true },
  { id: 6, priority: 6, channel: '在线客服', type: '咨询', urgency: '全部', assign: '在线客服组', enabled: true },
  { id: 7, priority: 7, channel: '电话', type: '外部转办', urgency: '全部', assign: '客服一组', enabled: true },
  { id: 8, priority: 8, channel: 'APP', type: '信息开具', urgency: '全部', assign: '客服三组', enabled: false },
  { id: 9, priority: 9, channel: '电话', type: '咨询', urgency: '普通', assign: '客服二组', enabled: true },
  { id: 10, priority: 10, channel: '电话', type: '调解', urgency: '全部', assign: '业务执行·李伟', enabled: true }
]

export const alertRules: {
  id: number; name: string; type: string; typeLabel: string;
  condition: string; notify: string; enabled: boolean
}[] = [
  { id: 1, name: '日投诉量异常', type: 'complaint_volume', typeLabel: '投诉量', condition: '> 120 件/日', notify: '系统消息 + 邮件', enabled: true },
  { id: 2, name: '监管件超时预警', type: 'regulator', typeLabel: '监管件', condition: '处理时限到期前 1 天', notify: '系统消息', enabled: true },
  { id: 3, name: '催收频次超限', type: 'collection', typeLabel: '催收', condition: '客户月度触达 > 20 次', notify: '系统消息 + 邮件', enabled: true },
  { id: 4, name: '重复投诉预警', type: 'complaint_volume', typeLabel: '投诉量', condition: '同一客户 7 天内投诉 ≥3 次', notify: '系统消息', enabled: false }
]

export const listRules: {
  name: string; condition: string; action: string; enabled: boolean
}[] = [
  { name: '黑名单自动限制呼入/呼出', condition: '客户身份证号命中黑名单', action: '限制呼入/呼出 + 醒目红色提示', enabled: true },
  { name: '投诉信息库来电提示', condition: '客户命中投诉信息库', action: '黄色提示 + 进入投诉信息库', enabled: true },
  { name: '异常代理库预警', condition: '声纹识别异常或核身未通过', action: '橙色提示 + 开启录音', enabled: true },
  { name: '扬言标签紧急处理', condition: '客户命中扬言标签', action: '红色紧急提示 + 转特殊处理流程', enabled: true }
]