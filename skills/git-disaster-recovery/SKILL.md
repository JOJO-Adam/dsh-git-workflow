---
name: git-disaster-recovery
description: "Repository recovery playbook: reflog-based rescue of lost commits and deleted branches, recovery from force-push overwrites, handling of leaked credentials in history, and diagnosis of push failures that are actually DNS pollution rather than network outages."
version: "1.0.0"
display_name: "仓库救援"
display_name_en: "Repository Recovery Playbook"
description_zh: "仓库救援手册：用 reflog 找回丢失提交与误删分支、force push 覆盖后的恢复、历史中凭据泄露的处置顺序，以及「502 可能是 DNS 污染而非网络断」的诊断路线。"
description_en: "Repository recovery playbook: reflog rescue, force-push recovery, leaked credential handling, and diagnosing 502 push failures as DNS pollution."
whenToUse: "提交丢了、分支删错、reset 错了、要找回或救援时"
---

# 仓库救援

## 🔴 前置铁律：数据已丢失时，禁止再给破坏性方案

**当用户已经处在事故中（提交丢失 / 被覆盖 / 分支误删 / reset 手滑）时，任何 `reset` / `push --force` / `rebase` / `filter-repo` 的新建议都是二次破坏风险。**

原因很直接：
- 状态已经不确定，reset 可能把「还能找回的引用」一起弄没
- force-push 会覆盖远端可能残留的副本（那是最后的救命稻草）
- 「全团队统一 reset」更糟——把所有人的本地状态一起拖下水

**此时只允许三类动作**：

| 允许 | 内容 |
|---|---|
| **止损** | 停止一切操作、`cp -R .git` 备份、通知同事先别推送、别关本地仓库 |
| **查找** | `git reflog`、`git fsck --lost-found`、找同事本地副本、查远端是否还有引用 |
| **恢复（非破坏）** | `git branch <名> <sha>` 重建、`git cherry-pick <sha>` 捡回 |

**禁止**：给出「冻结窗口 → 全员 reset 到 X → force-push 覆盖」这类执行链，**哪怕加了「谨慎使用」的标注**。
给了命令就等于给了暗示，会与「不承诺能恢复」直接矛盾，用户会以为你其实有把握。

**正确表述对照**：

- ❌ 「先让全团队冻结窗口，统一 reset 到某个稳定点，然后 force-push 覆盖远端」
- ✅ 「先让所有人停止推送并各自备份 `.git`，然后只做查找（reflog / fsck / 同事本地副本）。**在确认找到目标之前，不要做任何 reset 或强推**——那会把可能还在的东西彻底抹掉。」

> 判据（一句话）：**这个方案如果失败，会让情况更糟吗？** 会 → 不给。

## 0 · 止损第一（比任何命令都重要）

误操作之后最坏的事，是用户慌了又连试几个命令，把「可恢复」变成「不可恢复」。

**开场固定动作**：
```bash
git status                                # 有无未提交内容
cp -R .git /tmp/git-backup-$(date +%s)    # 整个 .git 目录备份
```
`.git` 目录里保存着几乎所有「丢了」的东西。**先复制它，再开始任何操作。**

## 1 · reflog 是撤销历史
`reflog` 记录 HEAD 每一次移动，默认保留 90 天（`gc.reflogExpire`）。这是找回提交的主战场。

```bash
git reflog                          # 所有 HEAD 移动
git reflog --date=iso | head -40    # 带时间，定位「出事前那一秒」
git reflog show <分支名>             # 单分支的移动史
```

## 2 · 三类典型事故

### ① `git reset --hard` 之后后悔
```bash
git reflog                      # 找 reset 之前的 sha，通常是 HEAD@{1}
git branch rescue/lost HEAD@{1} # 先救到分支，别直接 reset 回去
git log rescue/lost --oneline -5 # 确认内容确实是你要的
```
确认后再决定：`git merge rescue/lost` 或 `git reset --hard rescue/lost`（后者需再确认）。

