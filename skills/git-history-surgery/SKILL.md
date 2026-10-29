---
name: git-history-surgery
description: "History rewriting playbook: interactive rebase, squash versus fixup, cherry-pick ranges, revert versus reset, conflict resolution discipline, and the rule that shared pushed branches are never rebased."
version: "1.0.0"
display_name: "历史整理与冲突"
display_name_en: "History Surgery Playbook"
description_zh: "历史改写手册：交互式 rebase、squash 与 fixup 的区别、cherry-pick 区间、revert 与 reset 的取舍、冲突解决纪律，以及「已共享分支永不 rebase」铁律。"
description_en: "History rewriting playbook: interactive rebase, squash vs fixup, cherry-pick ranges, revert vs reset, conflict discipline."
whenToUse: "要改写历史、rebase/squash/cherry-pick、拆分或合并提交时"
---

# 历史整理与冲突解决

## 0 · 动手前的固定四步（无例外）

```bash
git status                                      # 必须干净
cp -R .git /tmp/git-backup-$(date +%s)          # 全量备份 .git
git branch backup/<分支>-$(date +%Y%m%d-%H%M)    # 分支快照
git log --oneline --graph -20                    # 留档现场
```
**工作区不干净时禁止开始 rebase** —— 冲突叠加未提交改动是最常见的事故链。

## 1 · 铁律：已推送 + 已共享 → 永不 rebase

rebase 会重写提交哈希。对已被他人拉取的分支做 rebase，等于给所有协作者制造冲突。

| 场景 | 手段 |
|---|---|
| 个人分支、未推送、整理提交 | `git rebase -i` ✅ |
| 已推送但只有你在用（且已通知） | `--force-with-lease` 可接受 ⚠️ |
| 已共享（有人基于它工作） | **只能用 `merge`** ❌ 禁止 rebase |
| 撤销已推送的某个提交 | `git revert` ✅（不重写历史） |

## 2 · squash vs fixup

```bash
git rebase -i HEAD~5
```

🔴 **实机踩坑（2026-10-18 验证）**：**列表里第一条必须是 `pick`，不能改成 `squash`。**

因为 `squash` 的语义是「合并到**上一条**」——第一条上面没有提交可合并。若把第一条改成 `squash`，rebase 会立刻中断并提示：

```
You can fix this with 'git rebase --edit-todo' and then run 'git rebase --continue'.
Or you can abort the rebase with 'git rebase --abort'.
```

处置：`git rebase --abort` 退回，然后**保留第一条为 `pick`**，从第二条起再标 `squash`。中断本身不会丢东西（原分支指针还在），但会让新手慌。

- `squash`：保留被合并提交的 message 供你编辑 → 用于「给团队看的提交」
- `fixup`：丢弃被合并提交的 message → 用于「清理自己的草稿提交」

判据：**这条提交信息未来会有人读吗？** 会 → squash；不会 → fixup。

> 💡 自动化环境提示：`GIT_SEQUENCE_EDITOR` 里调用 BSD `sed -i '' '...'` 会因空字符串参数被吞而失败（macOS 特有）。改用 Python 脚本处理 todo 文件更稳。

## 3 · cherry-pick

```bash
git cherry-pick <sha>                 # 单个
git cherry-pick <sha1>^..<sha2>       # 区间（含两端）
git cherry-pick -x <sha>              # 在 message 里记录来源 sha，推荐
```
`-x` 很重要 —— 它让未来的人知道这个提交是从别处搬来的，避免重复修复。

冲突时：解决 → `git add` → `git cherry-pick --continue`；想放弃 → `git cherry-pick --abort`。

## 4 · revert 优于 reset（针对已推送历史）

```bash
git revert <sha>              # 生成一个反向提交
git revert -m 1 <merge-sha>   # 回滚一个 merge（-m 1 指保留第一父提交主线）
```
`reset` 只改本地指针，对已推送历史用 reset = 制造分叉 = 需要 force push = 伤害协作者。

## 5 · 冲突解决纪律

1. **先看懂双方意图再动手**：`git log --left-right --merge` 或分别看两个分支的提交
2. 禁止无脑 `--ours` / `--theirs` —— 那是删掉别人的工作
3. 解决后**必须实际验证**（跑测试/构建）：能编译 ≠ 语义正确
4. 残留标记检查：
```bash
grep -rn "<<<<<<<\|>>>>>>>\|=======" --include="*" . | grep -v node_modules
```
必须为空。

## 6 · 中止方式（每次操作前都要告诉用户）

| 卡在 | 中止 |
|---|---|
| rebase 冲突 | `git rebase --abort` |
| cherry-pick 冲突 | `git cherry-pick --abort` |
| merge 冲突 | `git merge --abort` |
| reset 之后想回 | `git reflog` 找回 |

## 7 · 强制推送的正确方式

```bash
git push --force-with-lease          # ✅ 远端有你没拉到的提交时会拒绝
git push --force                     # ❌ 无条件覆盖，可能毁掉别人的提交
```
`--force-with-lease` 是唯一的可接受选项。且推送前必须在团队里说一声。

## 8 · 验证清单（操作完成后）

```bash
git log --oneline --graph -20     # 结构是否符合预期
git status                        # 工作区是否干净
git diff backup/<分支> HEAD --stat  # 与备份对比，确认改动范围符合预期
```
三条都对，才算完成。
