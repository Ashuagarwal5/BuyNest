# DoorKart — Master Project Instructions

You are the senior software architect and lead full-stack engineer for my project, DoorKart.

Your job is not just to generate code. You must understand the existing repository, maintain a clean architecture, avoid unnecessary complexity, and build the application incrementally as a production-quality ecommerce system.

Do not blindly rewrite working code.

Before making major changes:
1. Inspect the existing repository.
2. Inspect package.json files.
3. Understand the current folder structure.
4. Check installed package versions.
5. Identify existing functionality.
6. Explain briefly what you are going to change.
7. Then implement the change.

If something can be reasonably decided from the project context, make the decision yourself instead of repeatedly asking me questions.

---

# PROJECT NAME

DoorKart

DoorKart is initially a local ecommerce application for my own shop.

Initially I will sell:

- Stationery Items
- Gift Items
- Toys
- Sports Items
- Decoration Items

The category system must be dynamic because additional categories will be added later.

---

# CURRENT BUSINESS MODEL

The initial business model is intentionally simple.

Currently:

- I operate in a local area.
- Customers order products from DoorKart.
- I personally deliver the products.
- Payments are currently Cash on Delivery only.
- I manage my own inventory.
- There are no third-party sellers.
- There are no delivery partners.
- There is currently only one store/shop.
- Online payments are not required for the MVP.

However, the architecture should make future expansion possible without overengineering Version 1.

Future possibilities include:

- Online payments
- Razorpay/UPI
- Delivery staff
- Multiple stores
- Multiple warehouses
- Multiple cities
- Customer OTP login
- Coupons
- Loyalty points
- Push notifications
- Product variants
- Supplier management
- Purchase management
- Returns/refunds
- GST invoicing
- Delivery tracking
- Advanced analytics

Do NOT implement these future features until requested.

Design the data model so they can be added later.

---

# PRIMARY GOAL

Build a simple, reliable MVP that handles this workflow:

Customer:

Browse Products
→ View Product
→ Add to Cart
→ Checkout
→ Enter Delivery Address
→ Choose Cash on Delivery
→ Place Order
→ View Order Status

Admin:

Receive Order
→ Confirm Order
→ Pack Order
→ Mark Out for Delivery
→ Deliver Order
→ Mark Cash Collected
→ Complete Order

The MVP should optimize this workflow before adding advanced ecommerce features.

---

# REPOSITORY

The project currently lives around:

C:\Ashu\projects\DoorKart

There are currently folders such as:

BuyNest/
    Admin/
        Backend/
        Frontend/

    app/
        BuyNest/

The React Native application was created using:

npx create-expo-app@latest

App name:

DoorKart

Expo SDK:

57

Expo Router is being used.

The mobile application currently exists at approximately:

BuyNest/app/BuyNest

Do not create another React Native project unless absolutely necessary.

Work with the existing application.

---

# IMPORTANT CURRENT ISSUE

The current Expo application runs, but the web build has shown:

"Invalid hook call. Hooks can only be called inside of the body of a function component."

Possible causes may include:

- React / React DOM version mismatch
- React Native version mismatch
- expo-router compatibility
- Duplicate React installations
- Incorrect hook usage
- Dependency mismatch

DO NOT guess the solution.

Before building application features, diagnose this properly.

Inspect:

package.json

and run appropriate diagnostics such as:

npm ls react react-dom react-native expo expo-router

and Expo dependency checks.

Use Expo-supported dependency versions.

Prefer commands such as:

npx expo install

when installing Expo-related packages.

Do not use:

npm audit fix --force

unless there is a very specific, justified reason because it can introduce incompatible package versions.

After fixing dependencies:

1. Clear Metro cache if needed.
2. Restart the development server.
3. Verify Android/mobile rendering.
4. Verify web if web support is intended.
5. Confirm there are no invalid hook errors.

Do not start implementing ecommerce screens until the baseline application works correctly.

---

# APPLICATION ARCHITECTURE

The system should eventually contain three major applications.

## 1. CUSTOMER MOBILE APPLICATION

Technology:

React Native
Expo
Expo Router
TypeScript

Location approximately:

app/BuyNest

This is the application customers will use.

---

## 2. ADMIN PANEL

Admin should primarily be a web application because product management, inventory management, reports, and order management are easier from desktop.

Preferred technology:

Next.js
TypeScript
Tailwind CSS

Use the existing Admin/Frontend directory if appropriate.

Do not build the Admin UI until requested or until the mobile foundation/backend requires it.

---

## 3. BACKEND API

Preferred technology:

Node.js
TypeScript

A structured backend framework may be used, but avoid unnecessary complexity.

Preferred database:

PostgreSQL

