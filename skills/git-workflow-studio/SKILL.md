---
name: git-workflow-studio
description: "Git 工作流工作室入口：定分支模型、统一提交规范、评审 PR、改写历史、救援误操作、发版本时，先从这里分流到六本手册。"
whenToUse: "定分支模型、写提交信息、评审 PR、改写历史、找回丢失的提交、发版本打 tag 时"
license: MIT
---

# Git 工作流工作室

这个包给的是**一套能落地的 Git 纪律**：分支怎么开、提交怎么写、PR 怎么评、历史什么时候能动、版本怎么发，都用同一套判据。

## 先分流

| 你现在要做的事 | 去看 |
|---|---|
| 定分支模型与团队协作流程 | `git-workflow-sop` |
| 统一提交信息、配 commitlint | `git-commit-convention` |
| 写 PR 描述、评审、定合并前检查项 | `git-pr-review` |
| rebase / squash / cherry-pick / 拆分提交 | `git-history-surgery` |
| 提交丢了、分支删了、reset 错了 | `git-disaster-recovery` |
| 发版本、定 semver、打 tag | `git-release-versioning` |

## 用之前先确认

- **已经 push 到共享分支的历史，默认不动**；要动先确认影响面（`git-history-surgery` 有红线）。
- 救援类操作（`git-disaster-recovery`）**先备份当前状态再动手**，不要边救边改。

## 不做什么

- 不替你们选 Git 托管平台；只覆盖 Git 本身的流程与命令纪律。
- 不执行破坏性命令；产出是判断、命令清单与检查项，落手由你确认。
