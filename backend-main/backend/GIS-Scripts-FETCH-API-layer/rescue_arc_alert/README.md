# Rescue-Arc · Zone Alert Broadcast System

A resilient, geo-targeted emergency alert broadcasting service. Sits alongside `hazard_platform` to monitor disaster risk, manage persistent zone history in Supabase, and broadcast real-time Firebase Web Push alerts to citizens.

---

## Table of Contents
1. [Frequently Asked Questions (Architecture & Setup)](#frequently-asked-questions)
   - [Q1: Do I have to configure Supabase and Firebase every time?](#q1-do-i-have-to-configure-supabase-and-firebase-every-time)
   - [Q2: Do I need to run `schema.sql` and `schema_grants.sql` every time?](#q2-do-i-need-to-run-schemasql-and-schema_grantssql-every-time)
   - [Q3: How do I run the service without path errors?](#q3-how-do-i-run-the-service-without-path-errors)
   - [Q4: Are the 1-Click Presets real or simulated?](#q4-are-the-1-click-presets-real-or-simulated)
   - [Q5: Will alerts automatically target people nearest to that zone?](#q5-will-alerts-automatically-target-people-nearest-to-that-zone)
   - [Q6: Does this work even if the website is closed?](#q6-does-this-work-even-if-the-website-is-closed)
2. [Mobile Compatibility & Responsive Design](#mobile-compatibility--responsive-design)
3. [Admin Dashboard Features](#admin-dashboard-features)
4. [Notification UI System (Floating Pill Toast)](#notification-ui-system-floating-pill-toast)
5. [Quick Start & Running Locally](#quick-start--running-locally)
6. [API Reference](#api-reference)

---

## Frequently Asked Questions

### Q1: Do I have to configure Supabase and Firebase every time?
**No. It is already configured and persistent.**

* All credentials, API keys, URLs, and secret tokens are permanently saved on disk in `.env` and `secrets/firebase-service-account.json`.
* When you launch the service (`python -m uvicorn alert_service:app ...`), Python automatically reads these values into memory.
* The frontend dynamically retrieves public web configs from the `/admin/firebase-config` API endpoint.
* **You only need to edit `.env` if:** you rotate your API keys or switch to a different Supabase/Firebase project.

---

### Q2: Do I need to run `schema.sql` and `schema_grants.sql` every time?
**No. You only ever run them once during initial setup.**

* Supabase is a persistent cloud PostgreSQL database.
* Running `schema.sql` and `schema_grants.sql` creates the tables (`zones`, `zone_classifications`, `subscribers`, `alert_log`), views (`zone_current_status`), Row-Level Security policies, and access grants.
* These objects live permanently in PostgreSQL on disk in the cloud. They survive computer reboots, server shutdowns, and network reconnections.
* **You only need to run them again if:** you completely wipe/reset your database or introduce new table migrations.

---

### Q3: How do I run the service without path errors?
If your terminal shows `The system cannot find the path specified`, it means your terminal is in `C:\Users\madhv` instead of the project directory.

Run these exact commands from any terminal prompt:

```cmd
cd "C:\Users\madhv\OneDrive\Desktop\GIS-Scripts-FETCH-API-layer\rescue_arc_alert"
python -m uvicorn alert_service:app --reload --port 8001
```

Access the web interfaces:
* **Admin Dashboard:** [http://localhost:8001/admin](http://localhost:8001/admin)
* **Notification Tester:** [http://localhost:8001/test](http://localhost:8001/test)

---

### Q4: Are the 1-Click Presets real or simulated?
**They are synthetic simulation presets designed specifically for presentations and testing.**

* **Why?** In the real world, natural disasters do not strike on command during a 5-minute presentation. If the platform only relied on live satellite feeds, you could wait months before witnessing a live RED alert.
* **How It Works:** Clicking a preset (e.g. *Wayanad Landslide RED Alert*) passes realistic emergency parameters into the **exact same delivery pipeline**:
  1. Inserts the classification into Supabase.
  2. Identifies all subscribers registered to that zone.
  3. Dispatches the real Firebase Cloud Messaging (FCM) Web Push.
  4. Records the event in the permanent `alert_log`.
* **Switching Back to Real Data:** Click **`↺ Reset`** on any zone (or **`🟢 Reset All to Normal`** in the top bar) to immediately restore live GIS satellite polling from `hazard_platform`.

---

### Q5: Will alerts automatically target people nearest to that zone?
**Yes, absolutely. Delivery is strictly geo-targeted.**

```
[Citizen visits website]
        │
        ▼
[Clicks "Get Alerts" & shares GPS location]
        │
        ▼
[Backend calls /api/analyze-point(lat, lon)]
        │
        ▼
[Device token mapped to nearest Zone in Supabase]
        │
        ▼ (Disaster strikes / zone turns RED)
[FCM sends push ONLY to devices registered in that Zone]
```

* **No Spam / Irrelevant Noise:** A citizen registered in **Patna** will never receive an emergency notification for a landslide in **Wayanad**. Only devices in or closest to the affected danger zone receive the push notification.

---

### Q6: Does this work even if the website is closed?
**Yes, 100%. That is the primary purpose of Service Workers and Web Push.**

* Unlike regular tab scripts, the Service Worker (`firebase-messaging-sw.js`) is an independent background thread registered with the operating system.
* When the user closes the website, the browser maintains a low-power push listening socket.
* When an alert fires, the operating system wakes up the background Service Worker and renders a native desktop banner (Windows Action Center / macOS) or mobile lock-screen alert (Android).
* **iOS Safari Note:** Apple requires iPhone users to tap *"Add to Home Screen"* once (PWA mode, iOS 16.4+) before background push notifications are permitted.

---

## Mobile Compatibility & Responsive Design

Both the **Admin Dashboard** (`admin.html`) and the **Subscriber Portal** (`test_notify.html`) are fully mobile-responsive and touch-optimized:

1. **Adaptive Viewport & Layout**:
   * Uses fluid flex and CSS grid containers that adapt smoothly from 320px phone screens (iPhone SE) to tablets, laptops, and ultra-wide desktop monitors.
   * On mobile screens, the top navigation stacks cleanly with full-width action buttons.
2. **Touch-Friendly Hit Targets**:
   * All buttons, filter chips, dropdowns, and inline table actions have a minimum touch target height of 36px–44px, eliminating mis-taps.
3. **Responsive Zone Table**:
   * On mobile viewports, the table features touch-optimized horizontal scrolling (`-webkit-overflow-scrolling: touch`) with an on-screen swipe guide indicator.
4. **Interactive Simulated Phone Preview**:
   * Tap **`📱 Citizen Preview`** in the admin header to open a slide-over smartphone frame showing how the alert appears on an actual citizen's mobile lock-screen.
5. **Floating Emergency Pill**:
   * Responsive top banner dynamically scales its width (95vw on mobile) and font sizes for readability without obscuring screen content.

---

## Admin Dashboard Features

The dashboard at `/admin` is a single-page, lightweight console built with collapsible sections:

* **Demo Trigger & Scenario Simulator**:
  * **Dynamic Region Dropdown:** Automatically reads all zones from the Supabase database. Any newly added region appears dynamically.
  * **Side-by-Side Override Buttons:** `🔴 Force RED`, `🟡 Force YELLOW`, `🟢 Force GREEN`, and `↺ Reset`.
  * **1-Click Presets:** Instant simulation for *Puri Coastal Surge*, *Wayanad Landslide*, *Patna River Flood*, and *Joshimath Subsidence*.
* **Live Zone Monitor Table**:
  * Live status pills (`RED`, `YELLOW`, `GREEN`).
  * Worst hazard identifier & mini risk-percentage meters.
  * Active subscriber count per zone.
  * **Inline Action Buttons** (`RED`, `YEL`, `GRN`, `↺`) directly in every table row.
  * Search bar + filter chips (`All`, `RED`, `YELLOW`, `GREEN`).
* **Broadcast History & Audit Log**:
  * Real-time list of past broadcasts, targeted vs delivered counts, and transition logs.
* **Header Controls**:
  * **Auto-Poll Timer:** Live sync countdown (`Sync in 45s`) with manual refresh.
  * **Audio Chime Toggle:** Synthesized audio alarm when alerts trigger (`Audio On` / `Muted`).
  * **1-Click Reset All to Normal:** Instantly resets all zones across the database back to `GREEN` (All Clear).

---

## Notification UI System (Floating Pill Toast)

A modern, glassmorphic floating emergency pill toast integrated into both `/admin` and `/test`:

* **Visual Status Hierarchy**:
  * 🔴 **RED ALERT:** Multi-ring pulsating crimson halo, siren beacon icon (`🚨`), `RED ALERT` badge, and high-urgency audio alarm.
  * 🟡 **YELLOW WARNING:** Amber glowing pulse, warning icon (`⚠️`), `WARNING` badge, and cautionary chime.
  * 🟢 **GREEN ALL-CLEAR:** Calm emerald glow, shield icon (`🛡️`), `ALL CLEAR` badge, and positive chime.
* **Expandable Safety Drawer**:
  * Click anywhere on the pill or tap `Details ▾` to expand real-time evacuation directives, hazard probability percentage, and timestamp.
* **Auto-Dismiss Progress Bar**:
  * An 8-second depleting countdown bar at the bottom edge. Hovering pauses the countdown; an instant close (`✕`) button allows manual dismissal.
* **Web Audio Synthesizer**:
  * Employs standard browser `AudioContext` to synthesize emergency frequencies without needing external MP3 dependencies.

---

## Quick Start & Running Locally

### 1. Requirements
* Python 3.10+
* Chrome, Edge, or Firefox browser

### 2. Start the Alert Service
```powershell
cd rescue_arc_alert
python -m uvicorn alert_service:app --reload --port 8001
```

### 3. Open in Browser
* **Admin Dashboard:** <http://localhost:8001/admin>
* **Notification Tester:** <http://localhost:8001/test>

### 4. Run Automated Test Suite
```powershell
python -m pytest test_alert_system.py
```
*(All 22 test cases pass 100%).*

---

## API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/admin/zone-status` | Returns all database zones, current color, subscriber counts, and hazard metrics. |
| `POST` | `/admin/override-zone` | Forces a synthetic zone transition and dispatches Web Push alerts. |
| `POST` | `/admin/reset-all` | Resets all registered zones to `GREEN` (All Clear). |
| `GET` | `/admin/reset-zone/{zone_id}` | Reclassifies a single zone using live `hazard_platform` GIS data. |
| `POST` | `/admin/run-bridge` | Triggers an immediate polling cycle across all zones. |
| `POST` | `/admin/test-push` | Sends a direct test push notification to a specified FCM token. |
| `GET` | `/admin/alert-history` | Returns the audit log of dispatched notifications. |
| `POST` | `/subscribe` | Registers a citizen device with GPS coordinates and FCM token. |
| `GET` | `/admin/firebase-config` | Returns public Firebase web credentials for browser initialization. |
