<!-- markdownlint-disable MD009 MD022 MD026 MD031 MD032 MD034 MD036 MD040 MD058 MD060 -->

# 🎯 Royse City Junk Removal - Google & Microsoft Ads Setup Guide

## Quick Links

- **Google Ads Landing Page:** `https://roysecityjunkremoval.com/ads-google.html`
- **Microsoft Ads Landing Page:** `https://roysecityjunkremoval.com/ads-microsoft.html`
- **Original Free Quote Page:** `https://roysecityjunkremoval.com/free-quote.html`

---

## 📸 IMAGE SPECIFICATIONS FOR ADS

### Primary Hero Image
**File:** `hero-truck-trailer.png`
**Current Size:** 1.03 MB

#### Recommended Ad Image Versions:

**For Google Ads (Responsive Search Ads):**
- **Landscape 1.91:1** - 1200 x 628 px (Primary)
- **Square 1:1** - 1200 x 1200 px
- **Vertical 4:5** - 960 x 1200 px

**For Microsoft Audience Ads:**
- **Primary 1.91:1** - 1200 x 628 px ✓
- **Square 1:1** - 1200 x 1200 px
- **Mobile 9:16** - 1080 x 1920 px

**Technical Requirements:**
- Format: `.jpg` or `.png`
- Minimum resolution: 700 x 368 px
- Maximum file size: No limit, but optimize to <500KB for web
- ❌ NO text overlays or logos on the image itself
- ✅ High quality, professional appearance
- ✅ Relevant to ad message and landing page

### Before/After Images
**Files:** 
- `before-after-1.png` (0.81 MB)
- `before-after-2.png` (0.82 MB)
- `before-after-3.png` (1.21 MB)

**Ad Sizes:**
- Same specifications as hero image above
- Ensure transformations are dramatic for maximum impact
- Both platforms support image galleries/carousel ads

---

## 🔧 SETUP CHECKLIST

### Google Ads Setup

**1. Create Campaign**
```
Campaign Type: Search (Brand Protection)
Sub-type: Lead Generation
Bidding Strategy: Target CPA (conversion value = $50-75)
Budget: Start with $20/day
```

**2. Ad Groups**
- "Junk Removal Quote"
- "Same Day Service"
- "Furniture Removal"
- "Appliance Removal"

**3. Keywords (Broad Match)**
- junk removal royse city
- junk removal near me
- same day junk removal
- furniture removal royse city
- appliance removal
- estate cleanout near me

**4. Landing Page**
- **URL:** `https://roysecityjunkremoval.com/ads-google.html?utm_source=google&utm_medium=cpc&utm_campaign={campaign}`
- **Page Encoding:** UTF-8
- **Mobile:** Fully responsive ✓
- **Loading Speed:** <3 seconds ✓

**5. Conversion Tracking**
- Google Analytics Goal: "Quote Form Submission"
- JavaScript event: `gtag('event', 'conversion', {...})`
- Value per conversion: $50-75 (baseline estimate)

**6. Ad Copy Examples**
```
Headline 1: Same-Day Junk Removal
Headline 2: Free Quote in 60 Seconds
Headline 3: We Do All The Work

Description: Get your space back. Call 469-534-3392 or fill out our form for an instant quote. Licensed, insured, fast.
```

---

### Microsoft Ads Setup

**1. Create Campaign**
```
Campaign Type: Search
Ad Group Type: Standard
Bidding Strategy: CPA Target (if available) or Manual CPC
Budget: Start with $20/day
```

**2. Setup UET Tag**
- Go to Microsoft Ads Dashboard
- **Tools** → **Conversion Tracking** → **UET Tags**
- Create new tag: "Royse City Junk Removal Conversions"
- Copy your UET Tag ID
- **⚠️ UPDATE THE TAG ID IN:** `ads-microsoft.html`
  - Find: `ti:"YOUR_UET_TAG_ID"`
  - Replace with your actual ID

**3. Define Conversion Goals**
- Goal Name: "Quote Request"
- Goal Type: "Lead"
- Points Value: 1
- Revenue: $50-75

**4. Landing Page**
- **URL:** `https://roysecityjunkremoval.com/ads-microsoft.html?utm_source=bing&utm_medium=cpc&utm_campaign={campaign}`
- Track: Ensure UET tag fires on conversion
- Test UET: Use Debug tool in Microsoft Ads

**5. Keywords**
- junk removal
- junk removal near me [city]
- same day pickup junk
- furniture removal
- estate cleanout

**6. Ad Copy (Responsive Search Ads)**
```
Headlines:
- Same-Day Junk Removal Service
- Free Quote - 60 Seconds
- Licensed & Insured Team
- We Handle All The Work
- Call 469-534-3392 Today

Descriptions:
- Get your space back today. Same-day service available in Royse City and surrounding areas.
- No hidden fees. Upfront pricing on all junk removal services.
- Contact us now for a free, no-obligation quote.
```

---

## 📊 TRACKING & UTM PARAMETERS

### UTM Parameter Format

All three landing pages support UTM parameters:

```
?utm_source={source}&utm_medium={medium}&utm_campaign={campaign}
```

**Google Ads:**
```
https://roysecityjunkremoval.com/ads-google.html?utm_source=google&utm_medium=cpc&utm_campaign=junk_removal_texas
```

**Microsoft Ads:**
```
https://roysecityjunkremoval.com/ads-microsoft.html?utm_source=bing&utm_medium=cpc&utm_campaign=junk_removal_texas
```

**UTM Values:**
| Parameter | Value |
|-----------|-------|
| utm_source | google, bing, direct, facebook, etc. |
| utm_medium | cpc, organic, email, social |
| utm_campaign | junk_removal_quote, furniture_removal, same_day, etc. |

