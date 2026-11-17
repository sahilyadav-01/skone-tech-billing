# SK One Tech Billing

A lightweight browser-based billing application for creating GST invoices for computer repairs, IT support, products, and technical services.

**Author:** Sahil Yadav

## Features

- Email/password authentication with a private company workspace
- Multi-company data isolation enforced by Supabase Row Level Security
- Cloud sync across devices through Supabase
- Create invoices with customer, supply location, payment status, and notes
- Add multiple products or services with quantity, rate, discount, and GST
- Live subtotal, discount, tax, and grand-total calculations
- Download branded PDF invoices with the SKONE Tech Support logo
- Print invoice previews
- Save customers, reusable items, and invoices in the browser
- Track revenue, pending payments, and recent invoices on the dashboard
- Responsive layout for desktop and mobile screens

## Supabase setup

1. Create a Supabase project.
2. Open **SQL Editor** and run [`supabase/schema.sql`](supabase/schema.sql).
3. Copy the project URL and public anon key from **Project Settings > API**.
4. For local development, add the values to `supabase-config.js`.
5. In **Authentication > URL Configuration**, add the local and deployed URLs.

Never put the Supabase service-role key in browser code or Vercel environment variables used by this app.

## Run locally

No build step is required. Start a local static server from the project directory:

```powershell
python -m http.server 4173 --bind 127.0.0.1
```

Then open:

```text
http://127.0.0.1:4173/
```

Opening `index.html` directly may restrict some browser features, so using the local server is recommended.

## Create and download an invoice

1. Add the customer under **Customers**.
2. Add reusable services or products under **Items & Services** if needed.
3. Select **New Invoice**.
4. Enter the invoice details and line items.
5. Select **Download PDF** to save the branded invoice.
6. Select **Save invoice** to keep it in the invoice history.

Saved invoices also have their own **Download PDF** action.

## Project structure

```text
.
|-- assets/
|   `-- skone-logo.webp       # Invoice and application logo
|-- output/pdf/               # Generated reference invoice output
|-- app.js                    # Billing logic and PDF generation
|-- brand-fix.css             # Logo-specific styling
|-- index.html                # Application interface
`-- styles.css                # Main application styles
```

## Data storage

Customer, item, and invoice data is stored in the authenticated company's `company_data` record in Supabase. A company-scoped browser cache is retained for resilience.

Supabase Row Level Security checks the signed-in user's company membership before allowing access. Back up important invoices as PDFs.

## Deploy to Vercel

1. Import the GitHub repository into Vercel.
2. Keep the framework preset as **Other** and leave the build command empty.
3. Add `SUPABASE_URL` and `SUPABASE_ANON_KEY` in Vercel Project Settings > Environment Variables.
4. Deploy the project.
5. Add the Vercel production URL to Supabase Authentication > URL Configuration.

`api/config.js` exposes only the public Supabase URL and anon key to the browser. Database security remains enforced by Supabase RLS.

## PDF dependency

PDF downloads use jsPDF loaded from cdnjs. An internet connection is required when the application is first loaded unless the library is later hosted locally.

## Business details

Provider and bank details used in downloaded invoices are configured in the `BUSINESS` object near the end of `app.js`.

## Copyright

Copyright © 2026 SK One Tech Support. All rights reserved.  
Developed by Sahil Yadav.

This software and its source code may not be copied, modified, distributed, or used commercially without prior written permission from SK One Tech Support.

## License

This project is proprietary software. See [LICENSE](LICENSE) for the complete terms.
