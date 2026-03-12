# Ticket Concierge Site — Master Build Prompt / Product Requirements Document

## 1. Product Overview

Build a production-ready web platform for a **ticket concierge service** that helps customers purchase tickets in a simple, low-friction way for specific promoted events.

This business is **not affiliated** with venues, artists, teams, productions, box offices, or original ticket providers. The platform operates as an **independent ticket concierge / resale-style service** that helps customers obtain tickets in a desired seating **zone**, rather than promising exact seat numbers.

The system must support:
- multiple parent events across many categories
- multiple performance dates under a single parent event
- **one public landing page per parent event**, regardless of how many dates it contains
- ad-driven traffic from Google Ads directly to individual event pages
- **no sitewide event search for customers**
- manual inventory creation initially
- future semi-automated event ingestion from a source event URL
- internal order fulfillment workflows
- simple mainstream payment processing
- daily reporting and live fulfillment queue management

---

## 2. Core Business Model

### 2.1 Customer Experience Model
Customers arrive directly from paid ads to a specific event landing page. They do not browse a marketplace and they do not search the site for events.

Customers purchase tickets by **seating zone** and date, not by exact seat.

Example:
- Customer chooses: “Lower Level Center” for Friday, April 9 at 7:30 PM
- Customer does **not** choose exact section, row, and seat numbers
- Internal staff later fulfill the order by sourcing qualifying tickets from the original ticket provider or source

### 2.2 Inventory Source Model
Phase 1 inventory is entered manually by admins based on tickets observed on the original ticket source site.

Phase 2 should support a semi-automated admin workflow where a user pastes an event URL and the system attempts to prefill event data for admin review.

### 2.3 Seating Promise
- Tickets are sold by zone, not exact seat
- **Seats together are implied by default** for multi-ticket purchases
- If together seating cannot be fulfilled, the order must go into exception handling
- No separated-seat fulfillment is allowed without approval
- If approval is not obtained, the order must be refunded

### 2.4 Quantity Caps
Each event date must support configurable quantity caps, which may differ by venue and event.

Examples:
- max 2 per order
- max 4 per order
- max 8 per order

### 2.5 Event Cutoff Logic
Each event date must support a **sell cutoff datetime** that may occur before the actual event time to account for fulfillment and delivery lead time.

Examples:
- eTicket: cutoff 6 hours before showtime
- Will call: cutoff 24 hours before showtime
- Printed tickets: cutoff 72 hours before showtime

Per-date overrides must be supported.

---

## 3. Product Goals

### Primary Goals
- Create a high-converting, simple ticket-buying experience
- Allow internal staff to manage event pages, dates, zones, pricing, and fulfillment efficiently
- Prevent customers from seeing expired, past, or impossible-to-fulfill dates
- Support operational control over zone-based ticket sales and order fulfillment
- Provide flexible branding and page merchandising for each parent event

### Non-Goals for MVP
- No public sitewide event search
- No marketplace-style browsing experience
- No exact-seat map selection by customers
- No full automatic scraping-to-publish without admin review
- No broad discovery homepage requirement

---

## 4. Public Site Requirements

## 4.1 Public Information Architecture
The public site must be organized around **one landing page per parent event**.

A parent event may contain multiple performance dates, but the customer must see a **single event page** with a date selector embedded in it.

There should **not** be separate default public pages for each performance date.

### Example
Parent Event:
- Hamilton at Dr. Phillips Center

Date Instances within the same page:
- April 8, 2026 at 7:30 PM
- April 9, 2026 at 2:00 PM
- April 9, 2026 at 7:30 PM

## 4.2 Public Site Behavior
Each parent event page must:
- show event title and venue
- support custom branding and imagery for that event
- display only currently valid dates
- let the customer select a date on the same page
- update visible zone options, pricing, and fulfillment details based on the selected date
- support a fast, simplified checkout flow

If only one valid date is available, the page should auto-select that date.

If no valid dates are available, show a controlled message such as:
- “No dates currently available”

## 4.3 Public UI Requirements
The public page must support:
- hero image
- event title
- venue name
- category
- event summary / marketing copy
- date selector
- seating map or seating layout image
- selectable zones
- pricing display
- quantity selector
- disclosures
- trust/payment reassurance
- support/contact link

## 4.4 Event-Level Visual Control
Admins must be able to control the appearance of each parent event page, including:
- layout template
- color palette
- hero image
- gallery/supporting images
- text treatment
- section order
- CTA placement
- page copy
- disclosure placement

This control must be applied at the **parent event page level**, not duplicated separately for every date.

## 4.5 Layout System
Support 3–4 configurable page templates for MVP.

