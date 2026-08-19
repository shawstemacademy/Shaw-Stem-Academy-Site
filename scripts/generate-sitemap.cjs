const fs = require('fs');
const path = require('path');

const DOMAIN = 'https://www.shawstemacademy.com';
const TODAY = new Date().toISOString().split('T')[0];

const ROUTES = [
  { path: '/', priority: '1.0', changefreq: 'daily', comment: 'Interactive Homepage & Main STEM Portal' },
  { path: '/about/', priority: '0.9', changefreq: 'weekly', comment: 'About Us, Accreditations & Google Verification' },
  { path: '/academics', priority: '0.9', changefreq: 'daily', comment: 'STEM Course Catalog & Syllabi' },
  { path: '/student', priority: '0.9', changefreq: 'daily', comment: 'Student Registration & Portal Hub' },
  { path: '/privacy', priority: '0.8', changefreq: 'monthly', comment: 'Privacy Policy & Data Protection' },
  { path: '/terms', priority: '0.8', changefreq: 'monthly', comment: 'Terms of Service & Portal Policies' },
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
