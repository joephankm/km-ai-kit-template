#!/usr/bin/env bash
# Scaffold a new Claude Code skill directory with a SKILL.md template.
#
# Usage:
#   init_skill.sh <skill-name>            create under ~/.claude/skills/<skill-name>
#   init_skill.sh <skill-name> --project   create under ./.claude/skills/<skill-name>
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <skill-name> [--project]" >&2
  exit 1
fi

name="$1"
mode="${2:-}"

if [[ ! "$name" =~ ^[a-z0-9]+(-[a-z0-9]+)*$ ]]; then
  echo "Error: skill name must be lowercase kebab-case (e.g. pdf-editor), got: $name" >&2
  exit 1
fi

if [[ "$mode" == "--project" ]]; then
  base="./.claude/skills"
elif [[ -z "$mode" ]]; then
  base="$HOME/.claude/skills"
else
  echo "Error: unrecognized argument '$mode' (expected --project or nothing)" >&2
  exit 1
fi

dir="$base/$name"

if [[ -e "$dir" ]]; then
  echo "Error: $dir already exists" >&2
  exit 1
fi

mkdir -p "$dir"

cat > "$dir/SKILL.md" <<EOF
---
name: $name
description: TODO — third person, concrete quoted trigger phrases. e.g. This skill should be used when the user asks to "X", "Y", or "Z".
---

# $(echo "$name" | sed 's/-/ /g' | awk '{for(i=1;i<=NF;i++) $i=toupper(substr($i,1,1)) substr($i,2); print}')

TODO: one or two sentences on the purpose of this skill.

## TODO: procedure section(s)

Write in imperative/infinitive form (verb-first), not second person.
Reference any references/, scripts/, or assets/ files by path as they come up.

## Additional Resources

<!-- Delete this section if there are no bundled resources.
### Reference Files
- **\`references/EXAMPLE.md\`** - one line on what's in it and when to open it

### Scripts
- **\`scripts/EXAMPLE.sh\`** - one line on what it does and when to run it
-->
EOF

echo "Created $dir/SKILL.md"
echo "Next: fill in the frontmatter description, write the body, add references/scripts/assets only as needed."
echo "See ~/.claude/skills/skill-creator/references/checklist.md before shipping."
