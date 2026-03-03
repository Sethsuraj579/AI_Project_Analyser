# New Components & Features Documentation

## Overview
This document describes the new UI components and features added to the AI Project Analyser frontend.

---

## 📊 Components Added

### 1. **Burger Menu Button** ✅
Located in the header (`App.jsx`), the burger menu button provides mobile-responsive navigation.

**Features:**
- Animated hamburger icon with smooth transitions
- Automatically shows on screens ≤ 768px width
- Collapsible navigation menu
- Smooth open/close animations

**Usage:** Already integrated in `App.jsx` - no additional setup needed.

---

### 2. **Tabs Component** 
**File:** `src/components/Tabs.jsx`  
**Styles:** `src/components/Tabs.css`

A flexible, reusable tabs component with smooth animations and badge support.

**Features:**
- Multiple tab support with icons and labels
- Optional badges (e.g., item counts)
- Smooth content transitions
- Mobile-responsive with icon-only display on small screens
- Accessible (ARIA attributes)

**Props:**
```javascript
<Tabs 
  tabs={[
    {
      id: 'tab-1',           // Unique identifier
      label: 'Tab Label',    // Display text
      icon: '📊',            // Optional emoji/icon
      badge: 5,             // Optional badge number
      content: <Component /> // React component or function
    }
  ]}
  defaultActiveTab={0}       // Start on first tab
  onChange={(index, id) => {}} // Callback when tab changes
/>
```

**Example:**
```javascript
import Tabs from '../components/Tabs';

const tabs = [
  {
    id: 'overview',
    label: 'Overview',
    icon: '📋',
    badge: 3,
    content: <h2>Overview Content</h2>,
  },
  {
    id: 'details',
    label: 'Details',
    icon: '📊',
    content: () => <div>Details Content</div>, // Can also be a function
  },
];

<Tabs tabs={tabs} defaultActiveTab={0} />
```

---

### 3. **Comparison Chart Component**
**File:** `src/components/ComparisonChart.jsx`  
**Styles:** `src/components/ComparisonChart.css`

An interactive comparison chart for analyzing multiple projects with multiple visualization types.

**Features:**
- 3 chart types: Bar Chart, Scatter Plot, Radar Chart
- Compares metrics: Overall Score, Code Quality, Performance, Security, etc.
- Summary statistics (Average, Highest, Lowest scores)
- Responsive design with hover effects
- Custom theme matching app colors

**Props:**
```javascript
<ComparisonChart 
  projects={[
    {
      id: 1,
      name: 'Project Name',
      overall_score: 85,
      code_quality_score: 88,
      performance_score: 82,
      maintainability_score: 80,
      security_score: 87,
      complexity_score: 75,
      files_count: 45,
      lines_of_code: 12500,
    }
  ]}
  chartType="bar" // 'bar' | 'scatter' | 'radar'
/>
```

**Data Structure Required:**
```javascript
{
  name: string,              // Project name
  overall_score: number,     // 0-100
  code_quality_score: number,
  performance_score: number,
  maintainability_score: number,
  security_score: number,
  complexity_score: number,
  files_count: number,
  lines_of_code: number,
}
```

---

## 📄 Pages Added

### Comparison Page
**File:** `src/pages/ComparisonPage.jsx`  
**Styles:** `src/pages/ComparisonPage.css`

A complete demo page showing how to use the Tabs and ComparisonChart components together.

**Route:** `/comparison`

**Features:**
- Overview tab with statistics
- Bar Chart visualization
- Scatter Plot visualization
- Radar Chart visualization
- Detailed comparison table
- Sample data included

---

## 🎨 Styling

All components use CSS custom properties (variables) defined in `src/index.css`:

```css
--bg-primary: #0f0f1a
--bg-secondary: #1a1a2e
--accent: #00d4ff
--accent-alt: #7b2ff7
--text-primary: #e8e8f0
--text-secondary: #a0a0b8
```

Components automatically adapt to the dark theme.

---

## 📱 Responsive Design

All new components are fully responsive:

### Burger Menu
- **Desktop (>768px):** Hidden, full navigation visible
- **Mobile (≤768px):** Visible, toggles navigation menu

### Tabs
- **Desktop:** Full labels + icons + badges
- **Mobile:** Icons only + labels + badges

### Comparison Chart
- **Desktop:** Full chart with legends and tooltips
- **Mobile:** Vertical/compressed layout, simplified stats

---

## 🚀 Integration Guide

### 1. Using Tabs in Your Page

```javascript
import Tabs from '../components/Tabs';

function MyPage() {
  const tabs = [
    {
      id: 'stats',
      label: 'Statistics',
      icon: '📊',
      content: <YourStatsComponent />,
    },
    {
      id: 'chart',
      label: 'Charts',
      icon: '📈',
      content: <YourChartComponent />,
    },
  ];

  return <Tabs tabs={tabs} />;
}
```

### 2. Using Comparison Chart

```javascript
import ComparisonChart from '../components/ComparisonChart';

function MyComparison() {
  const projects = getProjectsFromAPI();

  return (
    <ComparisonChart 
      projects={projects}
      chartType="bar"
    />
  );
}
```

### 3. Accessing Comparison Page

Navigate to `/comparison` in your app to see a complete working example.

---

## ⚙️ Dependencies

All components use existing dependencies:
- **React** (18.2.0) - UI framework
- **Recharts** (2.10.0) - Charting library
- **React Router** (6.20.0) - Routing

No additional packages needed!

---

## 🎯 Customization

### Colors
Edit `src/index.css` CSS variables to change colors globally.

### Component Behavior
Edit component props to customize:
- Tab icons/labels
- Chart types
- Data structure
- Responsive breakpoints

### Styling
Edit `.css` files to customize appearance:
- `Tabs.css` - Tab styling
- `ComparisonChart.css` - Chart styling
- `ComparisonPage.css` - Page layout

---

## 📝 Notes

1. **Burger button** is already working - visible on mobile (≤768px)
2. **Tabs component** is generic and can be used anywhere
3. **Comparison Chart** expects specific data structure from projects
4. All components are **fully accessible** with ARIA attributes
5. Theme colors automatically adapt to dark mode

---

## 🔧 Troubleshooting

### Tabs not showing content
- Ensure `tabs` prop is an array with `label` and `content`
- Check that `defaultActiveTab` index is valid

### Chart not displaying
- Verify projects array has required fields
- Check browser console for errors
- Ensure recharts library is imported

### Burger button not showing
- Should appear automatically on screens ≤768px
- Check media query in `index.css`
- Clear browser cache and reload

---

## 📚 Additional Resources

- [Recharts Documentation](https://recharts.org/)
- [React Hooks Guide](https://react.dev/reference/react)
- [CSS Grid vs Flexbox](https://www.smashingmagazine.com/)

---

**Last Updated:** March 2026  
**Version:** 1.0.0
