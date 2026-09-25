# Manual Testing Guide

**Date:** September 25, 2026  
**Application:** TikTok Content Automation Platform  
**Version:** 1.0.0

---

## 📋 Test Execution Summary

### Test Session Information
- **Date:** [Date]
- **Tester:** [Your Name]
- **Environment:** Local Development
- **Backend URL:** http://localhost:3000
- **Frontend URL:** http://localhost:3001
- **Database:** PostgreSQL (tiktok_carousel_dev)

---

## ✅ Pre-Test Checklist

- [ ] Backend running on port 3000
- [ ] Frontend running on port 3001
- [ ] PostgreSQL database created (tiktok_carousel_dev)
- [ ] .env file configured
- [ ] Postman collection imported (optional)
- [ ] Browser console open (F12) for debugging
- [ ] Network tab open to monitor API calls

---

## 🧪 Test Cases

### 1. Backend Health Check

**Test ID:** TEST-001  
**Description:** Verify backend server is running

**Steps:**
1. Open http://localhost:3000/health in browser or curl
2. Check response status code

**Expected Result:**
```json
{
  "status": "ok",
  "timestamp": "2026-09-25T11:24:16.330Z"
}
```

**Status:** [ ] Pass [ ] Fail  
**Notes:** ___________________

---

### 2. User Registration

**Test ID:** TEST-002  
**Description:** Register new user with valid credentials

**Steps:**
1. Navigate to http://localhost:3001/register
2. Fill in form:
   - Email: testuser@example.com
   - Username: testuser123
   - Password: SecurePass123!
3. Click "Register" button
4. Should redirect to login page

**Expected Result:**
- Registration form submits
- Redirect to login page
- Success message appears

**Curl Command:**
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "username": "testuser123",
    "password": "SecurePass123!"
  }'
```

**Status:** [ ] Pass [ ] Fail  
**Notes:** ___________________

---

### 3. User Login

**Test ID:** TEST-003  
**Description:** Login with registered credentials

**Steps:**
1. On login page, enter credentials:
   - Email: testuser@example.com
   - Password: SecurePass123!
2. Click "Login" button
3. Should redirect to dashboard

**Expected Result:**
- Login form submits
- Redirect to dashboard
- Token stored in localStorage
- User profile visible

**Curl Command:**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "SecurePass123!"
  }'
```

**Status:** [ ] Pass [ ] Fail  
**JWT Token:** ___________________
**Notes:** ___________________

---

### 4. Create Carousel

**Test ID:** TEST-004  
**Description:** Create new carousel

**Steps:**
1. Login to dashboard
2. Click "Create New Carousel" or similar button
3. Fill in carousel details:
   - Title: "My First Carousel"
   - Description: "Testing carousel creation"
   - Style: "Professional"
4. Click "Save" or "Create"

**Expected Result:**
- Carousel created successfully
- Redirect to carousel editor
- Carousel appears in list

**Curl Command:**
```bash
curl -X POST http://localhost:3000/content/carousels \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My First Carousel",
    "description": "Testing carousel creation",
    "style": "professional"
  }'
```

**Status:** [ ] Pass [ ] Fail  
**Carousel ID:** ___________________
**Notes:** ___________________

---

### 5. Add Slide to Carousel

**Test ID:** TEST-005  
**Description:** Add slide to carousel

**Steps:**
1. Open carousel editor
2. Click "Add Slide" button
3. Fill in slide content:
   - Title: "Slide 1"
   - Content: "This is slide content"
   - Slide Number: 1
4. Add background color and font style
5. Click "Save Slide"

**Expected Result:**
- Slide added to carousel
- Slide appears in carousel preview
- Style applied correctly

**Status:** [ ] Pass [ ] Fail  
**Slide ID:** ___________________
**Notes:** ___________________

---

### 6. View Carousel List

**Test ID:** TEST-006  
**Description:** View all user carousels

**Steps:**
1. Navigate to Content/Carousels page
2. View carousel list with pagination
3. Check carousel count, titles, status

**Expected Result:**
- All carousels displayed
- Pagination works
- Carousel cards show correct information

**Curl Command:**
```bash
curl -X GET "http://localhost:3000/content/carousels?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Status:** [ ] Pass [ ] Fail  
**Carousels Found:** ___________________
**Notes:** ___________________

---

### 7. Update Carousel

**Test ID:** TEST-007  
**Description:** Update carousel details

**Steps:**
1. Open carousel editor
2. Edit carousel title or description
3. Click "Update" or "Save"

**Expected Result:**
- Carousel updated successfully
- Changes reflected in UI
- API returns updated data

**Curl Command:**
```bash
curl -X PUT http://localhost:3000/content/carousels/CAROUSEL_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Title",
    "description": "Updated description"
  }'
