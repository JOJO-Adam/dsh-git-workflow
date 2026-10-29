---
name: git-release-versioning
description: "Release engineering playbook: semantic versioning decisions from actual behavioral change, changelog generation from commit history, annotated tag discipline, pre-release checklists, and the rule that published tags never move."
version: "1.0.0"
display_name: "发布与版本号"
display_name_en: "Release & Versioning Playbook"
description_zh: "发布工程手册：按真实行为变化判断语义化版本、从提交历史生成 changelog、附注 tag 规范、发布前检查清单，以及「已发布 tag 永不移动」铁律。"
description_en: "Release engineering playbook: semver from real behavioral change, changelog from commit history, annotated tag discipline, pre-release checklist."
whenToUse: "发版本、定 semver、打 tag、判断这次改动该升 major 还是 minor 时"
---

# 发布与版本号

## 1 · 语义化版本：唯一依据是「对外行为是否变」

| 变更 | 版本位 | 判断要点 |
|---|---|---|
| 不兼容的对外变更 | **major** | 接口参数/返回结构变了、删了公开方法、配置项语义变了 |
| 向后兼容的新能力 | **minor** | 新增可选参数、新增接口、新增能力 |
| 向后兼容的缺陷修复 | **patch** | 修了计算错误、修了崩溃、修了越界 |

**最容易判错的三类**：

1. **「重构」不等于无变更**
   只要任何对外可观察行为改变（含错误信息格式、字段顺序、默认值），就按实际影响定级，不因为是重构就跳过版本判断。

2. **性能变化也是用户可感知的**
   显著变快或变慢，都可能影响使用方决策。性能特征变化按 minor 记，并在 changelog 写明。

3. **依赖升级不是天然 patch**
   若依赖升级引入了行为差异（默认值、边界处理、弃用警告），按实际影响定级。

> 版本号是**给使用者的承诺**，不是给开发者的流水账。判错的代价是别人升级后炸掉。

## 2 · 已发布 tag 永不移动

发错了就发下一个补丁版本（`1.2.3` 错了 → 发 `1.2.4`），**绝不移动 tag**。
移动 tag 会让已拉取旧版本的人状态不一致，且无法判断「我到底拿到的是哪版」。

## 3 · Changelog 从历史生成

```bash
# 上一个 tag 到现在的提交
git log $(git describe --tags --abbrev=0)..HEAD --oneline

# 只看 feat/fix（需提交规范已落地）
git log $(git describe --tags --abbrev=0)..HEAD --oneline --grep="^feat" --grep="^fix"
```

写入原则 —— **只写使用者关心的**：
- ✅ 「修复：批量导入时空行导致整批失败」
- ✅ 「新增：导出支持 CSV」
- ❌ 「修复了 bug」「优化代码」「更新文件」

内部重构 / 测试 / CI 可合并为一行「内部改进」。

## 4 · 附注 tag（必须用 annotated）

```bash
git tag -a v1.2.3 -m "v1.2.3: 修复批量导入空行问题"
git push origin v1.2.3        # 单独推 tag
```
轻量 tag 无作者、无日期、无说明，追溯时等于没有信息。

查看现有 tag 类型：
```bash
git for-each-ref refs/tags --format='%(refname:short) %(objecttype)'
```
`tag` = 附注 tag；`commit` = 轻量 tag。

## 5 · 发布前检查清单

- [ ] 该状态**实际跑过验证**（测试/构建/冒烟），不是「看起来没问题」
- [ ] 工作区干净，`HEAD` 与要打 tag 的提交一致
- [ ] CHANGELOG 与提交内容对得上
- [ ] 版本号与变更性质匹配
- [ ] 上一版 tag 处于可用状态（有回滚目标）
- [ ] 含安全修复 → 评估是否需通知使用者

## 6 · 预发布

未完成验证但需要交付时，用预发布标识，**不要直接发正式版**：
```
v1.3.0-rc.1     候选
v1.3.0-beta.2   测试
v1.3.0-alpha.1  早期
```
语义：`-rc.1 < -rc.2 < v1.3.0`。正式版发布后，预发布版本即为历史，不再更新。

## 7 · 发布记录（最小可用）

一次发布至少留三样：**tag 号 + 对应提交 sha + 变更摘要**。没有这三样，三个月后没人说得清线上跑的是什么。

```bash
git log -1 --format='%H %ci %s' v1.2.3
```
