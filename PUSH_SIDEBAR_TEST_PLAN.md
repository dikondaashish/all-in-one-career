# Push-Style Sidebar Test Plan for Climbly.ai Dashboard

## Overview
This document outlines the testing requirements to ensure the push-style sidebar behavior matches the Jobscan.co UX pattern exactly.

## Test Objectives
- Verify that the sidebar toggle works correctly from the header
- Ensure all dashboard pages shift horizontally when sidebar state changes
- Confirm smooth transitions and proper content alignment
- Test responsive behavior across different screen sizes

## Test Environment
- **Browser**: Chrome, Firefox, Safari (latest versions)
- **Screen Sizes**: Desktop (1440px+), Tablet (768px), Mobile (375px)
- **URLs to Test**: All authenticated dashboard routes

## Test Cases

### 1. Header and Sidebar Toggle
**Test Steps:**
1. Navigate to any dashboard page (e.g., `/dashboard`, `/ats`, `/portfolio`)
2. Locate the hamburger menu icon (☰) in the top-left of the header
3. Click the hamburger menu icon

**Expected Results:**
- ✅ Header remains fixed and spans full width
- ✅ Sidebar expands from 64px to 240px width
- ✅ Main content area shifts right by exactly 176px (240px - 64px)
- ✅ Smooth transition animation (300ms duration)

### 2. Main Content Area Shifting
**Test Steps:**
1. Start with sidebar collapsed (default state)
2. Click hamburger menu to expand sidebar
3. Observe main content area behavior
4. Click hamburger menu again to collapse sidebar

**Expected Results:**
- ✅ **Collapsed State**: `ml-16` (64px left margin)
- ✅ **Expanded State**: `ml-60` (240px left margin)
- ✅ **Transition**: Smooth animation between states
- ✅ **Content Alignment**: Content re-centers appropriately

### 3. Dashboard Page Navigation
**Test Steps:**
1. Navigate to `/dashboard` (Dashboard summary page)
2. Toggle sidebar and verify content shifting
3. Navigate to `/ats` (ATS page)
4. Toggle sidebar and verify content shifting
5. Navigate to `/portfolio` (Portfolio page)
6. Toggle sidebar and verify content shifting
7. Navigate to `/emails` (Emails page)
8. Toggle sidebar and verify content shifting
9. Navigate to `/referrals` (Referrals page)
10. Toggle sidebar and verify content shifting
11. Navigate to `/tracker` (Tracker page)
12. Toggle sidebar and verify content shifting

**Expected Results:**
- ✅ All pages maintain consistent sidebar state
- ✅ Content shifting behavior identical across all routes
- ✅ No layout breaking or content overflow
- ✅ Smooth transitions on all page changes

### 4. Responsive Behavior
**Test Steps:**
1. Test on desktop (1440px+ width)
2. Resize browser to tablet size (768px)
3. Resize browser to mobile size (375px)
4. Toggle sidebar at each screen size

**Expected Results:**
- ✅ **Desktop**: Full push behavior with 64px ↔ 240px transitions
- ✅ **Tablet**: Responsive behavior with mobile overlay
- ✅ **Mobile**: Overlay behavior with proper touch interactions

### 5. State Persistence
**Test Steps:**
1. Expand sidebar on dashboard page
2. Navigate to different dashboard pages
3. Verify sidebar remains expanded
4. Collapse sidebar on any page
5. Navigate to different dashboard pages
6. Verify sidebar remains collapsed

**Expected Results:**
- ✅ Sidebar state persists across page navigation
- ✅ No unexpected state changes
- ✅ Consistent behavior across all routes

## Technical Verification

### CSS Classes to Verify
```css
/* Collapsed State */
main.ml-16 { margin-left: 4rem; } /* 64px */

/* Expanded State */
main.ml-60 { margin-left: 15rem; } /* 240px */

/* Transitions */
main.transition-all.duration-300.ease-in-out {
  transition: all 0.3s ease-in-out;
}
```

### JavaScript State Management
```typescript
// Layout state
const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

// Toggle function
const handleSidebarToggle = () => {
  setSidebarCollapsed(!sidebarCollapsed);
};

// Main content margin
className={`pt-18 min-h-screen transition-all duration-300 ease-in-out ${
  sidebarCollapsed ? 'ml-16' : 'ml-60'
}`}
```

## Success Criteria
- [ ] Header remains fixed and full-width
- [ ] Sidebar toggles between 64px and 240px
- [ ] Main content shifts right/left by exactly 176px
- [ ] Smooth 300ms transitions on all state changes
- [ ] All dashboard pages behave identically
- [ ] State persists across page navigation
- [ ] Responsive behavior works on all screen sizes
- [ ] No layout breaking or content overflow

## Bug Reporting
If any test case fails, please report:
1. **Test Case**: Which test case failed
2. **Expected Result**: What should have happened
3. **Actual Result**: What actually happened
4. **Steps to Reproduce**: Detailed steps to recreate the issue
5. **Browser/Device**: Browser version and screen size
6. **Console Errors**: Any JavaScript errors in browser console

## Notes
- The push behavior should feel identical to Jobscan.co
- Content should never overlap or break the layout
- Transitions should be smooth and professional
- All dashboard functionality should remain intact
