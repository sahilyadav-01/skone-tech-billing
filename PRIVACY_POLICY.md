# Privacy Policy — SK One Tech Billing

**Last Updated:** November 17, 2026  
**Effective Date:** November 17, 2026  
**Applicability:** SK One Tech Billing platform (Web, Desktop, and Cloud Sync)

---

## 1. Overview & Commitment
SK One Tech Billing ("we", "us", or "our") provides multi-tenant billing, GST invoicing, client management, and inventory tracking for businesses and technical service providers. We respect the confidentiality and privacy of every business using our platform.

> **Core Guarantee:** Your company data, invoices, customer records, and financial figures belong **100% to your company**. We do not sell, rent, monetize, or merge your data with any other company or third party.

---

## 2. Multi-Tenant Company Data Isolation
Our architecture strictly isolates every organization into its own private partition:
- **Zero Cross-Company Data Leaks:** Each database query, cached session, and local storage state is strictly scoped to your specific `company_id`.
- **Private Catalogs & Customers:** Customers, rate cards, inventory items, and invoice sequences created by Company A can never be viewed, queried, or accessed by Company B.
- **Role-Based Access Control (RBAC):** Company owners and administrators control which team members have access to their company's workspace.

---

## 3. Information We Collect
We collect only the information necessary to provide seamless invoicing and billing operations:
1. **Account Credentials:** Email address, encrypted authentication token, and workspace role.
2. **Company Profile & Branding:** Registered business name, trade name, GSTIN, business address, contact telephone, email, and company logo.
3. **Banking & Payment Details:** Bank name, account number, IFSC code, and UPI details entered intentionally for printing on your client tax invoices.
4. **Customer Records:** Customer names, phone numbers, email addresses, and billing/shipping addresses added for invoice generation.
5. **Invoice & Transaction Data:** Invoice numbers, line item descriptions, quantities, unit prices, discounts, GST/tax breakdowns, and payment statuses (Paid, Pending, Partially Paid).

---

## 4. Local-First & Offline Mode Data
For users operating in **Local Workspace / Instant Mode**:
- All invoice data, customer lists, and business settings are stored locally within your browser's private `localStorage`.
- No customer data or financial records are uploaded to external servers in Local Mode unless you choose to connect Supabase cloud sync.

---

## 5. Security & Data Protection
- **Encryption in Transit:** All network traffic between your client device and cloud databases is encrypted via HTTPS / TLS 1.3.
- **Row-Level Security (RLS):** Supabase PostgreSQL database tables are protected by Row-Level Security policies enforcing that users can only read and write data belonging to their verified company memberships.
- **Credential Protection:** Passwords are never stored in plaintext; they are securely hashed using modern cryptographic algorithms.

---

## 6. How We Use Information
We use stored information exclusively to:
- Generate, format, and render GST-compliant PDF invoices.
- Display dashboard revenue statistics, sales summaries, and tax breakdowns.
- Maintain persistent item catalogues for quick invoice creation.
- Authenticate authorized team members to their respective workspaces.

We do **not**:
- Sell your customer lists or contact information to advertisers.
- Track user browsing activity outside our billing domain.
- Train third-party public AI models on your private invoices or client lists.

---

## 7. Your Rights & Data Portability
You maintain full control over your business data at all times:
- **Export Invoices:** You can download your invoices as PDF or print them on demand.
- **Edit & Correct:** You can update company details, customer phone numbers, addresses, and rates whenever needed.
- **Deletion:** You can remove line items, customers, or request complete workspace deletion by contacting our administrative team.

---

## 8. Contact & Grievance Officer
If you have any questions, concerns, or requests regarding this Privacy Policy or your data, please contact:

- **Entity:** SK ONE TECH SUPPORT
- **Email:** `support@skonetech.com`
- **Application:** SK One Tech Billing Platform