Suggested templates:
1. Hero + date selector + zones + checkout emphasis
2. Hero + details + seating map + zones
3. Image-left / purchase-right
4. Premium long-form landing page

Do not make the system fully freeform in MVP.

## 4.6 Color and Image Controls
Each parent event page must support:
- primary color
- secondary color
- accent color
- text color mode / theme
- hero image upload
- supporting image upload(s)
- optional mobile image variant

## 4.7 Date Presentation Rules
Only show date instances where all of the following are true:
- visible = true
- on sale = true
- sold out = false
- current time is before sell cutoff datetime
- event datetime has not passed

The system must automatically suppress expired dates from the public page.

## 4.8 Customer Disclosures
The following disclosures must be supported and shown clearly on the event page and/or checkout:
- Tickets are sold by seating zone, not exact seat number
- Seats together are intended whenever available
- If together seating cannot be fulfilled, customer may be contacted with options or refunded
- Company is not affiliated with venue, artist, team, production, box office, or original ticket provider
- Ticket format may vary by event and may include eTickets, printed tickets, or will call
- Prices may differ from original seller pricing

The legal copy should be editable in the admin.

---

## 5. Checkout Requirements

## 5.1 Checkout Experience
Checkout must be simple and mainstream. Minimize friction.

Required checkout capabilities:
- select quantity
- show selected event/date/zone summary
- show final price clearly
- collect customer contact information
- collect billing/payment information
- capture fulfillment-relevant information if needed
- display disclosures and policy links
- show order confirmation page after purchase
- send order confirmation email

## 5.2 Payment Stack
Use a mainstream processor compatible with custom checkout experiences.

Preferred:
- Stripe

Acceptable alternatives:
- Square
- PayPal as optional wallet/support method

Design the system so the payment provider can be abstracted/configurable.

## 5.3 Order Confirmation
After successful payment, the system must:
- create an order record
- place the order into the fulfillment queue
- send order confirmation to the customer
- send buyer notification email
- attach order to the proper parent event and event date

---

## 6. Pricing Model Requirements

## 6.1 Pricing Philosophy
The pricing model must support four components:
1. source ticket cost
2. markup on cost
3. margin buffer
4. service fee

### Formula
Per Ticket Public Price = Source Cost + Markup + Margin Buffer

Order Total = (Per Ticket Public Price × Quantity) + Service Fee + applicable taxes if needed

## 6.2 Markup Model
Support:
- percentage markup on source cost
- flat dollar markup
- minimum markup floor

## 6.3 Margin Buffer
Support a configurable margin buffer to protect against price movement on the original source site.

This must be configurable:
- at event level default
- optionally overridden at zone level

## 6.4 Service Fee Model
Support:
- flat fee per order
- flat fee per ticket
- percentage-based fee
- minimum service fee floor

## 6.5 Pricing Fields
Track:
- source observed cost
- markup type
- markup value
- markup amount
- margin buffer amount
- service fee type
- service fee value
- final public price
- gross margin estimate

## 6.6 Pricing Governance
Admins must be able to:
- configure pricing defaults at event level
- override pricing at zone level
- manually edit final public price if needed
- see margin health for each zone/order

---

## 7. Fulfillment Requirements

## 7.1 Fulfillment Queue
The system must include an internal dashboard queue for fulfillment staff.

Each new order must enter the queue automatically.

The queue must show at minimum:
- order number
- purchase timestamp
- parent event
- event date/time
- zone purchased
- quantity
- seats together expectation
- fulfillment type
- assigned buyer
- acquisition status
- urgency
- margin/risk flag
- exception status

## 7.2 Buyer Notifications
When an order is placed, notify the assigned buyer via:
- dashboard queue entry
- email notification

Also produce a daily sales / acquisition report.

## 7.3 Fulfillment Types
The system must support:
- eTickets / emailed tickets / mobile transfer
- printed / hard tickets / printable tickets
- will call

Each order and zone must store the relevant fulfillment type.

## 7.4 Fulfillment Workflow
Required workflow:
1. customer places order
2. payment succeeds
3. order enters queue
4. assigned buyer is notified
5. buyer acquires matching tickets from original source
6. buyer updates status
7. ticket delivery is completed according to fulfillment type
8. order is marked fulfilled or exception/refund

## 7.5 Seating Fulfillment Rule
Seats together are implied for multi-ticket orders.

If together seating cannot be fulfilled:
- do not fulfill split seats automatically
- move order to exception handling
- request approval if desired by policy
- if approval is not obtained, refund

## 7.6 Exception Handling
Required exception types:
- together seating not available
- source price drift beyond protected buffer
- zone unavailable
- quantity unavailable
- fulfillment-type mismatch
- delivery issue