```

**Status:** [ ] Pass [ ] Fail  
**Notes:** ___________________

---

### 8. Publish Carousel

**Test ID:** TEST-008  
**Description:** Publish carousel to change status

**Steps:**
1. Open carousel
2. Click "Publish" button
3. Confirm publication

**Expected Result:**
- Carousel status changed to "published"
- Timestamp updated
- UI reflects new status

**Status:** [ ] Pass [ ] Fail  
**Published At:** ___________________
**Notes:** ___________________

---

### 9. Schedule Carousel

**Test ID:** TEST-009  
**Description:** Schedule carousel for future posting

**Steps:**
1. Open carousel
2. Navigate to Schedule section
3. Pick future date and time
4. Click "Schedule"

**Expected Result:**
- Carousel scheduled
- Calendar shows scheduled item
- Status changed to "scheduled"

**Status:** [ ] Pass [ ] Fail  
**Scheduled For:** ___________________
**Notes:** ___________________

---

### 10. AI Generate Carousel from Topic

**Test ID:** TEST-010  
**Description:** Generate carousel using AI from topic

**Prerequisites:**
- OpenAI API key configured in .env

**Steps:**
1. Navigate to AI features section
2. Enter topic: "Risk Management in Trading"
3. Select style: "Educational"
4. Select number of slides: 5
5. Click "Generate"

**Expected Result:**
- AI generates carousel content
- Multiple slides created with content
- Design suggestions applied
- Hashtags generated

**Curl Command:**
```bash
curl -X POST http://localhost:3000/ai/generate-carousel \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "Risk Management in Trading",
    "style": "educational",
    "slides_count": 5
  }'
```

**Status:** [ ] Pass [ ] Fail  
**Generated Carousel ID:** ___________________
**Number of Slides:** ___________________
**Notes:** ___________________

---

### 11. Get Design Suggestions

**Test ID:** TEST-011  
**Description:** Get AI-powered design suggestions

**Prerequisites:**
- OpenAI API key configured

**Steps:**
1. Navigate to design suggestion feature
2. Enter topic: "Trading"
3. Select style: "Professional"
4. Click "Get Suggestions"

**Expected Result:**
- Color schemes suggested
- Fonts recommended
- Layout suggestions provided
- Visual elements recommended

**Curl Command:**
```bash
curl -X GET "http://localhost:3000/ai/design-suggestion?topic=Trading&style=professional" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Status:** [ ] Pass [ ] Fail  
**Color Scheme:** ___________________
**Recommended Fonts:** ___________________
**Notes:** ___________________

---

### 12. Generate Hashtags

**Test ID:** TEST-012  
**Description:** Generate hashtags for carousel

**Prerequisites:**
- OpenAI API key configured

**Steps:**
1. Enter carousel title: "Trading Tips"
2. Enter topic: "Finance"
3. Click "Generate Hashtags"

**Expected Result:**
- Hashtags generated
- 10-15 relevant hashtags shown
- Hashtags are trending and relevant

**Curl Command:**
```bash
curl -X GET "http://localhost:3000/ai/generate-hashtags?title=Trading%20Tips&topic=Finance" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Status:** [ ] Pass [ ] Fail  
**Hashtags Generated:** ___________________
**Notes:** ___________________

---

### 13. View Analytics Dashboard

**Test ID:** TEST-013  
**Description:** View analytics dashboard with metrics

**Steps:**
1. Navigate to Analytics section
2. View dashboard overview
3. Check metrics: views, likes, shares, engagement rate

**Expected Result:**
- Dashboard loads
- Metrics displayed
- Charts render correctly
- Data refreshes

**Curl Command:**
```bash
curl -X GET "http://localhost:3000/analytics/dashboard" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Status:** [ ] Pass [ ] Fail  
**Total Views:** ___________________
**Total Likes:** ___________________
**Engagement Rate:** ___________________
**Notes:** ___________________

---

### 14. View Carousel Analytics

**Test ID:** TEST-014  
**Description:** View analytics for specific carousel

**Steps:**
1. Select carousel from list
2. Click "View Analytics"
3. See performance metrics

**Expected Result:**
- Carousel analytics displayed
- Performance metrics shown
- Historical data available

