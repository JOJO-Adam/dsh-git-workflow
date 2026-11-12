# dsh-git-workflow · JOJO&Adam

A Git workflow studio for DeepSeek Harness: the agent follows your team's rules for branching, commit messages, PR review and releases instead of improvising each time.

## Install

```bash
dsh plugin --profile web add @jojonadam/dsh-git-workflow
dsh plugin --profile desktop add @jojonadam/dsh-git-workflow
```

## What's inside (7 skills)

Routing (`git-workflow-studio`) + Git SOP + commit conventions + PR review by defect density + history surgery + disaster recovery (reflog) + release/versioning.

## Boundaries

- Covers Git itself; does not choose your hosting platform or implement CI.
- Destructive operations come as judgement plus an explicit command list — you confirm before anything runs.
- Never pushes or rewrites history on its own.

## License

MIT · JOJO & Adam · <https://jojo-adam.com>
