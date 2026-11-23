# SK One Tech Billing

A lightweight, modern browser-based billing and GST invoicing application designed for businesses, computer repair centers, IT support providers, product sellers, and freelance services.

**Author:** Sahil Yadav<br>
**Copyright:** © 2026 SK One Tech Support. All rights reserved.

---

## ✨ Features

- **Company Profile & Custom Branding:**
  - Upload custom company logo (PNG, JPG, WebP) with automatic scaling and live preview.
  - Complete business profile: Display Name, Legal Name, GSTIN, Phone, Email, and Business Address.
  - Bank settlement details on invoices: Bank Name, Branch, Account Number, and IFSC Code.
  - Custom invoice prefix configuration (e.g., `INV`, `SK`, `BILL`).

- **Dynamic GST Invoicing:**
  - Live itemized invoicing with quantity, unit rate, percentage discount, and GST rate (0%, 5%, 12%, 18%, 28%).
  - Live calculations for Subtotal, Discount, GST Tax, and Grand Total.
  - Auto-generated number-to-words currency breakdown (Indian Rupees / Lakhs / Crores).
  - Branded PDF downloads generated client-side via jsPDF.
  - Formatted Print Preview ready for direct thermal or A4 printing.

- **Customer Management & Quick Editing:**
  - Add new clients with contact phone numbers, GSTIN, and billing addresses.
  - **Inline Editing:** 1-click **Edit** button auto-populates the form for rapid updates.
  - Form state management with "Cancel edit" support and active row highlights.
  - Live synchronization across invoice creation dropdowns.

- **Strict Multi-Tenant Data Isolation:**
  - Complete data privacy: customers, items/catalogue, invoices, and business profiles are 100% isolated per company workspace.
  - Database-level isolation enforced through Supabase Row Level Security (RLS).
  - Zero data bleed or merging between separate business accounts.

- **Privacy Policy & Legal Trust:**
  - Integrated **Privacy Policy & Terms** modal dialog accessible from the login page and workspace.
  - Dedicated in-dashboard **Legal & Trust** view (`#privacy`) detailing data protection standards.
  - Standalone documentation in [`PRIVACY_POLICY.md`](PRIVACY_POLICY.md).

- **Fast Authentication & Offline Access:**
  - Email/password authentication with cloud workspace synchronization.
  - Password visibility toggle (Show/Hide) and Forgot Password reset flow.
  - **Instant Local/Offline Mode:** 1-click access without cloud dependencies when offline or testing.
  - Resilient local browser caching (`localStorage`) alongside Supabase cloud sync.

- **Modern Light Green Mint UI:**
  - Clean, fresh mint & emerald color palette tailored for high-contrast brand logo display.
  - Fully responsive design for mobile, tablet, and desktop viewports.
  - Balanced typography with zero orphan punctuation.

---

## 📁 Project Structure

```text
skone-tech-billing/
├── assets/
│   └── skone-logo.webp             # Default application & brand logo
├── api/
│   └── config.js                   # Vercel serverless endpoint for Supabase config
├── supabase/
│   ├── schema.sql                  # Main database schema with Row Level Security (RLS)
│   └── multi_company_migration.sql # Migration script for company profiles & multi-tenancy
├── app.js                          # Core billing logic, calculations, customer CRUD, PDF export
├── auth.js                         # Authentication, workspace provisioning, and session manager
├── auth.css                        # Full-screen responsive authentication styling
├── company.css                     # Company profile and workspace settings styling
├── policy.css                      # Privacy policy modal and legal trust view styling
├── brand-fix.css                   # Responsive brand mark and logo styles
├── styles.css                      # Base application design system and invoice layout
├── supabase-config.js              # Supabase URL & anon key configuration
├── vercel.json                     # Vercel deployment configuration
├── index.html                      # Single-page application entrypoint
├── PRIVACY_POLICY.md               # Complete multi-tenant privacy & data protection policy
├── README.md                       # Documentation & setup guide
└── LICENSE                         # Proprietary software license
```