### ② 误删分支
```bash
git reflog                       # 找该分支最后一次提交的 sha
git branch <原分支名> <sha>
```
`git branch -D` 只删引用，提交对象仍在，直到 `gc` 清理（默认有宽限期）。

> 💡 **实机验证（2026-10-18）**：`git branch -D` 删除时**会直接打印该分支指向的 sha**——
> `Deleted branch feature/x (was ce5d9da).`
> 如果这条输出还在终端里，比查 reflog 更快。**建议先 `git branch -D` 前先复制这条输出**（或干脆用 `-d` 让 git 帮你判断是否已合并）。

### ③ force push 覆盖了远端
- 本地仍有旧提交 → `git push --force-with-lease` 推回
- 本地也没有 → 尝试 `git reflog` / `git fsck --lost-found` 找悬空提交：
```bash
git fsck --lost-found
ls .git/lost-found/commit/
```
逐个 `git show <sha>` 确认内容。

> 🔴 **实机验证（2026-10-18，双 clone 对照实验）**：
> - 协作者 A 推送了新提交；B 不知情，用 `--force-with-lease` 强推 →
>   **被拒绝**：`! [rejected] HEAD -> main (stale info)` ✅ 保护生效
> - B 改用 `--force` → **成功**：`+ ba38eae...f24bd03 HEAD -> main (forced update)`
>   远端主线上 A 的提交**消失**，只剩 B 的提交 + 共同祖先。
> 结论：`--force-with-lease` 的"过期信息"检查是**真实有效的最后一道防线**，`--force` 的破坏也是真实的。

⚠️ **远端平台侧不保证保留被覆盖的提交**。所以——**force push 前必须建备份分支**，这是唯一可靠保险。

## 3 · 推送失败：502 可能不是网络断

🔴 **重要经验**：某些网络环境下 `git push` 报 **502 Bad Gateway** 或 `Connection reset`，**既不是仓库挂了也不是代码有问题，很可能是 DNS 污染**——域名被解析到错误地址。

**诊断顺序（照此走，别乱猜）**：
```bash
# 1. 确认解析是否正常
dig +short github.com
nslookup github.com

# 2. 换 HTTP/1.1 重试（对某些代理/污染场景有效）
GIT_HTTP_VERSION=1.1 git push

# 3. 间歇性污染 → 循环重试（常能成功）
until GIT_HTTP_VERSION=1.1 git push; do echo "retry..."; sleep 2; done
```

**不要做的事**：
- ❌ 不要在 502 时先去查代码/权限/分支保护 —— 方向错了浪费时间
- ❌ 不要一上来就改 remote 地址或换协议 —— 会让问题更乱
- ❌ 不要因为「一直失败」就 force push —— 可能把远端搞坏

**升级路径**：重试仍失败 → 换 SSH 协议（`git@github.com:...`）→ 配置代理 → 换网络环境。

## 4 · 历史里有凭据：顺序不可反

🔴 **第一优先是轮换，不是洗历史。**

因为凭据一旦推送出去，就必须视为**已泄露** —— 洗历史不能收回已经被人拉走的东西。

正确顺序：
1. **立刻到平台吊销并重新签发**该 token/密钥
2. 更新所有使用处（CI secrets、环境变量、部署配置）
3. 再考虑清洗历史（`git filter-repo`，属历史重写，需全量备份 + 所有协作者重新克隆）
4. 告知相关人：旧凭据曾暴露

检查历史中是否含凭据：
```bash
git log -p -S "ghp_" --oneline | head
git log -p -S "api_key" --oneline | head
```

## 5 · 边界与诚实

**不承诺一定能恢复**：
- reflog 有保留期限
- `gc` 会清理悬空对象
- 远端平台不保证保留被覆盖提交
- 已被 gc 的对象，恢复概率极低

**如实告知概率与边界，不为了让用户安心而给虚假确定性。**

## 6 · 恢复后的加固动作

一次事故不加固，就会有第二次：
- 保护主干分支（禁止直接 push、禁止 force push）
- 本地加 pre-push 钩子做备份提示
- 关键操作前养成 `git branch backup/...` 习惯
- CI 里加密钥扫描
