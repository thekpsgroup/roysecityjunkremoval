import fs from "node:fs";
import path from "node:path";
import https from "node:https";

const ROOT = process.cwd();
const DOMAIN = "https://www.roysecityjunkremoval.com";
const TODAY = new Date().toISOString().slice(0, 10);
const WRITE_SITEMAP = process.argv.includes("--write-sitemap");
const LIVE_CHECK = process.argv.includes("--live");

function read(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function listHtmlFiles() {
  return fs
    .readdirSync(ROOT)
    .filter((name) => name.endsWith(".html"))
    .sort((a, b) => a.localeCompare(b));
}

function routeFromFile(file) {
  if (file === "index.html") return "/";
  return `/${file.replace(/\.html$/, "")}`;
}

function extractCanonical(html) {
  const m = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i);
  return m ? m[1].trim() : "";
}

function hasNoindex(html) {
  const m = html.match(/<meta\s+name=["']robots["']\s+content=["']([^"']+)["']/i);
  return m ? /noindex/i.test(m[1]) : false;
}

function extractJsonLdBlocks(html) {
  const blocks = [];
  const re = /<script\s+type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/gi;
  let match = re.exec(html);
  while (match) {
    blocks.push(match[1]);
    match = re.exec(html);
  }
  return blocks;
}

function parseSitemap(xml) {
  const entries = [];
  const urlRe = /<url>[\s\S]*?<loc>([^<]+)<\/loc>[\s\S]*?<lastmod>([^<]+)<\/lastmod>[\s\S]*?<changefreq>([^<]+)<\/changefreq>[\s\S]*?<priority>([^<]+)<\/priority>[\s\S]*?<\/url>/g;
  let match = urlRe.exec(xml);
  while (match) {
    entries.push({
      loc: match[1].trim(),
      lastmod: match[2].trim(),
      changefreq: match[3].trim(),
      priority: match[4].trim(),
    });
    match = urlRe.exec(xml);
  }
  return entries;
}

function buildSitemap(entries) {
  const lines = [];
  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
  for (const e of entries) {
    lines.push("  <url>");
    lines.push(`    <loc>${e.loc}</loc>`);
    lines.push(`    <lastmod>${e.lastmod}</lastmod>`);
    lines.push(`    <changefreq>${e.changefreq}</changefreq>`);
    lines.push(`    <priority>${e.priority}</priority>`);
    lines.push("  </url>");
  }
  lines.push("</urlset>");
  lines.push("");
  return lines.join("\n");
}

function extractInternalLinks(html, file) {
  const issues = [];
  const re = /href=["']([^"']+)["']/gi;
  let match = re.exec(html);
  while (match) {
    const href = match[1].trim();
    const isInternalAbsolute = href.startsWith(`${DOMAIN}/`);
    const isRelativeRoot = href.startsWith("/");
    if (!isInternalAbsolute && !isRelativeRoot) {
      match = re.exec(html);
      continue;
    }

    const pathValue = isInternalAbsolute ? href.replace(DOMAIN, "") : href;

    if (pathValue.endsWith(".html") || pathValue.includes("index.html")) {
      issues.push({ file, href, reason: "Uses .html path that may redirect" });
    }

    if (/^\/[^?#]+\/$/.test(pathValue) && pathValue !== "/") {
      issues.push({ file, href, reason: "Trailing slash variant may redirect" });
    }
  }
  return issues;
}

function findImgsMissingDimensions(html, file) {
  const issues = [];
  const re = /<img\b[^>]*>/gi;
  let match = re.exec(html);
  while (match) {
    const tag = match[0];
    if (!/\bwidth=/.test(tag) || !/\bheight=/.test(tag)) {
      const srcMatch = tag.match(/src=["']([^"']+)["']/i);
      issues.push({ file, src: srcMatch ? srcMatch[1] : "(unknown)" });
    }
    match = re.exec(html);
  }
  return issues;
}

function headStatus(url) {
  return new Promise((resolve) => {
    const req = https.request(url, { method: "HEAD" }, (res) => {
      const status = res.statusCode || 0;
      const location = res.headers.location || "";
      resolve({ url, status, location });
    });

    req.on("error", (err) => {
      resolve({ url, status: 0, location: "", error: err.message });
    });

    req.setTimeout(15000, () => {
      req.destroy(new Error("timeout"));
    });

    req.end();
  });
}

async function main() {
  const htmlFiles = listHtmlFiles();
  const pages = [];
  const missingCanonicals = [];
  const canonicalMismatches = [];
  const jsonLdErrors = [];
  const linkNormalizationIssues = [];
  const imgDimensionIssues = [];

  for (const file of htmlFiles) {
    const fullPath = path.join(ROOT, file);
    const html = read(fullPath);
    const route = routeFromFile(file);
    const canonical = extractCanonical(html);
    const noindex = hasNoindex(html);

    pages.push({ file, route, canonical, noindex });

    if (!canonical) {
      missingCanonicals.push(file);
    } else if (!canonical.startsWith(DOMAIN)) {
      canonicalMismatches.push({ file, canonical, reason: "Non-canonical host/protocol" });
    }

    const ldBlocks = extractJsonLdBlocks(html);
    for (const [idx, block] of ldBlocks.entries()) {
      try {
        JSON.parse(block.trim());
      } catch (err) {
        jsonLdErrors.push({ file, index: idx + 1, error: err.message });
      }
    }

    linkNormalizationIssues.push(...extractInternalLinks(html, file));
    imgDimensionIssues.push(...findImgsMissingDimensions(html, file));
  }

  const robots = read(path.join(ROOT, "robots.txt"));
  const sitemapXmlPath = path.join(ROOT, "sitemap.xml");
  const sitemapXml = read(sitemapXmlPath);
  const sitemapEntries = parseSitemap(sitemapXml);

  const priorityMap = new Map(sitemapEntries.map((e) => [e.loc, { changefreq: e.changefreq, priority: e.priority }]));

  const indexablePages = pages.filter((p) => !p.noindex && p.file !== "404.html");
  const expectedUrls = indexablePages.map((p) => `${DOMAIN}${p.route === "/" ? "/" : p.route}`);

  const sitemapUrls = sitemapEntries.map((e) => e.loc);
  const missingInSitemap = expectedUrls.filter((url) => !sitemapUrls.includes(url));
  const extraInSitemap = sitemapUrls.filter((url) => !expectedUrls.includes(url));

  if (WRITE_SITEMAP) {
    const regenerated = expectedUrls
      .slice()
      .sort((a, b) => {
        if (a === `${DOMAIN}/`) return -1;
        if (b === `${DOMAIN}/`) return 1;
        return a.localeCompare(b);
      })
      .map((loc) => {
        const current = priorityMap.get(loc);
        return {
          loc,
          lastmod: TODAY,
          changefreq: current?.changefreq || "monthly",
          priority: current?.priority || "0.8",
        };
      });

    fs.writeFileSync(sitemapXmlPath, buildSitemap(regenerated), "utf8");
  }

  const liveChecks = LIVE_CHECK ? await Promise.all(sitemapUrls.map((url) => headStatus(url))) : [];
  const liveIssues = liveChecks.filter((r) => r.status !== 200);

  const robotsSitemapLineOk = /Sitemap:\s*https:\/\/www\.roysecityjunkremoval\.com\/sitemap\.xml/i.test(robots);

  const reportLines = [];
  reportLines.push("# SEO Validation Report");
  reportLines.push("");
  reportLines.push(`- Date: ${TODAY}`);
  reportLines.push(`- Pages scanned: ${pages.length}`);
  reportLines.push(`- Sitemap entries: ${sitemapUrls.length}`);
  reportLines.push(`- Sitemap regenerated: ${WRITE_SITEMAP ? "yes" : "no"}`);
  reportLines.push("");

  reportLines.push("## Link Normalization");
  reportLines.push(`- Redirect-risk internal links found: ${linkNormalizationIssues.length}`);
  for (const issue of linkNormalizationIssues.slice(0, 30)) {
    reportLines.push(`- ${issue.file}: ${issue.href} (${issue.reason})`);
  }
  reportLines.push("");

  reportLines.push("## Technical SEO");
  reportLines.push(`- robots.txt sitemap line valid: ${robotsSitemapLineOk ? "yes" : "no"}`);
  reportLines.push(`- Missing canonical tags: ${missingCanonicals.length}`);
  reportLines.push(`- Canonical host/protocol mismatches: ${canonicalMismatches.length}`);
  reportLines.push(`- JSON-LD parse errors: ${jsonLdErrors.length}`);
  reportLines.push(`- Missing in sitemap: ${missingInSitemap.length}`);
  reportLines.push(`- Extra in sitemap: ${extraInSitemap.length}`);
  reportLines.push(`- Live non-200 sitemap URLs: ${LIVE_CHECK ? liveIssues.length : "not run (use --live)"}`);

  for (const item of missingInSitemap) reportLines.push(`- Missing URL: ${item}`);
  for (const item of extraInSitemap) reportLines.push(`- Extra URL: ${item}`);
  for (const item of liveIssues.slice(0, 30)) {
    reportLines.push(`- Live issue: ${item.url} -> ${item.status}${item.location ? ` (${item.location})` : ""}${item.error ? ` (${item.error})` : ""}`);
  }

  reportLines.push("");
  reportLines.push("## Mobile Conversion QA Signals");
  reportLines.push(`- Images missing explicit dimensions: ${imgDimensionIssues.length}`);
  for (const item of imgDimensionIssues.slice(0, 50)) {
    reportLines.push(`- ${item.file}: ${item.src}`);
  }

  const reportPath = path.join(ROOT, "docs", "seo-validation-report.md");
  fs.writeFileSync(reportPath, `${reportLines.join("\n")}\n`, "utf8");

  console.log(`Wrote docs/seo-validation-report.md`);
  console.log(`Summary:`);
  console.log(`  link normalization issues: ${linkNormalizationIssues.length}`);
  console.log(`  missing canonicals: ${missingCanonicals.length}`);
  console.log(`  json-ld errors: ${jsonLdErrors.length}`);
  console.log(`  missing in sitemap: ${missingInSitemap.length}`);
  console.log(`  extra in sitemap: ${extraInSitemap.length}`);
  console.log(`  live non-200 URLs: ${LIVE_CHECK ? liveIssues.length : "not run"}`);
  console.log(`  images missing dimensions: ${imgDimensionIssues.length}`);

  const hasBlockingIssues =
    missingCanonicals.length > 0 ||
    canonicalMismatches.length > 0 ||
    jsonLdErrors.length > 0 ||
    missingInSitemap.length > 0 ||
    (LIVE_CHECK && liveIssues.length > 0);

  process.exitCode = hasBlockingIssues ? 2 : 0;
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
