export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Scope phải thuộc danh sách (nếu có scope). Scope rỗng vẫn hợp lệ.
    //   app  → apps/frontend-app (@omni/app)
    //   api  → apps/server (@omni/api)
    //   sdk  → packages/sdk (@omni/sdk)
    //   repo → config gốc / monorepo (turbo, mise, lefthook…)
    //   ci   → workflow CI/CD
    //   deps → bump/đổi dependency
    'scope-enum': [2, 'always', ['app', 'api', 'sdk', 'repo', 'ci', 'deps']],
  },
};
