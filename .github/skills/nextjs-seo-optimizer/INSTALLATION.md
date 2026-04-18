# Installation Guide

This guide covers all the ways to install the Next.js SEO Optimizer skill.

## Table of Contents

- [Quick Install (Recommended)](#quick-install-recommended)
- [Claude Code](#claude-code)
- [Cursor](#cursor)
- [OpenCode](#opencode)
- [Claude.ai Web Interface](#claudeai-web-interface)
- [Manual Installation](#manual-installation)
- [Verification](#verification)

## Quick Install (Recommended)

The easiest way to install across all compatible AI assistants:

```bash
npx add-skill rajendraprasadn/nextjs-seo-optimizer
```

This automatically detects and installs to:
- Claude Code
- Cursor
- OpenCode
- GitHub Copilot CLI
- Codex
- And other compatible assistants

## Claude Code

### Global Installation
Install once, use in all projects:

```bash
git clone https://github.com/rajendraprasadn/nextjs-seo-optimizer.git ~/.claude/skills/nextjs-seo-optimizer
```

### Project-Specific Installation
Install for a single project:

```bash
cd your-nextjs-project
git clone https://github.com/rajendraprasadn/nextjs-seo-optimizer.git .claude/skills/nextjs-seo-optimizer
```

### Verify Installation

```bash
# Check if skill is detected
claude --list-skills

# Or start Claude and ask
claude
> list skills
```

## Cursor

### Installation

```bash
git clone https://github.com/rajendraprasadn/nextjs-seo-optimizer.git ~/.cursor/skills/nextjs-seo-optimizer
```

### Verify

Open Cursor and use:
```
Cmd/Ctrl + Shift + P → "List Skills"
```

## OpenCode

### Installation

```bash
git clone https://github.com/rajendraprasadn/nextjs-seo-optimizer.git ~/.opencode/skills/nextjs-seo-optimizer
```

## Claude.ai Web Interface

1. **Download the Skill Package**
   - Go to [Releases](https://github.com/rajendraprasadn/nextjs-seo-optimizer/releases)
   - Download the latest `.skill` file

2. **Upload to Claude.ai**
   - Visit [claude.ai](https://claude.ai)
   - Go to Settings (gear icon)
   - Click "Features"
   - Click "Skills" tab
   - Click "Add Skill"
   - Upload the downloaded `.skill` file

3. **Verify**
   - Ask Claude: "What skills do you have?"
   - It should list "nextjs-seo-optimizer"

## Manual Installation

If you prefer to install manually:

1. **Clone the repository**
   ```bash
   git clone https://github.com/rajendraprasadn/nextjs-seo-optimizer.git
   ```

2. **Copy to your skills directory**
   
   For Claude Code:
   ```bash
   cp -r nextjs-seo-optimizer ~/.claude/skills/
   ```
   
   For Cursor:
   ```bash
   cp -r nextjs-seo-optimizer ~/.cursor/skills/
   ```

3. **Verify the structure**
   ```
   ~/.claude/skills/nextjs-seo-optimizer/
   ├── SKILL.md
   ├── scripts/
   │   └── validate-seo.js
   └── references/
       ├── next-sitemap-guide.md
       ├── performance-optimization.md
       ├── pages-router-seo.md
       └── complete-example.md
   ```

## Verification

After installation, verify the skill is working:

1. **Start your AI assistant** (Claude Code, Cursor, etc.)

2. **Ask a test question:**
   ```
   "Do you have the nextjs-seo-optimizer skill?"
   ```
   
   Expected response: "Yes, I have the nextjs-seo-optimizer skill..."

3. **Test with an SEO question:**
   ```
   "How do I add metadata to a Next.js page?"
   ```
   
   Claude should use the skill to provide detailed Next.js-specific guidance.

## Updating the Skill

### For Git Installations

```bash
# Navigate to skill directory
cd ~/.claude/skills/nextjs-seo-optimizer

# Pull latest changes
git pull origin main
```

### For npx Installation

```bash
# Reinstall to get latest version
npx add-skill rajendraprasadn/nextjs-seo-optimizer --force
```

### For Claude.ai

1. Download latest `.skill` file from [Releases](https://github.com/rajendraprasadn/nextjs-seo-optimizer/releases)
2. Remove old skill in Settings → Features → Skills
3. Upload new `.skill` file

## Troubleshooting

### Skill Not Detected

**Issue:** AI assistant doesn't recognize the skill

**Solutions:**
1. Check file structure matches expected format
2. Ensure `SKILL.md` exists with proper YAML frontmatter
3. Restart your AI assistant
4. Check skills directory path is correct

### Wrong Skill Directory

**Issue:** Installed to wrong location

**Solution:**
```bash
# Find where skills should go
# For Claude Code
echo ~/.claude/skills/

# For Cursor
echo ~/.cursor/skills/

# Move skill to correct location
mv /wrong/path/nextjs-seo-optimizer ~/.claude/skills/
```

### Permission Issues

**Issue:** Permission denied during installation

**Solution:**
```bash
# Fix permissions
sudo chown -R $USER ~/.claude/skills/
chmod -R 755 ~/.claude/skills/
```

### Validation Script Not Working

**Issue:** `validate-seo.js` script fails

**Solution:**
```bash
# Ensure script is executable
chmod +x scripts/validate-seo.js

# Check Node.js is installed
node --version

# If not installed
# Mac: brew install node
# Ubuntu: sudo apt install nodejs npm
```

## Platform-Specific Notes

### Windows

Use Git Bash or WSL for best compatibility:

```bash
# In Git Bash or WSL
git clone https://github.com/rajendraprasadn/nextjs-seo-optimizer.git $HOME/.claude/skills/nextjs-seo-optimizer
```

### macOS

No special requirements. Use Terminal:

```bash
git clone https://github.com/rajendraprasadn/nextjs-seo-optimizer.git ~/.claude/skills/nextjs-seo-optimizer
```

### Linux

Same as macOS. Use your terminal:

```bash
git clone https://github.com/rajendraprasadn/nextjs-seo-optimizer.git ~/.claude/skills/nextjs-seo-optimizer
```

## Next Steps

After installation:

1. **Read the documentation**: Check [README.md](README.md)
2. **Try examples**: Ask Claude to implement SEO patterns
3. **Run validation**: Use the included validation script
4. **Give feedback**: Report issues or suggest improvements

## Getting Help

- 📖 [Documentation](README.md)
- 🐛 [Report Issues](https://github.com/rajendraprasadn/nextjs-seo-optimizer/issues)
- 💬 [Discussions](https://github.com/rajendraprasadn/nextjs-seo-optimizer/discussions)
- 🤝 [Contributing](CONTRIBUTING.md)
