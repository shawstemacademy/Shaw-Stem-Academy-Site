const fs = require('fs');
const path = require('path');

const DOMAIN = 'https://www.shawstemacademy.com';
const TODAY = new Date().toISOString().split('T')[0];

const ROUTES = [
  { path: '/', priority: '1.0', changefreq: 'daily', comment: 'Interactive Homepage & Main Portal' },
  { path: '/about/', priority: '0.9', changefreq: 'weekly', comment: 'Server-rendered About & Google Disclosure Page' },
  { path: '/?tab=academics', priority: '0.9', changefreq: 'daily', comment: 'STEM Course Catalog & Department Curricula' },
  { path: '/?tab=student', priority: '0.9', changefreq: 'daily', comment: 'Student Portal & Class Registration Hub' },
  { path: '/?tab=login', priority: '0.7', changefreq: 'monthly', comment: 'Portal Authentication & Google Sign-In' },
  { path: '/?tab=privacy', priority: '0.8', changefreq: 'monthly', comment: 'Privacy Policy & Data Protection Governance' },
  { path: '/?tab=terms', priority: '0.8', changefreq: 'monthly', comment: 'Terms of Service & Portal Usage Agreements' },
];

function generateSitemap() {
  const xmlEntries = ROUTES.map((route) => {
    return `  <!-- ${route.comment} -->
  <url>
    <loc>${DOMAIN}${route.path}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`;
  }).join('\n\n');

  const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlEntries}
</urlset>
`;

  const targetPath = path.join(__dirname, '..', 'public', 'sitemap.xml');
  fs.writeFileSync(targetPath, sitemapContent, 'utf8');
  console.log(`✅ Successfully generated sitemap.xml at ${targetPath}`);
}

generateSitemap();
