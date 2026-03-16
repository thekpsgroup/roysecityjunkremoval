// Royse City Junk Removal — Contact Form Handler
// Powered by Resend | roysecityjunkremoval.com
// Environment variables needed:
//   RESEND_API_KEY       — from resend.com dashboard
//   RESEND_FROM          — verified sender e.g. "Royse City Junk Removal <noreply@i30builders.com>"
//   REDIS_URL            — Redis connection string for rate limiting
//   META_CAPI_TOKEN      — Meta System User access token (enables Conversions API)
//   META_TEST_EVENT_CODE — (optional) test event code from Meta Events Manager

const { Resend } = require('resend');
const Redis      = require('ioredis');
const crypto     = require('crypto');

// --- Meta Conversions API ---
const FB_PIXEL_ID = '2040716276843820';

function sha256(value) {
  if (!value) return undefined;
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function normPhoneServer(ph) {
  const d = (ph || '').replace(/\D/g, '');
  return d.length === 10 ? '1' + d : d;
}

async function sendCapiEvent({
  accessToken, testEventCode,
  eventName, eventId, eventTime,
  eventSourceUrl, ipAddress, userAgent,
  email, phone, firstName, lastName, fbp, fbc,
  customData,
}) {
  const userData = {};
  if (email)     userData.em = sha256(email.toLowerCase().trim());
  if (phone)     userData.ph = sha256(normPhoneServer(phone));
  if (firstName) userData.fn = sha256(firstName.toLowerCase().trim());
  if (lastName)  userData.ln = sha256(lastName.toLowerCase().trim());
  if (ipAddress) userData.client_ip_address = ipAddress;
  if (userAgent) userData.client_user_agent = userAgent;
  if (fbp)       userData.fbp = fbp; // cookie value — not hashed per Meta spec
  if (fbc)       userData.fbc = fbc; // cookie value — not hashed per Meta spec

  const payload = {
    data: [{
      event_name:       eventName,
      event_time:       eventTime,
      event_id:         eventId,
      action_source:    'website',
      event_source_url: eventSourceUrl,
      user_data:        userData,
      custom_data:      customData,
    }],
  };
  if (testEventCode) payload.test_event_code = testEventCode;

  const url = `https://graph.facebook.com/v21.0/${FB_PIXEL_ID}/events?access_token=${encodeURIComponent(accessToken)}`;

  const capiRes = await fetch(url, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
    signal:  AbortSignal.timeout(8000),
  });

  const json = await capiRes.json().catch(() => ({}));
  if (!capiRes.ok) {
    throw new Error(`CAPI HTTP ${capiRes.status}: ${JSON.stringify(json?.error ?? json)}`);
  }
  return json;
}

// --- Redis-backed rate limiter (persists across serverless invocations) ---
const RATE_LIMIT_WINDOW = 15 * 60; // 15 minutes in seconds
const RATE_LIMIT_MAX = 5;          // max submissions per window per IP

let redis;
function getRedis() {
  if (!redis && process.env.REDIS_URL) {
    redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      connectTimeout: 3000,
      lazyConnect: true,
    });
    redis.on('error', () => {}); // suppress unhandled errors; failures fall through gracefully
  }
  return redis;
}

async function rateLimit(ip) {
  const client = getRedis();
  if (!client) return true; // no Redis configured — allow through

  try {
    const key = `rl:contact:${ip}`;
    const count = await client.incr(key);
    if (count === 1) await client.expire(key, RATE_LIMIT_WINDOW);
    return count <= RATE_LIMIT_MAX;
  } catch {
    return true; // Redis error — fail open so real users aren't blocked
  }
}

const SERVICE_LABELS = {
  residential:   'Residential Junk Removal',
  commercial:    'Commercial Junk Removal',
  furniture:     'Furniture Removal',
  appliances:    'Appliance Removal',
  estate:        'Estate Cleanout',
  garage:        'Garage / Attic Cleanout',
  construction:  'Construction Debris Removal',
  hottub:        'Hot Tub Removal',
  yard:          'Yard Waste / Brush Removal',
  mattress:      'Mattress Disposal',
  electronics:   'Electronics / E-Waste',
  office:        'Office Cleanout',
  other:         'Other / Multiple Services',
};

