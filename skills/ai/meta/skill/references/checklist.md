# Skill Validation Checklist & Common Mistakes

Consult this before considering a new or edited skill finished.

## Checklist

**Structure**
- [ ] `SKILL.md` exists with valid YAML frontmatter (`---` fenced)
- [ ] Frontmatter has `name` and `description` — both required, nothing else is
- [ ] Every path mentioned in the body (`references/x.md`, `scripts/y.sh`) actually exists
- [ ] No empty `references/`, `scripts/`, or `assets/` directories left behind

**Description quality**
- [ ] Third person: `"This skill should be used when..."`
- [ ] Contains 3-6 concrete, quoted trigger phrases a user would actually type
- [ ] Distinguishes this skill from adjacent ones (no overlap that would make Claude pick wrong)
- [ ] Under ~100 words

**Body quality**
- [ ] Imperative/infinitive form throughout — no "you should", "you need to", "you can"
- [ ] 1,500–2,000 words ideal, hard cap ~3,000; excess moved to `references/`
- [ ] Detailed/rare-path content lives in `references/`, not inline
- [ ] No information duplicated between SKILL.md and a references file
- [ ] Ends with an "Additional Resources" section pointing to every bundled file

**Scripts (if any)**
- [ ] Executable (`chmod +x`) and use a correct shebang
- [ ] Documented with a `--help`/usage comment or a one-liner in SKILL.md
- [ ] Actually deterministic — if the "script" is really just prose advice, it isn't a script

## The "Additional Resources" template

Close every SKILL.md body with this shape so Claude knows what exists without loading it yet:

```markdown
## Additional Resources

### Reference Files
- **`references/patterns.md`** - one line on what's in it and when to open it

### Scripts
- **`scripts/validate.sh`** - one line on what it does and when to run it
```

## Common mistakes

### 1. Weak trigger description

Bad: `description: Provides guidance for working with hooks.`
— vague, no phrases, second-person-adjacent framing.

Good: `description: This skill should be used when the user asks to "create a hook", "add a PreToolUse hook", "validate tool use", or mentions hook events (PreToolUse, PostToolUse, Stop).`

### 2. Everything crammed into SKILL.md

An 8,000-word SKILL.md loads in full the instant the skill triggers, even for a request that only
needed one paragraph of it. Split: keep the procedure in SKILL.md, move schemas/API references/
long edge-case walkthroughs to `references/*.md`, and point to them by one-line description.

### 3. Second-person narration

Bad: `You should start by reading the config file. You'll want to validate the input.`
Good: `Read the config file first. Validate the input before processing.`

### 4. Unreferenced resources

A `references/advanced.md` that nothing in SKILL.md points to might as well not exist — Claude
has no way to know to open it. Every bundled file needs a one-line pointer in the body.

### 5. Duplicated information

If the same fact (a schema, a flag list, a step sequence) appears both in SKILL.md and in a
references file, one of them will drift out of date. Pick one home for it and have the other side
just point there.

### 6. Overly broad scope

A skill that tries to cover too many unrelated triggers ("data stuff", "helper skill") competes
with itself and with other skills for activation. Prefer several narrow, sharply-triggered skills
over one broad one.
