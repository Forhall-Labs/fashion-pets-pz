# Requirements — Pet Grooming Shop Agenda System

## 1. Overview
A scheduling/agenda system for a pet grooming shop. It manages pet and owner
records, generates and displays appointments on a calendar, maintains a
waiting list, plans pickup routes for pets that need transportation, and
notifies owners via WhatsApp.

## 2. Actors
- **Admin** — the only actor with access to the system. Manages pet/owner records, appointments, waiting list, pickups, and shop-wide configuration (capacity, vacations).
- **Client (pet owner)** — has no access to the system. Interacts only indirectly, by receiving WhatsApp notifications.

## 3. Functional Requirements

### 3.1 Pet & Owner Records
- FR-1: The system shall store an **owner** record with: name, contact info, home address/location, and (optionally) fixed day(s) of the week the owner regularly visits the shop.
- FR-2: The system shall store a **pet** record with: name, breed, size (see FR-2b), owner (link to FR-1), aggressiveness flag, grooming frequency (how often the pet is groomed — see FR-2a), pickup-required flag, pet's location (may default to owner's address), and average service duration (time needed to groom this pet).
- FR-2a: Grooming frequency shall be set by the Admin per pet, chosen from preset intervals (e.g., twice a month, once a month, once every two months). This value drives automatic appointment generation (FR-8).
- FR-2b: Pet size shall be one of three categories: **Small**, **Medium**, or **Extra Large**. Size is used for waiting-list slot matching (FR-13).
- FR-3: A single owner may have multiple pets linked to their record; each pet can have its own independent appointment schedule.
- FR-4: The system shall support marking specific days as an owner's preferred/fixed visit day(s), used as a hint when generating or suggesting appointments for that owner's pets.

### 3.2 Calendar / Agenda
- FR-5: The system shall provide a calendar view of appointments with four display modes: **day**, **week**, **month**, and **year**.
- FR-6: In all views, each appointment shall show at minimum the pet's name and appointment time; clicking/tapping an appointment shall open full appointment details in one action.
- FR-7: The system shall support moving an appointment to a different date/time via **drag-and-drop** on the calendar.

### 3.3 Automatic Appointment Scheduling
- FR-8: The system shall be able to automatically generate future appointments for a pet based on its stored grooming frequency (FR-2) and service duration.
- FR-9: Automatically generated appointments shall respect shop configuration constraints (see 3.4) and shall not be created on blocked days.

### 3.4 Scheduling Constraints & Configuration
- FR-10: The system shall allow configuring **blackout periods** (e.g., vacations/holidays) during which no appointments can be scheduled.
- FR-11: The system shall allow configuring the **maximum number of pets the shop can handle per day**, and shall prevent scheduling (manual or automatic) beyond this limit. Capacity is a simple count of pets per day (not dependent on staff, stations, or time-of-day distribution).
- FR-11a: The system shall allow configuring the shop's **business hours** (opening and closing time). Appointments — manual, automatic, or moved via drag-and-drop — shall only be scheduled within business hours.

### 3.5 Waiting List
- FR-12: The system shall maintain a **waiting list** of pets that do not yet have a confirmed appointment. A pet is only eligible to be added to the waiting list if it has **no active (scheduled) appointment for the remainder of the year**; a pet whose only appointment(s) this year are already completed or cancelled remains eligible. Attempting to add a pet that already has an active appointment is rejected.
- FR-13: When an appointment slot becomes free (e.g., an existing appointment is cancelled or rescheduled to a different day via drag-and-drop), the system shall recommend waiting-list pets to fill that slot, matched by **size**: a vacated slot previously held by a Small/Medium/Extra Large pet is offered to waiting-list pets of that same size category. This matching rule applies uniformly across all three size categories.
- FR-13b: Slot recommendations (FR-13) are suggestions only — the Admin must review and **approve** a recommendation before it becomes a confirmed appointment. The Admin may also reject the recommendation and **manually** book any waiting-list (or new) pet into that slot instead.
- FR-13a: The system shall support **quick/emergency services** (e.g., a nail trim) that require significantly less time than a full grooming session. These shall be schedulable in short slots (including slots not suited for a full groom) and shall be considered separately from size-based full-groom slot matching.

### 3.6 Pickup & Route Management
- FR-14: The system shall identify, for a given day, all pets flagged as needing pickup (FR-2) that have appointments that day.
- FR-15: When multiple pets need pickup on the same day, the system shall group them by geographic proximity (using pet location, FR-2) and generate a suggested **route** ordering the stops efficiently. The route is based purely on the pets' locations relative to each other — the shop's own location is not used as a fixed start/end point.
- FR-16: The system shall allow exporting/opening the generated route in **Waze** or **Google Maps**.

### 3.7 Notifications
- FR-17: The system shall provide a **"Send via WhatsApp"** action per pet/appointment (or set of upcoming appointments for the year) that composes a pre-written reminder message and opens/redirects to the owner's WhatsApp chat with the message pre-filled.
- FR-17a: The system shall **not** send WhatsApp messages automatically or programmatically. The Admin must review the pre-filled message and manually press send within WhatsApp; the system's role is limited to composing the message and opening the correct chat.

## 4. Non-Functional Requirements
- NFR-1: Calendar views (day/week/month/year) shall load and render quickly enough for interactive use by shop staff during business hours.
- NFR-2: Drag-and-drop rescheduling shall immediately re-validate shop constraints (daily capacity, blackout periods) and reject/warn on conflicts.
- NFR-3: WhatsApp notifications shall use WhatsApp's click-to-chat mechanism (e.g., `wa.me` link with a pre-filled message) rather than a messaging API — no automatic/backend sending is required.
- NFR-4: Route generation shall integrate with an external mapping/routing service capable of producing links openable in Waze and Google Maps.
- NFR-5: Pet and owner data (including addresses) is personal data and shall be protected accordingly (access limited to shop staff).

Core data entities and schema details are documented separately in `system_design.md`.
