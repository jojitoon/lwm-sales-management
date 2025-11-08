# LWM Sales Management System - User Manual

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Role-Based Guides](#role-based-guides)
   - [Admin](#admin)
   - [Main Store](#main-store)
   - [Mini Store](#mini-store)
   - [Table Manager](#table-manager)
   - [Book Sales](#book-sales)
   - [Pre-order](#pre-order)

---

## Introduction

The LWM Sales Management System is a comprehensive platform for managing book sales, inventory, and distribution across multiple locations and roles. This manual provides step-by-step instructions for each user role.

### System Overview

The system manages the flow of books from:

- **Main Store** → **Mini Store** → **Table Manager/Book Sales** → **Customers**

It also handles:

- Pre-order confirmations and collections
- Stock tracking and reconciliation
- Sales reporting and analytics
- Session management

---

## Getting Started

### Step 1: Access the Application

1. Open your web browser and navigate to the application URL
2. You will see the login page

### Step 2: Login Process

1. **For Regular Users:**

   - Enter your email address in the "Email" field
   - Select your **Workspace** from the dropdown:
     - Table Manager
     - Book Sales
     - Mini Store
     - Main Store
     - Pre-order
   - Fill in any additional required fields based on your workspace:
     - **Book Sales**: Enter the Table ID you're assigned to
     - **Pre-order**: Enter the Table ID to link your preorder session
     - **Table Manager**: Select your Table Type (POS, Cash, Transfer, QR, or Preorder)
   - Click the **"Login"** button

2. **For Admin Users:**
   - Click the **"Sign in as admin"** link at the bottom of the login form
   - You will be redirected to the admin login page
   - Enter your admin credentials

### Step 3: Understanding Your Dashboard

After logging in, you'll see a dashboard customized for your role showing:

- Key metrics and statistics
- Recent activity
- Quick access to important features

---

## Role-Based Guides

---

## Admin

### Overview

Admins have full access to the system, including reconciliation, session management, book management, and comprehensive reporting.

### Step-by-Step Guide

#### 1. Initial Setup and Configuration

**Step 1.1: Access Admin Settings**

1. Log in as admin
2. Click on **"App Settings"** in the sidebar (under secondary navigation)
3. Configure system-wide settings:
   - Set current session name
   - Configure admin password
   - Manage main store data

**Step 1.2: Manage Books**

1. Click **"All Books"** in the sidebar
2. View all books in the system
3. Add new books, edit existing ones, or manage book quantities
4. Set book prices and availability

**Step 1.3: Import Pre-orders (if applicable)**

1. Click **"Import Pre-orders"** in the sidebar
2. Upload your pre-order data file
3. Review and confirm the imported data

**Step 1.4: Map Books to Products**

1. Click **"Map Books"** in the sidebar
2. Link product names from pre-orders to actual books in the system
3. This ensures pre-orders are correctly associated with inventory

#### 2. Session Management

**Step 2.1: View Active Sessions**

1. Navigate to **"Session Management"** (if available in your menu)
2. View all active sessions for:
   - Main Store sessions
   - Mini Store sessions
3. Monitor session status and activity

**Step 2.2: Change Current Session**

1. Go to **"App Settings"**
2. Update the **"Current Session"** field
3. Save changes
4. All new activities will be associated with the new session

#### 3. Monitoring and Reports

**Step 3.1: View Reports**

1. Click **"Reports"** in the sidebar
2. Select from available report types:
   - **Sales Summary**: Overall sales statistics
   - **Stock Movement**: Track inventory movements
   - **Request Status**: Monitor requests between stores
   - **User Performance**: Individual user statistics
   - **Financial Summary**: Financial overview
   - **Session Closing**: Session closure reports
   - **Closing Stock**: Final stock counts

**Step 3.2: Filter Reports**

1. In the Reports page, use the date range selector
2. Select "From" and "To" dates
3. Choose the report type from tabs
4. View filtered results

**Step 3.3: Pre-order Reports**

1. Access pre-order specific reports from the sidebar:
   - **Books**: Book-related pre-order data
   - **Books Left**: Remaining inventory
   - **Orders**: All pre-orders
   - **Orders by Location**: Geographic breakdown
   - **Orders by Status**: Collection status
   - **Orders by Session**: Session-based grouping

#### 4. Reconciliation

**Step 4.1: Generate Reconciliation Report**

1. Click **"Reconciliation"** in the sidebar
2. Select a session from the dropdown
3. View comprehensive reconciliation data including:
   - Total sales summary
   - Sales by table
   - Stock movements (Main Store → Mini Store → Tables)
   - Closing stock reports
   - Pre-order data

**Step 4.2: Review Reconciliation Details**

1. Click on any table or section to view detailed breakdowns
2. Review individual transactions
3. Verify stock movements
4. Check closing stock counts
5. Export or print reports as needed

#### 5. Daily Operations

**Step 5.1: Monitor System Activity**

1. Check the Dashboard for real-time metrics
2. Review recent activity across all workspaces
3. Monitor pending requests between stores

**Step 5.2: Process Pre-orders**

1. Click **"Process Pre-orders"** in the sidebar
2. View pending pre-orders
3. Mark orders as collected when customers pick up their books
4. Track collection status

---

## Main Store

### Overview

Main Store manages the primary inventory and distributes books to Mini Stores upon request.

### Step-by-Step Guide

#### 1. Initial Setup

**Step 1.1: First Login**

1. Log in with your email
2. Select **"Main Store"** as your workspace
3. Click **"Login"**
4. Your Main Store session will be created automatically

**Step 1.2: Receive Initial Stock**

1. Navigate to **"Stock"** in the sidebar
2. View your current inventory
3. If you need to add initial stock, contact an admin or use the import feature (if available)

#### 2. Stock Management

**Step 2.1: View Current Stock**

1. Click **"Stock"** in the sidebar
2. View all books in your inventory showing:
   - Book title
   - Total quantity received
   - Quantity distributed to mini stores
   - Remaining quantity
   - Unit price
   - Value calculations

**Step 2.2: Monitor Stock Levels**

1. Regularly check the Stock page
2. Review remaining quantities
3. Identify books that need restocking

#### 3. Handling Requests from Mini Stores

**Step 3.1: View Pending Requests**

1. Click **"Requests"** in the sidebar
2. View all requests from Mini Stores
3. Requests show:
   - Requesting Mini Store
   - Books requested with quantities
   - Request date and time
   - Request status (Pending/Approved/Denied)

**Step 3.2: Review a Request**

1. Click on a pending request to view details
2. Review the requested books and quantities
3. Check your available stock

**Step 3.3: Approve or Deny a Request**

1. For each request, you can:
   - **Approve**: Grant the full requested quantity
   - **Approve Partial**: Grant a reduced quantity
   - **Deny**: Reject the request
2. Enter the quantities you're granting (if different from request)
3. Click **"Approve"** or **"Deny"**
4. The Mini Store will be notified of your decision

**Step 3.4: Track Request History**

1. View all past requests in the Requests page
2. Filter by status (Pending, Approved, Denied)
3. Review distribution history

#### 4. Reports

**Step 4.1: View Stock Reports**

1. Click **"Reports"** in the sidebar
2. Access available reports:
   - **Stock Movement**: Track all stock movements
   - **Stock Summary**: Overview of inventory
   - **Request Status**: Status of all requests

**Step 4.2: Generate Reports**

1. Select the report type from tabs
2. View detailed breakdowns of:
   - Books distributed
   - Remaining inventory
   - Request statistics

#### 5. Dashboard Monitoring

**Step 5.1: Daily Dashboard Review**

1. Check your Dashboard upon login
2. Review key metrics:
   - Total books in inventory
   - Total stock value
   - Distributed value
   - Remaining value
   - Pending requests count
   - Approved requests count

**Step 5.2: Monitor Distribution Activity**

1. View the Distribution Activity table on the Dashboard
2. See real-time updates of:
   - Books distributed to Mini Stores
   - Remaining quantities
   - Value calculations

---

## Mini Store

### Overview

Mini Store receives books from Main Store and distributes them to Table Managers and Pre-order sessions.

### Step-by-Step Guide

#### 1. Initial Setup

**Step 1.1: First Login**

1. Log in with your email
2. Select **"Mini Store"** as your workspace
3. Click **"Login"**
4. Your Mini Store session will be created automatically

#### 2. Requesting Books from Main Store

**Step 2.1: Create a Request**

1. Click **"Requests"** in the sidebar
2. Click the **"Request Books from Main Store"** button
3. A form will appear showing available books

**Step 2.2: Select Books and Quantities**

1. Browse the list of available books from Main Store
2. Enter the quantity you need for each book
3. Review your selections
4. Click **"Submit Request"**

**Step 2.3: Track Request Status**

1. Return to the Requests page
2. View your request status:
   - **Pending**: Awaiting Main Store approval
   - **Approved**: Books have been granted
   - **Denied**: Request was rejected
3. If approved, the books will appear in your stock

#### 3. Stock Management

**Step 3.1: View Your Stock**

1. Click **"Stock"** in the sidebar
2. View all books in your inventory showing:
   - Total received from Main Store
   - Quantity distributed to tables/pre-orders
   - Remaining quantity
   - Unit prices and values

**Step 3.2: Monitor Stock Levels**

1. Regularly check remaining quantities
2. Request more books from Main Store when needed
3. Track distribution to ensure proper allocation

#### 4. Distributing Books to Tables and Pre-orders

**Step 4.1: Receive Distribution Requests**

1. Table Managers and Pre-order sessions can request books from you
2. These requests appear in your system automatically
3. View pending requests from tables/pre-orders

**Step 4.2: Review Distribution Requests**

1. Check the requested books and quantities
2. Verify you have sufficient stock
3. Review which table/pre-order is requesting

**Step 4.3: Approve or Deny Distribution**

1. For each request, you can:
   - **Approve**: Grant the full requested quantity
   - **Approve Partial**: Grant a reduced quantity
   - **Deny**: Reject the request
2. Enter quantities to grant
3. Click **"Approve"** or **"Deny"**
4. The requesting table/pre-order will receive the books

#### 5. Reports

**Step 5.1: View Reports**

1. Click **"Reports"** in the sidebar
2. Access available reports:
   - **Stock Movement**: Track all stock movements
   - **Stock Summary**: Overview of inventory
   - **Request Status**: Status of requests to/from you

**Step 5.2: Analyze Distribution**

1. Review how books are being distributed
2. Identify trends in requests
3. Plan future stock requests accordingly

#### 6. Dashboard Monitoring

**Step 6.1: Daily Dashboard Review**

1. Check your Dashboard upon login
2. Review key metrics:
   - Total books in inventory
   - Total stock value
   - Distributed value
   - Remaining value
   - Pending requests to Main Store
   - Approved requests from Main Store

**Step 6.2: Monitor Activity**

1. View the Distribution Activity table
2. Track books distributed to tables/pre-orders
3. Monitor remaining stock levels

---

## Table Manager

### Overview

Table Manager receives stock from Mini Store and manages inventory for a specific sales table. They can also process sales directly.

### Step-by-Step Guide

#### 1. Initial Setup

**Step 1.1: First Login**

1. Log in with your email
2. Select **"Table Manager"** as your workspace
3. Select your **Table Type**:
   - POS
   - Cash
   - Transfer
   - QR
   - Preorder
4. Click **"Login"**
5. A table session will be created with a unique Table ID (e.g., POS-001)

**Step 1.2: Note Your Table ID**

1. After login, your Table ID is displayed in the sidebar
2. Share this Table ID with Book Sales personnel who will work at your table
3. This ID links Book Sales users to your table's stock

#### 2. Requesting Stock from Mini Store

**Step 2.1: Request Books**

1. Click **"Stock"** in the sidebar
2. Click the **"Request Books from Mini Store"** button
3. View available books from Mini Store

**Step 2.2: Select Books and Quantities**

1. Browse available books
2. Enter quantities needed for each book
3. Review your selections
4. Click **"Submit Request"**

**Step 2.3: Track Request Status**

1. Return to the Stock page
2. View request status (Pending/Approved/Denied)
3. Once approved, books appear in your stock

#### 3. Stock Management

**Step 3.1: View Your Stock**

1. Click **"Stock"** in the sidebar
2. View all books allocated to your table showing:
   - Total received
   - Quantity sold
   - Remaining quantity
   - Unit prices
   - Value of sold and remaining stock

**Step 3.2: Monitor Stock Levels**

1. Regularly check remaining quantities
2. Request more books when stock is low
3. Ensure you have sufficient inventory for sales

#### 4. Processing Sales

**Step 4.1: Access Sales Page**

1. Click **"Sales"** in the sidebar
2. View the Book Sales page

**Step 4.2: Create a Sale**

1. Click the **"Sell Books"** button (if available)
2. Fill in customer information:
   - Full Name (required)
   - Email (required)
   - Phone Number (optional)
   - Customer Location (optional)
3. Select books to sell:
   - Choose from available stock
   - Enter quantities for each book
4. Review the order total
5. Optionally enter a Slip Number
6. Click **"Complete Sale"**

**Step 4.3: View Sales History**

1. The Sales page shows all sales for your table
2. View details including:
   - Order Number
   - Slip Number
   - Customer information
   - Books sold
   - Total amount
   - Date and time

#### 5. Managing Book Sales Personnel

**Step 5.1: Share Table ID**

1. Provide your Table ID to Book Sales staff
2. They will use this ID when logging in
3. They will share access to your table's stock

**Step 5.2: Monitor Sales Activity**

1. View all sales made by you and Book Sales personnel
2. Track performance and inventory usage
3. Ensure proper sales recording

#### 6. Reports

**Step 6.1: View Reports**

1. Click **"Reports"** in the sidebar
2. Access the **Stock Movement** report
3. View detailed breakdown of:
   - Books received
   - Books sold
   - Remaining stock
   - Financial values

#### 7. Dashboard Monitoring

**Step 7.1: Daily Dashboard Review**

1. Check your Dashboard upon login
2. Review key metrics:
   - Total books in inventory
   - Total stock value
   - Sold value
   - Remaining value

**Step 7.2: Monitor Stock Activity**

1. View the Stock Activity table
2. Track which books are selling well
3. Identify books that need restocking

#### 8. Closing Stock

**Step 8.1: Close Stock (when session ends)**

1. When your sales session is complete, you may need to close stock
2. This prevents further sales and prepares for reconciliation
3. Follow admin instructions for stock closure procedures

---

## Book Sales

### Overview

Book Sales personnel work at a specific table and process customer sales. They share stock with the Table Manager.

### Step-by-Step Guide

#### 1. Initial Setup

**Step 1.1: First Login**

1. Log in with your email
2. Select **"Book Sales"** as your workspace
3. Enter the **Table ID** provided by your Table Manager
4. Click **"Login"**
5. You will be linked to that table's stock and sales session

**Step 1.2: Verify Table Assignment**

1. After login, check the sidebar
2. Your assigned Table ID should be displayed
3. Verify you're connected to the correct table

#### 2. Processing Sales

**Step 2.1: Access Sales Page**

1. Click **"Sales"** in the sidebar
2. View available stock and sales interface

**Step 2.2: Create a Sale**

1. Click the **"Sell Books"** button
2. Fill in customer information:
   - **Full Name** (required)
   - **Email** (required)
   - **Phone Number** (optional)
   - **Customer Location** (optional)
3. Select books to sell:
   - Browse available stock
   - Select books from the list
   - Enter quantity for each book
   - Prices are automatically calculated
4. Review order details:
   - Verify book selections
   - Check quantities
   - Review total amount
5. Optionally enter a **Slip Number** for tracking
6. Click **"Complete Sale"**
7. The sale will be recorded and stock will be updated

**Step 2.3: View Sales History**

1. The Sales page displays all sales for your table
2. View details for each sale:
   - Order Number
   - Slip Number
   - Customer Name
   - Books sold with quantities
   - Total amount
   - Date and time
3. Sales are shown in reverse chronological order (newest first)

#### 3. Stock Management

**Step 3.1: View Available Stock**

1. Click **"Stock"** in the sidebar
2. View all books available at your table
3. See quantities available for sale
4. Note: You cannot request stock directly; the Table Manager handles requests

**Step 3.2: Monitor Stock Levels**

1. Regularly check available quantities
2. Inform your Table Manager when stock is low
3. Avoid selling books that are out of stock

#### 4. Reports

**Step 4.1: View Sales Reports**

1. Click **"Reports"** in the sidebar
2. Access available reports:
   - **Sales Summary**: Overview of your sales
   - **Books Sold**: Detailed list of books sold

**Step 4.2: Review Performance**

1. View your sales statistics
2. Track total sales value
3. Monitor items sold
4. Review transaction counts

#### 5. Dashboard Monitoring

**Step 5.1: Daily Dashboard Review**

1. Check your Dashboard upon login
2. Review key metrics:
   - Total Sales (revenue)
   - Items Sold (quantity)
   - Unique Books (variety)
   - Transactions (number of sales)

**Step 5.2: Monitor Recent Sales**

1. View the Recent Sales table on Dashboard
2. See your latest transactions
3. Track customer purchases
4. Verify sales are being recorded correctly

#### 6. Important Notes

**Step 6.1: Stock Sharing**

- You share stock with your Table Manager
- Sales you make reduce available stock for everyone at the table
- Coordinate with your Table Manager and other Book Sales staff

**Step 6.2: Stock Closure**

- When stock is closed, you cannot make new sales
- A "Stock Closed" badge will appear on the Sales page
- Complete any pending sales before stock closure

---

## Pre-order

### Overview

Pre-order personnel handle pre-order confirmations and collections. They receive stock from Mini Store and process customer pickups.

### Step-by-Step Guide

#### 1. Initial Setup

**Step 1.1: First Login**

1. Log in with your email
2. Select **"Pre-order"** as your workspace
3. Enter the **Table ID** of the Table Manager you're linked to
4. Click **"Login"**
5. Your pre-order session will be linked to that table

**Step 1.2: Verify Session Link**

1. Check that you're properly linked to the table
2. Your pre-order session will share some context with the table session

#### 2. Stock Management

**Step 2.1: Request Stock from Mini Store**

1. Click **"Stock"** in the sidebar
2. Click the **"Request Books from Mini Store"** button
3. View available books

**Step 2.2: Select Books for Pre-orders**

1. Browse available books
2. Enter quantities needed to fulfill pre-orders
3. Submit your request
4. Track approval status

**Step 2.3: View Your Stock**

1. Once approved, view your stock in the Stock page
2. Monitor quantities available for pre-order fulfillment
3. Track distributed and remaining quantities

#### 3. Processing Pre-order Collections

**Step 3.1: Access Pre-order Sales Page**

1. Click **"Sales"** in the sidebar
2. View the Pre-order Sales page

**Step 3.2: View Pre-orders**

1. See all pre-orders assigned to your session
2. View order details:
   - Order Number
   - Customer information
   - Items ordered
   - Order status (Collected/Pending)

**Step 3.3: Mark Order as Collected**

1. Find the pre-order to process
2. Review the order details
3. Verify you have the required books in stock
4. Click **"Mark as Collected"** or similar action
5. The order status will update to "Collected"
6. Stock will be deducted from your inventory

**Step 3.4: Partial Collection**

1. If a customer collects only some items:
   - Mark individual items as collected
   - The order may show as "Partially Collected"
   - Remaining items stay pending

#### 4. Reports

**Step 4.1: View Pre-order Reports**

1. Click **"Reports"** in the sidebar (or "Report User")
2. Access available reports:
   - **Sales Summary**: Overview of collections
   - **Stock Movement**: Track inventory
   - **Financial Summary**: Financial overview

**Step 4.2: Track Collection Status**

1. Monitor which orders have been collected
2. Identify pending collections
3. Plan stock requests based on pending orders

#### 5. Dashboard Monitoring

**Step 5.1: Daily Dashboard Review**

1. Check your Dashboard upon login
2. Review key metrics:
   - Total Orders
   - Total Items
   - Total Value
   - Collection Status (Collected/Pending)

**Step 5.2: Monitor Recent Activity**

1. View the Recent Order Confirmations table
2. See latest pre-orders
3. Track collection progress
4. Identify orders needing attention

#### 6. Important Notes

**Step 6.1: Pre-order Fulfillment**

- Ensure you have sufficient stock before marking orders as collected
- Coordinate with Mini Store for stock requests
- Keep accurate records of collections

**Step 6.2: Order Status**

- Orders can be: Pending, Partially Collected, or Collected
- Update status accurately to maintain system integrity
- Verify customer identity before collection

---

## Common Features Across All Roles

### Settings

**Accessing Settings:**

1. Click **"Settings"** in the sidebar (bottom section)
2. View and update your account settings
3. Manage preferences

### Getting Help

**Access Help:**

1. Click **"Get Help"** in the sidebar
2. Access documentation and support resources
3. Contact system administrators if needed

### Search

**Using Search:**

1. Click **"Search"** in the sidebar
2. Search for books, orders, or other items
3. Use filters to narrow results

### Logging Out

**To Log Out:**

1. Click on your user profile/avatar in the sidebar footer
2. Select **"Sign Out"** or **"Logout"**
3. You will be redirected to the login page

---

## Best Practices

### For All Users

1. **Regular Logins**: Log in daily to stay updated with your workspace
2. **Stock Monitoring**: Regularly check stock levels to avoid shortages
3. **Accurate Data Entry**: Enter all information accurately, especially customer details and quantities
4. **Communication**: Coordinate with other team members, especially when sharing stock
5. **Report Review**: Regularly review reports to understand performance and trends

### For Store Managers (Main Store, Mini Store)

1. **Timely Approvals**: Review and respond to requests promptly
2. **Stock Planning**: Monitor trends to anticipate stock needs
3. **Request Tracking**: Keep detailed records of all requests and distributions

### For Sales Personnel (Table Manager, Book Sales)

1. **Customer Service**: Ensure accurate customer information collection
2. **Stock Awareness**: Always verify stock availability before promising books to customers
3. **Sales Recording**: Record all sales immediately and accurately
4. **Coordination**: Communicate with team members when sharing stock

### For Pre-order Personnel

1. **Verification**: Always verify customer identity before collection
2. **Stock Preparation**: Request stock in advance based on pending orders
3. **Status Updates**: Update order status promptly after collection

---

## Troubleshooting

### Common Issues

**Issue: Cannot log in**

- Verify your email address is correct
- Ensure you've selected the correct workspace
- For Book Sales/Pre-order, verify the Table ID is correct
- Contact your administrator if issues persist

**Issue: No stock available**

- Check if stock has been requested and approved
- Verify you're viewing the correct session
- Contact your supervisor or the store above you in the hierarchy

**Issue: Cannot process sale**

- Verify stock is available for the selected books
- Check if stock has been closed
- Ensure all required fields are filled
- Refresh the page and try again

**Issue: Request not approved**

- Check with the approving store (Main Store or Mini Store)
- Verify requested quantities are reasonable
- Ensure sufficient stock exists at the source

**Issue: Dashboard not loading**

- Refresh the page
- Check your internet connection
- Clear browser cache if problems persist
- Contact support if issue continues

---

## Support and Contact

For technical support or questions:

- Contact your system administrator
- Use the "Get Help" feature in the application
- Refer to this manual for step-by-step guidance

---

## Appendix: Quick Reference

### Workspace Hierarchy

```
Main Store
  ↓ (distributes to)
Mini Store
  ↓ (distributes to)
Table Manager / Pre-order
  ↓ (sells to)
Customers
```

### Key Terms

- **Workspace**: Your role/position in the system (Main Store, Mini Store, etc.)
- **Session**: A time period for tracking activities (e.g., "FIRST_SESSION")
- **Table ID**: Unique identifier for a sales table (e.g., "POS-001")
- **Stock**: Inventory of books available for sale
- **Request**: A request for books from one store to another
- **Pre-order**: An order placed in advance by a customer
- **Reconciliation**: Admin process to verify all transactions and stock movements

### Navigation Shortcuts

- **Dashboard**: `/` - Overview of your workspace
- **Reports**: `/reports` - View various reports
- **Stock**: `/books-stock-*` - Manage inventory
- **Sales**: `/book-sales` or `/preorder-sales` - Process sales
- **Requests**: `/requests-*` - Manage requests
- **Settings**: `/settings` - Account settings

---

_Last Updated: [Current Date]_
_Version: 1.0_
