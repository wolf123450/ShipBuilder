# Agent Behavior Guidelines

This document specifies consistent behavior expectations for AI agents working in this codebase.

## Core Principles

1. **User-Driven Testing**: Never commit changes without explicit user confirmation that features work as expected
2. **Transparency**: Always explain what you're doing before doing it
3. **Respect Choices**: When multiple valid approaches exist, ask the user which they prefer
4. **Incremental Progress**: Make small, testable changes rather than large refactors
5. **Keep Context**: Maintain awareness of current state (what files changed, what's in progress)

## Code Standards

### TypeScript/Vue
- Use TypeScript strict mode (no implicit any)
- Prefer `const` over `let`, never use `var`
- Use Vue 3 Composition API with `<script setup>`
- Import types explicitly with `import type { ... }`
- All components should have proper type annotations

### File Organization
- Vue components in `src/components/`
- Composables in `src/components/composables/`
- Editors in `src/components/editors/`
- Store in `src/stores/`
- Types in `src/types/`
- Utilities in `src/utils/`
- Compiler logic in `src/compiler/`

### Naming Conventions
- Components: PascalCase (e.g., `HierarchyViewer.vue`)
- Composables: use prefix (e.g., `useSelection.ts`)
- Constants: UPPER_SNAKE_CASE
- Functions/methods: camelCase
- CSS classes: kebab-case

### CSS/Styling
- Use CSS custom properties (--color-primary, --color-text, etc.)
- Defined in `src/style.css` root selector
- Scoped styles in components with `<style scoped>`
- Always include both `-webkit-` and standard properties for cross-browser support

## Task Tracking & Progress Visibility

### Long-Term vs Short-Term Tracking

**TODO.md file** (for longer-term project planning):
- Track phases and major features across the entire project timeline
- Document implementation checkpoints for complex features
- Maintain a roadmap visible to all team members
- Include status updates (✅ COMPLETE, 🔄 IN PROGRESS, ⏳ DEFERRED)
- Update when features are completed or priorities change
- Examples: Phase 5.0c, Phase 5.0d, entire roadmap sections

**manage_todo_list tool** (for current work sessions):
- Track immediate action items for this specific session
- Break down current tasks into 3-7 actionable steps
- Mark as `in-progress` before starting work on each item
- Mark as `completed` immediately after finishing (don't batch)
- Max 1 item in-progress at a time
- Examples: "Create improved HullInstanceEditor component", "Validate build succeeds", "Test new editor UI with user"

**Workflow**:
1. Review user's request and check TODO.md for related phase status
2. Create session todo list using manage_todo_list tool with 3-5 specific action items
3. Work through each item, marking in-progress/completed as you go
4. When session work completes, update TODO.md with overall progress
5. Close the manage_todo_list as "all completed" before ending turn

## Testing & Validation

### Before Committing
1. **Development Build**: Ask user to check the development build (already running and auto-updating)
2. **Type Check**: `get_errors` tool should return no errors in modified files
3. **User Testing**: User must explicitly confirm feature works as expected
4. **Cleanup**: Remove console.log debug statements before final commit

### Testing Workflow
1. Make changes to code files
2. Check for errors with `get_errors` tool
3. Run terminal commands if needed for validation
4. Ask user to test the feature
5. Only after user confirms → proceed to commit

### What NOT to Do
- ❌ Auto-commit on your own schedule
- ❌ Assume changes work without validation
- ❌ Leave TODO/FIXME comments for "future work"
- ❌ Make breaking changes without discussion
- ❌ Use `git add -A` + commit without user confirmation

## Git Workflow

### Branching
- Work on `master` by default unless user specifies otherwise
- Use feature branches if working on large isolated features

### Commits
- **ONLY commit after user confirms testing is successful**
- Use descriptive commit messages (see examples below)
- Include what changed and why
- Reference Phase/Feature in message if applicable

### Commit Message Format
```
Phase X.Y: Brief feature description

- Specific change 1
- Specific change 2
- Specific change 3
```

**Example**:
```
Phase 5.0a: Add SecondaryHullEditor component

- Create SecondaryHullEditor.vue with full property editing UI
- Support position, rotation, and scale controls with sliders
- Implement duplicate, mirror, reset, delete actions
- Integrate into StepEditor as new tab
```

### Before Committing
Always run these validation steps:
```powershell
# Check git status
git -C d:\Projects\ShipBuilder status

# Review changes
git -C d:\Projects\ShipBuilder diff

# Only commit AFTER user confirms testing
git -C d:\Projects\ShipBuilder add -A
git -C d:\Projects\ShipBuilder commit -m "..."
```

## Communication Style

### When to Ask vs When to Decide
- **Ask**: Implementation approach (multiple valid options), breaking changes, large refactors
- **Decide**: Bug fixes, error handling, naming conventions, minor improvements

### Reporting Status
- Be concise: state what's done, what's next, any blockers
- Use bullet points for clarity
- Include file counts/line counts for perspective
- Example: "✅ SecondaryHullEditor created (600 lines), integrated into StepEditor, ready for user testing"

### Error Handling
When something breaks:
1. Explain the problem clearly
2. Show the error message
3. Propose 2-3 solutions
4. Ask which approach user prefers

## Common Sense Parameters

### File Editing
- Always read surrounding context (3-5 lines before/after) before replacing
- Use `multi_replace_string_in_file` for multiple independent edits in one operation
- Never create multiple files when one would suffice
- Don't edit documentation unless specifically asked

### Terminal Commands
- Use `isBackground=false` for quick validation commands (npm, git)
- Use `isBackground=true` for dev server/long-running processes
- Always include `explanation` and `goal` parameters
- Set reasonable timeouts (5000ms for git/npm, 0 for servers)

### File Search
- Use `grep_search` for quick lookups in known files
- Use `file_search` for finding files by pattern
- Use `semantic_search` when you need conceptual matches across codebase
- Start with narrow searches, expand if needed

### Error Checking
- Run `get_errors` after modifications to validate changes
- Before committing, ensure target files have no errors
- Type checking is mandatory before commit

## Testing Checklist

Before marking work as complete:
- [ ] Code compiles without TypeScript errors
- [ ] No console errors or warnings in browser
- [ ] Feature works as described in requirements
- [ ] No regression in existing features
- [ ] Styling looks correct and consistent
- [ ] Responsive on different viewport sizes (if applicable)

## Current Project Context

**Tech Stack**: Vue 3 + TypeScript, Pinia (state), Three.js (3D), Vite (build)
**MVP Status**: Complete ✅
**Current Phase**: 5.0a (Hierarchy + Selection + Secondary Hulls)
**Main Files**: 
- Store: `src/stores/shipStore.ts`
- Components: `src/components/*.vue`
- Compiler: `src/compiler/index.ts`
- Types: `src/types/index.ts`

**Color Scheme**: Dark theme with blue primary (#3b82f6), defined in `src/style.css`

## Quick Reference: Common Tasks

### Create New Component
1. Create `.vue` file in appropriate folder
2. Use `<script setup lang="ts">` 
3. Import with absolute path: `import { useStore } from '@stores/shipStore'`
4. Add proper TypeScript types
5. Test with `get_errors` before committing

### Modify Store
1. Edit `src/stores/shipStore.ts`
2. Follow existing pattern (state, computed, functions)
3. Test store methods in context of using component
4. Update types in `src/types/index.ts` if needed

### Fix Styling Issues
1. Check color variables defined in `src/style.css`
2. Use CSS custom properties, not hardcoded colors
3. Include browser prefixes for sliders/inputs
4. Test in both light and dark scenarios

## Questions to Ask User When Uncertain

1. "Should I proceed with approach A or B?"
2. "Before I implement this, shall I refactor existing code?"
3. "This will be a breaking change to X. Should I go ahead?"
4. "Should I add this as a new component or extend existing one?"
5. "How would you like this feature to behave when X happens?"

---

**Last Updated**: Feb 15, 2026
**Phase**: 5.0a (Active)
