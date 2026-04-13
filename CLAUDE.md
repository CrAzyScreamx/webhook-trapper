# Webhook Trapper — Project Context

## Project Vault

Before looking for project context in source files, check the vault at `./webhook-trapper-vault/`.

**How to navigate the vault:**
1. Read `tools.md` for a project overview.
2. Extract 3–6 keywords from the user's request (use domain terms, not just file names).
3. Search the vault for those keywords in the `keywords:` frontmatter field:
   ```bash
   grep -r "keywords:" ./webhook-trapper-vault/ --include="*.md" -A 1
   ```
   Then read the frontmatter of candidates to find the best match.
4. Read the matched feature file before opening source code.

The vault is the fast path — use it before digging into source.
