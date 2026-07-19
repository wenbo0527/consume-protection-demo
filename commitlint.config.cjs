// commitlint 配置
// Conventional Commits 标准 + 中文支持
// 提交格式: <type>(<scope>): <subject>
// 例: feat(quality): 添加"质检与整改联动"

module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // 新功能
        'fix',      // bug 修复
        'refactor', // 重构(无新功能/修复)
        'docs',     // 文档
        'chore',    // 杂项(配置文件等)
        'style',    // 代码风格(不改变逻辑)
        'test',     // 测试
        'perf',     // 性能优化
        'revert',   // 回退
        'build',    // 构建
        'ci',       // CI 改动
        'arch'      // 架构层改动
      ]
    ],
    'subject-max-length': [2, 'always', 72],
    'body-max-line-length': [2, 'always', 100],
    'header-max-length': [2, 'always', 100],
    // 中文支持
    'type-case': [2, 'always', 'lower-case'],
    'type-empty': [2, 'never'],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'scope-case': [2, 'always', 'lower-case']
  },
  prompt: {
    messages: {
      type: '选择提交类型:',
      scope: '作用范围(可选):',
      subject: '提交说明:',
      body: '详细说明(可选):'
    },
    types: [
      { value: 'feat',     name: 'feat      : 新功能',  emoji: '✨' },
      { value: 'fix',      name: 'fix       : Bug 修复', emoji: '🐛' },
      { value: 'refactor', name: 'refactor  : 重构',    emoji: '♻️' },
      { value: 'docs',     name: 'docs      : 文档',    emoji: '📝' },
      { value: 'chore',    name: 'chore     : 杂项',    emoji: '🔧' },
      { value: 'style',    name: 'style     : 样式',    emoji: '💄' },
      { value: 'test',     name: 'test      : 测试',    emoji: '✅' },
      { value: 'perf',     name: 'perf      : 性能',    emoji: '⚡' },
      { value: 'build',    name: 'build     : 构建',    emoji: '🏗️' },
      { value: 'ci',       name: 'ci        : CI',      emoji: '👷' },
      { value: 'arch',     name: 'arch      : 架构',    emoji: '🏛️' }
    ]
  }
}
