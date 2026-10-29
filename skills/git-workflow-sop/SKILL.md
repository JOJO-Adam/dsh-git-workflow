---
name: git-workflow-sop
description: "Git workflow standard operating procedure: version baseline, branch model decision tree, collaboration flow, commit/review/release discipline, and the irreversible-operation red lines. The single source of truth for this studio's engineering judgment."
version: "1.0.0"
display_name: "Git 工作流 SOP"
display_name_en: "Git Workflow SOP"
description_zh: "Git 工作流标准作业流程：版本基线、分支模型决策树、协作流程、提交/评审/发布纪律，以及不可逆操作红线。本套技能的工程判断唯一真相源。"
description_en: "Git workflow SOP: version baseline, branch model decision tree, collaboration flow, commit/review/release discipline, and irreversible-operation red lines."
whenToUse: "定分支模型、团队协作流程、提交/评审/发布纪律、判断某个 git 操作该不该做时"
---

# Git 工作流 SOP

本文件是本套技能的**工程判断唯一真相源**。所有专业结论以此为准；与本文件冲突的，以本文件 + 官方文档为准。

## 1 · 版本基线

- **最低要求 git 2.20+**（`--force-with-lease`、`git switch`/`git restore` 需要）。核验命令：`git --version`
- `--force-with-lease` 需要 git 1.8.5+；`git maintenance` 需要 2.30+；`git switch` 需要 2.23+
- 涉及子模块/大文件时另需 `git-lfs`（**非必需**，按需）
- 托管平台不限：GitHub / GitLab / Gitee 均可，命令侧基本一致，差异集中在 PR/MR 术语与保护分支策略

> ⚠️ 具体版本特性是否可用，**必须用 `git --version` 实测判断**，不要凭记忆断言某版本支持某参数。

## 2 · 分支模型决策树

```
团队人数 ≤3 且发布频繁?
├─ 是 → Trunk-Based（需有自动化测试兜底）
│        └─ 无测试? → 先补最小冒烟测试，再上主干开发
└─ 否 → 是否需要同时维护多个线上版本?
         ├─ 是 → GitHub Flow + release/x.y 长期分支
         └─ 否 → 版本制发布(客户端/嵌入式)?
                  ├─ 是 → Git Flow（接受其复杂度）
                  └─ 否 → GitHub Flow
```

**反模式清单**（见到就要指出来）：

| 反模式 | 后果 |
|---|---|
| 3 人团队用 Git Flow | 分支比人多，合并路径长到没人维护 |
| 无 CI 却上 trunk-based | 主干长期红着，等于没有主干 |
| 长期不合并的 feature 分支 | 合并时冲突量爆炸 |
| 在 `main` 上直接开发并 push | 无评审、无回退点 |
| 一个分支干三件不相关的事 | 无法单独回滚任何一件 |

## 3 · 协作流程（默认 GitHub Flow 变体）

1. 从 `main` 切短命分支：`feat/<简述>`、`fix/<简述>`
2. 小步提交（一次提交一个可解释的意图）
3. 推送到远端同名分支
4. 开 PR，按 `git-pr-review` 的模板填写
5. 评审：至少一个 `[blocking]` 清零
6. 合并前同步 `main`（rebase 个人分支 / merge 共享分支——判据见 `git-history-surgery`）
7. Squash 或保留历史？**看团队**：要单功能可回滚 → 保留有意义提交；要线性清晰 → squash。**不要在项目中途反复改策略。**

## 4 · 🔴 不可逆操作红线（一票否决）

以下操作**必须先建备份**（`git branch backup/...` + 复制 `.git`）：

- `git reset --hard`
- `git push --force` / `--force-with-lease`
- `git rebase -i`（尤其涉及已推送历史）
- `git filter-branch` / `git filter-repo`
- `git clean -fdx`
- `git branch -D`

**且**：已推送 + 已共享的分支，**永远不 rebase**。要撤销已推送提交，用 `git revert`。

## 5 · 提交纪律

- 一次提交一个意图；「修 bug + 改格式 + 升级依赖」拆三次
- 提交信息说清「改了什么行为」，不是「改了哪些文件」
- 格式规范见 `git-commit-convention`

## 6 · 评审纪律

- 单 PR 建议 ≤ 400 行有效 diff；超出要求拆分
- 机械改动（格式化/重命名）单独成 PR，不与逻辑改动混
- 详见 `git-pr-review`

## 7 · 发布纪律

- 版本号按对外行为变化定级（见 `git-release-versioning`）
- 已发布 tag 永不移动
- 未实际验证的状态不打发布 tag

## 8 · 凭据卫生（强制）

- **remote URL 不得含凭据**：`https://user:token@host/repo.git` → `https://host/repo.git`，token 走凭据管理器或 SSH
- 交付物（脚本/配置/示例）落盘前扫描 `ghp_` / `github_pat_` / `glpat-` / `sk-` / `Bearer ` 模式
- 提交前可加 `pre-commit` 钩子做密钥扫描
- 一旦凭据已推送 → **先轮换，再洗历史**，顺序不可反

## 9 · 故障速查

| 现象 | 先查什么 |
|---|---|
| push 报 502 / 连接重置 | 可能是 DNS 污染，不是网络断。见 `git-disaster-recovery` |
| 合并冲突多到解不完 | 分支活太久；先看分支策略是否合适 |
| 提交丢失 / 分支误删 | 别动，先 `cp -R .git` 备份，再 `git reflog` |
| 「改了但没生效」 | `git status` 确认是否真的提交/推送；`git log origin/<branch>` 对比远端 |
| CI 绿但线上坏 | 检查是否只跑了单测没跑集成；检查部署的分支/环境是否对 |

## 10 · 数字纪律

任何涉及性能（clone 耗时、仓库体积、CI 时长）的数字，**实测才写**，否则标「待实测」并给验证方法。不编造行业基准数据。
