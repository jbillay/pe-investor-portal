# Vue Component UI/UX Analyzer Command

## Overview

This command enables Claude Code to analyze Vue components for UI/UX optimization opportunities using Playwright MCP. It performs automated analysis of component structure, accessibility, performance, and user experience patterns.

## Command Definition

```bash
claude-code analyze-vue-component [COMPONENT_NAME] [OPTIONS]
```

## Arguments

- `COMPONENT_NAME` (required): Name of the Vue component to analyze (with or without `.vue` extension)

## Options

- `--path, -p`: Specify custom path to the component (default: searches common Vue directories)
- `--deep, -d`: Perform deep analysis including child components
- `--accessibility, -a`: Focus on accessibility analysis
- `--performance, -perf`: Include performance metrics analysis
- `--output, -o`: Output format (console, json, html) (default: console)
- `--browser, -b`: Browser to use for analysis (chromium, firefox, webkit) (default: chromium)
- `--implement, -i`: Automatically implement recommended fixes (default: false)
- `--interactive`: Show interactive prompts for each fix before applying
- `--backup`: Create backup of original files before modifications (default: true)
- `--dry-run`: Show what changes would be made without applying them

## Implementation Structure

### 1. Component Discovery

```javascript
// Pseudo-code for component discovery
async function findComponent(componentName, customPath) {
  const searchPaths = [
    customPath,
    './src/components/',
    './components/',
    './src/views/',
    './views/',
    './src/'
  ];
  
  // Search for component file
  // Return full path or throw error if not found
}
```

### 2. Playwright Integration

The command utilizes Playwright MCP to:

- Launch browser instance - localhost:3000
- Using the following credential to login - login = admin@pe-portal.com & password = Admin@PE2025$
- Navigate to component in isolation (via Storybook, test environment, or dev server)
- Capture screenshots and element information
- Run accessibility audits
- Measure performance metrics

### 3. Analysis and Implementation Pipeline

The command follows a comprehensive analyze-and-implement workflow:

1. **Analysis Phase**: Component examination and issue identification
2. **Planning Phase**: Generate implementation plan with change preview
3. **Implementation Phase**: Apply fixes automatically or interactively
4. **Validation Phase**: Re-run analysis to confirm improvements

### 4. Analysis Categories

#### A. Visual Analysis
- Component layout and spacing
- Color contrast and accessibility
- Typography consistency
- Responsive behavior
- Visual hierarchy

#### B. Interaction Analysis  
- Click targets and touch accessibility
- Form usability
- Navigation patterns
- Loading states and feedback

#### C. Code Quality Analysis
- Component structure and organization
- Props and event handling
- Performance optimization opportunities
- Accessibility implementation

#### D. Accessibility Audit
- WCAG compliance checking
- Screen reader compatibility
- Keyboard navigation
- Focus management

### 5. Automatic Implementation Engine

#### A. Code Transformation Capabilities
- **CSS/Style Fixes**: Color contrast adjustments, spacing normalization, focus indicators
- **Template Updates**: ARIA attributes, semantic HTML improvements, accessibility labels
- **Script Enhancements**: Performance optimizations, prop validation, event handling
- **Asset Optimization**: Image compression, lazy loading implementation

#### B. Implementation Safety
- **Backup Creation**: Automatic backup of original files before modifications
- **Validation**: Syntax checking and linting after changes
- **Rollback**: Easy reversion if issues are detected
- **Preview Mode**: Show exact changes before applying

#### C. Smart Fix Application
- **Dependency Management**: Install required packages for new features
- **Import Updates**: Add necessary imports for new functionality  
- **Style Integration**: Merge CSS changes with existing styles
- **Component Registration**: Update parent components when needed

## Expected Output Format

### Console Output (Default)

