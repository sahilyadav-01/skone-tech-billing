# Privacy Policy — SK One Tech Billing

**Last Updated:** November 25, 2026<br>
**Effective Date:** November 25, 2026<br>
**Applicability:** SK One Tech Billing Platform (Web, Desktop, and Cloud Sync)

---

## 1. Overview & Commitment
SK One Tech Billing ("we", "us", or "our") provides modern multi-tenant billing, GST invoicing, client management, item cataloging, and financial tracking for businesses, computer repair centers, IT support providers, retailers, and freelance service professionals.

We recognize that your invoices, customer lists, pricing strategies, and financial turnovers are confidential business assets.

> **Core Guarantee:** Your company data, invoices, customer records, and financial figures belong **100% to your company**. We do not sell, rent, monetize, or merge your data with any other company, advertiser, or third party under any circumstances.

---

## 2. Strict Multi-Tenant Company Data Isolation
Our database and software architecture enforce strict, verifiable segregation for every business organization:
- **Zero Cross-Company Data Leaks:** Every database transaction, session token, and local cache is isolated using unique `company_id` partitions.
- **Protected Catalogs & Clients:** Customers, rates, inventory items, and invoice sequences created by Company A can never be viewed, queried, modified, or accessed by Company B.
- **Modification & Deletion Scoping:** Editing or deleting a customer or invoice only impacts your specific workspace and cannot corrupt or affect any other organization.
- **Role-Based Access Control (RBAC):** Company owners and administrators have granular authority over which team members access their company's workspace.

---

## 3. Information We Collect
We collect and store only the data strictly necessary to generate, calculate, format, and manage valid GST tax invoices:

1. **Account Credentials:**
   - Email address and cryptographically hashed passwords (handled securely by Supabase Auth).
   - Session identifiers and assigned workspace role (Owner, Admin, Member).

2. **Company Profile & Branding Details:**
   - Registered business name and trade name.
   - Goods and Services Tax Identification Number (GSTIN).
   - Official business contact telephone, email, and physical billing address.
   - Custom uploaded company logo image (stored securely in format-optimized Base64 or cloud storage).
   - Custom invoice numbering prefix (e.g., `INV`, `SK`, `BILL`).

3. **Banking & Settlement Information:**
   - Bank name, branch name, account number, and IFSC code.
   - Optional UPI payment ID entered intentionally for display on customer-facing invoice sheets.

4. **Customer Directory Records:**
   - Client/Company names, contact telephone numbers, email addresses, and billing/shipping addresses.
   - Optional client GSTIN numbers for B2B input tax credit (ITC) compliance.

5. **Invoice & Transaction Data:**
   - Auto-generated or custom invoice numbers and invoice creation dates.
   - Line items, custom service descriptions, quantities, unit prices, and discount percentages.
   - GST tax slabs (0%, 5%, 12%, 18%, 28%) and calculated tax totals.
   - Payment statuses (`Paid`, `Pending`, `Partially Paid`) and payment update timestamps.

---

## 4. Local-First & Offline Mode Privacy
For users operating in **Instant / Local Mode**:
- All invoice history, customer directories, and company settings remain entirely on your local machine within the browser's private `localStorage`.
- No customer records or financial details are transmitted across the internet or uploaded to remote databases in Local Mode.
- You retain complete manual control to clear local records at any time through your browser's data settings.

---

## 5. Security & Technical Safeguards
We implement high-grade technical safeguards to prevent unauthorized access, alteration, or disclosure of your business records:
- **Encryption in Transit:** All communications between your web browser and our backend infrastructure are encrypted using TLS 1.3 / HTTPS.
- **Database Row-Level Security (RLS):** Supabase PostgreSQL database tables employ declarative Row-Level Security policies. Queries evaluate the authenticated user's verified company membership at the database kernel level before returning any rows.
- **Password Protection:** User passwords are encrypted with industry-standard bcrypt/Argon2 password hashing; plain-text passwords are never recorded in application logs or databases.
- **Client-Side PDF Generation:** Tax invoices and receipts are generated directly in the client browser using jsPDF, reducing server-side exposure of sensitive invoice line items.

---

## 6. How We Use Information
Your data is utilized strictly for direct operational purposes:
- Formatting, calculating, and rendering GST-compliant invoices and print views.
- Generating client-downloadable PDF invoices.
- Displaying real-time turnover statistics, monthly sales volumes, and unpaid bill reminders.
- Maintaining persistent customer and inventory registries to expedite bill creation.
- Authenticating authorized team members into their isolated company workspaces.

### What We Never Do:
- We **never** sell, rent, or trade your customer lists or contact numbers to telemarketers or third-party advertisers.
- We **never** execute behavioral advertising or third-party cross-site user tracking.
- We **never** feed or train public artificial intelligence models on your private invoices, pricing, or customer lists.

---

## 7. Cookies & Tracking Technologies
- **Zero Advertising Trackers:** We do not embed Google AdSense, third-party analytics pixels, social media tracking beacons, or marketing cookies.
- **Functional Storage Only:** We utilize browser `localStorage` and authenticated session tokens solely for authentication persistence and offline workspace operations.

---

## 8. Your Rights & Data Portability
You maintain full sovereign control over your business data at all times:
- **Portability & Export:** You can export and download any invoice as a print-ready PDF at any time.
- **Real-Time Rectification:** You can edit company profile details, customer contacts, phone numbers, addresses, and catalog rates directly through the UI.
- **Erasure & Deletion:** You can remove individual line items, customers, or invoices directly from your ledger. For complete company workspace deletion, contact our administrative support.

---

## 9. Compliance & Jurisdiction
This Privacy Policy is designed to adhere to global data protection principles, including the **Digital Personal Data Protection Act (DPDP Act, India)** and internationally accepted standards of business confidentiality, security, and integrity.

---

## 10. Contact & Grievance Redressal
If you have questions, feedback, security disclosures, or data requests regarding this Privacy Policy, please contact our support team:

- **Entity:** SK ONE TECH SUPPORT
- **Contact Email:** `support@skonetech.com`
- **Application:** SK One Tech Billing Platform
- **Lead Developer:** Sahil Yadav