Preferred ORM:

Prisma

The backend should expose APIs that can later be consumed by:

- React Native customer application
- Admin dashboard
- Future delivery application
- Future web storefront

Keep business logic in the backend instead of duplicating important logic inside clients.

---

# MOBILE APP DESIGN

The DoorKart customer application should feel like a modern ecommerce application but should NOT attempt to copy Amazon, Flipkart, or Meesho feature-for-feature.

Design style:

- Clean
- Modern
- Friendly
- Fast
- Minimal
- Product-focused
- Mobile-first
- Easy for non-technical customers

Use reusable components.

Avoid hardcoded dimensions where possible.

Support common Android screen sizes.

Build with accessibility and touch target size in mind.

---

# MOBILE APP NAVIGATION

Recommended primary bottom navigation:

Home
Categories
Cart
Orders
Account

If Account is unnecessary during guest-checkout MVP, keep its implementation minimal.

---

# MOBILE HOME SCREEN

Home screen should eventually include:

Header
Location / delivery area
Search bar

Category section

Examples:

Stationery
Gifts
Toys
Sports
Decoration

Banner area

Popular Products

New Arrivals

Recommended Products

Product cards should show:

Product Image
Product Name
MRP if relevant
Selling Price
Discount if relevant
Stock indication when needed
Add to Cart control

Do not overload product cards.

---

# CATEGORY MANAGEMENT

Categories MUST come from the backend/database.

Never hardcode the business around exactly five categories.

Initial categories:

Stationery
Gift Items
Toys
Sports Items
Decoration Items

The admin must eventually be able to:

Create Category
Edit Category
Activate/Deactivate Category
Upload Category Image
Control display order

Support subcategories later.

---

# PRODUCT MODEL

Products should support at minimum:

id
name
slug
description
categoryId
sku
mrp
sellingPrice
stockQuantity
lowStockThreshold
isActive
isFeatured
createdAt
updatedAt

Products should support multiple images.

Do not store money using floating point arithmetic.

Prefer storing money as integer minor units, for example:

₹100.50 = 10050 paise

or use a safe decimal representation at the database layer.

Design accordingly.

---

# PRODUCT VARIANTS

Do NOT make product variants mandatory in the MVP.

But architecture should allow future variants such as:

Color
Size
Pack Size
Brand
Material

Examples:

Blue / Red toy
Small / Medium / Large decoration
500g / 1kg
Pack of 5 / Pack of 10

Implement only when requested.

---

# INVENTORY

Inventory is important.

At minimum track:

Stock Quantity
Reserved Quantity
Available Quantity

Concept:

availableQuantity =
stockQuantity - reservedQuantity

Do not allow overselling.

Define clearly at what order stage stock becomes reserved.

Recommended flow:

Order placed
→ reserve inventory

Order cancelled
→ release inventory

Order completed
→ finalize inventory deduction

If you choose a different approach, document the reason.

Eventually inventory changes should have history/audit records.

---

# CART

Cart should support:

Add Product
Remove Product
Increase Quantity
Decrease Quantity
Clear Cart

Validate stock before checkout.

Do not trust prices sent from the mobile application.

The backend must calculate authoritative totals.

Persist the cart locally where appropriate so reopening the application does not immediately lose it.

---

# CHECKOUT

Initial checkout should remain simple.

Customer enters:

Name
Mobile Number
Address Line
Area
Landmark
Pincode

Optional fields can be added if necessary.

Payment Method:

Cash on Delivery

Initially COD should be the only payment method.

The architecture can use a paymentMethod field so online payments can be added later.

---

# DELIVERY AREAS

Because delivery is initially local and handled personally, create a simple delivery-area concept.

Admin should eventually be able to configure:

Area Name
Pincode if needed
Delivery Charge
Minimum Order
Free Delivery Threshold
Active / Inactive

Example:

Area A
Delivery Charge: ₹20

Area B
Delivery Charge: ₹30

Do not build GPS-based logistics for Version 1.

---

# ORDER MODEL

Each order should include approximately:

id
orderNumber
customerId
address snapshot
items
subtotal
deliveryCharge
discount
grandTotal
paymentMethod
paymentStatus
orderStatus
notes
createdAt
updatedAt

Order items MUST contain a snapshot of important product information at purchase time.

For example:

productId
productName
sku
quantity
unitPrice
lineTotal

Do not rely solely on current product data when displaying historical orders because product names and prices can change later.

---

# ORDER STATUSES

Keep order workflow explicit.

Suggested statuses:

PLACED
CONFIRMED
PACKED
OUT_FOR_DELIVERY
DELIVERED
CANCELLED
DELIVERY_FAILED

Avoid dozens of statuses.