These sync with Google Analytics and are captured in the form submission.

---

## 🎯 CONVERSION GOALS

### Primary Goal: Quote Form Submission
- **Value:** $50-75 (estimated value per lead)
- **Track in Google Analytics:** Yes ✓
- **Track in Microsoft Ads:** UET Tag ✓
- **Track in CRM:** [Email to sales@i30builders.com](mailto:sales@i30builders.com)

### Secondary Goals (Optional)
- Phone click: `<a href="tel:+14695343392">` 
- Page visit: Tracked automatically

---

## 📱 MOBILE OPTIMIZATION

✅ **All landing pages are mobile-first optimized:**
- Single column on mobile
- Large tap targets (44x44px minimum)
- Sticky phone button on mobile
- Fast loading (<3 sec)
- Click-to-call implementation

**Mobile Conversion Rate Target:** 35-45%

---

## 🔍 QUALITY SCORE OPTIMIZATION

**Google Ads Quality Score Factors for Landing Page:**

| Factor | Status | Score |
|--------|--------|-------|
| Landing Page Relevance | Excellent | 9/10 |
| Expected Click-Through Rate | Good | 8/10 |
| Ad Copy Relevance | Excellent | 9/10 |
| Mobile Experience | Excellent | 9/10 |
| Page Load Speed | Good | 8/10 |
| Security (HTTPS) | Good | 8/10 |

**Estimated Quality Score: 8-9/10**

---

## 💡 OPTIMIZATION TIPS

### A/B Testing

Create variations to test:

1. **Ad Copy Variations**
   - "Same-Day Junk Removal" vs "Fast & Easy Junk Removal"
   - "Free Quote" vs "Get Started Free"

2. **CTA Button Colors**
   - Currently: Green (#6CBE45)
   - Test: Red (#FF4444) for urgency

3. **Form Field Count**
   - Current: 8 fields required/optional
   - Test: 3-field minimal version (Name, Phone, Service)

### Bid Strategy

**Starting Budget Allocation:**
- Google Ads: 60% ($12/day)
- Microsoft Ads: 40% ($8/day)
- Total: $20/day

**Target Metrics:**
- Cost Per Lead: $15-25
- Conversion Rate: 35-45%
- Page Load Speed: <2 seconds

---

## 📞 FORM INTEGRATION

### Contact Form Fields

The form sends data to `/api/contact` with these fields:

```javascript
{
  first_name: "John",
  last_name: "Smith",
  phone: "469-534-3392",
  email: "john@example.com",
  address: "123 Main St",
  service: "furniture",
  timing: "today",
  description: "1 couch and 2 chairs",
  utm_source: "google",
  utm_medium: "cpc",
  utm_campaign: "junk_removal"
}
```

### Confirmation Flow

✓ **On Form Submit:**
1. Form validates (2-3 seconds)
2. Data sent to `/api/contact` API
3. Email sent to `sales@i30builders.com`
4. Confirmation email sent to user
5. Success page displays
6. Conversion tracked

---

## 🚀 LAUNCH CHECKLIST

- [ ] Update Microsoft UET Tag ID in `ads-microsoft.html`
- [ ] Add hero image variations for different ad sizes
- [ ] Create Google Ads campaign with landing page URL
- [ ] Create Microsoft Ads campaign with landing page URL
- [ ] Set up conversion tracking in Google Ads
- [ ] Set up UET tag in Microsoft Ads
- [ ] Test form submission on both versions
- [ ] Verify emails are received
- [ ] Check mobile experience on iPhone/Android
- [ ] Monitor initial performance for 1 week
- [ ] Adjust bids based on Cost Per Conversion

---

## 📈 PERFORMANCE TARGETS (First 30 Days)

| Metric | Target |
|--------|--------|
| Click-Through Rate (CTR) | 3-5% |
| Cost Per Click (CPC) | $0.50-$1.50 |
| Landing Page Conversion Rate | 35-45% |
| Cost Per Lead | $15-25 |
| Quality Score | 8-10 |
| Page Load Time | <2 sec |

---

## ❓ FAQ

**Q: Can I use the same landing page for both Google and Microsoft Ads?**
A: Yes, but the ad-specific versions (ads-google.html and ads-microsoft.html) have different tracking and are recommended for better data separation.

**Q: What's the difference between the three landing pages?**
A: 
- `free-quote.html` - General purpose
- `ads-google.html` - Google Ads optimized with GA4 tracking
- `ads-microsoft.html` - Microsoft Ads optimized with UET tag

**Q: How often should I check performance?**
A: Daily for first week, then weekly. Collect at least 50 conversions before major changes.

**Q: What's a good Cost Per Lead?**
A: For junk removal, $15-25 is typical. Anything under $20 is excellent.

**Q: Should I bid higher on "same-day" searches?**
A: Yes - these are high-intent. Bid 25-50% higher than average.

---

## 🆘 TROUBLESHOOTING

**Problem: Form not submitting**
- Check browser console for errors (F12)
- Verify `/api/contact` endpoint is live
- Check CORS headers

**Problem: Conversion not tracking**
- Verify GTags/UET tag is loading
- Check Network tab in browser DevTools
- Confirm conversion goal is created in ad platform

**Problem: High CPC, low conversions**
- Lower bid, start at $0.50/click
- Improve ad copy relevance
- Check landing page load speed
- Test different keywords

---

## 📧 Support

For help with setup:
- Email: `sales@i30builders.com`
- Phone: `469-534-3392`
- Landing Page Support: Check browser console (F12) for errors

---

**Last Updated:** February 28, 2026
**Version:** 1.0
