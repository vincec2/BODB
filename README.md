# bodb — Business Operations Dashboard

Video of current use: https://youtu.be/i_pFFsTL0e8

bodb is a full-stack business operations dashboard for small e-commerce businesses. It helps track products, suppliers, orders, expenses, customer issues, margins, operational alerts, and AI-generated business summaries in one place.

The project is designed as a platform-agnostic operations layer. It can be used manually through forms and CSV imports, with a planned WooCommerce connector for syncing real store data.

---

## Overview

Small businesses often manage operations across disconnected tools: online store dashboards, supplier emails, spreadsheets, customer messages, and accounting notes. bodb brings those operational signals together into one dashboard.

The goal is not to replace platforms like WooCommerce or Shopify. Instead, bodb acts as a decision-support layer that helps answer questions like:

- Which products are actually profitable?
- Which expenses are hurting margins?
- Which orders or customer issues need attention?
- What products are driving revenue?
- What happened in the business this week?
- What should the owner review next?

---

## Features

### Dashboard Overview

- Revenue tracking
- Supplier cost tracking
- Gross profit calculation
- Expense tracking
- Estimated net profit
- Net margin
- Reporting period filter:
  - All time
  - Last 30 days
  - Last 7 days
  - Month to date

### Products

- Create products manually
- Import products from CSV
- Track SKU, category, selling price, supplier cost, and supplier
- Calculate estimated product margin
- Search products by name, SKU, or category
- Filter by supplier
- Filter missing supplier costs
- Filter low-margin products
- Edit product details inline
- Delete products safely

### Suppliers

- Create suppliers
- Track contact name, email, phone, and notes
- Link products to suppliers
- Search supplier records
- Delete suppliers while preserving linked products

### Orders

- Create sales orders
- Track order number, customer name, customer email, status, and order date
- Support order line items
- Store supplier cost snapshots at the time of order
- Calculate order revenue, estimated cost, and estimated profit
- Update order status inline
- Search by order number, customer, email, or product
- Filter by order status
- Delete orders and related order items

### Expenses

- Create expenses manually
- Import expenses from CSV
- Track category, amount, vendor, date, and notes
- Search by description, vendor, or notes
- Filter by category
- Edit expenses inline
- Delete expenses

### Customer Issues

- Create customer issue records
- Link issues to orders
- Track issue type, status, priority, customer, and description
- Update issue status inline
- Search by title, customer, order number, or description
- Filter by status, priority, and type
- Delete customer issues

### Needs Attention

The dashboard automatically flags operational risks, including:

- Paid or pending orders that may need fulfillment follow-up
- Products missing supplier cost data
- Order items missing cost snapshots
- Low-margin products
- Expenses exceeding gross profit
- Open or high-priority customer issues
- Missing foundational business data

### Charts

The Overview page includes visual reporting for:

- Revenue, supplier costs, expenses, and net profit
- Orders by status
- Expenses by category
- Top products by revenue

### Backend Analytics API

bodb includes a backend analytics endpoint:

```txt
GET /api/analytics/overview?range=last30