```
🔍 Analyzing Vue Component: UserProfile.vue
📍 Located at: ./src/components/UserProfile.vue

📊 ANALYSIS RESULTS
==================

✅ STRENGTHS
- Good semantic HTML structure
- Proper ARIA labels implemented
- Responsive design patterns used

⚠️  OPTIMIZATION OPPORTUNITIES

🎨 UI/Visual Issues:
• Low color contrast ratio (3.2:1) on secondary text
• Inconsistent spacing between elements (8px, 12px, 16px mixed)
• Missing loading states for async operations

♿ Accessibility Issues:
• Form inputs missing associated labels
• No focus indicators on custom buttons
• Images missing alt text

⚡ Performance Issues:
• Large bundle size due to unused imports
• Missing lazy loading for images
• Excessive re-renders detected

🔧 RECOMMENDATIONS & IMPLEMENTATION
==================================

High Priority (Auto-implementable):
✅ 1. Fix color contrast issues (use #666 instead of #999)
   → IMPLEMENTED: Updated 3 instances in component styles
✅ 2. Add proper form labels and ARIA attributes  
   → IMPLEMENTED: Added aria-label and associated labels
✅ 3. Implement focus indicators for interactive elements
   → IMPLEMENTED: Added :focus-visible styles

Medium Priority (Requires Review):
📋 4. Standardize spacing using design system tokens
   → PLANNED: Will update to use $spacing-* variables
📋 5. Add loading states for better UX
   → PLANNED: Will add loading prop and conditional rendering  
📋 6. Optimize bundle size by removing unused imports
   → IMPLEMENTED: Removed 2 unused imports, saved 12kb

Low Priority (Manual Review Recommended):
⏳ 7. Add image lazy loading
   → AVAILABLE: Can implement v-lazy directive
⏳ 8. Consider memoization for expensive computations
   → SUGGESTION: Review computeUserStats() method

💾 CHANGES APPLIED
==================
• Created backup: UserProfile.vue.backup.2025-09-24-103000
• Modified files: 1
• Lines changed: 23 additions, 8 deletions
• Estimated improvement: +15 UX Score points

🔄 RE-ANALYSIS RESULTS
=====================
• Accessibility Score: 78 → 92 (+14) ✅
• Performance Score: 85 → 89 (+4) ✅  
• UI Consistency Score: 72 → 85 (+13) ✅
• Overall UX Score: 78 → 89 (+11) ✅

📏 METRICS
==========
• Accessibility Score: 78/100
• Performance Score: 85/100
• UI Consistency Score: 72/100
• Overall UX Score: 78/100
```

### JSON Output (`--output json`)

```json
{
  "component": "UserProfile.vue",
  "path": "./src/components/UserProfile.vue",
  "timestamp": "2025-09-24T10:30:00Z",
  "analysis": {
    "visual": {
      "score": 72,
      "post_implementation_score": 85,
      "issues": [
        {
          "type": "contrast",
          "severity": "high",
          "description": "Low color contrast ratio (3.2:1) on secondary text",
          "recommendation": "Use #666 instead of #999 for better readability",
          "auto_fixable": true,
          "status": "implemented"
        }
      ]
    },
    "accessibility": {
      "score": 78,
      "post_implementation_score": 92,
      "wcag_violations": [],
      "improvements": []
    },
    "performance": {
      "score": 85,
      "post_implementation_score": 89,
      "bundle_size": "45.2kb",
      "bundle_size_after": "33.2kb",
      "render_time": "12ms",
      "suggestions": []
    }
  },
  "implementation": {
    "changes_applied": 6,
    "backup_created": "UserProfile.vue.backup.2025-09-24-103000",
    "files_modified": ["UserProfile.vue"],
    "auto_fixes": ["contrast", "aria_labels", "focus_indicators", "unused_imports"],
    "manual_review_required": ["spacing_tokens", "loading_states"]
  },
  "recommendations": {
    "implemented": [
      {
        "priority": "high",
        "description": "Fixed color contrast issues",
        "changes": "Updated 3 CSS color values"
      }
    ],
    "pending": [],
    "requires_review": []
  }
}
```

## Usage Examples

### Basic Analysis with Auto-Implementation
```bash
claude-code analyze-vue-component UserProfile --implement
```

### Interactive Implementation (Review Each Fix)
```bash
claude-code analyze-vue-component UserProfile --interactive
```

### Preview Changes Without Applying
```bash
claude-code analyze-vue-component UserProfile --dry-run
```

### Deep Analysis with Selective Implementation
```bash
claude-code analyze-vue-component ProductCard --path ./src/shop/components/ --deep --implement --accessibility
```

