# Next.js SEO Optimizer - Agent Skill

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Agent Skills](https://img.shields.io/badge/Agent-Skills-blue)](https://agentskills.io)
[![Next.js](https://img.shields.io/badge/Next.js-13%2B-black)](https://nextjs.org)

A comprehensive AI agent skill for optimizing Next.js applications for search engines. Works with Claude Code, Cursor, OpenCode, and other AI coding assistants.

## 🎯 What This Skill Does

This skill transforms Claude (or any compatible AI assistant) into a Next.js SEO expert that can:

- ✅ Configure **Metadata API** (static & dynamic)
- ✅ Generate **dynamic sitemaps** from your content
- ✅ Set up **robots.txt** with proper rules
- ✅ Add **structured data** (JSON-LD) for rich results
- ✅ Optimize **Core Web Vitals** for better rankings
- ✅ Validate SEO implementation automatically
- ✅ Support both **App Router** and **Pages Router**

## 🚀 Quick Start

### Install with npx (Recommended)

```bash
npx add-skill kumbajirajkumar123/nextjs-seo-optimizer
```

### Manual Installation

#### For Claude Code

```bash
# Global installation
git clone https://github.com/kumbajirajkumar123/nextjs-seo-optimizer.git ~/.claude/skills/nextjs-seo-optimizer

# Project-specific installation
git clone https://github.com/kumbajirajkumar123/nextjs-seo-optimizer.git .claude/skills/nextjs-seo-optimizer
```

#### For Cursor

```bash
git clone https://github.com/kumbajirajkumar123/nextjs-seo-optimizer.git ~/.cursor/skills/nextjs-seo-optimizer
```

#### For Claude.ai (Web Interface)

1. Download the latest [release](https://github.com/rajendraprasadn/nextjs-seo-optimizer/releases)
2. Go to Settings → Features → Skills
3. Upload the `.skill` file

## 📚 Features

### Metadata Implementation

- Static metadata for fixed pages
- Dynamic metadata with `generateMetadata`
- Open Graph tags for social sharing
- Twitter Cards configuration
- Template-based titles
- Canonical URL management

### Technical SEO

- Dynamic sitemap generation
- next-sitemap integration guide
- Robots.txt configuration
- Environment-specific rules
- Multi-sitemap support for large sites

### Structured Data

- Organization schema
- Article/BlogPosting schema
- Product schema with offers
- FAQ schema
- Breadcrumb navigation
- Rich results validation

### Performance

- Image optimization with next/image
- Font optimization with next/font
- Code splitting strategies
- Bundle size optimization
- Core Web Vitals improvement
- Caching strategies

### Validation

- Automated SEO checker script
- Sitemap validation
- Robots.txt verification
- Metadata completeness check
- Performance scoring

## 💡 Usage Examples

Once installed, your AI assistant will automatically use this skill when you ask SEO-related questions:

### Basic Setup

```
"Set up SEO for my Next.js blog"
"Add metadata to my homepage"
"Create a sitemap for my site"
```

### E-commerce

```
"Add product schema to my product pages"
"Optimize my e-commerce site for Google Shopping"
"Set up dynamic sitemap for 10,000+ products"
```

### Blog/Content

```
"Add article schema to my blog posts"
"Optimize my blog for search engines"
"Set up dynamic metadata for CMS content"
```

### Auditing

```
"Audit my Next.js site for SEO issues"
"Check if my metadata is properly configured"
"Review my Core Web Vitals"
```

## 📖 Documentation

The skill includes comprehensive guides:

- **[SKILL.md](SKILL.md)** - Main implementation guide
- **[next-sitemap-guide.md](references/next-sitemap-guide.md)** - Advanced sitemap setup
- **[performance-optimization.md](references/performance-optimization.md)** - Core Web Vitals
- **[pages-router-seo.md](references/pages-router-seo.md)** - Legacy Next.js support
- **[complete-example.md](references/complete-example.md)** - Full e-commerce example

## 🛠️ Validation Script

The skill includes an automated SEO validation script:

```bash
node scripts/validate-seo.js
# or with custom URL
node scripts/validate-seo.js --url=http://localhost:3000
```

**Checks:**

- ✅ Sitemap accessibility and validity
- ✅ robots.txt configuration
- ✅ Metadata implementation
- ✅ Next.js config optimization
- ✅ SEO score calculation

## 🎓 What You'll Learn

- Next.js Metadata API best practices
- Google's SEO guidelines
- Schema.org structured data
- Core Web Vitals optimization
- Sitemap generation patterns
- Robots.txt configuration

## 🤝 Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

**Ways to contribute:**

- Report bugs or SEO issues
- Suggest new patterns or schemas
- Improve documentation
- Add examples for specific use cases
- Test with different Next.js versions

## 📊 Compatibility

| Next.js Version | Support Level        |
| --------------- | -------------------- |
| 15.x            | ✅ Full support      |
| 14.x            | ✅ Full support      |
| 13.x            | ✅ Full support      |
| 12.x            | ⚠️ Pages Router only |
| < 12            | ❌ Not supported     |

**AI Assistants:**

- ✅ Claude Code
- ✅ Cursor
- ✅ OpenCode
- ✅ GitHub Copilot CLI
- ✅ Codex
- ✅ Gemini CLI
- ✅ Claude.ai (via upload)

## 🏗️ Built With

This skill follows the [Agent Skills](https://agentskills.io) open standard, making it compatible with multiple AI coding assistants.

## 📝 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- Built following [Next.js official docs](https://nextjs.org/docs)
- Schema.org structured data standards
- Google Search Central guidelines
- Agent Skills standard by Anthropic

## 📧 Contact

Created by **Rajendra Prasad N**

- Portfolio: [Your Portfolio URL]
- LinkedIn: [Your LinkedIn]
- Twitter: [@YourHandle]

## ⭐ Show Your Support

If this skill helps your Next.js projects rank better, give it a star! ⭐

## 🔗 Related Projects

- [Agent Skills Registry](https://github.com/VoltAgent/awesome-claude-skills)
- [Next.js Documentation](https://nextjs.org/docs)
- [next-sitemap](https://github.com/iamvishnusankar/next-sitemap)

---

**Note:** This is an AI agent skill, not a standalone library. It provides instructions and patterns for AI assistants to help you implement SEO in Next.js projects.