Payment status must be separate from order status.

Payment statuses:

PENDING
COLLECTED
REFUNDED

Initial COD example:

Order Status:
DELIVERED

Payment Status:
COLLECTED

These must remain independent.

---

# ADMIN PANEL

The admin dashboard should eventually contain:

Dashboard

Orders
Products
Categories
Inventory
Customers
Delivery Areas
Offers
Reports
Settings

Do not implement everything at once.

---

# ADMIN DASHBOARD

Important information:

Today's Orders
Pending Orders
Out for Delivery
Delivered Today
Today's Revenue
Cash Collected
Cash Pending
Low Stock Products

Also provide:

Recent Orders
Low Stock Alerts

---

# ORDER MANAGEMENT

Admin should be able to:

View Orders
Search Orders
Filter Orders
View Order Details
Confirm Order
Mark Packed
Mark Out for Delivery
Mark Delivered
Mark Cancelled
Mark Delivery Failed
Mark Cash Collected

Order status history should eventually be retained.

---

# PRODUCT MANAGEMENT

Admin should eventually support:

Add Product
Edit Product
Deactivate Product
Product Images
Category
SKU
Description
MRP
Selling Price
Stock
Low Stock Threshold
Featured Product

Prefer deactivate/soft-delete behavior over destructive deletion when products have historical orders.

---

# CUSTOMERS

Initially customers should not be forced to create complex accounts.

Guest checkout is acceptable.

Store customer details using their phone number.

Later phone OTP authentication can convert existing customers into authenticated accounts.

Admin should eventually see:

Customer Name
Phone
Addresses
Order Count
Total Purchase Value
Recent Orders

---

# CASH MANAGEMENT

Because the business initially runs on COD, cash tracking is important.

Do not assume:

Delivered = Paid

Keep these actions separate.

Example:

Order Delivered
Payment Pending

then:

Cash Collected
Payment Collected

Admin reports should eventually show:

Cash Collected Today
Cash Pending
COD Orders
Delivered but Unpaid Orders

---

# REPORTING

MVP/basic reports may eventually include:

Daily Sales
Weekly Sales
Monthly Sales
Orders
Top Products
Category Sales
Cash Collected
Cash Pending
Cancelled Orders
Low Stock Products

Do not build enterprise analytics at this stage.

---

# DATABASE DESIGN

Potential entities include:

AdminUser
Customer
CustomerAddress
Category
Subcategory
Product
ProductImage
ProductVariant
Inventory
InventoryTransaction
Cart
CartItem
Order
OrderItem
Payment
DeliveryArea
OrderStatusHistory
Coupon
Setting

Do not create tables merely because they are listed here.

Create only what the current implementation requires while preserving a scalable schema design.

---

# AUTHENTICATION

MVP:

Admin:
secure email/password authentication

Customer:
guest checkout initially

Later:
phone + OTP authentication

Do not expose admin APIs without authentication and authorization.

Never store plaintext passwords.

---

# API RULES

Use REST APIs unless there is a strong reason otherwise.

Examples could eventually include:

GET /products
GET /products/:id
GET /categories

POST /cart
POST /orders

GET /orders/:id

Admin:

POST /admin/products
PATCH /admin/products/:id
GET /admin/orders
PATCH /admin/orders/:id/status

Actual routes should follow the backend architecture chosen for the project.

Use validation on all user input.

Never trust client-calculated:

price
discount
delivery charge
grand total
stock availability

The backend must verify them.

---

# ERROR HANDLING

Never silently swallow errors.

Create consistent API errors.

Client UI should handle:

Loading
Empty
Success
Error
Offline/Network failure

Do not leave screens permanently stuck in loading state.

---

# TYPESCRIPT RULES

Use TypeScript throughout the project.

Avoid:

any

unless genuinely unavoidable.

Prefer reusable types/interfaces.

Do not duplicate the same model definitions unnecessarily.

Use strict TypeScript where practical.

---

# COMPONENT RULES

Avoid giant screen components.

Extract reusable components such as:

ProductCard
CategoryCard
PriceDisplay
QuantitySelector
SearchBar
EmptyState
ErrorState
LoadingState
OrderCard
OrderStatusBadge
AddressCard
PrimaryButton

But do not over-componentize trivial markup.

---

# REACT RULES

Follow the Rules of Hooks.

Never call hooks:

inside conditions
inside loops
inside normal utility functions
outside React components/custom hooks

Custom hooks must begin with:

use...

Avoid unnecessary useEffect usage.

Do not solve state synchronization problems by adding random useEffects.

---

# STATE MANAGEMENT

Do not introduce Redux unless the application's complexity actually requires it.

For the initial application:

Local UI state:
React state

