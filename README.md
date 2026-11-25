# SK One Tech Billing

A lightweight, modern browser-based billing and GST invoicing application designed for businesses, computer repair centers, IT support providers, product sellers, and freelance services.

**Author:** Sahil Yadav<br>
**Copyright:** © 2026 SK One Tech Support. All rights reserved.<br>
**Last Updated:** November 25, 2026

---

## ✨ Features

- **Company Profile & Custom Branding:**
  - Upload custom company logo (PNG, JPG, WebP) with automatic scaling and live preview.
  - Complete business profile: Display Name, Legal Name, GSTIN, Phone, Email, and Business Address.
  - Bank settlement details on invoices: Bank Name, Branch, Account Number, and IFSC Code.
  - Custom invoice prefix configuration (e.g., `INV`, `SK`, `BILL`).

- **Dynamic GST Invoicing:**
  - Live itemized invoicing with custom descriptions, quantity, unit rate, percentage discount, and GST rate (0%, 5%, 12%, 18%, 28%).
  - Live calculations for Subtotal, Discount, GST Tax, and Grand Total.
  - Auto-generated number-to-words currency breakdown (Indian Rupees / Lakhs / Crores).
  - Branded PDF downloads generated client-side via jsPDF.
  - Formatted Print Preview ready for direct thermal or A4 printing.

- **Invoice Management & History (Full CRUD):**
  - **Live Search & Filter:** Instant search by invoice number or customer name.
  - **Edit Invoice:** Reopen any saved bill in the invoice builder, adjust line items, rates, or customers, and update records seamlessly.
  - **Delete Invoice:** Remove cancelled or void bills with instant dashboard revenue recalculation.
  - **Quick Status Toggle:** 1-click "Mark as paid" directly from the invoice ledger.

- **Customer Management & Quick Editing:**
  - Add new clients with contact phone numbers, GSTIN, and billing addresses.
  - **Inline Editing:** 1-click **Edit** button auto-populates the form for rapid updates.
  - Form state management with "Cancel edit" support and active row highlights.
  - Live synchronization across invoice creation dropdowns.

- **Catalogue & Price List:**
  - Save recurring products and service rates with default GST slabs.
  - Fast item lookup and 1-click insertion into invoices.

- **Strict Multi-Tenant Data Isolation:**
  - Complete data privacy: customers, items/catalogue, invoices, and business profiles are 100% isolated per company workspace.
  - Database-level isolation enforced through Supabase Row Level Security (RLS).
  - Zero data bleed or merging between separate business accounts.

- **Privacy Policy & Legal Trust:**
  - Integrated **Privacy Policy & Terms** modal dialog accessible from the login page and workspace.
  - Dedicated in-dashboard **Legal & Trust** view (`#privacy`) detailing data protection standards.
  - Comprehensive documentation in [`PRIVACY_POLICY.md`](PRIVACY_POLICY.md).

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
├── tools/
│   ├── build_invoice_pdf.py        # Python CLI utility for generating invoices
│   └── inspect_invoice.py          # Script for verifying invoice calculations & layout
├── app.js                          # Core billing logic, calculations, invoice & customer CRUD, PDF export
├── auth.js                         # Authentication, workspace provisioning, and session manager
├── auth.css                        # Full-screen responsive authentication styling
├── company.css                     # Company profile and workspace settings styling
├── policy.css                      # Privacy policy modal and legal trust view styling
├── brand-fix.css                   # Responsive brand mark and logo styles
├── styles.css                      # Base application design system and invoice layout
├── supabase-config.js              # Supabase URL & anon key configuration
├── vercel.json                     # Vercel deployment configuration
├── .env.example                    # Template for environment variables
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

## 🧾 Creating & Managing Invoices

### 1. Creating a New Invoice
1. Go to **＋ New Invoice** from the sidebar or top bar.
2. Select the customer from the dropdown and set the invoice date.
3. Add line items:
   - Select an existing catalog item or type a custom description.
   - Adjust quantity, rate (₹), discount (%), and GST slab.
   - Add multiple lines using **＋ Add item**.
4. Review live totals on the summary panel (Subtotal, Tax breakdown, and Grand Total).
5. Click **Download PDF** for client export or **Save invoice** to record it.

### 2. Editing an Existing Invoice
1. Go to **Invoices** from the sidebar.
2. Find the invoice using the real-time search box.
3. Click the **Edit** button to reopen it in the invoice builder.
4. Update lines, prices, or dates, then click **Update invoice** to save changes.

### 3. Printing & Status Tracking
- Click **Print** to open the browser print dialog formatted for A4 or thermal receipt printers.
- Click **Mark paid** to update payment status and dashboard collections.
- Click **Delete** to remove obsolete bills.

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

This software and its source code are proprietary. See [LICENSE](LICENSE) for complete terms.<br>
Copyright © 2026 SK One Tech Support. Developed by **Sahil Yadav**.<br>
Contact: [skonetechsupport@gmail.com](mailto:skonetechsupport@gmail.com)