Each exception should support:
- status
- notes
- assigned owner
- resolution outcome

## 7.7 Delivery Handling
For each fulfillment type:

### eTickets
- record transfer/upload/delivery info
- email customer or record transfer completion
- mark delivered

### Printed Tickets
- record shipment or delivery method
- track shipment info if used
- mark delivered when completed

### Will Call
- record customer/pickup name requirements
- store pickup instructions
- send instructions to customer
- mark fulfilled

---

## 8. Reporting Requirements

## 8.1 Daily Report
Create and send a daily report of ticket sales to the assigned ticket buyer or responsible person.

Daily report should include:
- order number
- event
- event date
- zone
- quantity
- customer name
- fulfillment type
- price sold
- estimated source cost
- order status
- notes/exceptions

## 8.2 Admin Reporting
Provide admin reporting views for:
- sales by event
- sales by event date
- sales by assigned buyer
- unfulfilled orders
- refunded orders
- exception queue
- revenue / margin overview

## 8.3 Export
Allow report export in CSV for finance/operations.

---

## 9. Admin Backend Requirements

## 9.1 Admin Overview
The admin backend must allow non-technical staff to manage:
- parent events
- event dates
- layout and branding
- images
- seating maps
- zones
- pricing
- quantity caps
- cutoff dates/times
- fulfillment settings
- orders
- queue workflow
- reports
- disclosures and content blocks

## 9.2 Parent Event Management
Each parent event must support:
- title
- slug / public URL
- venue
- category
- hero image
- supporting images
- layout template
- color palette
- marketing copy
- disclosure content
- default pricing settings
- default fulfillment assumptions
- default cutoff rules
- active/inactive status

## 9.3 Event Date Management
Each event date instance must support:
- parent event reference
- performance datetime
- timezone
- visible yes/no
- on sale yes/no
- sold out yes/no
- sell cutoff datetime
- optional cutoff override
- quantity cap
- assigned buyer
- notes
- status: draft / scheduled / live / hidden / cutoff reached / sold out / completed / archived

## 9.4 Zone Management
Each event date must allow zone-level configuration including:
- zone name
- customer-facing description
- display order
- map region / color
- source sections included
- source observed cost
- public price
- markup settings
- margin buffer
- service fee settings or inherited rules
- available quantity
- min/max quantity
- active/inactive
- fulfillment type
- seats together eligible / policy notes

## 9.5 Seating Map Upload
Admins must be able to upload seating map images/layouts.

MVP can use image-based map support rather than fully interactive SVG seat maps.

## 9.6 Content Controls
Admins must be able to show/hide or reorder:
- description section
- seating map section
- FAQ section
- disclosures section
- support section

## 9.7 Order Management
Admins must be able to:
- search orders internally
- filter by status/event/date/buyer
- view full order detail
- update fulfillment status
- add notes
- mark exceptions
- mark refund status
- record delivery completion

## 9.8 Roles and Permissions
MVP roles:
- Admin
- Fulfillment Buyer
- Read-only Finance / Reporting

Admins can manage all configuration.
Fulfillment users can work the queue and update orders.
Finance users can see orders/reports but not alter critical event configuration.

---

## 10. Data Model

## 10.1 Parent Event
Fields should include:
- id
- title
- slug
- venue_name
- category
- hero_image
- gallery_images
- layout_template
- primary_color
- secondary_color
- accent_color
- text_theme
- marketing_headline
- subheadline
- event_description
- disclosure_block
- default_cutoff_rule
- default_markup_rule
- default_service_fee_rule
- default_margin_buffer
- active_status
- created_at
- updated_at

## 10.2 Event Date Instance
Fields should include:
- id
- parent_event_id
- performance_datetime
- timezone
- visibility_status
- on_sale_status
- sold_out_status
- sell_cutoff_datetime
- quantity_cap
- assigned_buyer_id
- status
- notes
- created_at
- updated_at

## 10.3 Zone
Fields should include:
- id
- event_date_id
- zone_name
- customer_description
- display_order
- map_region_key
- source_section_mapping
- source_observed_cost
- markup_type
- markup_value
- margin_buffer_value
- service_fee_type
- service_fee_value
- public_price
- available_quantity
- min_purchase_qty
- max_purchase_qty
- fulfillment_type
- active_status
- notes

## 10.4 Order
Fields should include:
- id
- order_number
- parent_event_id
- event_date_id
- zone_id
- customer_name
- customer_email
- customer_phone
- quantity
- seats_together_expected
- fulfillment_type
- source_cost_estimate
- markup_amount
- margin_buffer_amount
- service_fee_amount
- final_sale_amount
- payment_status
- fulfillment_status
- delivery_status
- refund_status
- assigned_buyer_id
- exception_status
- internal_notes
- created_at
- updated_at