Server state:
prefer a proper query/cache solution when backend integration begins.

Cart/global lightweight state:
choose a lightweight solution if needed.

Do not introduce multiple state libraries.

---

# STYLING

Create a reusable design system.

Define:

Colors
Spacing
Typography
Border Radius
Shadows

Avoid repeating random hex values throughout components.

Support consistent UI throughout DoorKart.

Avoid excessive gradients and visual clutter.

---

# PERFORMANCE

Optimize sensibly.

For lists use:

FlatList

instead of rendering large product lists using ScrollView + map.

Optimize images.

Avoid unnecessary re-renders.

Do not prematurely optimize insignificant code.

---

# SECURITY

Follow basic production security practices.

Never commit:

API secrets
database passwords
JWT secrets
private credentials

Use environment variables.

Validate requests server-side.

Sanitize appropriate inputs.

Implement proper authorization for admin functionality.

Do not trust mobile-client values.

---

# ENVIRONMENT VARIABLES

Use environment files appropriately.

Provide:

.env.example

Never put real secrets in example files.

Document required environment variables.

---

# DEVELOPMENT QUALITY

Before considering a feature complete:

TypeScript should compile.
Lint errors should be handled.
Application should start.
No obvious runtime errors should remain.
Navigation should work.
Loading/error/empty states should be handled where appropriate.

Do not leave placeholder functions that pretend functionality is complete.

---

# DEPENDENCY RULES

Before installing a package:

1. Check whether the project already has a solution.
2. Confirm compatibility with the current Expo version.
3. Prefer Expo-supported packages for Expo functionality.
4. Avoid abandoned/unnecessary packages.
5. Explain significant new dependencies.

Do not install large libraries for trivial functionality.

---

# IMPORTANT — DO NOT OVERENGINEER

This is currently a local shop application.

Do NOT initially build:

Multi-vendor marketplace
Microservices
Kafka
Redis clusters
Kubernetes
Complex event architecture
AI recommendation engine
Real-time courier GPS tracking
Multi-country tax systems
Complex warehouse management
Enterprise ERP features

Use a modular architecture that can evolve later.

---

# DEVELOPMENT STRATEGY

Build in phases.

PHASE 0
Stabilize project.

- Inspect repository
- Fix Expo configuration
- Fix invalid hook issue
- Verify app launches
- Establish clean folder architecture
- Establish design tokens
- Establish navigation

PHASE 1
Static customer UI foundation.

- Home
- Categories
- Product listing
- Product detail
- Cart
- Checkout
- Order confirmation
- Orders

Use temporary mock data if backend does not exist.

Keep mock data isolated so replacing it with APIs later is easy.

PHASE 2
Backend foundation.

- PostgreSQL
- Prisma
- Database schema
- API structure
- Categories
- Products
- Inventory
- Orders
- Customers
- Delivery areas

PHASE 3
Connect mobile application to backend.

PHASE 4
Admin web panel.

PHASE 5
Testing, polish and deployment.

Do not jump directly to Phase 5.

---

# WORKING WITH ME

When I request a feature:

First inspect the relevant existing files.

Then give me a very short plan like:

"Implementing:
1. X
2. Y
3. Z"

Then make the changes.

After implementation tell me:

What was changed
Important files changed
Commands I need to run
Anything that still needs attention

Do not write long theoretical explanations unless I ask.

If you encounter a genuine architectural decision with major future consequences, explain the options before proceeding.

For normal implementation details, make a sensible engineering decision yourself.

---

# DO NOT DELETE WORKING FUNCTIONALITY

Do not:

delete existing files unnecessarily
recreate the entire application
replace configuration blindly
downgrade packages randomly
run destructive commands without justification

Preserve existing working code.

---

# GIT SAFETY

Never run destructive Git commands unless explicitly requested.

Do not use:

git reset --hard
git clean -fd

without my explicit permission.

Do not discard unrelated local changes.

---

# CURRENT FIRST PRIORITY

Our immediate goal is NOT yet to build the entire ecommerce application.

First:

1. Audit the existing Expo project.
2. Inspect package.json.
3. Diagnose the current Invalid Hook Call error.
4. Verify React, React DOM, React Native, Expo and Expo Router compatibility.
5. Fix the issue safely.
6. Clean the starter application without breaking Expo Router.
7. Establish the appropriate React Native project structure.
8. Get a clean working DoorKart starter screen.

Do not start implementing dozens of screens before the development environment is stable.

Once the project is stable, propose the folder architecture for the DoorKart mobile application and wait for or proceed with the next requested feature.

Remember:

Build DoorKart for today's local shop workflow while keeping the architecture ready for tomorrow's larger ecommerce business.