---

## 🚀 Running Locally

No complex build step or Node bundling required. Run using any local HTTP static server:

### Option A: Using Python (Recommended)
```powershell
python -m http.server 4173 --bind 127.0.0.1
```
Then open your browser at:
```text
http://127.0.0.1:4173/
```

### Option B: Using Node (npx)
```powershell
npx serve -l 4173
```

> **Note:** Opening `index.html` via the `file://` protocol may block web canvas operations or PDF font rendering. Using a local web server is recommended.

---

## ⚙️ Supabase Cloud Setup

1. Create a project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in your Supabase Dashboard and run:
   - [`supabase/schema.sql`](supabase/schema.sql)
3. Under **Project Settings > API**, copy your **Project URL** and **anon public key**.
4. Paste these into `supabase-config.js`:
   ```javascript
   window.SKONE_SUPABASE_CONFIG = {
     url: 'https://YOUR_PROJECT_REF.supabase.co',
     anonKey: 'YOUR_SUPABASE_ANON_KEY'
   };
   ```
5. In **Authentication > URL Configuration**, add your local address (`http://127.0.0.1:4173`) and production domain to **Redirect URLs**.
6. *(Optional)* To allow instant user signups without email verification, disable **Confirm email** under **Authentication > Providers > Email**.

---

## 🏢 Setting Up Your Company Profile

1. Sign in or choose **⚡ Continue in Offline / Local Mode**.
2. Click **⚙ Company Profile** in the left sidebar (or click the hero button on the Dashboard).
3. **Upload Logo:** Click **Choose logo** to upload your brand mark. It will automatically be formatted and previewed.
4. **Enter Details:** Fill in your display name, legal business name, GSTIN, phone, email, and billing address.
5. **Bank Details:** Add your bank name, branch, account number, and IFSC code for settlement information on bills.
6. Click **Save company profile**. All future invoices will automatically print with your custom logo and credentials.

---

## 👥 Managing Customers

1. Navigate to **Customers** from the left navigation sidebar.
2. **Add Customer:** Fill in Name, Phone, GSTIN (optional), and Billing Address, then click **Save customer**.
3. **Edit Customer:**
   - Click the green **Edit** button on any customer card.
   - The form will auto-fill with the customer's current details and switch to edit mode.
   - Modify the necessary fields and click **Update customer** (or click **✕ Cancel edit** to discard).
4. **Delete Customer:** Click the **Delete** button to remove a contact (maintains a minimum of 1 customer).

---

## 🧾 Creating an Invoice

1. Go to **Customers** and add or select a client (or use the default *Walk-in Customer*).
2. Go to **Items & Services** to add frequently billed repairs, parts, or hourly services.
3. Click **＋ New Invoice**:
   - Select the customer and date.
   - Choose or add items, adjust quantity, rate, discount, and tax.
   - Review live totals on the summary panel.
4. Click **Download PDF** to export a high-resolution, print-ready GST tax invoice.
5. Click **Save invoice** to record it in your invoice history and dashboard analytics.

---

## 🌐 Deploying to Vercel

1. Push your repository to GitHub.
2. In [Vercel](https://vercel.com), click **Add New > Project** and import the repository.
3. Framework Preset: **Other** (leave build settings empty).
4. Add the following Environment Variables under **Project Settings > Environment Variables**:
   - `SUPABASE_URL`: Your Supabase Project URL
   - `SUPABASE_ANON_KEY`: Your Supabase Anon Key
5. Click **Deploy**.
6. Copy the assigned production domain (e.g. `https://your-app.vercel.app`) and add it to Supabase **Authentication > URL Configuration**.

---

## 📄 License

This software and its source code are proprietary. See [LICENSE](LICENSE) for complete terms.
Copyright © 2026 SK One Tech Support. Developed by **Sahil Yadav**.