### Analysis Only (No Implementation)
```bash
claude-code analyze-vue-component NavigationMenu 
```

### Performance-Focused Auto-Fix
```bash
claude-code analyze-vue-component DataTable --performance --implement --output json
```

## Prerequisites

1. **Playwright MCP Setup**: Ensure Playwright MCP is configured and accessible
2. **Development Server**: Component should be accessible via development server or Storybook
3. **Vue Project Structure**: Standard Vue project structure for component discovery

## Configuration File

Create `.claude-vue-analyzer.json` in project root:

```json
{
  "componentPaths": [
    "./src/components/",
    "./src/views/",
    "./components/"
  ],
  "devServer": {
    "url": "http://localhost:3000",
    "componentRoute": "/component-preview/"
  },
  "storybook": {
    "url": "http://localhost:6006",
    "enabled": true
  },
  "analysis": {
    "accessibility": {
      "wcag_level": "AA",
      "include_aaa": false,
      "auto_implement": true
    },
    "performance": {
      "lighthouse": true,
      "bundle_analysis": true,
      "auto_optimize": true
    },
    "visual": {
      "contrast_fixes": true,
      "spacing_normalization": true,
      "focus_indicators": true
    }
  },
  "implementation": {
    "auto_backup": true,
    "backup_path": "./backups/",
    "safe_mode": true,
    "validate_after_changes": true,
    "rollback_on_error": true
  },
  "output": {
    "save_screenshots": true,
    "screenshot_path": "./analysis-results/screenshots/"
  }
}
```

## Integration with Claude Code Workflow

This command integrates seamlessly with Claude Code's workflow:

1. **Discovery Phase**: Automatically locate and parse the Vue component
2. **Analysis Phase**: Use Playwright to render and analyze the component
3. **Planning Phase**: Generate implementation plan with change previews
4. **Implementation Phase**: Apply fixes automatically or with user confirmation
5. **Validation Phase**: Re-run analysis to confirm improvements
6. **Reporting Phase**: Generate before/after comparison reports

### Implementation Workflow Details

#### Automatic Mode (`--implement`)
```bash
# Full automation
claude-code analyze-vue-component MyComponent --implement

# Process:
# 1. Analyze component
# 2. Create backup
# 3. Apply all auto-fixable issues
# 4. Validate changes
# 5. Report results
```

#### Interactive Mode (`--interactive`)
```bash
# User-guided implementation
claude-code analyze-vue-component MyComponent --interactive

# Process:
# 1. Analyze component
# 2. Show each fix with preview
# 3. User approves/rejects each change
# 4. Apply approved changes
# 5. Validate and report
```

#### Dry Run Mode (`--dry-run`)
```bash
# Preview changes only
claude-code analyze-vue-component MyComponent --dry-run

# Process:
# 1. Analyze component
# 2. Generate implementation plan
# 3. Show exact code changes
# 4. No files modified
```

## Error Handling

- **Component Not Found**: Provides suggestions for similar component names
- **Server Not Running**: Instructions to start development server  
- **Playwright Issues**: Fallback to static analysis when browser automation fails
- **Invalid Component**: Clear error messages for malformed Vue files
- **Implementation Errors**: Automatic rollback with detailed error reporting
- **Backup Failures**: Prevents implementation if backup cannot be created
- **Validation Failures**: Rollback changes if post-implementation validation fails
- **Dependency Issues**: Clear messages about missing packages needed for fixes

## Future Enhancements

- Integration with design systems (check against component library standards)
- **AI-Powered Fix Suggestions**: Advanced code transformations using Claude's understanding
- **Batch Processing**: Analyze and fix multiple components simultaneously
- Comparison analysis between component versions
- Integration with CI/CD pipelines for continuous UX monitoring  
- **Live Collaboration**: Real-time analysis and implementation with team members
- Support for Vue 3 Composition API patterns
- Custom rule definitions for project-specific standards
- **Smart Conflict Resolution**: Handle merge conflicts in implementation
- **Performance Monitoring**: Track improvement metrics over time

## Contributing

When extending this command:
1. Follow the established output format patterns
2. Add comprehensive error handling
3. Include unit tests for new analysis features
4. Update this documentation with new options or features