/**
 * IndexNow bulk submission — roysecityjunkremoval.com
 * Submits all indexable URLs to IndexNow (auto-distributes to Bing, Yandex, etc.)
 *
 * Usage:
 *   node scripts/indexnow-submit.mjs
 *
 * Requires internet access. Run after every production deploy that adds/changes pages.
 */

const KEY  = 'j51vv433a7v6639ja8avqf5td35bakan';
const HOST = 'www.roysecityjunkremoval.com';

const URLS = [
  `https://${HOST}/`,
  `https://${HOST}/services`,
  `https://${HOST}/service-areas`,
  `https://${HOST}/about`,
  `https://${HOST}/contact`,
  `https://${HOST}/residential-junk-removal-royse-city-tx`,
  `https://${HOST}/commercial-junk-removal-royse-city-tx`,
  `https://${HOST}/furniture-removal-royse-city-tx`,
  `https://${HOST}/appliance-removal-royse-city-tx`,
  `https://${HOST}/estate-cleanout-royse-city-tx`,
  `https://${HOST}/garage-cleanout-royse-city-tx`,
  `https://${HOST}/construction-debris-removal-royse-city-tx`,
  `https://${HOST}/hot-tub-removal-royse-city-tx`,
  `https://${HOST}/yard-waste-removal-royse-city-tx`,
  `https://${HOST}/mattress-disposal-royse-city-tx`,
  `https://${HOST}/e-waste-removal-royse-city-tx`,
  `https://${HOST}/office-cleanout-royse-city-tx`,
  `https://${HOST}/junk-removal-caddo-mills-tx`,
  `https://${HOST}/junk-removal-rockwall-tx`,
  `https://${HOST}/junk-removal-heath-tx`,
  `https://${HOST}/junk-removal-fate-tx`,
  `https://${HOST}/junk-removal-greenville-tx`,
  `https://${HOST}/junk-removal-forney-tx`,
  `https://${HOST}/junk-removal-terrell-tx`,
  `https://${HOST}/junk-removal-wylie-tx`,
  `https://${HOST}/junk-removal-sachse-tx`,
  `https://${HOST}/junk-removal-quinlan-tx`,
  `https://${HOST}/privacy-policy`,
];

const payload = {
  host:    HOST,
  key:     KEY,
  keyLocation: `https://${HOST}/${KEY}.txt`,
  urlList: URLS,
};

console.log(`Submitting ${URLS.length} URLs to IndexNow…`);

const res = await fetch('https://api.indexnow.org/indexnow', {
  method:  'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body:    JSON.stringify(payload),
});

if (res.ok || res.status === 202) {
  console.log(`✅  IndexNow accepted (HTTP ${res.status}) — URLs queued for crawl.`);
} else {
  const body = await res.text().catch(() => '');
  console.error(`❌  IndexNow returned HTTP ${res.status}: ${body}`);
  process.exit(1);
}