const TIMING_LABELS = {
  today:      'Today (Same Day)',
  tomorrow:   'Tomorrow',
  'this-week':'This Week',
  'next-week':'Next Week',
  flexible:   "I'm Flexible",
};

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildNotificationHtml(d) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>New Quote Request</title></head>
<body style="margin:0;padding:0;background:#f0f4f0;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f0;padding:30px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:#000000;padding:28px 36px;text-align:center;">
            <p style="margin:0;color:#6CBE45;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Royse City Junk Removal</p>
            <h1 style="margin:8px 0 0;color:#ffffff;font-size:22px;">New Quote Request 🎉</h1>
          </td>
        </tr>

        <!-- Urgency Banner -->
        <tr>
          <td style="background:#6CBE45;padding:12px 36px;text-align:center;">
            <p style="margin:0;color:#ffffff;font-size:14px;font-weight:700;">
              ⚡ ${d.timing === 'today' ? 'SAME-DAY REQUEST — Respond ASAP!' : 'New lead — aim to call within 1 hour'}
            </p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px 36px;">
            <h2 style="margin:0 0 20px;color:#000000;font-size:18px;">Contact Details</h2>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:10px 0;border-bottom:1px solid #eef5ea;">
                  <span style="color:#6b8a60;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Name</span><br>
                  <span style="color:#000000;font-size:16px;font-weight:700;">${escapeHtml(d.firstName)} ${escapeHtml(d.lastName)}</span>
                </td>
              </tr>
              <tr>
                <td style="padding:10px 0;border-bottom:1px solid #eef5ea;">
                  <span style="color:#6b8a60;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Phone</span><br>
                  <a href="tel:${escapeHtml(d.phone)}" style="color:#4d8e2c;font-size:18px;font-weight:700;text-decoration:none;">${escapeHtml(d.phone)}</a>
                </td>
              </tr>
              ${d.email ? `
              <tr>
                <td style="padding:10px 0;border-bottom:1px solid #eef5ea;">
                  <span style="color:#6b8a60;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Email</span><br>
                  <a href="mailto:${escapeHtml(d.email)}" style="color:#4d8e2c;font-size:15px;text-decoration:none;">${escapeHtml(d.email)}</a>
                </td>
              </tr>` : ''}
              <tr>
                <td style="padding:10px 0;border-bottom:1px solid #eef5ea;">
                  <span style="color:#6b8a60;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Property Address / City</span><br>
                  <span style="color:#000000;font-size:15px;">${escapeHtml(d.address)}</span>
                </td>
              </tr>
              <tr>
                <td style="padding:10px 0;border-bottom:1px solid #eef5ea;">
                  <span style="color:#6b8a60;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Service Requested</span><br>
                  <span style="color:#000000;font-size:15px;font-weight:700;">${escapeHtml(SERVICE_LABELS[d.service] || d.service)}</span>
                </td>
              </tr>
              ${d.timing ? `
              <tr>
                <td style="padding:10px 0;border-bottom:1px solid #eef5ea;">
                  <span style="color:#6b8a60;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Timing</span><br>
                  <span style="color:#000000;font-size:15px;">${escapeHtml(TIMING_LABELS[d.timing] || d.timing)}</span>
                </td>
              </tr>` : ''}
              <tr>
                <td style="padding:10px 0;${(d.utmSource && d.utmSource !== 'direct') || d.fbclid || d.gclid || d.msclkid ? 'border-bottom:1px solid #eef5ea;' : ''}">
                  <span style="color:#6b8a60;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Job Description</span><br>
                  <p style="color:#2a3328;font-size:15px;line-height:1.6;margin:6px 0 0;background:#f7fcf4;padding:12px;border-radius:8px;border-left:3px solid #6CBE45;white-space:pre-wrap;">${escapeHtml(d.description)}</p>
                </td>
              </tr>
              ${(d.utmSource && d.utmSource !== 'direct') || d.fbclid || d.gclid || d.msclkid ? `
              <tr>
                <td style="padding:10px 0;">
                  <span style="color:#6b8a60;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Traffic Source</span><br>
                  <span style="color:#000000;font-size:14px;">${escapeHtml(d.utmSource || 'direct')} / ${escapeHtml(d.utmMedium || 'none')}${d.utmCampaign ? ' &mdash; ' + escapeHtml(d.utmCampaign) : ''}</span>
                  ${d.utmTerm    ? `<br><span style="color:#6b8a60;font-size:12px;">Keyword: ${escapeHtml(d.utmTerm)}</span>` : ''}
                  ${d.utmContent ? `<br><span style="color:#6b8a60;font-size:12px;">Content: ${escapeHtml(d.utmContent)}</span>` : ''}
                  ${d.fbclid  ? `<br><span style="color:#6b8a60;font-size:12px;">&#x1F4F1; Facebook Ad click (fbclid present)</span>` : ''}
                  ${d.gclid   ? `<br><span style="color:#6b8a60;font-size:12px;">&#x1F50D; Google Ad click (gclid present)</span>` : ''}
                  ${d.msclkid ? `<br><span style="color:#6b8a60;font-size:12px;">&#x1F4BB; Microsoft Ad click (msclkid present)</span>` : ''}
                </td>
              </tr>` : ''}
            </table>
          </td>
        </tr>

        <!-- CTA -->
        <tr>
          <td style="padding:0 36px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" style="background:#f7fcf4;border-radius:10px;padding:20px;">
                  <p style="margin:0 0 12px;color:#566052;font-size:14px;">Ready to close this lead?</p>
                  <a href="tel:${escapeHtml(d.phone)}" style="display:inline-block;background:#6CBE45;color:#ffffff;font-size:16px;font-weight:700;padding:13px 32px;border-radius:8px;text-decoration:none;">📞 Call ${escapeHtml(d.phone)}</a>
                  ${d.email ? `<br><a href="mailto:${escapeHtml(d.email)}" style="display:inline-block;margin-top:10px;color:#4d8e2c;font-size:14px;">✉️ Reply by email</a>` : ''}
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f7fcf4;padding:16px 36px;text-align:center;border-top:1px solid #d2e8c4;">
            <p style="margin:0;color:#8a9e88;font-size:12px;">
              Royse City Junk Removal · Operated by I30 Builders LLC<br>
              2346 FM 36, Caddo Mills, TX 75135 · 469-721-0145
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildConfirmationHtml(d) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>We Got Your Request!</title></head>
<body style="margin:0;padding:0;background:#f0f4f0;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f0;padding:30px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">

        <tr>
          <td style="background:#000000;padding:28px 36px;text-align:center;">
            <p style="margin:0;color:#6CBE45;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Royse City Junk Removal</p>
            <h1 style="margin:8px 0 0;color:#ffffff;font-size:22px;">We Got Your Request! ✅</h1>
          </td>
        </tr>

        <tr>
          <td style="padding:36px;">
            <p style="color:#2a3328;font-size:16px;line-height:1.6;margin:0 0 16px;">Hi <strong>${escapeHtml(d.firstName)}</strong>,</p>
            <p style="color:#2a3328;font-size:16px;line-height:1.6;margin:0 0 16px;">
              Thank you for contacting <strong>Royse City Junk Removal</strong>! We've received your quote request for <strong>${escapeHtml(SERVICE_LABELS[d.service] || d.service)}</strong> and our team will be in touch within <strong>1 business hour</strong>.
            </p>
            <p style="color:#2a3328;font-size:16px;line-height:1.6;margin:0 0 24px;">
              For <strong>immediate assistance or same-day service</strong>, don't hesitate to call us directly:
            </p>

            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" style="background:#f7fcf4;border-radius:10px;padding:20px;border:1px solid #d2e8c4;">
                  <a href="tel:+14697210145" style="display:block;color:#6CBE45;font-size:28px;font-weight:900;text-decoration:none;font-family:Arial,sans-serif;">📞 469-721-0145</a>
                  <p style="margin:8px 0 0;color:#566052;font-size:13px;">Mon – Sat · 7:00 AM – 7:00 PM</p>
                </td>
              </tr>
            </table>

            <hr style="border:none;border-top:1px solid #eef5ea;margin:28px 0;">

            <h3 style="color:#000000;font-size:16px;margin:0 0 12px;">Your Request Summary</h3>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f7fcf4;border-radius:8px;padding:16px;">
              <tr><td style="padding:6px 16px;color:#566052;font-size:14px;"><strong style="color:#000000;">Service:</strong> ${escapeHtml(SERVICE_LABELS[d.service] || d.service)}</td></tr>
              <tr><td style="padding:6px 16px;color:#566052;font-size:14px;"><strong style="color:#000000;">Location:</strong> ${escapeHtml(d.address)}</td></tr>
              ${d.timing ? `<tr><td style="padding:6px 16px;color:#566052;font-size:14px;"><strong style="color:#000000;">Timing:</strong> ${escapeHtml(TIMING_LABELS[d.timing] || d.timing)}</td></tr>` : ''}
            </table>

            <p style="color:#8a9e88;font-size:13px;line-height:1.6;margin:24px 0 0;">
              Royse City Junk Removal is an <em>I30 Builders Company</em> serving Royse City, Rockwall, Heath, Fate, Caddo Mills, Greenville, and surrounding areas of Northeast Texas.
            </p>
          </td>
        </tr>

        <tr>
          <td style="background:#f7fcf4;padding:16px 36px;text-align:center;border-top:1px solid #d2e8c4;">
            <p style="margin:0;color:#8a9e88;font-size:12px;">
              © Royse City Junk Removal · Operated by I30 Builders LLC<br>
              2346 FM 36, Caddo Mills, TX 75135
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

module.exports = async function handler(req, res) {
  const allowedOrigins = new Set([
    'https://roysecityjunkremoval.com',
    'https://www.roysecityjunkremoval.com',
    'http://localhost:8080',
  ]);

  const requestOrigin = req.headers.origin;

  // CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Vary', 'Origin');
  if (requestOrigin && allowedOrigins.has(requestOrigin)) {
    res.setHeader('Access-Control-Allow-Origin', requestOrigin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', 'https://roysecityjunkremoval.com');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Rate limit by IP (Redis-backed, persists across serverless invocations)
  const clientIp = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim();
  if (!(await rateLimit(clientIp))) {
    return res.status(429).json({ error: 'Too many requests. Please try again later or call us at 469-721-0145.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const {
      first_name: firstName = '',
      last_name:  lastName  = '',
      phone       = '',
      email       = '',
      address     = '',
      service     = '',
      description = '',
      timing      = '',
      website     = '',  // honeypot field — bots fill this, humans leave it blank
      consent_contact: consentContact = '',
      // Attribution & Meta Pixel Conversions API fields
      utm_source:   utmSource   = '',
      utm_medium:   utmMedium   = '',
      utm_campaign: utmCampaign = '',
      utm_term:     utmTerm     = '',
      utm_content:  utmContent  = '',
      gclid         = '',
      msclkid       = '',
      fbclid        = '',
      fb_event_id:  fbEventId   = '',
      fbp           = '',
      fbc           = '',
      form_source:  formSource  = '',
      page_url:     pageUrl     = '',
    } = body || {};

    // Cap attribution string lengths — prevents oversized strings reaching the email
    const capAttr = (s, n = 200) => String(s || '').slice(0, n);

    // Honeypot check — silently discard bot submissions
    if (website.trim()) {
      console.log('[Honeypot] blocked ip=%s', clientIp);
      return res.status(200).json({ success: true });
    }

    // Validate required fields
    const missing = [];
    if (!firstName.trim()) missing.push('first name');
    if (!lastName.trim())  missing.push('last name');
    if (!phone.trim())     missing.push('phone');
    if (!address.trim())   missing.push('address');
    if (!service.trim())   missing.push('service');
    if (!description.trim()) missing.push('description');
    if (String(consentContact).trim().toLowerCase() !== 'yes') missing.push('contact consent');

    if (missing.length) {
      console.warn('[Validation] missing fields ip=%s fields=%s', clientIp, missing.join(', '));
      return res.status(400).json({ error: 'Please fill in all required fields.' });
    }

    // Server-side field length caps — client maxlength is easily bypassed
    if (firstName.length  > 100) return res.status(400).json({ error: 'Invalid input.' });
    if (lastName.length   > 100) return res.status(400).json({ error: 'Invalid input.' });
    if (phone.length      >  30) return res.status(400).json({ error: 'Invalid input.' });
    if (email.length      > 254) return res.status(400).json({ error: 'Invalid input.' });
    if (address.length    > 300) return res.status(400).json({ error: 'Invalid input.' });
    if (description.length > 600) return res.status(400).json({ error: 'Invalid input.' });

    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY environment variable is not set');
      return res.status(500).json({ error: 'Email service not configured' });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    const fromAddress = process.env.RESEND_FROM || 'Royse City Junk Removal <onboarding@resend.dev>';
    const notifyTo    = process.env.NOTIFY_EMAIL || 'sales@i30builders.com';
    const validEmail  = email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const d = {
      firstName, lastName, phone, email, address, service, description, timing,
      utmSource:   capAttr(utmSource),
      utmMedium:   capAttr(utmMedium),
      utmCampaign: capAttr(utmCampaign),
      utmTerm:     capAttr(utmTerm),
      utmContent:  capAttr(utmContent),
      gclid:       capAttr(gclid,   100),
      msclkid:     capAttr(msclkid, 100),
      fbclid:      capAttr(fbclid,  100),
      fbEventId:   capAttr(fbEventId, 100),
      fbp:         capAttr(fbp,     100),
      fbc:         capAttr(fbc,     200),
      formSource:  capAttr(formSource, 20),
      pageUrl:     capAttr(pageUrl,    500),
    };

    if (d.fbEventId) {
      console.log('[Meta] event_id=%s form=%s fbclid=%s',
        d.fbEventId, d.formSource || 'unknown', d.fbclid ? '[present]' : 'none');
    }

    // Ad-platform tag for quick subject-line scanning
    const platformTag = d.fbclid ? ' [FB]' : d.gclid ? ' [GGL]' : d.msclkid ? ' [MSFT]' : '';

    // Build email sends
    const emailSends = [
      resend.emails.send({
        from:    fromAddress,
        to:      [notifyTo],
        subject: `New Quote: ${firstName} ${lastName} — ${SERVICE_LABELS[service] || service} (${TIMING_LABELS[timing] || timing || 'Flexible'})${platformTag}`,
        html:    buildNotificationHtml(d),
        replyTo: validEmail ? email : undefined,
      }),
    ];

    if (validEmail) {
      emailSends.push(
        resend.emails.send({
          from:    fromAddress,
          to:      [email],
          subject: 'We received your junk removal request — Royse City Junk Removal',
          html:    buildConfirmationHtml(d),
        })
      );
    }

    // Meta Conversions API — runs concurrently with emails
    // Failure is logged and silently swallowed; never blocks the success response
    const capiToken   = process.env.META_CAPI_TOKEN;
    const safePageUrl = /^https?:\/\//.test(d.pageUrl)
      ? d.pageUrl
      : `https://www.roysecityjunkremoval.com/`;

    const capiPromise = capiToken
      ? sendCapiEvent({
          accessToken:    capiToken,
          testEventCode:  process.env.META_TEST_EVENT_CODE || undefined,
          eventName:      'Lead',
          eventId:        d.fbEventId || `srv_${crypto.randomUUID()}`,
          eventTime:      Math.floor(Date.now() / 1000),
          eventSourceUrl: safePageUrl,
          ipAddress:      clientIp,
          userAgent:      req.headers['user-agent'] || '',
          email, phone, firstName, lastName,
          fbp: d.fbp,
          fbc: d.fbc,
          customData: {
            currency:         'USD',
            value:            150,
            content_category: d.formSource === 'quote' ? 'Quote Form' : 'Contact Form',
            content_name:     service || 'general',
          },
        })
          .then(json => console.log('[CAPI] ok events_received=%d', json.events_received || 0))
          .catch(err  => console.error('[CAPI] failed:', err.message))
      : Promise.resolve();

    // Await emails + CAPI in parallel
    const [[...emailResults]] = await Promise.all([
      Promise.allSettled(emailSends),
      capiPromise,
    ]);

    const failedEmails = emailResults.filter(r => r.status === 'rejected');
    if (failedEmails.length === emailResults.length) {
      console.error('All email sends failed:', failedEmails.map(f => f.reason));
      return res.status(500).json({ error: 'Failed to send email. Please call us at 469-721-0145.' });
    }

    return res.status(200).json({ success: true, message: 'Quote request submitted successfully' });

  } catch (err) {
    console.error('Contact handler error:', err);
    return res.status(500).json({ error: 'Server error. Please call us at 469-721-0145.' });
  }
};
