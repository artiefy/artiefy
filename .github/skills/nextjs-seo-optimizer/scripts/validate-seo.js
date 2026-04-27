#!/usr/bin/env node

/**
 * Next.js SEO Validator
 *
 * This script validates your Next.js project's SEO implementation by checking:
 * - Metadata API usage
 * - Sitemap existence and validity
 * - robots.txt configuration
 * - Image optimization
 * - Performance best practices
 *
 * Usage:
 *   node scripts/validate-seo.js
 *   node scripts/validate-seo.js --url http://localhost:3000
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

class SEOValidator {
  constructor(options = {}) {
    this.baseUrl = options.url || 'http://localhost:3000';
    this.projectRoot = process.cwd();
    this.errors = [];
    this.warnings = [];
    this.passed = [];
  }

  log(message, type = 'info') {
    const colors = {
      error: '\x1b[31m',
      warning: '\x1b[33m',
      success: '\x1b[32m',
      info: '\x1b[36m',
      reset: '\x1b[0m',
    };

    const prefix = {
      error: '❌',
      warning: '⚠️ ',
      success: '✅',
      info: 'ℹ️ ',
    };

    console.log(`${colors[type]}${prefix[type]} ${message}${colors.reset}`);
  }

  async checkFileExists(filePath) {
    try {
      await fs.promises.access(path.join(this.projectRoot, filePath));
      return true;
    } catch {
      return false;
    }
  }

  async fetchUrl(url) {
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith('https') ? https : http;

      protocol
        .get(url, (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () =>
            resolve({
              data,
              statusCode: res.statusCode,
              headers: res.headers,
            })
          );
        })
        .on('error', reject);
    });
  }

  async validateSitemap() {
    this.log('\n📄 Validating Sitemap...', 'info');

    try {
      // Check for sitemap.ts in app directory
      const hasSitemapTs =
        (await this.checkFileExists('app/sitemap.ts')) ||
        (await this.checkFileExists('app/sitemap.js'));

      if (hasSitemapTs) {
        this.passed.push('Sitemap configuration file found (app/sitemap.ts)');
        this.log('Sitemap configuration file found', 'success');
      } else {
        this.warnings.push('No sitemap.ts found in app directory');
        this.log('No sitemap.ts found in app directory', 'warning');
      }

      // Check if sitemap is accessible
      try {
        const response = await this.fetchUrl(`${this.baseUrl}/sitemap.xml`);

        if (response.statusCode === 200) {
          this.passed.push('Sitemap accessible at /sitemap.xml');
          this.log('Sitemap accessible at /sitemap.xml', 'success');

          // Check if it's valid XML
          if (
            response.data.includes('<?xml') &&
            response.data.includes('urlset')
          ) {
            this.passed.push('Sitemap is valid XML');
            this.log('Sitemap is valid XML', 'success');
          } else {
            this.errors.push('Sitemap XML is malformed');
            this.log('Sitemap XML appears malformed', 'error');
          }
        } else {
          this.errors.push(`Sitemap returned status ${response.statusCode}`);
          this.log(`Sitemap returned status ${response.statusCode}`, 'error');
        }
      } catch (error) {
        this.errors.push('Sitemap not accessible at /sitemap.xml');
        this.log(
          'Sitemap not accessible - make sure server is running',
          'error'
        );
      }
    } catch (error) {
      this.errors.push(`Sitemap validation failed: ${error.message}`);
    }
  }

  async validateRobotsTxt() {
    this.log('\n🤖 Validating robots.txt...', 'info');

    try {
      // Check for robots.ts in app directory
      const hasRobotsTs =
        (await this.checkFileExists('app/robots.ts')) ||
        (await this.checkFileExists('app/robots.js'));

      if (hasRobotsTs) {
        this.passed.push('Robots configuration file found (app/robots.ts)');
        this.log('Robots configuration file found', 'success');
      }

      // Check static robots.txt
      const hasStaticRobots = await this.checkFileExists('public/robots.txt');
      if (hasStaticRobots) {
        this.warnings.push(
          'Static robots.txt found in public/ - this may conflict with app/robots.ts'
        );
        this.log(
          'Static robots.txt found - may conflict with dynamic config',
          'warning'
        );
      }

      // Check if robots.txt is accessible
      try {
        const response = await this.fetchUrl(`${this.baseUrl}/robots.txt`);

        if (response.statusCode === 200) {
          this.passed.push('robots.txt accessible at /robots.txt');
          this.log('robots.txt accessible', 'success');

          // Check for sitemap reference
          if (response.data.includes('Sitemap:')) {
            this.passed.push('robots.txt includes sitemap reference');
            this.log('Sitemap referenced in robots.txt', 'success');
          } else {
            this.warnings.push('robots.txt does not reference sitemap');
            this.log('No sitemap reference in robots.txt', 'warning');
          }

          // Check for user-agent
          if (response.data.includes('User-agent:')) {
            this.passed.push('robots.txt includes user-agent rules');
            this.log('User-agent rules found', 'success');
          } else {
            this.errors.push('robots.txt missing user-agent rules');
            this.log('Missing user-agent rules', 'error');
          }
        } else {
          this.errors.push(`robots.txt returned status ${response.statusCode}`);
          this.log(
            `robots.txt returned status ${response.statusCode}`,
            'error'
          );
        }
      } catch (error) {
        this.errors.push('robots.txt not accessible');
        this.log(
          'robots.txt not accessible - make sure server is running',
          'error'
        );
      }
    } catch (error) {
      this.errors.push(`robots.txt validation failed: ${error.message}`);
    }
  }

  async validateMetadata() {
    this.log('\n📋 Validating Metadata...', 'info');

    try {
      // Check for layout.tsx in app directory
      const layoutPath = path.join(this.projectRoot, 'app/layout.tsx');
      const hasLayout =
        (await this.checkFileExists('app/layout.tsx')) ||
        (await this.checkFileExists('app/layout.js'));

      if (hasLayout) {
        this.passed.push('Root layout file found');
        this.log('Root layout file found', 'success');

        // Read and check for metadata
        const layoutContent = fs.readFileSync(
          fs.existsSync(layoutPath)
            ? layoutPath
            : layoutPath.replace('.tsx', '.js'),
          'utf-8'
        );

        if (
          layoutContent.includes('export const metadata') ||
          layoutContent.includes('export async function generateMetadata')
        ) {
          this.passed.push('Metadata configuration found in root layout');
          this.log('Metadata configured in root layout', 'success');
        } else {
          this.warnings.push('No metadata found in root layout');
          this.log('Consider adding metadata to root layout', 'warning');
        }

        if (layoutContent.includes('metadataBase')) {
          this.passed.push('metadataBase configured');
          this.log('metadataBase configured', 'success');
        } else {
          this.warnings.push(
            'metadataBase not found - required for absolute URLs'
          );
          this.log('metadataBase not configured', 'warning');
        }
      } else {
        this.errors.push('Root layout file not found');
        this.log('Root layout file not found', 'error');
      }
    } catch (error) {
      this.errors.push(`Metadata validation failed: ${error.message}`);
    }
  }

  async validateNextConfig() {
    this.log('\n⚙️  Validating next.config.js...', 'info');

    try {
      const configPath = path.join(this.projectRoot, 'next.config.js');
      const hasMjs = await this.checkFileExists('next.config.mjs');
      const hasJs = await this.checkFileExists('next.config.js');

      if (!hasJs && !hasMjs) {
        this.warnings.push('next.config.js not found');
        this.log('No next.config.js found', 'warning');
        return;
      }

      const configContent = fs.readFileSync(
        hasMjs ? configPath.replace('.js', '.mjs') : configPath,
        'utf-8'
      );

      // Check for image optimization
      if (configContent.includes('images:')) {
        this.passed.push('Image configuration found');
        this.log('Image optimization configured', 'success');
      }

      // Check for compression
      if (
        configContent.includes('compress: true') ||
        !configContent.includes('compress: false')
      ) {
        this.passed.push('Compression enabled (default or explicit)');
        this.log('Compression enabled', 'success');
      }
    } catch (error) {
      this.warnings.push(`Could not validate next.config.js: ${error.message}`);
    }
  }

  printReport() {
    this.log('\n' + '='.repeat(60), 'info');
    this.log('SEO Validation Report', 'info');
    this.log('='.repeat(60) + '\n', 'info');

    if (this.passed.length > 0) {
      this.log(`✅ Passed (${this.passed.length}):`, 'success');
      this.passed.forEach((item) => console.log(`   • ${item}`));
    }

    if (this.warnings.length > 0) {
      this.log(`\n⚠️  Warnings (${this.warnings.length}):`, 'warning');
      this.warnings.forEach((item) => console.log(`   • ${item}`));
    }

    if (this.errors.length > 0) {
      this.log(`\n❌ Errors (${this.errors.length}):`, 'error');
      this.errors.forEach((item) => console.log(`   • ${item}`));
    }

    this.log('\n' + '='.repeat(60), 'info');

    const totalChecks =
      this.passed.length + this.warnings.length + this.errors.length;
    const score = Math.round((this.passed.length / totalChecks) * 100);

    this.log(
      `\nSEO Score: ${score}%`,
      score >= 80 ? 'success' : score >= 50 ? 'warning' : 'error'
    );

    if (this.errors.length === 0 && this.warnings.length === 0) {
      this.log('\n🎉 Perfect! Your SEO configuration looks great!', 'success');
    } else if (this.errors.length === 0) {
      this.log(
        '\n👍 Good job! Address the warnings to improve your SEO.',
        'success'
      );
    } else {
      this.log(
        '\n⚠️  Please fix the errors above to improve your SEO.',
        'warning'
      );
    }
  }

  async run() {
    this.log('🔍 Starting Next.js SEO Validation...', 'info');
    this.log(`Testing: ${this.baseUrl}\n`, 'info');

    await this.validateSitemap();
    await this.validateRobotsTxt();
    await this.validateMetadata();
    await this.validateNextConfig();

    this.printReport();
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const urlArg = args.find((arg) => arg.startsWith('--url='));
const url = urlArg ? urlArg.split('=')[1] : undefined;

// Run validator
const validator = new SEOValidator({ url });
validator.run().catch((error) => {
  console.error('Validation failed:', error);
  process.exit(1);
});