## 10.5 User
Fields should include:
- id
- name
- email
- role
- active_status

---

## 11. Date and Availability Logic

## 11.1 Frontend Date Visibility Logic
A date should be publicly visible only if:
- parent event is active
- date visibility = true
- on sale = true
- sold out = false
- current datetime < sell cutoff datetime
- current datetime < event datetime

## 11.2 Automatic Lifecycle Actions
Support automatic handling for:
- hiding dates after event passes
- disabling checkout after sell cutoff
- marking dates completed after event passes
- suppressing sold-out dates from purchase UI

## 11.3 Manual Overrides
Admins must be able to:
- hide a future date
- reopen a future date
- mark sold out manually
- change cutoff time
- archive old dates

---

## 12. Event Ingestion — Phase 2

## 12.1 Goal
Allow admin to paste a source event URL and let the system prefill event information for review.

## 12.2 Expected Prefill Targets
Attempt to capture:
- source site name
- source event URL
- source event title
- venue
- date/time(s)
- event imagery if available
- seating map if available
- source sections / zones if available
- observed price information if available

## 12.3 Safety Rule
Do not auto-publish without admin review.

This is an **admin assist tool**, not a fully autonomous publisher.

---

## 13. Technical / UX Expectations

## 13.1 UX Priorities
- mobile-friendly
- fast page load
- conversion-oriented design
- easy admin usage
- clean event/date/zone selection flow

## 13.2 Recommended Build Approach
Use a modern web stack suitable for custom admin + public site development.

Suggested architecture:
- React / Next.js frontend
- secure admin dashboard
- relational database for events/orders/zones
- image/file storage for hero images and seating maps
- payment provider integration abstraction
- email notification service

## 13.3 Accessibility and Responsiveness
Ensure:
- strong mobile usability
- legible contrast based on configurable palettes
- keyboard-usable controls where practical
- responsive layout templates

---

## 14. Success Criteria

The platform is successful if it enables the business to:
- launch event-specific paid-traffic landing pages quickly
- control branding per event
- manage multiple dates under one public event page
- prevent stale/expired dates from appearing
- sell by zone with simple checkout
- notify buyers quickly when orders occur
- fulfill eTickets, print tickets, and will call orders
- track pricing and margin protection
- issue refunds when together seating cannot be fulfilled
- run daily operational reporting reliably

---

## 15. Master Build Prompt for AI Developer / App Generator

Build a production-ready web application for an independent ticket concierge service. The application must support multiple parent events across categories, but customers must not search or browse the site like a marketplace. Instead, traffic comes from Google Ads directly to one public landing page per parent event. Each parent event may have multiple performance dates, but all dates must be presented within the same public page using a date selector. Customers purchase tickets by seating zone, not exact seat number. Seats together are implied by default for multi-ticket purchases, and if together seating cannot be fulfilled, the order must be routed to exception handling and refunded if approval is not obtained.

The frontend must allow per-parent-event control over layout template, color palette, hero image, supporting images, section order, marketing copy, and disclosures. Only event dates that are visible, on sale, not sold out, not past the event time, and not past the sell cutoff time may be shown to customers. Each event date must support an adjustable sell cutoff datetime that may occur before the actual performance to account for processing and fulfillment time.

The admin backend must support parent-event management, event-date management, seating map upload, zone creation, source section mapping, quantity caps, pricing controls, fulfillment settings, order management, reporting, and role-based access. Pricing must support source cost, markup on cost, margin buffer, and service fee. Orders must enter a live dashboard fulfillment queue and also trigger email notification to the assigned buyer. The system must support eTicket, printed ticket, and will call fulfillment types. The platform must also generate a daily sales/acquisition report and support CSV export.

Initially, inventory entry is manual. Design the data model and admin workflow so that a future Phase 2 feature can accept a source event URL and prefill event/date/zone information for admin review, without auto-publishing.

Use a modern responsive architecture suitable for a custom public website and secure admin dashboard. Optimize for simplicity, operational control, and conversion-focused ticket purchasing.

---

## 16. MVP Scope Summary

### Include in MVP
- one public page per parent event
- multiple dates within same page
- date selector
- event branding controls
- layout templates
- image uploads
- seating map image uploads
- manual zone setup
- quantity caps
- pricing model with markup + service fee + margin buffer
- payment integration
- order confirmation
- fulfillment queue
- buyer email notifications
- daily report
- CSV export
- eTicket / print / will call handling
- role-based admin

### Phase 2
- source URL ingestion
- event prefill
- source parsing assistance
- automated stale inventory warnings
- advanced operational dashboards
- optional campaign-specific alternate landing pages