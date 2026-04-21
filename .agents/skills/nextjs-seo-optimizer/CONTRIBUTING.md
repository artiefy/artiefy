# Contributing to Next.js SEO Optimizer

Thank you for your interest in contributing! This skill helps frontend developers implement SEO in Next.js projects, and we welcome improvements.

## 🎯 Ways to Contribute

1. **Report Issues** - Found a bug or SEO pattern that doesn't work?
2. **Suggest Improvements** - Have ideas for better SEO patterns?
3. **Add Examples** - Real-world use cases are valuable
4. **Improve Documentation** - Clarify or expand guides
5. **Test Compatibility** - Try with different Next.js versions

## 📋 Guidelines

### Reporting Issues

When reporting an issue, please include:

- **Next.js version** you're using
- **Description** of the problem
- **Expected behavior** vs actual behavior
- **Code example** that reproduces the issue
- **Error messages** if applicable

**Example:**
```
Next.js: 14.2.3
Issue: Sitemap not generating correctly for dynamic routes
Expected: All blog posts should appear in sitemap
Actual: Only first 10 posts appear
Code: [paste relevant code]
```

### Suggesting Enhancements

For feature requests or improvements:

1. **Check existing issues** first to avoid duplicates
2. **Describe the use case** - What problem does it solve?
3. **Provide examples** - Show how it would work
4. **Consider SEO impact** - How does it improve search rankings?

**Example:**
```
Feature: Add LocalBusiness schema support
Use Case: Restaurants and physical stores need LocalBusiness schema
Example: Schema with address, hours, geo coordinates
SEO Impact: Enables Google Maps integration and local search
```

### Contributing Code

#### Before You Start

1. **Open an issue** to discuss your changes
2. **Check compatibility** with Agent Skills standard
3. **Review existing patterns** in SKILL.md

#### Code Standards

**For SKILL.md updates:**
- Keep instructions clear and concise
- Include code examples
- Follow imperative/infinitive form ("Configure metadata", not "Configuring metadata")
- Test examples with actual Next.js projects
- Keep token count reasonable (avoid verbose explanations)

**For reference files:**
- Organize by topic
- Include practical examples
- Reference official Next.js docs
- Keep up-to-date with latest Next.js features

**For scripts:**
- Add clear comments
- Include usage examples
- Test on multiple platforms (Mac, Linux, Windows)
- Handle errors gracefully

#### Pull Request Process

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/add-local-business-schema`
3. **Make your changes**
4. **Test thoroughly**:
   ```bash
   # Test with real Next.js project
   npm create next-app@latest test-app
   cd test-app
   # Apply your changes
   # Verify they work
   ```
5. **Update documentation** if needed
6. **Commit with clear messages**:
   ```bash
   git commit -m "Add LocalBusiness schema support
   
   - Add schema template for physical stores
   - Include opening hours and geo coordinates
   - Add example for restaurant use case
   - Update SKILL.md with implementation guide"
   ```
7. **Push and create PR**
8. **Describe your changes** in the PR description

#### PR Checklist

- [ ] Tested with actual Next.js project
- [ ] Documentation updated (if needed)
- [ ] Examples are clear and working
- [ ] Follows existing code style
- [ ] No breaking changes (or clearly documented)
- [ ] Compatible with Agent Skills standard

### Adding New SEO Patterns

When adding new SEO patterns:

1. **Verify with Google** - Check official Google Search Central docs
2. **Test impact** - Ensure it actually improves SEO
3. **Provide examples** - Show real implementation
4. **Include validation** - How to test it works

**Example structure:**
```markdown
## Video Schema (New Pattern)

### When to Use
Use for pages with video content to enable video rich results.

### Implementation
[code example]

### Validation
Test at: https://search.google.com/test/rich-results
```

## 🐛 Bug Fixes

For bug fixes:

1. **Describe the bug** clearly
2. **Explain the fix** - Why does this solve it?
3. **Test before submitting** - Ensure it actually fixes the issue
4. **Consider edge cases** - Does it work in all scenarios?

## 📝 Documentation Improvements

Documentation contributions are highly valued:

- Fix typos or unclear explanations
- Add missing examples
- Update outdated information
- Improve formatting for readability
- Add diagrams or visual aids

## 🧪 Testing

Before submitting:

1. **Create a test Next.js app**:
   ```bash
   npx create-next-app@latest test-seo
   cd test-seo
   ```

2. **Apply your changes**

3. **Verify with validation script**:
   ```bash
   node scripts/validate-seo.js
   ```

4. **Test in production build**:
   ```bash
   npm run build
   npm start
   ```

5. **Check with Lighthouse**:
   ```bash
   npx lighthouse http://localhost:3000 --view
   ```

## 🤔 Questions?

- Open a [GitHub Discussion](https://github.com/rajendraprasadn/nextjs-seo-optimizer/discussions)
- Create an issue with the `question` label
- Reach out on [Twitter/LinkedIn]

## 🙏 Recognition

All contributors will be acknowledged in:
- README.md contributors section
- Release notes
- Project documentation

Thank you for making Next.js SEO better for everyone! 🚀
