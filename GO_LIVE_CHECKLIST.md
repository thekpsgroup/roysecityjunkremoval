# Go-Live Checklist (Ads + Lead Form)

## 1) Required production environment variables

Set these in Vercel Project Settings > Environment Variables:

- `RESEND_API_KEY` = your Resend API key
- `RESEND_FROM` = verified sender (example: `Royse City Junk Removal <noreply@roysecityjunkremoval.com>`)
- `NOTIFY_EMAIL` = inbox for new leads (example: `sales@i30builders.com`)

## 2) Microsoft Ads UET tag

In `quote.html`, verify the UET Tag ID (`ti:"343236784"`) matches your Microsoft Ads account.

## 3) Deploy

Deploy the site to Vercel after the values above are set.

## 4) Post-deploy smoke tests

### Form API test (replace your domain)

```bash
curl -X POST https://roysecityjunkremoval.com/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "first_name":"Test",
    "last_name":"Lead",
    "phone":"4695343392",
    "email":"you@example.com",
    "address":"Royse City, TX",
    "service":"residential",
    "description":"Testing live lead flow",
    "timing":"this-week",
    "consent_contact":"yes",
    "website":""
  }'
```

Expected result: `{"success":true,...}`

### Browser test

Submit one lead test on the landing page:

- `/quote`

Also verify old URLs redirect correctly:
- `/free-quote` -> `/quote`
- `/ads-google` -> `/quote`
- `/ads-microsoft` -> `/quote`

## 5) Verify outcomes

- Lead notification email arrives at `NOTIFY_EMAIL`
- Customer confirmation email arrives (when email provided)
- GA4 receives conversion event
- Microsoft Ads receives UET event

## 6) Fast rollback plan

If form failures are detected:

1. Pause ads immediately
2. Confirm Vercel env vars are present and correct
3. Re-submit API smoke test
4. Resume ads only after successful API + email delivery
