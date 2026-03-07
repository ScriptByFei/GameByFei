#!/bin/bash
# Script to install skills from openclaw/skills repo manually

SKILLS_DIR="$HOME/.agents/skills"
WORKSPACE_SKILLS="$HOME/.openclaw/workspace/skills"
REPO_BASE="https://raw.githubusercontent.com/openclaw/skills/main/skills"

install_skill() {
    local author="$1"
    local name="$2"
    local target_dir="$SKILLS_DIR/$name"
    
    mkdir -p "$target_dir"
    
    # Download SKILL.md
    curl -sL "$REPO_BASE/$author/$name/SKILL.md" -o "$target_dir/SKILL.md" 2>/dev/null
    
    # Download _meta.json if exists
    curl -sL "$REPO_BASE/$author/$name/_meta.json" -o "$target_dir/_meta.json" 2>/dev/null
    
    # Create symlink in workspace
    ln -sf "$target_dir" "$WORKSPACE_SKILLS/$name" 2>/dev/null
    
    echo "Installed: $name"
}

# Install requested skills
install_skill "spclaudehome" "skill-vetter"
