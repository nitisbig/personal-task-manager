# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

## Data storage (Supabase)

The dashboard persists data to a Supabase Postgres database (previously it used
browser `localStorage`). Data lives in an isolated `daily_dashboard` schema in
the `trading-journal` project, separate from other schemas:

| Table                        | Purpose                                             |
| ---------------------------- | --------------------------------------------------- |
| `daily_dashboard.settings`   | Single-row profile name + theme (shared workspace)  |
| `daily_dashboard.days`       | One row per date: goal + reflection                 |
| `daily_dashboard.tasks`      | Tasks for a day (FK → days, cascade delete)         |
| `daily_dashboard.plans`      | Schedule blocks for a day (FK → days, cascade)      |

Client code: `src/lib/supabase.ts` (client, pinned to the `daily_dashboard`
schema) and `src/lib/api.ts` (typed read/write helpers used by `App.tsx`).

### Config

Copy `.env.example` to `.env` and set your project credentials:

```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-or-publishable-key>
```

`.env` is gitignored. There is no login — this is a single shared workspace, so
the anon key has read/write access to the `daily_dashboard` tables via RLS.

---

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
