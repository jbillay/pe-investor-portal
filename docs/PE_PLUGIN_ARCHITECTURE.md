# PE Plugin Architecture Guide

**Version:** 1.0.0
**Last Updated:** November 2025
**Target Audience:** PE Portal Plugin Developers

---

## Table of Contents

1. [Overview](#overview)
2. [PE Portal Plugin Strategy](#pe-portal-plugin-strategy)
3. [Plugin Distribution Model](#plugin-distribution-model)
4. [Common PE Data Models](#common-pe-data-models)
5. [Shared Components & Utilities](#shared-components--utilities)
6. [Plugin Interaction Patterns](#plugin-interaction-patterns)
7. [Security & Compliance](#security--compliance)
8. [Performance Guidelines](#performance-guidelines)
9. [Plugin Examples by Use Case](#plugin-examples-by-use-case)

---

## Overview

### The Vision

The PE Investor Portal is designed as a **plugin-first platform** where all PE-specific functionality is delivered through independent, installable plugins. This architecture allows:

- **Client Customization**: Each client gets only the plugins they need
- **Flexible Deployment**: Plugins can be developed, tested, and deployed independently
- **Feature Isolation**: Bug in one plugin doesn't affect others
- **Gradual Rollout**: New features can be tested with select clients
- **Third-Party Extensions**: Partners can build their own plugins

### Core vs Plugin Responsibilities

**Core Platform Provides:**
- User authentication & session management
- Role-based access control (RBAC)
- Dynamic data objects (EAV storage)
- Email system with templates & queue
- Audit trail logging
- File upload/storage
- Base UI framework (Vue 3, PrimeVue, Tailwind)
- Plugin loading & lifecycle management

**Plugins Provide:**
- PE-specific business logic
- Custom UI components
- Specialized calculations (IRR, MOIC, NAV)
- Domain-specific workflows
- Regulatory compliance features
- Client-specific customizations

---

## PE Portal Plugin Strategy

### Plugin Categories

PE portal plugins fall into these categories:

#### 1. **Fund Management Plugins**
- Fund creation & marketing
- Fund documentation
- Fund performance tracking
- Fund reporting

#### 2. **Investor Relations Plugins**
- Capital call management
- Distribution management
- Commitment tracking
- Investor communications
- Investor portal access

#### 3. **Portfolio Management Plugins**
- Portfolio company tracking
- Valuation management
- Deal pipeline
- Exit planning

#### 4. **Financial Plugins**
- NAV calculations
- IRR/MOIC analytics
- Cash flow projections
- Fee calculations
- Carry calculations

#### 5. **Compliance & Reporting Plugins**
- Regulatory reporting (e.g., SEC, ILPA)
- ESG/Impact reporting
- Tax reporting (K-1 generation)
- AIFMD/MiFID II compliance

#### 6. **Document Management Plugins**
- Due diligence document repositories
- Legal document management
- Subscription document management
- Automated document generation

### Architecture Principles

#### Principle 1: Frontend-Only Plugins

Plugins are purely frontend applications that:
- Use Vue 3 Composition API
- Leverage PrimeVue components
- Style with Tailwind CSS
- Store data via Dynamic Data Objects API
- Call core backend APIs for all operations

**Why Frontend-Only?**
- Simpler deployment (no backend changes required)
- Faster development cycles
- Easier testing and debugging
- Consistent security model
- Platform independence (could support multiple backends)

#### Principle 2: Data via Dynamic Objects

Plugins store all data using the Dynamic Data Objects system:
- No custom database tables
- Automatic CRUD APIs
- Built-in versioning & audit trails
- Automatic UI generation capabilities
- Schema evolution support

#### Principle 3: Permission Integration

Every plugin integrates with RBAC:
- Defines its own permissions during installation
- Checks permissions before sensitive operations
- Respects role-based access controls
- Provides admin UI for permission assignment

#### Principle 4: Independent Deployment

Each plugin is a separate codebase:
- Own Git repository
- Independent versioning (semver)
- Separate CI/CD pipeline
- Self-contained dependencies
- Can be installed/uninstalled per client

#### Principle 5: Inter-Plugin Collaboration

Plugins can interact with each other:
- Share data via Dynamic Data Objects
- Emit and listen to events
- Query each other's data objects
- Coordinate workflows

---

## Plugin Distribution Model

### Repository Structure

Each plugin is a separate GitHub repository:

```
fund-marketing-plugin/
├── README.md
├── package.json
├── plugin.json                 # Plugin manifest
├── src/
│   ├── index.js               # Entry point
│   ├── components/            # Vue components
│   │   ├── FundList.js
│   │   ├── FundEditor.js
│   │   └── FundDetail.js
│   ├── composables/           # Vue composables
│   │   ├── useFunds.js
│   │   └── useFundAnalytics.js
│   ├── utils/                 # Utility functions
│   │   ├── calculations.js
│   │   └── formatters.js
│   └── assets/                # Static assets
│       ├── icons/
│       └── images/
├── docs/                      # Plugin documentation
│   ├── INSTALLATION.md
│   ├── USER_GUIDE.md
│   └── API.md
├── tests/                     # Tests
│   ├── unit/
│   └── e2e/
├── .github/
│   └── workflows/
│       └── ci.yml             # CI/CD pipeline
└── dist/                      # Build output
    └── fund-marketing-plugin.zip
```

### Build Process

```bash
# package.json scripts
{
  "scripts": {
    "build": "node scripts/build.js",
    "package": "node scripts/package.js",
    "test": "jest",
    "lint": "eslint src/",
    "release": "npm run test && npm run build && npm run package"
  }
}
```

### Installation Flow

1. **Development**: Plugin developer builds plugin locally
2. **Testing**: Plugin tested against core platform
3. **Release**: Plugin packaged as ZIP file
4. **Distribution**: ZIP uploaded to client's portal
5. **Installation**: Admin installs via Admin > Plugins
6. **Activation**: Plugin creates data objects, registers permissions
7. **Configuration**: Admin assigns permissions to roles
8. **Usage**: Users access plugin features based on permissions

---

## Common PE Data Models

### Recommended Data Object Naming

To ensure consistency and avoid conflicts, use these naming conventions:

| Entity | Data Object Name | Plugin | Description |
|--------|-----------------|--------|-------------|
| Fund | `Fund` | fund-marketing-plugin | Investment fund information |
| Commitment | `Commitment` | commitment-tracking-plugin | Investor commitments |
| Capital Call | `CapitalCall` | capital-call-plugin | Capital call notices |
| Distribution | `Distribution` | distribution-plugin | Distribution payments |
| Portfolio Company | `PortfolioCompany` | portfolio-plugin | Portfolio company details |
| Valuation | `Valuation` | valuation-plugin | Periodic valuations |
| Transaction | `Transaction` | transaction-plugin | Financial transactions |
| Document | `[PluginName]Document` | various | Plugin-specific documents |

### Example: Shared Fund Model

Since multiple plugins might need fund information, establish a standard:

```javascript
// Fund Data Object (created by fund-marketing-plugin)
{
  name: "Fund",
  description: "Investment fund core information",
  fields: [
    {
      name: "fundName",
      label: "Fund Name",
      fieldType: "TEXT",
      required: true
    },
    {
      name: "fundLegalName",
      label: "Legal Name",
      fieldType: "TEXT",
      required: true
    },
    {
      name: "fundType",
      label: "Fund Type",
      fieldType: "SINGLE_SELECT",
      dropdownOptions: [
        { value: "BUYOUT", label: "Buyout" },
        { value: "VENTURE", label: "Venture Capital" },
        { value: "GROWTH", label: "Growth Equity" },
        { value: "DEBT", label: "Private Debt" },
        { value: "REAL_ESTATE", label: "Real Estate" },
        { value: "INFRASTRUCTURE", label: "Infrastructure" }
      ]
    },
    {
      name: "vintage",
      label: "Vintage Year",
      fieldType: "NUMBER",
      required: true
    },
    {
      name: "currency",
      label: "Base Currency",
      fieldType: "SINGLE_SELECT",
      dropdownOptions: [
        { value: "USD", label: "US Dollar" },
        { value: "EUR", label: "Euro" },
        { value: "GBP", label: "British Pound" }
      ]
    },
    {
      name: "targetSize",
      label: "Target Fund Size",
      fieldType: "CURRENCY",
      required: true
    },
    {
      name: "finalSize",
      label: "Final Closing Size",
      fieldType: "CURRENCY"
    },
    {
      name: "firstCloseDate",
      label: "First Closing Date",
      fieldType: "DATE"
    },
    {
      name: "finalCloseDate",
      label: "Final Closing Date",
      fieldType: "DATE"
    },
    {
      name: "investmentPeriodEnd",
      label: "Investment Period End",
      fieldType: "DATE"
    },
    {
      name: "legalStructure",
      label: "Legal Structure",
      fieldType: "SINGLE_SELECT",
      dropdownOptions: [
        { value: "LP", label: "Limited Partnership" },
        { value: "LLC", label: "Limited Liability Company" },
        { value: "SLP", label: "Scottish Limited Partnership" }
      ]
    },
    {
      name: "domicile",
      label: "Domicile",
      fieldType: "TEXT"
    },
    {
      name: "managementFeeRate",
      label: "Management Fee Rate (%)",
      fieldType: "NUMBER"
    },
    {
      name: "carriedInterestRate",
      label: "Carried Interest Rate (%)",
      fieldType: "NUMBER"
    },
    {
      name: "hurdleRate",
      label: "Hurdle Rate (%)",
      fieldType: "NUMBER"
    },
    {
      name: "status",
      label: "Fund Status",
      fieldType: "SINGLE_SELECT",
      dropdownOptions: [
        { value: "FUNDRAISING", label: "Fundraising" },
        { value: "INVESTING", label: "Investing" },
        { value: "HARVESTING", label: "Harvesting" },
        { value: "LIQUIDATING", label: "Liquidating" },
        { value: "CLOSED", label: "Closed" }
      ]
    }
  ]
}
```

### Example: Commitment Model

```javascript
// Commitment Data Object (created by commitment-tracking-plugin)
{
  name: "Commitment",
  description: "Investor commitment to a fund",
  fields: [
    {
      name: "fund",
      label: "Fund",
      fieldType: "RELATIONSHIP",
      relationshipTarget: "Fund",
      required: true
    },
    {
      name: "investor",
      label: "Investor",
      fieldType: "RELATIONSHIP",
      relationshipTarget: "User",
      required: true
    },
    {
      name: "commitmentAmount",
      label: "Commitment Amount",
      fieldType: "CURRENCY",
      required: true
    },
    {
      name: "commitmentDate",
      label: "Commitment Date",
      fieldType: "DATE",
      required: true
    },
    {
      name: "commitmentCurrency",
      label: "Currency",
      fieldType: "SINGLE_SELECT",
      dropdownOptions: [
        { value: "USD", label: "US Dollar" },
        { value: "EUR", label: "Euro" },
        { value: "GBP", label: "British Pound" }
      ]
    },
    {
      name: "calledAmount",
      label: "Total Called to Date",
      fieldType: "CURRENCY",
      required: false
    },
    {
      name: "distributedAmount",
      label: "Total Distributed to Date",
      fieldType: "CURRENCY",
      required: false
    },
    {
      name: "unfundedCommitment",
      label: "Unfunded Commitment",
      fieldType: "CURRENCY",
      required: false
    },
    {
      name: "investorClass",
      label: "Investor Class",
      fieldType: "SINGLE_SELECT",
      dropdownOptions: [
        { value: "CLASS_A", label: "Class A" },
        { value: "CLASS_B", label: "Class B" },
        { value: "FOUNDERS", label: "Founders" }
      ]
    },
    {
      name: "status",
      label: "Status",
      fieldType: "SINGLE_SELECT",
      dropdownOptions: [
        { value: "ACTIVE", label: "Active" },
        { value: "SUSPENDED", label: "Suspended" },
        { value: "WITHDRAWN", label: "Withdrawn" }
      ]
    }
  ]
}
```

---

## Shared Components & Utilities

### When to Add to Core

Components and utilities should be added to the core platform when:
- **Used by 2+ plugins**: Avoids code duplication
- **General-purpose**: Not tied to specific plugin logic
- **Stable API**: Interface unlikely to change frequently
- **Well-tested**: Has comprehensive test coverage
- **Documented**: Clear usage documentation

### Shared Component Examples

#### Currency Formatter

```javascript
// Should be added to core: app/frontend/src/utils/formatters.js
export const formatCurrency = (amount, currency = 'USD', locale = 'en-US') => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);
};

// Usage in plugins
import { formatCurrency } from '@/utils/formatters';
const display = formatCurrency(5000000, 'USD'); // "$5,000,000"
```

#### Date Formatter

```javascript
// Should be added to core: app/frontend/src/utils/formatters.js
export const formatDate = (date, format = 'long') => {
  const d = new Date(date);

  switch (format) {
    case 'short':
      return d.toLocaleDateString();
    case 'long':
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    case 'iso':
      return d.toISOString().split('T')[0];
    default:
      return d.toLocaleDateString();
  }
};
```

#### PE Calculations Library

```javascript
// Should be added to core: app/frontend/src/utils/pe-calculations.js

/**
 * Calculate Internal Rate of Return (IRR)
 * @param cashFlows Array of {date, amount} objects
 * @returns IRR as decimal (e.g., 0.15 for 15%)
 */
export const calculateIRR = (cashFlows) => {
  // Newton-Raphson method implementation
  // ... complex calculation logic
};

/**
 * Calculate Multiple on Invested Capital (MOIC)
 * @param totalInvested Total capital invested
 * @param totalReturned Total capital returned (distributions + NAV)
 * @returns MOIC as number (e.g., 2.5x)
 */
export const calculateMOIC = (totalInvested, totalReturned) => {
  if (totalInvested === 0) return 0;
  return totalReturned / totalInvested;
};

/**
 * Calculate Distributed to Paid-In (DPI)
 * @param distributions Total distributions
 * @param capitalCalled Total capital called
 * @returns DPI as decimal
 */
export const calculateDPI = (distributions, capitalCalled) => {
  if (capitalCalled === 0) return 0;
  return distributions / capitalCalled;
};

/**
 * Calculate Residual Value to Paid-In (RVPI)
 * @param nav Current Net Asset Value
 * @param capitalCalled Total capital called
 * @returns RVPI as decimal
 */
export const calculateRVPI = (nav, capitalCalled) => {
  if (capitalCalled === 0) return 0;
  return nav / capitalCalled;
};

/**
 * Calculate Total Value to Paid-In (TVPI)
 * @param distributions Total distributions
 * @param nav Current Net Asset Value
 * @param capitalCalled Total capital called
 * @returns TVPI as decimal
 */
export const calculateTVPI = (distributions, nav, capitalCalled) => {
  if (capitalCalled === 0) return 0;
  return (distributions + nav) / capitalCalled;
};
```

#### Investor Selector Component

```vue
<!-- Should be added to core: app/frontend/src/components/common/InvestorSelector.vue -->
<template>
  <div class="investor-selector">
    <label v-if="label" class="block text-sm font-medium text-gray-700 mb-2">
      {{ label }}
    </label>
    <Dropdown
      v-model="selectedInvestor"
      :options="investors"
      optionLabel="displayName"
      optionValue="id"
      :filter="true"
      filterPlaceholder="Search investors..."
      :placeholder="placeholder"
      :loading="loading"
      :disabled="disabled"
      class="w-full"
      @change="handleChange"
    >
      <template #option="{ option }">
        <div class="flex items-center gap-3">
          <Avatar
            :image="option.profile?.avatar"
            :label="option.firstName?.[0] + option.lastName?.[0]"
            shape="circle"
            size="normal"
          />
          <div>
            <div class="font-semibold">{{ option.displayName }}</div>
            <div class="text-sm text-gray-500">{{ option.email }}</div>
          </div>
        </div>
      </template>
    </Dropdown>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import Dropdown from 'primevue/dropdown';
import Avatar from 'primevue/avatar';

const props = defineProps({
  modelValue: String,
  label: String,
  placeholder: {
    type: String,
    default: 'Select an investor'
  },
  disabled: Boolean,
  role: {
    type: String,
    default: 'INVESTOR'
  }
});

const emit = defineEmits(['update:modelValue', 'change']);

const investors = ref([]);
const loading = ref(false);
const selectedInvestor = ref(props.modelValue);

const loadInvestors = async () => {
  loading.value = true;
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(
      `/api/admin/users?role=${props.role}&limit=1000`,
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );
    const data = await response.json();
    investors.value = data.users.map(u => ({
      ...u,
      displayName: `${u.firstName} ${u.lastName}`
    }));
  } catch (error) {
    console.error('Failed to load investors:', error);
  } finally {
    loading.value = false;
  }
};

const handleChange = () => {
  emit('update:modelValue', selectedInvestor.value);
  const investor = investors.value.find(i => i.id === selectedInvestor.value);
  emit('change', investor);
};

onMounted(() => {
  loadInvestors();
});
</script>
```

#### Amount Input Component

```vue
<!-- Should be added to core: app/frontend/src/components/common/AmountInput.vue -->
<template>
  <div class="amount-input">
    <label v-if="label" class="block text-sm font-medium text-gray-700 mb-2">
      {{ label }}
    </label>
    <div class="flex gap-2">
      <Dropdown
        v-model="selectedCurrency"
        :options="currencies"
        optionLabel="label"
        optionValue="value"
        class="w-28"
        @change="handleCurrencyChange"
      />
      <InputNumber
        v-model="amount"
        :placeholder="placeholder"
        :min="min"
        :max="max"
        :minFractionDigits="0"
        :maxFractionDigits="2"
        :useGrouping="true"
        :disabled="disabled"
        class="flex-1"
        @input="handleAmountChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import Dropdown from 'primevue/dropdown';
import InputNumber from 'primevue/inputnumber';

const props = defineProps({
  modelValue: Number,
  currency: {
    type: String,
    default: 'USD'
  },
  label: String,
  placeholder: String,
  min: Number,
  max: Number,
  disabled: Boolean
});

const emit = defineEmits(['update:modelValue', 'update:currency', 'change']);

const amount = ref(props.modelValue);
const selectedCurrency = ref(props.currency);

const currencies = [
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'CHF', label: 'CHF - Swiss Franc' },
  { value: 'JPY', label: 'JPY - Japanese Yen' }
];

const handleAmountChange = () => {
  emit('update:modelValue', amount.value);
  emit('change', { amount: amount.value, currency: selectedCurrency.value });
};

const handleCurrencyChange = () => {
  emit('update:currency', selectedCurrency.value);
  emit('change', { amount: amount.value, currency: selectedCurrency.value });
};

watch(() => props.modelValue, (newVal) => {
  amount.value = newVal;
});

watch(() => props.currency, (newVal) => {
  selectedCurrency.value = newVal;
});
</script>
```

### Proposing Shared Components

To propose a component for core inclusion:

1. **Create Issue**: Open GitHub issue titled "Shared Component Proposal: [ComponentName]"
2. **Provide Context**: Explain which plugins need it
3. **Show Implementation**: Include working code
4. **Document API**: Clear props, events, slots
5. **Include Tests**: Unit tests demonstrating usage
6. **Get Approval**: Wait for core team review

---

## Plugin Interaction Patterns

### Pattern 1: Sequential Workflow

Multiple plugins work together in a defined sequence.

**Example**: Capital Call → Payment → Distribution

```javascript
// capital-call-plugin emits event when capital call is created
context.emitEvent('capital-call-created', {
  capitalCallId: 'uuid',
  fundId: 'fund-uuid',
  dueDate: '2025-12-31',
  totalAmount: 5000000
});

// payment-tracking-plugin listens and creates payment records
context.onEvent('capital-call-plugin:capital-call-created', async (payload) => {
  // Get all commitments for this fund
  const commitments = await loadCommitments(payload.fundId);

  // Create payment records for each investor
  for (const commitment of commitments) {
    await createPaymentRecord({
      capitalCallId: payload.capitalCallId,
      investorId: commitment.investor,
      amount: calculateProRataAmount(commitment, payload.totalAmount)
    });
  }
});

// distribution-plugin listens for payment completion
context.onEvent('payment-tracking-plugin:payment-received', async (payload) => {
  // Check if capital call is fully funded
  const isFunded = await checkCapitalCallFunding(payload.capitalCallId);

  if (isFunded) {
    // Trigger distribution workflow
    context.emitEvent('capital-call-funded', {
      capitalCallId: payload.capitalCallId,
      fundedAt: new Date().toISOString()
    });
  }
});
```

### Pattern 2: Data Aggregation

One plugin aggregates data from multiple plugins.

**Example**: Portfolio dashboard aggregating fund performance

```javascript
// portfolio-dashboard-plugin
const loadPortfolioData = async () => {
  // Get funds from fund-marketing-plugin
  const fundsResponse = await fetch(
    context.getApiUrl('/dynamic/Fund'),
    { headers: getAuthHeaders() }
  );
  const funds = await fundsResponse.json();

  // Get commitments from commitment-tracking-plugin
  const commitmentsResponse = await fetch(
    context.getApiUrl('/dynamic/Commitment'),
    { headers: getAuthHeaders() }
  );
  const commitments = await commitmentsResponse.json();

  // Get valuations from valuation-plugin
  const valuationsResponse = await fetch(
    context.getApiUrl('/dynamic/Valuation?sort=date&order=DESC'),
    { headers: getAuthHeaders() }
  );
  const valuations = await valuationsResponse.json();

  // Aggregate data
  return funds.instances.map(fund => ({
    ...fund,
    totalCommitments: commitments.instances
      .filter(c => c.fieldValues.fund === fund.id)
      .reduce((sum, c) => sum + c.fieldValues.commitmentAmount, 0),
    latestValuation: valuations.instances
      .find(v => v.fieldValues.fund === fund.id)
  }));
};
```

### Pattern 3: Cross-Plugin Validation

One plugin validates data from another.

**Example**: Distribution plugin validates against commitments

```javascript
// distribution-plugin
const createDistribution = async (distributionData) => {
  // Get commitment to validate investor eligibility
  const commitment = await fetch(
    context.getApiUrl(`/dynamic/Commitment?filter[investor]=${distributionData.investorId}&filter[fund]=${distributionData.fundId}`),
    { headers: getAuthHeaders() }
  ).then(r => r.json());

  if (!commitment.instances.length) {
    throw new Error('Investor does not have a commitment to this fund');
  }

  const investorCommitment = commitment.instances[0];

  // Validate distribution amount doesn't exceed commitment
  if (distributionData.amount > investorCommitment.fieldValues.commitmentAmount) {
    throw new Error('Distribution amount exceeds investor commitment');
  }

  // Create distribution
  await fetch(
    context.getApiUrl('/dynamic/Distribution'),
    {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        fieldValues: distributionData
      })
    }
  );
};
```

---

## Security & Compliance

### Permission Hierarchy

Establish clear permission hierarchy:

```
SUPER_ADMIN
└── Can install/uninstall plugins
└── Can assign all permissions

FUND_ADMIN
└── FUND:VIEW, FUND:CREATE, FUND:EDIT, FUND:DELETE
└── COMMITMENT:VIEW, COMMITMENT:CREATE, COMMITMENT:EDIT
└── CAPITAL_CALL:VIEW, CAPITAL_CALL:CREATE, CAPITAL_CALL:APPROVE
└── DISTRIBUTION:VIEW, DISTRIBUTION:CREATE, DISTRIBUTION:APPROVE

FUND_MANAGER
└── FUND:VIEW, FUND:CREATE, FUND:EDIT
└── PORTFOLIO:VIEW, PORTFOLIO:CREATE, PORTFOLIO:EDIT
└── VALUATION:VIEW, VALUATION:CREATE
└── DOCUMENT:VIEW, DOCUMENT:UPLOAD

INVESTOR
└── FUND:VIEW (own funds only)
└── COMMITMENT:VIEW (own commitments only)
└── CAPITAL_CALL:VIEW (own calls only)
└── DISTRIBUTION:VIEW (own distributions only)
└── DOCUMENT:VIEW (accessible documents only)
```

### Data Access Patterns

#### Scope-Based Filtering

```javascript
// Admin can view all funds
GET /api/dynamic/Fund
// Returns: all funds

// Investor can only view funds they're committed to
GET /api/dynamic/Fund?filter[investor]=current-user-id
// Returns: only funds where investor has commitments
```

#### Implement in Plugin

```javascript
const loadFunds = async () => {
  const context = usePluginContext('fund-marketing-plugin');
  let url = '/dynamic/Fund';

  // If user is investor, filter by their commitments
  if (context.hasRole('INVESTOR') && !context.hasRole('ADMIN')) {
    const userId = context.currentUser.value.id;

    // First get user's commitments
    const commitmentsResponse = await fetch(
      context.getApiUrl(`/dynamic/Commitment?filter[investor]=${userId}`),
      { headers: getAuthHeaders() }
    );
    const commitments = await commitmentsResponse.json();

    // Get fund IDs
    const fundIds = commitments.instances.map(c => c.fieldValues.fund);

    // Filter funds by IDs
    url = `/dynamic/Fund?filter[id]=${fundIds.join(',')}`;
  }

  const response = await fetch(
    context.getApiUrl(url),
    { headers: getAuthHeaders() }
  );

  return await response.json();
};
```

### Audit Trail Integration

Log all sensitive operations:

```javascript
const logPluginAction = async (action, resourceType, resourceId, details = {}) => {
  const context = usePluginContext('your-plugin-id');

  try {
    await fetch(context.getApiUrl('/admin/audit-trail'), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        action,
        resourceType,
        resourceId,
        metadata: {
          plugin: 'your-plugin-id',
          ...details
        }
      })
    });
  } catch (error) {
    console.error('Audit logging failed:', error);
    // Don't fail the main operation if audit logging fails
  }
};

// Usage
await createCapitalCall(callData);
await logPluginAction(
  'CAPITAL_CALL_CREATED',
  'CapitalCall',
  newCall.id,
  {
    fundId: callData.fundId,
    amount: callData.totalAmount,
    dueDate: callData.dueDate
  }
);
```

---

## Performance Guidelines

### 1. Lazy Load Components

```javascript
// Don't load everything upfront
import HeavyComponent from './HeavyComponent.js'; // ❌ Bad

// Lazy load when needed
const HeavyComponent = defineAsyncComponent(() =>
  import('./HeavyComponent.js')
); // ✅ Good
```

### 2. Paginate Large Lists

```javascript
const loadFunds = async (page = 1, limit = 20) => {
  const response = await fetch(
    context.getApiUrl(`/dynamic/Fund?page=${page}&limit=${limit}&sort=createdAt&order=DESC`),
    { headers: getAuthHeaders() }
  );
  return await response.json();
};
```

### 3. Cache Expensive Calculations

```javascript
const calculateFundPerformance = memoize((fund, distributions, valuations) => {
  // Expensive IRR calculation
  const irr = calculateIRR(fund, distributions);
  const moic = calculateMOIC(fund, distributions, valuations);
  return { irr, moic };
}, {
  // Cache for 5 minutes
  maxAge: 5 * 60 * 1000
});
```

### 4. Debounce Search Inputs

```javascript
import { ref } from 'vue';
import { useDebounceFn } from '@vueuse/core';

const searchTerm = ref('');
const searchResults = ref([]);

const performSearch = async (term) => {
  const response = await fetch(
    context.getApiUrl(`/dynamic/Fund?search=${term}`),
    { headers: getAuthHeaders() }
  );
  searchResults.value = await response.json();
};

const debouncedSearch = useDebounceFn(performSearch, 300);

watch(searchTerm, (newTerm) => {
  debouncedSearch(newTerm);
});
```

### 5. Virtualize Long Lists

```vue
<template>
  <div class="investor-list" style="height: 600px; overflow-y: auto;">
    <VirtualScroller
      :items="investors"
      :itemSize="60"
      class="border-1 surface-border border-round"
    >
      <template v-slot:item="{ item }">
        <div class="flex align-items-center p-2">
          <Avatar :label="item.initials" shape="circle" />
          <div class="ml-2">
            <div class="font-semibold">{{ item.name }}</div>
            <div class="text-sm text-gray-500">{{ item.email }}</div>
          </div>
        </div>
      </template>
    </VirtualScroller>
  </div>
</template>

<script setup>
import VirtualScroller from 'primevue/virtualscroller';
import Avatar from 'primevue/avatar';
import { ref, onMounted } from 'vue';

const investors = ref([]);

onMounted(async () => {
  // Load all 10,000 investors - virtual scroller handles rendering
  const response = await fetch(
    context.getApiUrl('/admin/users?role=INVESTOR&limit=10000'),
    { headers: getAuthHeaders() }
  );
  const data = await response.json();
  investors.value = data.users;
});
</script>
```

---

## Plugin Examples by Use Case

### Use Case 1: Fund Marketing Plugin

**Purpose**: Allow fund managers to create and publish fund information to the investor portal.

**Features**:
- Create fund profiles
- Add marketing documents
- Publish to investor portal
- Track investor interest

**Data Objects**:
- `Fund`
- `FundDocument`
- `FundInquiry`

**Permissions**:
- `FUND:VIEW`
- `FUND:CREATE`
- `FUND:EDIT`
- `FUND:DELETE`
- `FUND:PUBLISH`
- `FUND_DOCUMENT:UPLOAD`

**Key Implementation Points**:
- Uses rich text editor for strategy description
- File upload for marketing materials
- Email notifications when fund is published
- Analytics on investor engagement

### Use Case 2: Capital Call Plugin

**Purpose**: Manage capital call workflow from creation to payment tracking.

**Features**:
- Create capital calls
- Calculate pro-rata amounts per investor
- Send call notices via email
- Track payments
- Generate confirmation documents

**Data Objects**:
- `CapitalCall`
- `CapitalCallPayment`

**Permissions**:
- `CAPITAL_CALL:VIEW`
- `CAPITAL_CALL:CREATE`
- `CAPITAL_CALL:APPROVE`
- `CAPITAL_CALL:SEND`
- `CAPITAL_CALL:TRACK_PAYMENT`

**Dependencies**:
- Requires `Fund` and `Commitment` data objects
- Integrates with email system
- Logs to audit trail

### Use Case 3: Performance Reporting Plugin

**Purpose**: Generate and display fund performance metrics.

**Features**:
- Calculate IRR, MOIC, DPI, RVPI, TVPI
- Generate performance charts
- Export reports to PDF
- Compare against benchmarks

**Data Objects**:
- `PerformanceReport`
- `Benchmark`

**Permissions**:
- `PERFORMANCE:VIEW`
- `PERFORMANCE:EXPORT`

**Dependencies**:
- Reads `Fund`, `Commitment`, `CapitalCall`, `Distribution`, `Valuation`
- Uses shared PE calculation utilities

---

**End of PE Plugin Architecture Guide**
