# Dynamic Data Objects - User Guide

**Version**: 1.0
**Date**: 2025-10-29
**Audience**: End Users

---

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Working with Data Objects](#working-with-data-objects)
4. [Creating Instances](#creating-instances)
5. [Viewing Instances](#viewing-instances)
6. [Editing Instances](#editing-instances)
7. [Deleting Instances](#deleting-instances)
8. [Understanding Field Types](#understanding-field-types)
9. [Tips and Best Practices](#tips-and-best-practices)
10. [Troubleshooting](#troubleshooting)

---

## Introduction

### What are Dynamic Data Objects?

Dynamic Data Objects allow you to manage custom data structures created by your system administrators. Instead of having fixed forms and tables, the system generates them automatically based on the data structure definitions.

**Think of it like this**:
- Administrators define what information should be collected (e.g., Company Name, Type, Revenue)
- The system automatically creates forms to enter this information
- You can then create, view, and manage records using these forms

### What Can You Do?

✅ **View available data objects** (e.g., Companies, Projects, Contacts)
✅ **Create new records** (instances) using auto-generated forms
✅ **View all records** in organized lists
✅ **Edit existing records** (coming soon)
✅ **Delete records** you no longer need
✅ **See field counts and record counts** for quick insights

### Where to Find It

The Dynamic Data Objects widget is located on your **Dashboard** page. You'll see it as a card with the title "Dynamic Data Objects" and a database icon.

---

## Getting Started

### Accessing the Dashboard

1. **Login** to the investor portal with your credentials
2. **Navigate** to the Dashboard (usually the first page after login)
3. **Scroll** to find the "Dynamic Data Objects" widget

### Understanding the Widget

The widget contains:

```
┌─────────────────────────────────────────┐
│  🗄️ Dynamic Data Objects                │
├─────────────────────────────────────────┤
│                                         │
│  Select Data Object                     │
│  [Choose a data object...        ▼]    │
│                                         │
└─────────────────────────────────────────┘
```

When you select a data object, the widget expands:

```
┌─────────────────────────────────────────┐
│  🗄️ Dynamic Data Objects                │
├─────────────────────────────────────────┤
│                                         │
│  Select Data Object                     │
│  [Company                        ▼]    │
│                                         │
│  ┌──────────────┬──────────────┐       │
│  │ Create New   │  View All     │       │
│  └──────────────┴──────────────┘       │
│                                         │
│  ┌───────────┬───────────┐             │
│  │     3     │     5     │             │
│  │  Fields   │ Instances │             │
│  └───────────┴───────────┘             │
└─────────────────────────────────────────┘
```

**Key Elements**:
- **Dropdown**: Select which data object to work with
- **Create New**: Opens a form to create a new record
- **View All**: Shows a list of all existing records
- **Stats**: Quick view of field count and record count

---

## Working with Data Objects

### Selecting a Data Object

1. Click the **dropdown** in the widget
2. You'll see a list of available data objects with:
   - **Name**: What the data object is called (e.g., "Company")
   - **Description**: Brief explanation of what it's for
   - **Instance count**: How many records exist

Example dropdown:
```
┌─────────────────────────────────────────┐
│  Company                                │
│  Company information                    │
│  3 instances                            │
├─────────────────────────────────────────┤
│  Project                                │
│  Project tracking                       │
│  12 instances                           │
├─────────────────────────────────────────┤
│  Contact                                │
│  Contact information                    │
│  8 instances                            │
└─────────────────────────────────────────┘
```

3. **Click** on the data object you want to work with
4. The widget will update to show:
   - Action buttons (Create New, View All)
   - Statistics (field count, instance count)

### Understanding Field Count

The **field count** shows how many pieces of information the data object tracks.

**Example**: A "Company" data object might have 5 fields:
- Company Name
- Company Type
- Revenue
- Founded Date
- Description

### Understanding Instance Count

The **instance count** shows how many records exist for this data object.

**Example**: If you have 5 companies in the system:
- Acme Corporation
- Beta Industries
- Gamma Solutions
- Delta Technologies
- Epsilon Services

Then the instance count is **5**.

---

## Creating Instances

### Step-by-Step Guide

#### 1. Select Data Object

First, select which data object you want to create a record for.

**Example**: Select "Company" from the dropdown

#### 2. Click "Create New"

Click the **Create New** button. A dialog will open with an auto-generated form.

```
┌──────────────────────────────────────────┐
│  Create Company                      ✕   │
├──────────────────────────────────────────┤
│                                          │
│  Company Name *                          │
│  [                              ]        │
│  Legal company name                      │
│                                          │
│  Company Type                            │
│  [Choose...                      ▼]     │
│  Type of company                         │
│                                          │
│  Revenue                                 │
│  [$                             ]        │
│  Annual revenue in USD                   │
│                                          │
│  Founded Date                            │
│  [📅 mm/dd/yyyy                 ]        │
│  Date company was founded                │
│                                          │
│  Description                             │
│  [                              ]        │
│  [                              ]        │
│  [                              ]        │
│  Additional information                  │
│                                          │
├──────────────────────────────────────────┤
│                    [Cancel] [Create]     │
└──────────────────────────────────────────┘
```

#### 3. Fill Required Fields

Fields marked with a **red asterisk (*)** are required.

**Example**:
- **Company Name** * : Enter "Acme Corporation"
- **Company Type**: Select "Technology"
- **Revenue**: Enter 5000000
- **Founded Date**: Select 01/15/2010
- **Description**: "Leading technology company"

#### 4. Field Validation

As you fill the form, the system validates your input:

✅ **Valid**: Field appears normal
❌ **Invalid**: Field shows red border with error message

**Example Error**:
```
Company Name *
[Ac                             ]
❌ Company name must be at least 3 characters
```

#### 5. Submit the Form

Once all required fields are filled correctly:

1. Click the **Create** button
2. The system validates all fields
3. If valid:
   - Instance is created
   - Dialog closes automatically
   - Instance count updates (+1)
   - Success message appears (may vary)

4. If invalid:
   - Error messages appear under invalid fields
   - Dialog remains open
   - Fix errors and try again

#### 6. Verify Creation

After creation:
- Check the **instance count** increased
- Click **View All** to see your new record in the list

---

## Viewing Instances

### Opening the Instance List

1. **Select a data object** from the dropdown
2. Click the **View All** button
3. A dialog opens showing all instances

```
┌────────────────────────────────────────────────┐
│  Company (5)                               ✕   │
├────────────────────────────────────────────────┤
│                                                │
│  ┌──────────────────────────────────────────┐ │
│  │  Company Name: Acme Corporation          │ │
│  │  Company Type: Technology                │ │
│  │  Revenue: $5,000,000.00                  │ │
│  │  Founded Date: 01/15/2010                │ │
│  ├──────────────────────────────────────────┤ │
│  │  Created Oct 29, 2025                    │ │
│  │                    👁️  ✏️  🗑️           │ │
│  └──────────────────────────────────────────┘ │
│                                                │
│  ┌──────────────────────────────────────────┐ │
│  │  Company Name: Beta Industries           │ │
│  │  Company Type: Finance                   │ │
│  │  Revenue: $3,000,000.00                  │ │
│  │  Founded Date: 03/20/2015                │ │
│  ├──────────────────────────────────────────┤ │
│  │  Created Oct 28, 2025                    │ │
│  │                    👁️  ✏️  🗑️           │ │
│  └──────────────────────────────────────────┘ │
│                                                │
└────────────────────────────────────────────────┘
```

### Understanding the List View

Each card in the list shows:

**Main Information**:
- First 4 fields of the data object
- Values formatted appropriately (currency, dates, etc.)

**Metadata**:
- Created date (when the record was created)

**Actions**:
- 👁️ **View**: See full details (coming soon)
- ✏️ **Edit**: Modify the record (coming soon)
- 🗑️ **Delete**: Remove the record

### Empty State

If no instances exist yet:

```
┌────────────────────────────────────────────┐
│  Company (0)                           ✕   │
├────────────────────────────────────────────┤
│                                            │
│            📭                              │
│                                            │
│        No instances yet                    │
│                                            │
│    [Create First Instance]                 │
│                                            │
└────────────────────────────────────────────┘
```

Click **Create First Instance** to get started.

---

## Editing Instances

⚠️ **Coming Soon**: Edit functionality is planned but not yet implemented.

**Expected Workflow** (when available):
1. Open the instance list (View All)
2. Click the **edit icon** (✏️) on the instance you want to modify
3. A pre-filled form opens with current values
4. Modify the fields you want to change
5. Click **Save** to update the instance

---

## Deleting Instances

### How to Delete

1. **Open the instance list**: Click "View All"
2. **Find the instance** you want to delete
3. **Click the delete icon** (🗑️)
4. A **confirmation dialog** appears

```
┌─────────────────────────────────────────┐
│  Confirm Delete                         │
├─────────────────────────────────────────┤
│                                         │
│  ⚠️  Delete this instance?              │
│                                         │
│      This action cannot be undone.      │
│                                         │
├─────────────────────────────────────────┤
│              [Cancel]  [Delete]         │
└─────────────────────────────────────────┘
```

5. **Confirm**: Click "Delete"
6. **Verify**: Instance removed, count updated (-1)

### Important Notes

⚠️ **Deletion is permanent** - There is no undo
⚠️ **Cannot be recovered** - Make sure before deleting
✅ **Safe to cancel** - Click "Cancel" if unsure

### When to Delete

**Delete when**:
- Record is no longer needed
- Duplicate entry was created by mistake
- Information is outdated and irrelevant

**Don't delete when**:
- You might need the information later
- Other records might reference it
- Required for audit/compliance purposes

---

## Understanding Field Types

The system supports 13 different field types. Here's what to expect for each:

### Text Fields

#### TEXT (Single-line)
- **Appears as**: Standard text input box
- **Used for**: Names, titles, short descriptions
- **Example**: Company Name

```
Company Name *
[Acme Corporation                           ]
```

#### TEXTAREA (Multi-line)
- **Appears as**: Large text area (4+ lines)
- **Used for**: Descriptions, notes, comments
- **Example**: Company Description

```
Description
[Leading technology company                 ]
[specializing in enterprise software        ]
[solutions for Fortune 500 companies.       ]
[                                           ]
```

#### EMAIL
- **Appears as**: Text input with email validation
- **Used for**: Email addresses
- **Validates**: Proper email format

```
Contact Email *
[john.doe@acme.com                          ]
```

#### URL
- **Appears as**: Text input with URL validation
- **Used for**: Website addresses
- **Validates**: Proper URL format

```
Website
[https://www.acme.com                       ]
```

#### RICH_TEXT
- **Appears as**: WYSIWYG editor with formatting toolbar
- **Used for**: Formatted text with styles, lists, links
- **Features**: Bold, italic, lists, links, headings

```
┌────────────────────────────────────────────┐
│ B I U  🔗 • ≡  H1 H2                      │
├────────────────────────────────────────────┤
│ This is **bold** and this is *italic*     │
│                                            │
│ • List item 1                              │
│ • List item 2                              │
└────────────────────────────────────────────┘
```

### Number Fields

#### NUMBER
- **Appears as**: Numeric input with +/- buttons
- **Used for**: Quantities, counts, percentages
- **Features**: Increment/decrement buttons

```
Employee Count
[  -  ] 250 [  +  ]
```

#### CURRENCY
- **Appears as**: Number input with currency symbol
- **Used for**: Money amounts
- **Features**: Formatted with commas and decimals
- **Default**: USD ($)

```
Annual Revenue
$ [5,000,000.00                             ]
```

### Date/Time Fields

#### DATE
- **Appears as**: Date picker
- **Used for**: Dates without time
- **Features**: Calendar popup

```
Founded Date *
[📅 01/15/2010                              ]
    ↓ (click to open calendar)
┌────────────────────────┐
│   January 2010         │
│ Su Mo Tu We Th Fr Sa   │
│           1  2  3  4   │
│  5  6  7  8  9 10 11   │
│ 12 13 14 [15] 16 17 18 │
│ 19 20 21 22 23 24 25   │
│ 26 27 28 29 30 31      │
└────────────────────────┘
```

#### DATETIME
- **Appears as**: Date and time picker
- **Used for**: Events, appointments with specific times
- **Features**: Calendar + time selection

```
Meeting Date & Time
[📅 01/15/2010  🕐 10:30:00                ]
```

### Choice Fields

#### BOOLEAN
- **Appears as**: Checkbox or toggle switch
- **Used for**: Yes/No, True/False flags
- **Values**: Checked = Yes/True, Unchecked = No/False

```
Is Active
☑ Yes
```

#### SINGLE_SELECT
- **Appears as**: Dropdown menu
- **Used for**: Choose one option from a list
- **Features**: Searchable dropdown

```
Company Type *
[Technology                          ▼]

↓ (click to open)

┌──────────────────────────────┐
│ Technology           ✓        │
│ Finance                       │
│ Healthcare                    │
│ Manufacturing                 │
│ Retail                        │
└──────────────────────────────┘
```

#### MULTI_SELECT
- **Appears as**: Multi-select dropdown
- **Used for**: Choose multiple options from a list
- **Features**: Searchable, shows selected as chips

```
Tags
[Technology, Innovation      ▼]

Selected: [Technology ✕] [Innovation ✕]

↓ (click to add more)

┌──────────────────────────────┐
│ ☑ Technology                 │
│ ☑ Innovation                 │
│ ☐ Enterprise                 │
│ ☐ Cloud                      │
│ ☐ AI/ML                      │
└──────────────────────────────┘
```

### File Fields

#### FILE
- **Appears as**: File upload button
- **Used for**: Attaching documents, images
- **Features**: Drag-and-drop support (varies)

```
Company Logo
┌──────────────────────────────┐
│    📁 Choose File            │
│                              │
│    or drag and drop          │
└──────────────────────────────┘

After upload:
[company-logo.png ✕]
```

---

## Tips and Best Practices

### Creating Quality Records

#### 1. Fill All Required Fields

Always complete fields marked with *. The form won't submit without them.

✅ **Good**: All required fields completed
❌ **Bad**: Skipping required fields

#### 2. Use Descriptive Names

Make records easy to find later with clear, descriptive names.

✅ **Good**: "Acme Corporation - Enterprise Solutions Division"
❌ **Bad**: "Company1", "Test", "ABCD"

#### 3. Provide Complete Information

Even optional fields can be valuable. Fill what you know.

✅ **Good**: Fill description, contact info, dates
❌ **Bad**: Only fill the bare minimum

#### 4. Check for Duplicates

Before creating, check if a similar record already exists.

**How to Check**:
1. Click "View All"
2. Scan existing records
3. If found, edit existing instead of creating new

#### 5. Use Consistent Formatting

Maintain consistency in how you enter data:

✅ **Good**: All phone numbers as (555) 123-4567
❌ **Bad**: Mix of 555-123-4567, 5551234567, etc.

### Managing Records Efficiently

#### Organize with Filters (Future)

When advanced filtering is added, you'll be able to:
- Filter by field values
- Sort by any field
- Search across all fields
- Save filter presets

#### Regular Cleanup

Periodically review and delete:
- Outdated records
- Duplicate entries
- Test data

#### Export for Backup (Future)

When export functionality is added:
- Export to Excel/CSV regularly
- Keep backups of important data
- Share data with stakeholders

---

## Troubleshooting

### Common Issues and Solutions

#### Issue: "Validation failed" error

**Symptoms**: Can't submit form, red error messages appear

**Causes**:
- Required field left empty
- Value doesn't meet validation rules (min/max length, format, etc.)

**Solutions**:
1. Read the error message under each red field
2. Fix the invalid values
3. Try submitting again

**Example**:
```
Company Name *
[Ab                                 ]
❌ Company name must be at least 3 characters

Solution: Change to "ABC Corporation" (3+ chars)
```

---

#### Issue: Can't see "Create New" button

**Symptoms**: Button is missing or disabled

**Causes**:
- No data object selected
- Don't have permission to create records

**Solutions**:
1. **Select a data object** from dropdown first
2. **Check permissions**: Contact administrator if you need access
3. **Verify role**: Ensure you have WRITE permission for this data object

---

#### Issue: Instance count doesn't update

**Symptoms**: Create/delete works but count stays same

**Causes**:
- Browser cache issue
- Need to refresh

**Solutions**:
1. **Refresh the page** (F5 or Ctrl+R)
2. **Re-select the data object** from dropdown
3. **Clear browser cache** if problem persists

---

#### Issue: Can't delete an instance

**Symptoms**: Delete button missing or doesn't work

**Causes**:
- Don't have permission to delete
- Instance is referenced elsewhere (future)

**Solutions**:
1. **Check permissions**: Contact administrator for DELETE access
2. **Try refreshing**: Page might be outdated
3. **Contact support**: If referenced elsewhere, may need admin help

---

#### Issue: Form fields not appearing

**Symptoms**: Dialog opens but no fields show

**Causes**:
- Data object has no fields defined
- Network error loading schema

**Solutions**:
1. **Check data object**: Admin may need to add fields
2. **Try again**: Close and reopen the dialog
3. **Check network**: Ensure stable internet connection
4. **Contact admin**: Data object may be misconfigured

---

#### Issue: Dropdown options are empty

**Symptoms**: Select field has no choices

**Causes**:
- No options configured for this field
- Options are all marked inactive

**Solutions**:
1. **Contact administrator**: They need to add options
2. **Try another field**: This field may not be ready yet

---

### Getting Help

If you encounter issues not covered here:

#### 1. Check This Guide
Review the relevant sections above.

#### 2. Contact Your Administrator
They can:
- Grant you additional permissions
- Fix data object configurations
- Add missing dropdown options

#### 3. Report Bugs
If something seems broken:
- Note what you were doing
- Screenshot the error
- Send to support team

#### 4. Request Features
Have ideas for improvements?
- Suggest to your administrator
- They can request features from development team

---

## Quick Reference

### Widget Actions

| Action | What It Does |
|--------|-------------|
| Select Data Object | Choose which type of record to work with |
| Create New | Open form to create new record |
| View All | See list of all existing records |

### Instance Actions

| Icon | Action | What It Does | Status |
|------|--------|-------------|--------|
| 👁️ | View | See full record details | Coming Soon |
| ✏️ | Edit | Modify record | Coming Soon |
| 🗑️ | Delete | Remove record permanently | ✅ Available |

### Field Indicators

| Symbol | Meaning |
|--------|---------|
| * (red asterisk) | Required field - must fill |
| 📅 (calendar icon) | Click to open date picker |
| ▼ (dropdown arrow) | Click to see options |
| ✕ (x button) | Click to remove/clear |

### Form Actions

| Button | What It Does |
|--------|-------------|
| Create | Submit form and create record |
| Cancel | Close dialog without saving |
| Delete | Confirm deletion (in delete dialog) |

---

## Keyboard Shortcuts

### Navigation

- **Tab**: Move to next field
- **Shift + Tab**: Move to previous field
- **Enter**: Submit form (when all fields valid)
- **Esc**: Close dialog

### Field Editing

- **Ctrl/Cmd + A**: Select all text in field
- **Ctrl/Cmd + C**: Copy selected text
- **Ctrl/Cmd + V**: Paste text
- **Ctrl/Cmd + Z**: Undo typing

---

## Frequently Asked Questions (FAQ)

### Q: How many instances can I create?

**A**: There's no hard limit. You can create as many instances as needed for your data object.

---

### Q: Can I edit an instance after creating it?

**A**: Edit functionality is coming soon. For now, you can delete and recreate if needed.

---

### Q: What happens to deleted instances?

**A**: They are permanently removed and cannot be recovered. Be sure before deleting!

---

### Q: Can I see who created an instance?

**A**: This information is tracked but not yet displayed in the UI. Coming in a future update.

---

### Q: Why can't I see certain data objects?

**A**: You may not have permission to access them. Contact your administrator for access.

---

### Q: Can I export instances to Excel?

**A**: Export functionality is planned but not yet implemented.

---

### Q: How do I know what each field means?

**A**: Many fields have descriptions shown in gray text below the input. If unclear, ask your administrator.

---

### Q: Can I upload multiple files to a FILE field?

**A**: Currently, file fields support single file uploads. Multiple file support may come later.

---

### Q: Why do some dropdown fields have different options than others?

**A**: Each field's options are configured independently by administrators based on business needs.

---

### Q: Can I create my own data objects?

**A**: Only administrators with SUPER_ADMIN role can create and configure data objects.

---

## Glossary

| Term | Definition |
|------|------------|
| **Data Object** | A template/structure defining what information to collect (e.g., Company, Project) |
| **Instance** | A single record created from a data object (e.g., "Acme Corporation") |
| **Field** | A single piece of information in a data object (e.g., "Company Name") |
| **Field Type** | The kind of data a field can hold (e.g., TEXT, NUMBER, DATE) |
| **Validation** | Rules that ensure data is entered correctly |
| **Required Field** | A field that must be filled before submitting (marked with *) |
| **Dropdown** | A field that lets you pick from predefined options |
| **Widget** | A component on the dashboard for specific functionality |

---

**Last Updated**: 2025-10-29
**Version**: 1.0
**Need Help?** Contact your system administrator
