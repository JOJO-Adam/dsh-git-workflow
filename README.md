# dsh-git-workflow · JOJO&Adam

装完之后，agent 在开分支、写提交、提 PR、发版本之前会先按你们自己的规矩走，而不是每次现编一套。

## 安装

```bash
# Web 版
dsh plugin --profile web add @jojonadam/dsh-git-workflow
# 桌面版
dsh plugin --profile desktop add @jojonadam/dsh-git-workflow
```

## 装完能做什么

- **定流程**：版本基线、分支模型决策树、协作流程、提交/评审/发布纪律，一次说清
- **统一提交**：Conventional Commits 的 type/scope 约定，含破坏性变更怎么写
- **评 PR**：PR 描述模板、按缺陷密度排序的评审顺序、合并前检查清单
- **改历史**：交互式 rebase、squash 与 fixup 的取舍、cherry-pick 区间，以及"已 push 就别动"的红线
- **救火**：reflog 找回丢失的提交、恢复误删分支、reset 错了怎么办
- **发版本**：按实际行为变化定 semver，打 tag 与发布流程

## 怎么触发

直接用自然语言，例如「这次改动该升 major 还是 minor」「帮我把这三个提交压成一个」「我把分支删了怎么找回」；也可以显式点名技能。

## 边界

- 只覆盖 Git 本身；不替你们选托管平台、不碰 CI 配置的具体实现
- 破坏性操作给的是判断与命令清单，**执行前由你确认**，不会自动跑

## 许可

MIT
