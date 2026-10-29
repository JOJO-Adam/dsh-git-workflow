---
name: git-commit-convention
description: "Conventional Commits adoption playbook: type taxonomy, scope conventions, breaking-change signaling, commitlint plus husky wiring, and the honest trade-offs of enforcing conventions on small versus large teams."
version: "1.0.0"
display_name: "提交规范落地"
display_name_en: "Commit Convention Playbook"
description_zh: "Conventional Commits 落地手册：type 分类、scope 约定、破坏性变更标记、commitlint 与 husky 接线，以及小团队与大团队强制规范的诚实取舍。"
description_en: "Conventional Commits adoption playbook: type taxonomy, scope conventions, breaking-change signaling, commitlint and husky wiring, plus honest trade-offs."
whenToUse: "写提交信息、统一 commit 规范、配 commitlint、写 CHANGELOG 时"
---

# 提交规范落地手册

## 1 · 先明确收益，否则不值得

规范化提交能换来三件事，只有这三件：
1. **自动生成 changelog**（不需要人回忆）
2. **语义化推导版本号**（feat→minor，fix→patch，`!`→major）
3. **可 grep 的变更史**（改过哪些行为、何时引入）

换不来的：代码质量、评审质量、架构好坏。**别把规范当治理万能药。**

## 2 · type 分类（够用就好）

`feat` 新功能 · `fix` 修缺陷 · `docs` 文档 · `style` 格式 · `refactor` 重构 · `perf` 性能 · `test` 测试 · `build` 构建/依赖 · `ci` CI · `chore` 杂项 · `revert` 回滚

判不准时的三个分辨：
- 加了能力但同时修了 bug → 拆成两个提交，别用 `feat` 一次性糊过去
- 改了行为但对外接口没变 → 看「使用者能否感知」，能 → `fix` 或 `feat`，不能 → `refactor`
- 纯改文件名/移动目录 → `refactor`，但若影响 import 路径则属破坏性 → 加 `!`

## 3 · scope 约定

scope 用**模块/目录名**，不用人名或「misc」。团队超过 3 个模块就该定义 scope 白名单，否则会退化成一堆自造词。

## 4 · 破坏性变更

两种写法等价，**推荐用 `!` 更醒目**：
```
feat(api)!: 移除 deprecated 的 /v1/search 接口
```
```
feat(api): 移除 deprecated 的 /v1/search 接口

BREAKING CHANGE: /v1/search 已删除，请迁移到 /v2/search
```

## 5 · 接线（可直接粘贴）

`.commitlintrc.json`：
```json
{
  "extends": ["@commitlint/config-conventional"],
  "rules": {
    "scope-enum": [1, "always", ["api", "ui", "core", "docs", "deps"]],
    "subject-max-length": [2, "always", 72]
  }
}
```
`scope-enum` 用 `1`（警告）而非 `2`（报错）—— 一开始就报错会让人绕过钩子。

husky 钩子（`.husky/commit-msg`）：
```sh
#!/bin/sh
npx --no -- commitlint --edit "$1"
```

## 6 · 存量历史怎么办

**不要为规范化重写全部历史。** 正确做法：
- 在某次提交（或某个 tag）之后生效，写进 `CONTRIBUTING.md`：`自 v1.2.0 起提交信息遵循 Conventional Commits`
- 旧历史原样保留
- 真要清洗 → 交历史整理角色，且必须先备份

## 7 · 诚实取舍

| 团队 | 建议 | 理由 |
|---|---|---|
| 1 人项目 | 不强制 type，但必须写清改了什么行为 | 规范成本 > 收益；但信息必须留存 |
| 2-5 人 | 强制 type，scope 宽松 | changelog 与版本号自动化开始有收益 |
| 5+ 人 / 开源 | 强制 type + scope + BREAKING 标记 | 变更记录是协作刚需 |

**别做的事**：
- 不要一上来就 `2`（error）级别拦截所有人 —— 会逼出集体 `--no-verify`
- 不要为了「提交好看」而把多个意图合并成一个巨大提交
- 不要用提交规范去考核人

## 8 · 紧急情况正确姿势

```bash
git commit --no-verify -m "hotfix: 线上支付回调 500"
```
用了就要在 PR 里**说明为什么跳过**。偷偷用 `--no-verify` 是团队信任问题，不是技术问题。
