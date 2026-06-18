# 开发工作流

> 此文件扩展自 [common/git-workflow.md](./git-workflow.md)，包含 git 操作之前的完整功能开发流程。

功能实现工作流描述了开发管道：规划、TDD、代码审查，然后提交到 git。

## 功能实现工作流

1. **先规划**
   - 使用 **planner** 智能体创建实施计划
   - 识别依赖关系和风险
   - 分解为多个阶段

2. **TDD 方法**
   - 使用 **tdd-guide** 智能体
   - 先写测试（红色）
   - 实现以通过测试（绿色）
   - 重构（改进）
   - 验证覆盖率 80%+

3. **代码审查**
   - 编写代码后立即使用 **code-reviewer** 智能体
   - 解决 CRITICAL 和 HIGH 问题
   - 尽可能修复 MEDIUM 问题

4. **提交与推送**
   - 详细的提交信息
   - 遵循 conventional commits 格式
   - 提交信息格式和 PR 流程见 [git-workflow.md](./git-workflow.md)