**Curl Command:**
```bash
curl -X GET "http://localhost:3000/analytics/carousels/CAROUSEL_ID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Status:** [ ] Pass [ ] Fail  
**Carousel Views:** ___________________
**Engagement Rate:** ___________________
**Notes:** ___________________

---

### 15. Delete Carousel

**Test ID:** TEST-015  
**Description:** Delete carousel

**Steps:**
1. Select carousel from list
2. Click "Delete" button
3. Confirm deletion

**Expected Result:**
- Carousel deleted
- Removed from list
- Confirmation message shown

**Curl Command:**
```bash
curl -X DELETE "http://localhost:3000/content/carousels/CAROUSEL_ID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Status:** [ ] Pass [ ] Fail  
**Notes:** ___________________

---

### 16. Responsive Design - Mobile

**Test ID:** TEST-016  
**Description:** Test responsive design on mobile

**Steps:**
1. Open browser DevTools (F12)
2. Set device to iPhone 12 (375x812)
3. Navigate through all pages
4. Test touch interactions

**Expected Result:**
- All content visible
- No horizontal scroll
- Buttons easily clickable
- Navigation accessible

**Status:** [ ] Pass [ ] Fail  
**Devices Tested:**
- [ ] iPhone 12
- [ ] iPad
- [ ] Android

**Notes:** ___________________

---

### 17. Browser Compatibility

**Test ID:** TEST-017  
**Description:** Test in different browsers

**Browsers to Test:**
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

**Steps:**
1. Open application in each browser
2. Test key features
3. Check console for errors
4. Test performance

**Issues Found:**
- Browser: ___________________
  Issue: ___________________
- Browser: ___________________
  Issue: ___________________

**Status:** [ ] Pass [ ] Fail  
**Notes:** ___________________

---

### 18. Error Handling - Invalid Credentials

**Test ID:** TEST-018  
**Description:** Test error handling for invalid login

**Steps:**
1. Navigate to login page
2. Enter wrong email/password
3. Click login

**Expected Result:**
- Error message displayed
- User not logged in
- Redirect to login page

**Status:** [ ] Pass [ ] Fail  
**Error Message:** ___________________
**Notes:** ___________________

---

### 19. Error Handling - Required Fields

**Test ID:** TEST-019  
**Description:** Test validation for required fields

**Steps:**
1. Go to carousel creation
2. Leave title empty
3. Click save

**Expected Result:**
- Validation error shown
- Form not submitted
- Error message indicates missing field

**Status:** [ ] Pass [ ] Fail  
**Error Message:** ___________________
**Notes:** ___________________

---

### 20. Performance - Page Load Time

**Test ID:** TEST-020  
**Description:** Measure page load times

**Steps:**
1. Open DevTools Network tab
2. Refresh each page
3. Record load time and resource count

**Pages to Test:**
- Login: _____ ms
- Dashboard: _____ ms
- Content: _____ ms
- Analytics: _____ ms

**Expected Result:**
- All pages load in < 2 seconds
- Images optimized
- API calls efficient

**Status:** [ ] Pass [ ] Fail  
**Notes:** ___________________

---

## 📊 Test Summary

### Metrics
- **Total Tests:** 20
- **Passed:** _____
- **Failed:** _____
- **Skipped:** _____
- **Success Rate:** _____%

### Results by Category
| Category | Pass | Fail | Notes |
|----------|------|------|-------|
| Authentication | | | |
| Content Management | | | |
| AI Features | | | |
| Analytics | | | |
| UI/UX | | | |
| Performance | | | |
| Error Handling | | | |
| Browser Compatibility | | | |

---

## 🐛 Issues Found

### Critical Issues
1. **Issue ID:** [ID]
   - **Title:** ___________________
   - **Description:** ___________________
   - **Steps to Reproduce:** ___________________
   - **Expected:** ___________________
   - **Actual:** ___________________
   - **Severity:** Critical

### High Priority Issues
2. **Issue ID:** [ID]
   - **Title:** ___________________
   - **Severity:** High

### Medium Priority Issues
3. **Issue ID:** [ID]
   - **Title:** ___________________
   - **Severity:** Medium

---

## ✅ Sign Off

- **Tester Name:** ___________________
- **Date:** ___________________
- **Time Spent:** ___________________
- **Overall Status:** [ ] Pass [ ] Fail [ ] Partial
- **Recommendations:** ___________________

---

## 📝 Notes for Next Testing Session

___________________

___________________

___________________

---

**Document Version:** 1.0  
**Last Updated:** September 25, 2026
