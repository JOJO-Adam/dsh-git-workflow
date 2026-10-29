---
name: git-pr-review
description: "Pull request review playbook: PR description template, defect-density-ordered review checklist, blocking versus nit labeling, and the rationale for splitting PRs above roughly 400 changed lines."
version: "1.0.0"
display_name: "PR 与代码评审"
display_name_en: "Pull Request Review Playbook"
description_zh: "PR 与评审手册：PR 描述模板、按缺陷密度排序的评审清单、blocking 与 nit 的分级标注，以及超过约 400 行必须拆分的依据。"
description_en: "PR review playbook: description template, defect-density-ordered checklist, blocking vs nit labeling, and why to split large PRs."
whenToUse: "写 PR 描述、评审 PR、定合并前检查项时"
---

# PR 与代码评审

## 1 · 为什么要求拆分

经验阈值：**有效 diff 超过约 400 行，评审质量断崖下降**。人会开始滑动鼠标然后点通过。这不是道德问题，是认知负荷问题。

拆分维度（一次只用一种）：
- 按层次：纯重构 / 加功能 / 改测试
- 按模块：一个 PR 只动一个模块
- 按性质：机械改动单独一个 PR

🔴 **机械改动（格式化/重命名/移动文件）与逻辑改动混在一个 PR，是评审失效率的头号原因** —— diff 被噪音淹没，真正的逻辑变化看不见。

## 2 · PR 描述模板（缺项即退回）

```markdown
## 改了什么
（一句话，具体。禁止"修复了一些问题"）

## 为什么改
（关联 issue / 事故 / 需求。没有动因的改动不该存在）

## 怎么验证
（复现步骤 / 测试命令 / 截图。让评审者能自己验证）

## 影响面
（对外行为变化 / 是否需要迁移 / 是否需要发版说明）

## 风险与回滚
（最坏情况 + 怎么退回去）
```

## 3 · 评审清单（按缺陷密度排序）

### 第一层 · 会出事故
- [ ] **凭据泄露**：token / 密钥 / 内网地址 / 含签名的 URL
- [ ] **错误处理**：异常被吞？失败时用户看到什么？有没有静默失败
- [ ] **边界**：空值 / 超长 / 并发 / 重复提交 / 时区
- [ ] **破坏性操作**：删数据、覆盖写、不可逆转换有没有二次确认或备份
- [ ] **权限**：新增接口有没有鉴权；越权访问可能

### 第二层 · 会随时间变烂
- [ ] 命名与既有代码一致（不是引入第二套风格）
- [ ] 有没有复制粘贴产生的新副本（该抽未抽）
- [ ] 日志/异常信息能否定位问题（而不是「出错了」）
- [ ] 是否有未使用的死代码、调试残留

### 第三层 · 风格
交给 lint / formatter。**人不在评审里争风格。** 这是最浪费团队时间的行为。

## 4 · 标注分级（必须显式写）

- `[blocking]` 不修不能合
- `[nit]` 小建议，可忽略
- `[question]` 我不确定，想听你的解释
- `[praise]` 这里做得好（不是客套，是让评审不只有负面信息）

## 5 · 评审语气

- 说事不说人：「这里并发下会重复写入」> 「你没考虑并发」
- 先问再判：「这里是有意为之吗？」> 直接假定错误
- 认可要具体：「这个错误信息带了 trace id，排查会省很多时间」> 「不错」

## 6 · 评审者自己的纪律

- 没实际验证的判断标「待验证」，不伪装成结论
- 提了 blocking 就要跟进到解决，不能提完消失
- 不确定就去跑一下/问一下，别让作者自证清白

## 7 · 合并前最后三问

1. 这个 PR 如果明天出事故，能不能单独 revert 掉？（不能 → 拆分没做够）
2. 三个月后有人看这条 PR，能不能看懂为什么改？
3. 描述里的「怎么验证」别人真的能照着跑通吗？
