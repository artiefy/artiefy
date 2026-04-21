# Changelog

All notable changes to the Next.js SEO Optimizer skill will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-01-27

### Added
- Initial release of Next.js SEO Optimizer skill
- Comprehensive SKILL.md with SEO implementation guide
- Metadata API documentation (static and dynamic)
- Sitemap generation patterns (built-in and next-sitemap)
- Robots.txt configuration examples
- Structured data schemas (Organization, Product, Article, FAQ, Breadcrumb)
- Core Web Vitals optimization guide
- Performance optimization reference
- Pages Router support for legacy projects
- Complete e-commerce example
- Automated SEO validation script
- GitHub Actions workflows for CI/CD
- Comprehensive documentation (README, CONTRIBUTING, INSTALLATION)
- MIT License

### Features
- ✅ Next.js 13+ App Router full support
- ✅ Next.js 12 Pages Router support
- ✅ Dynamic metadata with generateMetadata
- ✅ Open Graph and Twitter Card configuration
- ✅ JSON-LD structured data templates
- ✅ Image optimization best practices
- ✅ Font optimization with next/font
- ✅ Bundle size optimization
- ✅ SEO audit checklist
- ✅ Testing and validation tools
- ✅ Environment-specific configurations

### Documentation
- Main skill implementation guide
- next-sitemap advanced configuration
- Performance optimization strategies
- Pages Router migration guide
- Complete example implementation
- Installation guide for all platforms
- Contributing guidelines
- Detailed README with usage examples

### Scripts
- validate-seo.js - Automated SEO validation
  - Sitemap validation
  - robots.txt verification
  - Metadata completeness check
  - SEO scoring system

### Compatibility
- Next.js 15.x ✅
- Next.js 14.x ✅
- Next.js 13.x ✅
- Next.js 12.x ⚠️ (Pages Router only)
- Claude Code ✅
- Cursor ✅
- OpenCode ✅
- GitHub Copilot CLI ✅
- Codex ✅
- Gemini CLI ✅
- Claude.ai ✅

## [Unreleased]

### Planned Features
- [ ] Video schema support
- [ ] LocalBusiness schema for physical stores
- [ ] Recipe schema for food blogs
- [ ] Event schema
- [ ] FAQ schema generator
- [ ] Multilingual SEO guide (i18n)
- [ ] AMP support patterns
- [ ] Progressive Web App SEO
- [ ] E-commerce category page optimization
- [ ] Blog archive optimization
- [ ] XML sitemap compression for 100k+ pages
- [ ] Integration with Google Analytics 4
- [ ] Integration with Google Tag Manager
- [ ] Structured data testing automation

### Under Consideration
- [ ] Visual sitemap generator
- [ ] SEO diff checker for deployments
- [ ] Automated meta description generator
- [ ] Image alt text validator
- [ ] Internal linking analyzer
- [ ] Keyword density checker
- [ ] Mobile-first validation
- [ ] Accessibility checker integration
- [ ] Schema markup validator
- [ ] Rich results preview

---

## Version History

- **1.0.0** (2026-01-27) - Initial release

## How to Upgrade

### For Git Installations
```bash
cd ~/.claude/skills/nextjs-seo-optimizer
git pull origin main
```

### For npx Installations
```bash
npx add-skill rajendraprasadn/nextjs-seo-optimizer --force
```

### For Claude.ai
Download latest `.skill` from [Releases](https://github.com/rajendraprasadn/nextjs-seo-optimizer/releases)

## Breaking Changes

None yet (v1.0.0 is initial release)

## Migration Guides

### From Pre-1.0 Beta (if applicable)
Not applicable - this is the first release

---

**Note:** Dates use YYYY-MM-DD format (ISO 8601)
