# SK One Tech Billing

A lightweight browser-based billing application for creating GST invoices for computer repairs, IT support, products, and technical services.

**Author:** Sahil Yadav

## Features

- Create invoices with customer, supply location, payment status, and notes
- Add multiple products or services with quantity, rate, discount, and GST
- Live subtotal, discount, tax, and grand-total calculations
- Download branded PDF invoices with the SKONE Tech Support logo
- Print invoice previews
- Save customers, reusable items, and invoices in the browser
- Track revenue, pending payments, and recent invoices on the dashboard
- Responsive layout for desktop and mobile screens

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

Customer, item, and invoice data is stored in the browser using `localStorage` under the key `skoneBillingV1`. Data is not uploaded to a server by this application.

Clearing the browser's site data will remove saved billing records. Back up important invoices as PDFs.

## PDF dependency

PDF downloads use jsPDF loaded from cdnjs. An internet connection is required when the application is first loaded unless the library is later hosted locally.

## Business details

Provider and bank details used in downloaded invoices are configured in the `BUSINESS` object near the end of `app.js`.

## Copyright

Copyright © 2026 SK One Tech Support. All rights reserved.  
Developed by Sahil Yadav.

This software and its source code may not be copied, modified, distributed, or used commercially without prior written permission from SK One Tech Support.
