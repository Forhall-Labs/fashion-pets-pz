# User Histories (HU) — Pet Grooming Shop Agenda System

This document defines the **Epics** (main HUs) and the **HUs** that implement
each Epic. Every HU follows the same structure:

- **As a / I want / So that**
- **Background** — shared setup (Given/And) for all scenarios in the HU
- **Scenarios** — written in Given/When/Then/And, each tagged with exactly
  one of:
  - `@positive` — happy path
  - `@negative` — valid input/action but a business rule prevents or alters the outcome
  - `@error` — unexpected/system-level failure (not caused by user input)
  - `@validation` — malformed/missing input rejected before business logic runs

Each HU is broken down into **many small, atomic scenarios** rather than a
few long ones — every scenario tests exactly one distinct behavior, field,
boundary condition, or failure mode (e.g., one scenario per missing field,
one per failure point in a multi-step process, one per boundary value).
This keeps each scenario easy to hand to a developer as a single,
unambiguous implementation or test case.

All HUs assume the actor is the **Admin** (see `requeriments.md`, Section 2 —
the Client has no direct system access).

---

## Epic 1 — Pet & Owner Record Management
*Covers requirements FR-1 to FR-4.*

**Epic goal:** As an Admin, I want to manage owner and pet records so that
all information needed for scheduling and grooming is available in one place.

### HU-1.1 — Create Owner Record
**As an** Admin
**I want to** create an owner record
**So that** I can associate pets and appointments with a client

**Background**
```
Given I am logged in as Admin
And I am on the "Owners" section
And the owners list currently shows N existing owners
```

**Scenarios**
```
@positive
Scenario: Create an owner with all fields filled in
  Given I enter a valid name, phone number, and home address
  When I click "Save"
  Then the owner is created and assigned a unique id
  And all three fields are stored exactly as entered

@positive
Scenario: Create an owner without an address
  Given I enter a valid name and phone number
  And I leave the address field blank
  When I click "Save"
  Then the owner is created successfully
  And the address field is stored as empty

@positive
Scenario: Create an owner with a fixed visit day set at creation time
  Given I enter a valid name, phone number, and address
  And I also select "Saturday" as the fixed visit day in the same form
  When I click "Save"
  Then the owner is created with "Saturday" already stored as the fixed visit day

@positive
Scenario: Newly created owner appears in the owners list
  Given I create a new owner with valid data
  When the save completes
  Then the owner appears in the owners list
  And the owners list count increases from N to N+1

@positive
Scenario: Create an owner whose name contains accented characters and apostrophes
  Given I enter the name "José O'Connor"
  And I enter a valid phone number
  When I click "Save"
  Then the owner is created with the name stored exactly as "José O'Connor"

@negative
Scenario: Duplicate name and phone number detected
  Given an owner with the same name and phone number already exists
  When I enter the same name and phone and click "Save"
  Then the system shows me the existing matching owner
  And asks whether I meant to open it instead of creating a new one
  And no second owner record is created yet

@negative
Scenario: Same phone number reused under a different name
  Given an owner "Maria Perez" already exists with phone "+1 555-0100"
  When I create a new owner "Carlos Perez" using the same phone "+1 555-0100"
  Then the system warns me the phone number is already in use by "Maria Perez"
  And asks whether this is a shared household phone or a mistake

@negative
Scenario: Confirm override after a duplicate-name warning
  Given the system has warned me about a duplicate name and phone
  When I confirm this is a different person and choose to save anyway
  Then a new, separate owner record is created

@negative
Scenario: Cancel after a duplicate-name warning
  Given the system has warned me about a duplicate name and phone
  When I choose to cancel instead of overriding
  Then no new owner record is created
  And the owners list count remains unchanged at N

@error
Scenario: Owner cannot be saved due to a system failure
  Given I enter valid owner data
  And the data store becomes temporarily unavailable
  When I click "Save"
  Then the system shows an error message
  And no partial owner record is persisted

@error
Scenario: Save request times out with an ambiguous result
  Given I click "Save" with valid owner data
  And the response times out before confirming success or failure
  When the timeout occurs
  Then the system re-checks whether the owner was actually created before letting me resubmit
  And it does not create a duplicate on retry

@error
Scenario: Save succeeds on the server but the confirmation is never received
  Given the owner record is actually persisted server-side
  And the success response is lost in transit back to me
  When I see no confirmation and try again
  Then the system detects the owner already exists before creating a second one

@validation
Scenario: Missing name
  Given I leave the "name" field empty
  When I click "Save"
  Then I see a validation message stating "name" is required
  And the owner is not saved

@validation
Scenario: Invalid phone number format
  Given I enter a phone number containing letters
  When I click "Save"
  Then I see a validation message stating the phone format is invalid
  And the owner is not saved

@validation
Scenario: Name exceeds the maximum allowed length
  Given I enter a name of 300 characters
  When I click "Save"
  Then I see a validation message stating the name is too long
  And the owner is not saved

@validation
Scenario: Phone number exceeds the maximum allowed length
  Given I enter a phone number with far more digits than any valid number
  When I click "Save"
  Then I see a validation message stating the phone number is too long
  And the owner is not saved

@validation
Scenario: Phone number below the minimum required digits
  Given I enter a phone number with only 3 digits
  When I click "Save"
  Then I see a validation message stating the phone number is too short
  And the owner is not saved
```

### HU-1.2 — Create Pet Record Linked to an Owner
**As an** Admin
**I want to** create a pet record linked to an owner
**So that** I can track each pet's grooming needs independently

**Background**
```
Given I am logged in as Admin
And an owner record already exists
And I am on that owner's "Pets" tab
And the owner currently has M pets on record
```

**Scenarios**
```
@positive
Scenario: Add a pet with all fields filled in
  Given I enter the pet's name, breed, size, and aggressiveness flag
  And I enter a location
  When I click "Save"
  Then the pet is created and linked to this owner's id

@positive
Scenario: Add a pet with location left blank
  Given I enter the pet's name, breed, and size
  And I leave the "location" field blank
  When I click "Save"
  Then the pet's location defaults to the owner's address

@positive
Scenario: Add a pet with a location different from the owner's address
  Given I enter the pet's name, breed, and size
  And I explicitly enter a location different from the owner's address
  When I click "Save"
  Then the pet is stored with its own distinct location, not the owner's

@positive
Scenario: Newly added pet appears in the owner's pet list
  Given I add a valid pet
  When the save completes
  Then the pet appears in the owner's pet list
  And the owner's pet count increases from M to M+1

@positive
Scenario: Add a second pet under an owner who already has one
  Given the owner already has one pet, "Rex"
  When I add a second pet, "Luna", with her own grooming frequency
  Then both pets are linked to the same owner
  And each pet's schedule is tracked independently

@negative
Scenario: Add a pet flagged as aggressive
  Given I set the "aggressive" flag to true
  When I click "Save"
  Then the system requires me to acknowledge a warning before the pet is saved
  And the pet's aggressive flag is stored as true

@negative
Scenario: Add a pet that needs pickup but has no location yet
  Given I set the "needs pickup" flag to true
  And I leave the location field blank and the owner also has no address
  When I click "Save"
  Then the pet is saved
  And it is flagged as "location missing" for pickup planning purposes

@negative
Scenario: Add a pet whose name duplicates another pet under the same owner
  Given the owner already has a pet named "Rex"
  When I add another pet also named "Rex"
  Then the system warns me a pet with that name already exists for this owner
  And still allows me to save if I confirm it's intentional

@error
Scenario: Pet record fails to save due to a system failure
  Given I enter valid pet data
  And the data store becomes temporarily unavailable
  When I click "Save"
  Then the system shows an error message
  And no partial pet record is persisted

@error
Scenario: Pet core data saves but the owner link fails
  Given the pet record itself is written successfully
  And the step that links it to the owner's id fails immediately after
  When this partial failure occurs
  Then the system does not show the pet as a success
  And it does not leave an orphaned, unlinked pet record visible to me

@error
Scenario: Pet saves but copying the owner's address as a default location fails
  Given I leave the pet's location blank, intending it to default to the owner's address
  And the step that copies the owner's address fails
  When this partial failure occurs
  Then the pet is saved
  And it is flagged as "location missing" rather than silently left blank

@validation
Scenario: Missing pet name
  Given I leave the "name" field empty
  When I click "Save"
  Then I see a validation message for "name" stating it is required
  And the pet is not saved

@validation
Scenario: Missing pet size
  Given I leave the "size" field unselected
  When I click "Save"
  Then I see a validation message for "size" stating it is required
  And the pet is not saved

@validation
Scenario: Missing pet breed
  Given I leave the "breed" field empty
  When I click "Save"
  Then I see a validation message for "breed" stating it is required
  And the pet is not saved

@validation
Scenario: Aggressiveness flag submitted in a non-boolean state
  Given a malformed request submits a non-boolean value for "aggressive"
  When the request is processed
  Then the system rejects the value
  And the pet is not saved

@validation
Scenario: Location submitted in an unparseable format
  Given I enter a location value that is not a valid address (e.g., random symbols)
  When I click "Save"
  Then I see a validation message stating the location is invalid
  And the pet is not saved
```

### HU-1.3 — Set Pet Grooming Frequency
**As an** Admin
**I want to** set how often a pet is groomed
**So that** the system can automatically generate future appointments

**Background**
```
Given I am logged in as Admin
And I am editing a pet's record
And the pet's current grooming frequency is "None set"
```

**Scenarios**
```
@positive
Scenario: Set the grooming frequency for the first time
  Given the pet has no frequency set
  When I select "Once a month" and click "Save"
  Then the pet record is updated with grooming frequency "Once a month"

@positive
Scenario: Change frequency when no future appointments exist
  Given the pet has no future appointments scheduled
  When I change the frequency from "Once a month" to "Twice a month"
  Then the system applies the change immediately with no conflict prompt

@positive
Scenario: Set the most frequent preset
  Given I open the "Grooming frequency" field
  When I select "Twice a month" and click "Save"
  Then the pet record is updated with grooming frequency "Twice a month"

@positive
Scenario: Set the least frequent preset
  Given I open the "Grooming frequency" field
  When I select "Once every two months" and click "Save"
  Then the pet record is updated with grooming frequency "Once every two months"

@negative
Scenario: Change frequency for a pet with existing future appointments
  Given the pet already has 3 auto-generated appointments in the future
  When I change the frequency to "Once every two months" and click "Save"
  Then the system asks whether to keep or regenerate the existing appointments
  And no appointment is changed until I confirm one of the two options

@negative
Scenario: Choose to keep existing appointments after a frequency change
  Given I am prompted to keep or regenerate existing future appointments
  When I choose "Keep existing appointments"
  Then the new frequency is saved
  And the 3 existing future appointments remain untouched

@negative
Scenario: Choose to regenerate appointments after a frequency change
  Given I am prompted to keep or regenerate existing future appointments
  When I choose "Regenerate appointments"
  Then the new frequency is saved
  And the 3 existing future appointments are replaced under the new frequency

@negative
Scenario: New frequency rarely aligns with the owner's fixed visit day
  Given Saturdays are frequently inside configured blackout periods
  And the owner's fixed visit day is "Saturday"
  When I set the pet's frequency to "Once a month" and save
  Then the system saves the frequency
  And warns me that upcoming suggested dates may often deviate from Saturday

@error
Scenario: Frequency update fails to save
  Given I select a new grooming frequency
  And the data store becomes temporarily unavailable
  When I click "Save"
  Then the system shows an error message
  And the pet record keeps its previous frequency value

@error
Scenario: Frequency saves but appointment regeneration fails
  Given the new frequency value saves successfully
  And I confirm "regenerate" for the existing future appointments
  And the regeneration step then fails
  When the failure occurs
  Then the system flags the pet's schedule as "needs regeneration retry"

@error
Scenario: Appointment regeneration fails partway through
  Given regeneration is replacing 3 existing appointments
  And the process fails after regenerating 1 of the 3
  When the failure occurs
  Then the pet is not left silently with a mix of old- and new-frequency appointments
  And the pet's schedule is flagged for manual review

@validation
Scenario: No frequency selected
  Given the "Grooming frequency" field is left unselected
  When I click "Save"
  Then I see a validation message stating a value must be chosen
  And the pet remains flagged as "incomplete" for scheduling

@validation
Scenario: Frequency value outside the allowed presets
  Given a malformed request submits a frequency value that isn't one of the defined presets
  When the request is processed
  Then the system rejects the value
  And the pet keeps its previous frequency value

@validation
Scenario: Frequency change submitted for a pet record that no longer exists
  Given the pet was deleted moments before I submit the change
  When I click "Save"
  Then the system detects the pet no longer exists
  And shows a "not found" message instead of applying the change
```

### HU-1.4 — Set Owner's Fixed Visit Day
**As an** Admin
**I want to** mark an owner's preferred/fixed visit day
**So that** the system can hint at that day when scheduling that owner's pets

**Background**
```
Given I am logged in as Admin
And I am editing an owner's record
And the owner has at least one pet with a grooming frequency set
```

**Scenarios**
```
@positive
Scenario: Set a fixed visit day for the first time
  Given the owner has no fixed visit day set
  When I select "Saturday" and click "Save"
  Then the owner's fixed visit day is stored as "Saturday"

@positive
Scenario: Update an already-set fixed day to a different day
  Given the owner's fixed visit day is currently "Saturday"
  When I change it to "Wednesday" and click "Save"
  Then the owner's fixed visit day is updated to "Wednesday"

@positive
Scenario: Clear a previously set fixed day
  Given the owner's fixed visit day is currently "Saturday"
  When I clear the field to "No preference" and click "Save"
  Then the owner's fixed visit day is stored as unset

@negative
Scenario: Fixed day conflicts with a blackout period
  Given the owner's fixed visit day is "Saturday"
  And all Saturdays next month are inside a blackout period
  When the system generates suggested appointments for next month
  Then it does not suggest a blacked-out Saturday
  And it suggests the nearest available day instead

@negative
Scenario: Owner-level fixed day does not override a pet's own frequency cadence
  Given the owner's fixed visit day is "Saturday"
  And the pet's frequency is "Once every two months"
  When the system calculates the pet's next suggested appointment
  Then it still uses the pet's own frequency to pick the cycle
  And only uses "Saturday" to pick the day within that cycle

@negative
Scenario: Fixed day set but a pet has no frequency yet
  Given the owner's fixed visit day is "Saturday"
  And one of the owner's pets has no grooming frequency set
  When auto-scheduling evaluates that pet
  Then no suggestion is generated for that pet until its frequency is set

@error
Scenario: Fixed day fails to save
  Given I select a fixed visit day
  And the data store becomes temporarily unavailable
  When I click "Save"
  Then the system shows an error message
  And the previous fixed visit day, if any, remains in effect

@error
Scenario: Fixed day saves but downstream suggestion recalculation fails
  Given the new fixed day saves successfully
  And the background recalculation of scheduling suggestions fails
  When this partial failure occurs
  Then the system flags the owner's pets as "suggestions out of date"

@error
Scenario: Concurrent edits to the same owner's fixed day
  Given two separate actions attempt to change the owner's fixed day at nearly the same time
  When both submissions are processed
  Then only one consistent final value is stored
  And no corrupted or partially-applied value results

@validation
Scenario: Invalid day value
  Given a malformed request submits a value outside the seven weekdays
  When the request is processed
  Then the system rejects the value
  And the owner record's other changes in the same submission are not saved either

@validation
Scenario: Non-day value submitted
  Given a request attempts to set the fixed visit day to "8" instead of a weekday name
  When the request is submitted
  Then the system rejects the value as the wrong type
  And the owner's previous fixed visit day remains unchanged

@validation
Scenario: Attempt to select multiple weekdays when only one is supported
  Given the fixed visit day field only accepts a single weekday
  When a request attempts to submit more than one weekday value
  Then the system rejects the request
  And shows a validation message stating only one day is supported
```

---

## Epic 2 — Calendar / Agenda
*Covers requirements FR-5 to FR-7.*

**Epic goal:** As an Admin, I want a calendar with multiple views and
drag-and-drop so I can see and manage appointments at a glance.

### HU-2.1 — View Calendar in Day / Week / Month / Year Modes
**As an** Admin
**I want to** switch the calendar between day, week, month, and year views
**So that** I can see the right level of detail for what I'm doing

**Background**
```
Given I am logged in as Admin
And there are existing appointments spread across the current month and year
And I am on the "Agenda" screen
```

**Scenarios**
```
@positive
Scenario: Drill down from year to month to day
  Given I am viewing "Year" mode
  When I click a specific month and then a specific day within it
  Then the view switches to "Day" mode for that date
  And shows every appointment for that day in chronological order

@positive
Scenario: Switch to week view and see all seven days
  Given I am viewing "Month" mode
  When I select "Week" view for the week containing today
  Then the calendar shows all seven days side by side, each with its own appointments

@positive
Scenario: Navigate to the next and previous month
  Given I am viewing "Month" mode for the current month
  When I click "Next" and then "Previous"
  Then the view correctly shows next month, then returns to the current month

@positive
Scenario: Navigate to the next and previous week
  Given I am viewing "Week" mode for the current week
  When I click "Next" and then "Previous"
  Then the view correctly shows next week, then returns to the current week

@positive
Scenario: Navigate to the next and previous year
  Given I am viewing "Year" mode for the current year
  When I click "Next" and then "Previous"
  Then the view correctly shows next year, then returns to the current year

@negative
Scenario: Empty month renders correctly
  Given the selected month has zero appointments
  When I open "Month" view for that month
  Then the grid renders with every day cell empty
  And I see a message indicating there are no appointments this month

@negative
Scenario: Year view with a single busy month
  Given only one month of the year has any appointments
  When I open "Year" view
  Then that month is shown as busy and all other months are shown as empty

@negative
Scenario: Day view for a day with zero appointments
  Given the selected day has no appointments
  When I open "Day" view for that date
  Then the view renders correctly with an empty appointment list

@negative
Scenario: Week view spanning a month boundary
  Given the selected week starts in one month and ends in the next
  When I open "Week" view for that week
  Then all seven days render correctly regardless of which month each falls in

@error
Scenario: Calendar data fails to load
  Given the appointments data source is temporarily unavailable
  When I open any calendar view
  Then the system shows an error message instead of a blank calendar
  And offers a "Retry" action

@error
Scenario: Data source responds slowly and returns only partial data
  Given the data source times out partway through returning data
  When I open "Month" view
  Then the system does not render the partial data as if it were complete

@error
Scenario: Retry after a failed load succeeds
  Given a previous attempt to load the calendar failed
  When I click "Retry" after the data source recovers
  Then the calendar loads normally and shows the expected appointments

@validation
Scenario: Out-of-range date navigation
  Given I attempt to navigate to year 9999
  When I confirm the navigation
  Then the system rejects it and I remain on the last valid date shown

@validation
Scenario: Malformed date typed directly into the navigation field
  Given I type "13/45/2026" into the date navigation field
  When I submit the navigation
  Then the system rejects the input as invalid

@validation
Scenario: Invalid view-mode parameter
  Given a request specifies a view mode outside day/week/month/year (e.g., via URL manipulation)
  When the request is processed
  Then the system rejects the unsupported mode and falls back to a valid default view
```

### HU-2.2 — View Appointment Details in One Click
**As an** Admin
**I want to** see the pet's name and time on the calendar, and open full details in one click
**So that** I can quickly scan the schedule and drill in when needed

**Background**
```
Given I am logged in as Admin
And I am viewing any calendar view with at least one appointment
And each appointment tile shows the pet's name and time
```

**Scenarios**
```
@positive
Scenario: Open details for a full-groom appointment
  Given an appointment tile for "Rex" at 10:00 is visible
  When I click the tile
  Then a details panel opens showing pet, owner, service type, duration, and status

@positive
Scenario: Open details for a quick-service appointment
  Given an appointment tile is marked "Quick service"
  When I click the tile
  Then the details panel clearly shows the service type as "Quick service" and its shorter duration

@positive
Scenario: Closing the details panel preserves my calendar position
  Given I have the details panel open after scrolling the calendar
  When I close the panel
  Then I return to the same view and scroll position I was at before

@positive
Scenario: Trigger edit directly from the details panel
  Given the details panel is open for an appointment
  When I click "Edit" within the panel
  Then the appointment edit form opens pre-filled with the current details

@negative
Scenario: Appointment was cancelled by another action just before opening it
  Given an appointment was cancelled moments ago
  And its calendar tile has not yet refreshed
  When I click the stale tile
  Then the system informs me the appointment is no longer active

@negative
Scenario: Appointment was moved by another action just before opening it
  Given an appointment was just moved to a different day via drag-and-drop
  And the tile I click still reflects the old slot
  When I click the stale tile
  Then the system shows the current, correct details rather than the stale ones

@negative
Scenario: Pet's aggressive flag was updated after the appointment was created
  Given the pet was marked aggressive after this appointment was booked
  When I open the appointment's details
  Then the panel reflects the pet's current aggressive flag, not the flag at booking time

@error
Scenario: Appointment details fail to load
  Given the appointment data source is temporarily unavailable
  When I click an appointment tile
  Then the system shows an error message within the details panel

@error
Scenario: Basic fields load but linked owner data fails
  Given the appointment's own fields load successfully
  And the linked owner data fetch fails
  When I view the details panel
  Then the owner section is clearly marked as failed to load

@error
Scenario: Basic fields load but pickup/location data fails
  Given the appointment's own fields load successfully
  And the pickup/location data fetch fails
  When I view the details panel
  Then the pickup section is clearly marked as failed to load

@validation
Scenario: Appointment id no longer exists
  Given a tile references an appointment id that was deleted
  When I click that tile
  Then the system shows a "not found" message instead of an empty panel

@validation
Scenario: Appointment references a deleted pet
  Given an appointment references a pet id that was deleted
  When I click that appointment's tile
  Then the system shows a message indicating the linked pet record is missing

@validation
Scenario: Appointment references a deleted owner
  Given an appointment references an owner id that was deleted
  When I click that appointment's tile
  Then the system shows a message indicating the linked owner record is missing
```

### HU-2.3 — Reschedule an Appointment via Drag-and-Drop
**As an** Admin
**I want to** drag an appointment to a new date/time on the calendar
**So that** I can quickly reschedule without opening a form

**Background**
```
Given I am logged in as Admin
And I am viewing the calendar with at least one scheduled appointment
And shop configuration (max pets/day, blackout periods) is set
```

**Scenarios**
```
@positive
Scenario: Drag an appointment to a different day with capacity available
  Given an appointment for "Rex" is on Monday at 10:00
  And Tuesday has fewer appointments than the daily maximum
  When I drag the appointment onto Tuesday at 11:00 and drop it
  Then the appointment moves to Tuesday at 11:00

@positive
Scenario: Drag an appointment within the same day to a different time
  Given an appointment for "Milo" is on Wednesday at 09:00
  And 14:00 that same day is open
  When I drag the appointment to 14:00 and drop it
  Then the appointment's time updates to 14:00 while staying on Wednesday

@positive
Scenario: Drag a quick-service appointment to a new short slot
  Given a "Quick service" appointment is on Monday at 09:00
  And a valid short slot is open on Tuesday
  When I drag it onto that Tuesday slot and drop it
  Then the appointment moves, keeping its quick-service duration

@positive
Scenario: Dragging a pickup-required appointment updates pickup planning
  Given "Rex" needs pickup and his appointment is on Monday
  When I drag it to a valid new day and drop it
  Then the pickup planning for the new day includes "Rex"

@positive
Scenario: Drag an appointment to the first available day after a blackout period ends
  Given a blackout period ends on Friday
  When I drag an appointment onto the following Monday, which has capacity
  Then the move succeeds

@negative
Scenario: Drop on a day already at max capacity
  Given Tuesday already has the maximum number of pets allowed
  When I drag an appointment onto Tuesday and drop it
  Then the system rejects the move and the tile reverts to its original slot

@negative
Scenario: Drop causes a time overlap for the same pet
  Given the pet already has another appointment later the same day
  When I drag an appointment for that pet onto an overlapping time and drop it
  Then the system rejects the move due to the conflicting appointment

@negative
Scenario: Drag to a time outside configured business hours
  Given the shop's business hours end at 18:00
  When I drag an appointment onto a 19:00 slot and drop it
  Then the system rejects the move as outside business hours

@negative
Scenario: Drop moves an appointment away from the owner's fixed visit day
  Given the owner's fixed visit day is "Saturday"
  When I drag their pet's appointment from Saturday onto a Tuesday and drop it
  Then the move succeeds
  And the appointment is shown with a note that it deviates from the owner's fixed day

@error
Scenario: Move fails to persist
  Given I drag an appointment to a valid new slot
  And the data store becomes temporarily unavailable at the moment of saving
  When the drop completes
  Then the system shows an error message and the tile reverts to its original slot

@error
Scenario: Move persists but pickup-route recalculation fails
  Given the appointment move itself is persisted successfully
  And the subsequent pickup-route update fails
  When this partial failure occurs
  Then the system flags the affected day's pickup route as "needs recalculation"

@error
Scenario: Move triggers a waiting-list re-evaluation that fails
  Given moving the appointment vacates its original slot
  And the waiting-list matching step for that vacated slot fails
  When this partial failure occurs
  Then the move itself remains successful
  And the vacated slot is flagged for manual waiting-list review

@validation
Scenario: Drop on a blacked-out day
  Given a date range is configured as a blackout period
  When I drag an appointment onto a date inside that period and drop it
  Then the system rejects the drop before any persistence attempt

@validation
Scenario: Drop outside the calendar's valid drop zones
  Given I start dragging an appointment tile
  When I release it outside any valid day/time cell
  Then the operation is cancelled and the tile reverts with no persistence attempt

@validation
Scenario: Appointment is cancelled by another action mid-drag
  Given I have started dragging an appointment tile
  And the appointment is cancelled by another action before I drop it
  When I complete the drop
  Then the system rejects the move since the appointment no longer exists

@validation
Scenario: Drop onto a date at the edge of the supported calendar range
  Given the calendar supports dates only up to year 9999
  When I drag an appointment onto a date beyond that range and drop it
  Then the system rejects the drop as out of range
```

---

## Epic 3 — Automatic Appointment Scheduling
*Covers requirements FR-8 and FR-9.*

**Epic goal:** As an Admin, I want the system to auto-generate future
appointments from each pet's grooming frequency, so I don't have to
schedule every recurring visit by hand.

### HU-3.1 — Auto-generate Future Appointments from Grooming Frequency
**As an** Admin
**I want to** have appointments generated automatically based on a pet's grooming frequency
**So that** recurring visits are scheduled without manual data entry

**Background**
```
Given I am logged in as Admin
And a pet has a grooming frequency and average service duration set
And shop configuration (max pets/day, blackout periods) is set
```

**Scenarios**
```
@positive
Scenario: Generate the next appointment for a single pet on schedule
  Given the pet's frequency is "Once a month" and its last appointment was on the 1st
  When the auto-scheduling process runs
  Then it creates a new appointment for approximately the 1st of next month

@positive
Scenario: Generate appointments for multiple pets under the same owner independently
  Given the owner has "Rex" (monthly) and "Luna" (every two months), both due
  When the auto-scheduling process runs
  Then it creates a separate appointment for each pet on its own due date

@positive
Scenario: Generated appointment respects the owner's fixed visit day
  Given the owner's fixed visit day is "Saturday"
  When the process calculates the pet's next due date
  Then it picks a Saturday within the due month, when available

@positive
Scenario: Generated appointment uses the pet's average service duration
  Given the pet's average service duration is 90 minutes
  When the process creates the next appointment
  Then the appointment's duration is set to 90 minutes

@negative
Scenario: Target date already at full daily capacity
  Given the calculated due date is already at the maximum pets/day
  When the process runs for this pet
  Then it searches forward for the nearest date with capacity

@negative
Scenario: Calculated due date falls inside a blackout period
  Given the due date is inside a configured blackout period
  When the process runs for this pet
  Then it searches forward past the end of the blackout period

@negative
Scenario: No available date found within a reasonable horizon
  Given every date within the search horizon is either full or blacked out
  When the process runs for this pet
  Then the pet is placed on the waiting list instead of being scheduled

@negative
Scenario: Two pets under the same owner are due the same day, only one slot left
  Given "Rex" and "Luna" are both due on the same day, which has one remaining slot
  When the process runs
  Then one pet is scheduled into the remaining slot and the other is placed on the waiting list

@negative
Scenario: A manual appointment already exists close to the calculated due date
  Given a manual appointment for the pet already exists 2 days after the calculated due date
  When the process runs for this pet
  Then it avoids creating a duplicate/near-duplicate appointment for the same cycle

@error
Scenario: Process fails partway through a multi-pet run
  Given multiple pets are due for auto-generated appointments
  And the process fails after creating appointments for some but not all
  When the failure occurs
  Then already-created appointments remain in place
  And the remaining pets are retried or flagged for manual review

@error
Scenario: Scheduled trigger fails to fire at all
  Given the process is configured to run nightly
  And the trigger fails to fire due to a system outage
  When the expected run time passes with no run recorded
  Then the system flags the missed run and offers a manual "Run now" action

@error
Scenario: Process creates the appointment but fails to update the pet's last-appointment reference
  Given the appointment is created successfully
  And the subsequent update to the pet's "last appointment date" fails
  When this partial failure occurs
  Then the next run does not recalculate the due date from stale data without flagging it

@validation
Scenario: Pet missing grooming frequency
  Given a pet has no grooming frequency set
  When the process evaluates that pet
  Then it skips the pet and flags its record as "incomplete for scheduling"

@validation
Scenario: Pet missing average service duration
  Given a pet has a frequency set but no average service duration
  When the process evaluates that pet
  Then it skips the pet and flags its record as "incomplete for scheduling"

@validation
Scenario: Pet's stored frequency value is unrecognized
  Given a pet's frequency field holds a value outside the recognized presets
  When the process evaluates that pet
  Then it skips the pet rather than guessing a date

@validation
Scenario: Pet was deleted between being queued and being processed
  Given a pet is queued for auto-scheduling
  And the pet record is deleted before the run reaches it
  When the run reaches that queued entry
  Then it skips the deleted pet without error
```

---

## Epic 4 — Scheduling Constraints & Configuration
*Covers requirements FR-10, FR-11, and FR-11a.*

**Epic goal:** As an Admin, I want to configure shop-wide scheduling rules
(vacations, daily capacity, business hours) so both manual and automatic
scheduling respect them.

### HU-4.1 — Configure Blackout Periods (Vacations)
**As an** Admin
**I want to** mark date ranges as blocked
**So that** no appointments are created during vacations

**Background**
```
Given I am logged in as Admin
And I am on the "Shop Configuration" section
And there are no overlapping blackout periods configured yet
```

**Scenarios**
```
@positive
Scenario: Add a new multi-day blackout period
  Given I enter a start date and a later end date
  When I click "Save"
  Then the date range is stored as a blackout period

@positive
Scenario: Add a single-day blackout period
  Given I enter the same date for both start and end
  When I click "Save"
  Then that single day is blocked for new appointments

@positive
Scenario: Add a blackout period far in the future
  Given I enter a date range for next year
  When I click "Save"
  Then the period is stored and will apply once that year's calendar is reached

@positive
Scenario: View existing blackout periods in configuration
  Given two blackout periods already exist
  When I open the "Shop Configuration" section
  Then both periods are listed with their date ranges

@negative
Scenario: Blackout period overlaps existing appointments
  Given 4 confirmed appointments fall inside the range I'm about to block
  When I enter that range and click "Save"
  Then the system warns me about the 4 conflicting appointments before finalizing

@negative
Scenario: New blackout period overlaps an existing blackout period
  Given a blackout period already exists from "2026-12-20" to "2026-12-31"
  When I try to add a new one from "2026-12-28" to "2027-01-05"
  Then the system warns me of the overlap and offers to merge or adjust

@negative
Scenario: Choose to reschedule conflicting appointments automatically
  Given the system has flagged 4 conflicting appointments
  When I choose "reschedule automatically"
  Then those 4 appointments are moved to the nearest available dates outside the blackout period

@negative
Scenario: Choose to cancel conflicting appointments
  Given the system has flagged 4 conflicting appointments
  When I choose "cancel"
  Then those 4 appointments are cancelled

@negative
Scenario: Choose to leave conflicting appointments as exceptions
  Given the system has flagged 4 conflicting appointments
  When I choose "leave as exceptions"
  Then those 4 appointments remain scheduled inside the now-blacked-out range, marked as exceptions

@error
Scenario: Blackout period fails to save
  Given I enter a valid date range
  And the data store becomes temporarily unavailable
  When I click "Save"
  Then the system shows an error message and the blackout period is not applied

@error
Scenario: Blackout period saves but the conflict-handling choice fails to apply
  Given the blackout period itself is persisted successfully
  And the chosen conflict-handling action then fails
  When this partial failure occurs
  Then the affected appointments are flagged as "needs manual rescheduling"

@error
Scenario: Blackout period saves but calendar views fail to refresh
  Given the blackout period is persisted successfully
  And the calendar view's refresh step fails
  When this partial failure occurs
  Then the system shows a message that the calendar may not reflect the change yet

@validation
Scenario: End date before start date
  Given I enter an end date earlier than the start date
  When I click "Save"
  Then I see a validation message and the blackout period is not saved

@validation
Scenario: Missing start date
  Given I fill in only the end date
  When I click "Save"
  Then I see a validation message for the missing start date

@validation
Scenario: Missing end date
  Given I fill in only the start date
  When I click "Save"
  Then I see a validation message for the missing end date

@validation
Scenario: Date range entirely in the past
  Given I enter a start and end date that are both before today
  When I click "Save"
  Then the system warns me the range is entirely in the past before allowing the save
```

### HU-4.2 — Configure Maximum Pets Per Day
**As an** Admin
**I want to** set the maximum number of pets the shop can handle per day
**So that** the calendar and auto-scheduling never overbook the shop

**Background**
```
Given I am logged in as Admin
And I am on the "Shop Configuration" section
And the current maximum pets per day is set to 8
```

**Scenarios**
```
@positive
Scenario: Increase the daily capacity
  Given I change the value from 8 to 10
  When I click "Save"
  Then the shop's daily capacity is updated to 10

@positive
Scenario: Decrease the daily capacity with no conflicts
  Given no day currently has more than 6 appointments
  When I change the value from 8 to 7 and click "Save"
  Then the new capacity of 7 is saved with no warning

@positive
Scenario: Save the same capacity value unchanged
  Given the current value is already 8
  When I click "Save" without changing it
  Then the save succeeds with no effective change to scheduling behavior

@positive
Scenario: Capacity change reflects immediately across calendar views
  Given I increase capacity from 8 to 10
  When I open the day, week, month, and year views
  Then all of them reflect the new limit of 10 immediately

@negative
Scenario: Lower capacity below a day's current bookings
  Given a specific day already has 9 confirmed appointments
  When I change the maximum to 7 and click "Save"
  Then the system warns me that day now exceeds the new capacity
  And does not auto-cancel any existing appointment

@negative
Scenario: Lower capacity affects pending waiting-list recommendations
  Given pending recommendations assumed the old capacity of 8
  When I lower the maximum to 5
  Then any pending recommendation that would now exceed capacity is flagged

@negative
Scenario: Lower capacity affects an in-progress auto-scheduling run
  Given the auto-scheduling process is currently running with the old capacity of 8
  When I change the capacity to 5 mid-run
  Then the remainder of the run uses the new capacity of 5, not the stale value of 8

@negative
Scenario: Raise capacity re-opens previously blocked days
  Given a day was blocked at the old capacity of 8
  When I raise the capacity to 10
  Then that day becomes available again for new appointments up to 10

@negative
Scenario: Lower capacity to exactly match the busiest existing day
  Given the busiest day currently has exactly 7 appointments
  When I lower the maximum to 7 and click "Save"
  Then the change saves with no over-capacity warning, since 7 does not exceed 7

@error
Scenario: Capacity change fails to save
  Given I enter a new capacity value
  And the data store becomes temporarily unavailable
  When I click "Save"
  Then the system shows an error message and the previous value remains in effect

@error
Scenario: Capacity saves but the re-validation scan of future days fails
  Given the new capacity saves successfully
  And the background scan for over-capacity days fails to run
  When this partial failure occurs
  Then the system flags that the scan did not complete and offers a manual re-scan

@error
Scenario: Capacity saves but waiting-list re-evaluation fails
  Given the new capacity saves successfully
  And the step that re-evaluates pending waiting-list recommendations against it fails
  When this partial failure occurs
  Then pending recommendations are flagged as "needs re-check"

@validation
Scenario: Zero value
  Given I enter "0" as the max pets per day
  When I click "Save"
  Then I see a validation message stating the value must be a positive integer

@validation
Scenario: Negative value
  Given I enter "-1" as the max pets per day
  When I click "Save"
  Then I see a validation message stating the value must be positive

@validation
Scenario: Non-numeric value
  Given I enter "abc" as the max pets per day
  When I click "Save"
  Then I see a validation message stating the value must be numeric

@validation
Scenario: Decimal value
  Given I enter "8.5" as the max pets per day
  When I click "Save"
  Then I see a validation message stating the value must be a whole number

@validation
Scenario: Value exceeding a sane upper bound
  Given I enter "100000" as the max pets per day
  When I click "Save"
  Then I see a validation message stating the value exceeds the allowed maximum
```

### HU-4.3 — Configure Business Hours
**As an** Admin
**I want to** set the shop's opening and closing time
**So that** appointments are only ever scheduled within hours the shop is actually open

**Background**
```
Given I am logged in as Admin
And I am on the "Shop Configuration" section
And the current business hours are 09:00–18:00
```

**Scenarios**
```
@positive
Scenario: Change the opening time
  Given I change the opening time from 09:00 to 08:00
  When I click "Save"
  Then the shop's opening time is updated to 08:00

@positive
Scenario: Change the closing time
  Given I change the closing time from 18:00 to 19:00
  When I click "Save"
  Then the shop's closing time is updated to 19:00

@positive
Scenario: Save the same business hours unchanged
  Given the current hours are already 09:00–18:00
  When I click "Save" without changing them
  Then the save succeeds with no effective change to scheduling behavior

@positive
Scenario: Business hours change reflects immediately across booking and drag-and-drop
  Given I extend the closing time from 18:00 to 20:00
  When I try to book or drag an appointment to 19:00 the same day
  Then the system now accepts 19:00 as a valid time, using the updated hours immediately

@negative
Scenario: Narrow closing time below an existing appointment's time
  Given an appointment is already scheduled at 17:30
  When I change the closing time to 17:00 and click "Save"
  Then the system warns me that appointment now falls outside business hours
  And it does not auto-cancel or move the existing appointment

@negative
Scenario: Narrow business hours affects an in-progress auto-scheduling run
  Given the auto-scheduling process is currently running with hours 09:00–18:00
  When I change the hours to 09:00–15:00 mid-run
  Then the remainder of the run uses the new closing time of 15:00, not the stale 18:00

@negative
Scenario: Widen business hours re-opens previously out-of-range slots
  Given 18:30 was previously outside business hours and unavailable for booking
  When I extend the closing time to 19:00
  Then 18:30 becomes available for new appointments

@negative
Scenario: Narrow closing time to exactly match the latest existing appointment's start time
  Given the latest appointment today starts at 17:00
  When I change the closing time to 17:00 and click "Save"
  Then the change saves with no warning, since 17:00 does not exceed the new closing time

@error
Scenario: Business hours change fails to save
  Given I change the opening or closing time
  And the data store becomes temporarily unavailable
  When I click "Save"
  Then the system shows an error message and the previous hours remain in effect

@error
Scenario: Hours save but the re-validation scan of existing appointments fails
  Given the new business hours save successfully
  And the background scan for now-out-of-range appointments fails to run
  When this partial failure occurs
  Then the system flags that the scan did not complete and offers a manual re-scan

@validation
Scenario: Closing time equal to opening time
  Given I set the opening time to 09:00 and the closing time to 09:00
  When I click "Save"
  Then I see a validation message stating the closing time must be after the opening time

@validation
Scenario: Closing time before opening time
  Given I set the opening time to 09:00 and the closing time to 08:00
  When I click "Save"
  Then I see a validation message stating the closing time must be after the opening time

@validation
Scenario: Missing opening or closing time
  Given I clear the closing time field, leaving it empty
  When I click "Save"
  Then I see a validation message stating both opening and closing time are required

@validation
Scenario: Malformed time value
  Given a request attempts to submit "25:00" as the closing time
  When the request is submitted
  Then the system rejects the value as not a valid time
  And the shop's previous business hours remain unchanged
```

---

## Epic 5 — Waiting List
*Covers requirements FR-12, FR-13, FR-13a, FR-13b.*

**Epic goal:** As an Admin, I want a waiting list with size-based
recommendations for freed-up slots, admin approval, and support for quick
services, so unscheduled pets get seen without manual searching.

### HU-5.1 — Add a Pet to the Waiting List
**As an** Admin
**I want to** place a pet on the waiting list
**So that** it is scheduled as soon as a matching slot is available

**Background**
```
Given I am logged in as Admin
And a pet record exists with a size category set
And the waiting list currently has K entries
```

**Scenarios**
```
@positive
Scenario: Add a pet with a preferred date range
  Given the pet has no confirmed appointment
  When I add it to the waiting list with a preferred date range
  Then the entry is created with that preferred range stored

@positive
Scenario: Add a pet with no preferred date range
  Given the pet has no confirmed appointment
  When I add it to the waiting list and leave the preferred range empty
  Then the entry is created with an open-ended preferred range

@positive
Scenario: New entry appears in the waiting list with the correct size
  Given I add a "Medium" pet to the waiting list
  When the entry is saved
  Then it appears in the waiting list showing size "Medium"
  And the waiting list count increases from K to K+1

@positive
Scenario: Add multiple different pets to the waiting list in sequence
  Given I add "Rex" to the waiting list
  When I then add "Luna" to the waiting list as well
  Then both entries exist independently
  And the waiting list count increases from K to K+2

@positive
Scenario: Pet's only appointment this year already took place
  Given the pet had a confirmed appointment last month that is now completed
  And the pet has no other appointment scheduled this year
  When I add it to the waiting list
  Then the entry is created successfully, since a completed appointment does not count as active

@positive
Scenario: Pet's prior appointment this year was cancelled
  Given the pet had an appointment this year that was cancelled
  And the pet has no other appointment scheduled this year
  When I add it to the waiting list
  Then the entry is created successfully, since a cancelled appointment does not count as active

@negative
Scenario: Pet already has an active appointment later this year
  Given the pet already has a confirmed appointment scheduled for later this year
  When I try to add it to the waiting list
  Then the system rejects the action
  And it explains the pet already has an active appointment this year and is not eligible for the waiting list
  And no waiting list entry is created

@negative
Scenario: Pet is already on the waiting list
  Given the pet is already an active waiting-list entry
  When I try to add it again
  Then the system offers to edit the existing entry instead of creating a duplicate

@negative
Scenario: Preferred date range suggested from the owner's fixed visit day
  Given the pet's owner has a fixed visit day of "Saturday"
  When I add the pet to the waiting list
  Then the system suggests a preferred date range aligned with upcoming Saturdays

@error
Scenario: Waiting list entry fails to save
  Given I click "Add to waiting list" for a valid pet
  And the data store becomes temporarily unavailable
  When I confirm
  Then the system shows an error message and the pet is not added

@error
Scenario: Entry saves but size-category indexing fails
  Given the entry itself saves successfully
  And the step that indexes it by size for matching fails
  When this partial failure occurs
  Then the entry is flagged as "not yet eligible for automatic matching"

@error
Scenario: Entry saves but the preferred-date-range validation cache fails to update
  Given the entry saves successfully with a preferred date range
  And an internal cache used to validate future matches fails to update
  When this partial failure occurs
  Then the entry is flagged for re-validation before it is used in matching

@validation
Scenario: Pet missing a size category
  Given the selected pet has no size set
  When I click "Add to waiting list"
  Then I see a validation message asking me to set the pet's size first

@validation
Scenario: Preferred end date before start date
  Given I enter a preferred date range with an end date earlier than the start date
  When I confirm
  Then I see a validation message and the entry is not saved

@validation
Scenario: Preferred date range entirely in the past
  Given I enter a preferred date range that is entirely before today
  When I confirm
  Then I see a validation message stating the range must include a future date

@validation
Scenario: Duplicate submission from a double click
  Given I click "Add to waiting list" and accidentally click it a second time before it responds
  When both submissions are processed
  Then only one waiting-list entry is created
```

### HU-5.2 — Recommend a Waiting-List Pet for a Vacated Slot
**As an** Admin
**I want to** get a size-matched recommendation when a slot opens up
**So that** I can quickly refill cancelled/moved appointments from the waiting list

**Background**
```
Given I am logged in as Admin
And the waiting list has pets of various sizes (Small, Medium, Extra Large)
And an appointment slot was just vacated
```

**Scenarios**
```
@positive
Scenario: Recommend a same-size pet, single candidate
  Given the vacated slot was previously held by a "Medium" pet
  And exactly one "Medium" pet is on the waiting list
  When the system evaluates the waiting list
  Then it recommends that "Medium" pet for the slot

@positive
Scenario: Multiple same-size candidates are ranked by wait time
  Given three "Small" pets are on the waiting list, added on different dates
  When a "Small" slot becomes vacant
  Then the pet waiting longest is ranked as the top recommendation

@positive
Scenario: Recommendation triggered by a cancellation
  Given an appointment is cancelled
  When the cancellation completes
  Then the system evaluates the waiting list for that newly vacated slot

@positive
Scenario: Recommendation triggered by a drag-and-drop move
  Given an appointment is moved to a different day, vacating its original slot
  When the move completes
  Then the system evaluates the waiting list for the vacated original slot

@negative
Scenario: No matching pet on the waiting list
  Given no "Extra Large" pet is on the waiting list
  And the vacated slot was previously held by an "Extra Large" pet
  When the system evaluates the waiting list
  Then no recommendation is shown and the slot is marked "open, no match"

@negative
Scenario: Candidate excluded because its preferred date range doesn't include the slot's date
  Given a "Medium" pet's preferred range ends before the vacated slot's date
  When the system evaluates the waiting list
  Then that pet is excluded from the recommendation

@negative
Scenario: Candidate excluded because it already has a different confirmed appointment
  Given a "Medium" waiting-list pet already has a confirmed appointment elsewhere
  When the system evaluates the waiting list
  Then that pet is excluded from the recommendation

@negative
Scenario: No cross-size match offered when a different size is available
  Given a "Small" slot is vacated
  And no "Small" pet is waiting, but a "Medium" pet is
  When the system evaluates the waiting list
  Then it does not recommend the "Medium" pet for the "Small" slot

@negative
Scenario: Two vacated slots at once are evaluated independently
  Given two separate cancellations vacate a "Small" slot and a "Medium" slot on the same day
  When the system evaluates the waiting list
  Then each slot receives its own independent, correctly-sized recommendation

@error
Scenario: Waiting list data source unavailable
  Given a slot was vacated
  And the waiting list data source is temporarily unavailable
  When the system tries to generate a recommendation
  Then it shows an error and the slot remains open and unaffected

@error
Scenario: Ranking step fails after candidates are found
  Given multiple "Small" candidates are correctly identified
  And the ranking step fails
  When this failure occurs
  Then the system falls back to an unranked list, clearly labeled as unranked

@error
Scenario: Size-category data partially fails to load during matching
  Given the waiting list has entries across all three sizes
  And the "Extra Large" category data fails to load while "Small" and "Medium" load fine
  When the system evaluates a vacated "Extra Large" slot
  Then it shows an error scoped to the "Extra Large" category rather than a generic failure

@validation
Scenario: Vacated slot has no recorded size context
  Given the vacated appointment's original pet size is missing from historical data
  When the system tries to generate a recommendation
  Then it skips automatic recommendation and flags the slot for manual review

@validation
Scenario: Waiting-list entry has an invalid size value
  Given a waiting-list entry's size field holds an unrecognized value
  When the system evaluates the waiting list
  Then it excludes that entry from automatic matching and flags it for correction

@validation
Scenario: Vacated slot's date is corrupted
  Given the vacated slot's stored date is invalid/corrupted data
  When the system tries to generate a recommendation
  Then it skips automatic recommendation and flags the slot for manual review
```

### HU-5.3 — Approve, Reject, or Manually Book a Slot Recommendation
**As an** Admin
**I want to** approve a recommendation, reject it, or manually assign a different pet
**So that** I retain final control over every appointment booking

**Background**
```
Given I am logged in as Admin
And the system has shown a recommended pet for a vacated slot
And the recommended pet is currently on the waiting list
```

**Scenarios**
```
@positive
Scenario: Approve the top recommendation
  Given the system recommends "Rex" for the open slot
  When I click "Approve"
  Then "Rex" is booked into that slot and removed from the waiting list

@positive
Scenario: Approve an alternate candidate instead of the top one
  Given "Rex" is the top recommendation and "Bella" is shown as an alternate
  When I select "Bella" and click "Approve"
  Then "Bella" is booked and "Rex" remains on the waiting list

@positive
Scenario: Approved booking appears on the calendar
  Given I approve a recommendation for "Rex" for Friday at 09:00
  When the approval completes
  Then the calendar shows "Rex"'s new confirmed appointment on Friday at 09:00

@positive
Scenario: Approve a recommendation when only one candidate exists
  Given only one waiting-list pet matches the vacated slot's size
  When I click "Approve"
  Then that single candidate is booked with no alternates to choose from

@negative
Scenario: Reject and manually book a different waiting-list pet
  Given the system recommends "Rex"
  When I reject the recommendation and manually book "Luna" from the waiting list instead
  Then "Luna" is booked and "Rex" remains on the waiting list

@negative
Scenario: Reject and leave the slot open
  Given the system recommends "Rex"
  When I reject the recommendation and choose "Leave slot open"
  Then the slot remains unbooked and "Rex" remains on the waiting list

@negative
Scenario: Reject and manually book a pet not currently on the waiting list
  Given the system recommends "Rex"
  When I reject the recommendation and manually book a different, non-waiting-list pet
  Then that pet is booked into the slot directly

@negative
Scenario: Manually book a pet whose size doesn't match, confirm anyway
  Given I manually select a pet whose size doesn't match the vacated slot
  When I confirm the size-mismatch warning
  Then the booking proceeds and is flagged as a size-mismatch exception

@negative
Scenario: Manually book a pet whose size doesn't match, cancel instead
  Given I manually select a pet whose size doesn't match the vacated slot
  When I cancel at the size-mismatch warning
  Then the slot remains open and unbooked

@error
Scenario: Approval fails to persist
  Given I click "Approve" on a recommendation
  And the data store becomes temporarily unavailable
  When the request is submitted
  Then the system shows an error and the slot remains open, not double-booked

@error
Scenario: Appointment books successfully but waiting-list removal fails
  Given the approval creates the appointment successfully
  And the step to remove the pet from the waiting list fails
  When this partial failure occurs
  Then the waiting-list entry is flagged as "stale, needs cleanup"

@error
Scenario: Manual booking fails to persist
  Given I choose to manually book a pet into the slot
  And the data store becomes temporarily unavailable
  When I confirm the booking
  Then the system shows an error and the slot remains unbooked

@validation
Scenario: Size mismatch warning on manual booking
  Given I manually select a pet whose size doesn't match the vacated slot
  When I try to confirm
  Then I see a warning requiring explicit confirmation before proceeding

@validation
Scenario: Approve a recommendation for a pet no longer on the waiting list
  Given the recommended pet was removed from the waiting list moments ago by another action
  When I click "Approve"
  Then the system rejects the approval and explains the pet is no longer eligible

@validation
Scenario: Approve a recommendation for a slot already booked by another action
  Given the vacated slot was already filled by another action moments ago
  When I click "Approve" on the now-stale recommendation
  Then the system rejects the approval and shows that the slot is no longer available
```

### HU-5.4 — Schedule a Quick/Emergency Service
**As an** Admin
**I want to** book short services (e.g., a nail trim) into short slots
**So that** urgent, low-duration requests don't need a full grooming slot

**Background**
```
Given I am logged in as Admin
And I am creating or editing an appointment
And the shop's daily capacity and blackout periods are configured
```

**Scenarios**
```
@positive
Scenario: Book a quick service in a short slot
  Given a pet needs a nail trim
  When I select service type "Quick service" and a short open slot, then confirm
  Then the appointment is created with the quick-service duration

@positive
Scenario: Book a quick service for a pet that also has a separate full-groom appointment later
  Given the pet has a full-groom appointment scheduled for next month
  When I book a "Quick service" appointment for the same pet this week, non-overlapping
  Then both appointments are created and coexist independently

@positive
Scenario: Quick service counts toward daily capacity but not size-matching
  Given the day has 7 of 8 slots used by full-groom appointments
  When I book a quick service as the 8th appointment that day
  Then the day is now at capacity
  And the quick service was not evaluated against size-based slot matching

@positive
Scenario: Book a quick service on the same day as the pet's regular appointment
  Given the pet has a full-groom appointment at 10:00 today
  When I book a "Quick service" appointment for the same pet at 15:00 today
  Then both appointments are created without conflict

@negative
Scenario: Attempt to book a quick service into a fully-booked day
  Given the day is already at the maximum number of pets allowed
  When I try to book a quick service on that day
  Then the system rejects the booking regardless of the short duration

@negative
Scenario: Quick service time slot overlaps another appointment
  Given a full-groom appointment occupies 10:00–11:00
  When I try to book a quick service at 10:30 the same day
  Then the system rejects the booking due to the time overlap

@negative
Scenario: Attempt to book a quick service inside a blackout period
  Given the selected date falls inside a configured blackout period
  When I try to confirm the booking
  Then the system rejects the booking

@negative
Scenario: Book a quick service for a pet flagged aggressive
  Given the pet is flagged as aggressive
  When I book a "Quick service" appointment for it
  Then the booking proceeds
  And the appointment shows the aggressive-pet handling note

@error
Scenario: Quick service booking fails to save
  Given I select a valid service type and slot
  And the data store becomes temporarily unavailable
  When I click "Confirm booking"
  Then the system shows an error and the slot remains unbooked

@error
Scenario: Booking saves but the calendar view fails to refresh
  Given the appointment is persisted successfully
  And the calendar view's refresh step fails
  When this partial failure occurs
  Then the system offers a manual "Refresh" action

@error
Scenario: Booking saves but the day's capacity counter fails to increment
  Given the appointment is persisted successfully
  And the internal capacity counter update fails
  When this partial failure occurs
  Then the system flags the day's capacity count as "needs recount"

@validation
Scenario: No service type selected
  Given I leave the "service type" field unselected
  When I click "Confirm booking"
  Then I see a validation message stating a service type is required

@validation
Scenario: Quick-service duration missing from configuration
  Given the shop's quick-service duration has not been configured
  When I try to select service type "Quick service"
  Then I see a message asking me to configure the duration first

@validation
Scenario: Selected slot shorter than the configured quick-service duration
  Given the configured quick-service duration is 20 minutes
  And the selected open slot is only 10 minutes long
  When I try to confirm the booking
  Then the system rejects the slot as too short
```

---

## Epic 6 — Pickup & Route Management
*Covers requirements FR-14 to FR-16.*

**Epic goal:** As an Admin, I want the system to identify pets needing
pickup and suggest an efficient route, so I can plan pickups without manually
mapping addresses.

### HU-6.1 — Identify Pets Needing Pickup for a Given Day
**As an** Admin
**I want to** see which of the day's appointments need pet pickup
**So that** I know which owners I need to visit before their appointment

**Background**
```
Given I am logged in as Admin
And appointments exist for a selected day
And some appointments are for pets flagged "needs pickup" and some are not
```

**Scenarios**
```
@positive
Scenario: List pets needing pickup for today
  Given 3 of today's 8 appointments are flagged "needs pickup"
  When I open the "Pickups" view for today
  Then I see exactly those 3 pets, each with owner, location, and appointment time

@positive
Scenario: View pickups for a future day
  Given a day one week from now has 2 appointments flagged "needs pickup"
  When I navigate the "Pickups" view to that future date
  Then I see those 2 pets with the same level of detail as today's view

@positive
Scenario: Each pickup entry links back to its appointment details
  Given the "Pickups" view is showing today's flagged pets
  When I click one of the entries
  Then it opens that pet's full appointment details

@negative
Scenario: No pets need pickup that day
  Given none of today's appointments are flagged "needs pickup"
  When I open the "Pickups" view for today
  Then I see a message indicating there are no pickups scheduled today

@negative
Scenario: All of today's appointments need pickup
  Given all 8 of today's appointments are flagged "needs pickup"
  When I open the "Pickups" view for today
  Then all 8 pets are listed with no entries hidden

@negative
Scenario: Only one pet needs pickup that day
  Given only 1 of today's appointments is flagged "needs pickup"
  When I open the "Pickups" view for today
  Then that single pet is listed

@negative
Scenario: A pet needing pickup is on the waiting list, not yet confirmed today
  Given a pet is flagged "needs pickup" but only has a waiting-list entry, no confirmed appointment today
  When I open the "Pickups" view for today
  Then that pet is excluded, since it has no confirmed appointment today

@error
Scenario: Appointments data source unavailable
  Given the appointments data source is temporarily unavailable
  When I open the "Pickups" view
  Then the system shows an error message and offers a "Retry" action

@error
Scenario: Pickup-flag data source fails independently
  Given appointments data loads successfully but the "needs pickup" flag data fails separately
  When I open the "Pickups" view
  Then the system shows an error specific to the pickup-flag data

@validation
Scenario: Pet flagged for pickup has no location on record
  Given a pet is flagged "needs pickup" but has no stored location
  When I open the "Pickups" view for that day
  Then the pet is listed and flagged "location missing"

@validation
Scenario: Pet flagged for pickup but its appointment was cancelled
  Given a pet was flagged "needs pickup" for today, but its appointment was just cancelled
  When I open the "Pickups" view for today
  Then that pet is excluded from the list

@validation
Scenario: Pet flagged for pickup with a corrupted appointment date/time
  Given a pickup-flagged pet's appointment record has a corrupted date/time field
  When I open the "Pickups" view for that day
  Then the pet is flagged as having invalid appointment data rather than silently shown or hidden
```

### HU-6.2 — Generate a Pickup Route by Proximity
**As an** Admin
**I want to** get pets needing pickup grouped and ordered by location
**So that** I can collect them efficiently without planning the route myself

**Background**
```
Given I am logged in as Admin
And I am viewing the list of pets needing pickup for a selected day
And each of those pets has a valid location on record
```

**Scenarios**
```
@positive
Scenario: Generate a route for pets in the same area
  Given two pets are located Downtown and a third is nearby
  When I click "Generate pickup route"
  Then the stops are ordered by proximity, without using the shop's location as start/end

@positive
Scenario: Generate a route for pets spread across distinct areas
  Given pets are located in three distinct, non-overlapping neighborhoods
  When I click "Generate pickup route"
  Then stops within the same neighborhood are grouped together in the order

@positive
Scenario: Regenerate a route after the underlying pickup list changes
  Given a route was previously generated
  And a new pickup-flagged appointment is added for that day
  When I click "Generate pickup route" again
  Then the new route includes the newly added stop

@negative
Scenario: Only one pet needs pickup
  Given only a single pet needs pickup today
  When I click "Generate pickup route"
  Then that single stop is shown directly, with no ordering step needed

@negative
Scenario: Two pets share the exact same address
  Given two pets from different owners share the exact same pickup address
  When I click "Generate pickup route"
  Then both pet names are listed together as a single combined stop

@negative
Scenario: Zero pets need pickup that day
  Given no appointments today are flagged "needs pickup"
  When I view the "Pickups" screen for today
  Then the "Generate pickup route" action is not offered

@error
Scenario: Routing service unavailable
  Given the routing/geocoding service is temporarily unavailable
  When I click "Generate pickup route"
  Then the system shows an error and keeps the unordered pickup list as a fallback

@error
Scenario: Routing service returns a partial result
  Given the routing service returns ordering for only some of the stops
  When I click "Generate pickup route"
  Then the system shows an error rather than presenting the partial order as complete

@error
Scenario: Routing service returns malformed coordinate data
  Given the routing service responds with corrupted/invalid coordinate data
  When I click "Generate pickup route"
  Then the system detects the malformed data and shows an error instead of a broken route

@validation
Scenario: One pet has an invalid address
  Given one pet's stored location cannot be geocoded
  When I click "Generate pickup route"
  Then that pet is excluded and flagged, while a valid route is generated for the rest

@validation
Scenario: All pets have invalid addresses
  Given every pet needing pickup today has an invalid address
  When I click "Generate pickup route"
  Then the system shows a message that no valid addresses are available

@validation
Scenario: A pet's address is outside the routing service's supported region
  Given one pet's address is valid but outside the areas the routing service supports
  When I click "Generate pickup route"
  Then that pet is excluded and flagged as "unsupported region"
```

### HU-6.3 — Open the Generated Route in Waze or Google Maps
**As an** Admin
**I want to** open the suggested pickup route in Waze or Google Maps
**So that** I can navigate to each stop using an app I already use for driving

**Background**
```
Given I am logged in as Admin
And a pickup route has been generated for today
```

**Scenarios**
```
@positive
Scenario: Open route in Google Maps
  Given the route has 3 ordered stops
  When I click "Open in Google Maps"
  Then Google Maps opens with the 3 stops as waypoints in the generated order

@positive
Scenario: Open route in Waze
  Given the route has 3 ordered stops
  When I click "Open in Waze"
  Then Waze opens with the 3 stops in the generated order

@positive
Scenario: Open the same route in both apps for comparison
  Given the route has 3 ordered stops
  When I click "Open in Waze" and then "Open in Google Maps"
  Then both apps open successfully with the same stops in the same order

@negative
Scenario: Open a single-stop route in Waze
  Given the route has only one stop
  When I click "Open in Waze"
  Then Waze opens with turn-by-turn directions to that single destination

@negative
Scenario: Open a single-stop route in Google Maps
  Given the route has only one stop
  When I click "Open in Google Maps"
  Then Google Maps opens with directions to that single destination

@negative
Scenario: Target app not installed falls back to web
  Given the Waze app is not installed on the current device
  When I click "Open in Waze"
  Then the system falls back to a web-based option instead of a broken link

@error
Scenario: Map link fails to generate
  Given the link-generation step fails unexpectedly
  When I click "Open in Waze" or "Open in Google Maps"
  Then the system shows an error rather than opening a broken link

@error
Scenario: Link generates but the app/browser fails to open it
  Given a valid link is generated
  And the device fails to launch any app or browser to handle it
  When I click "Open in Google Maps"
  Then the system offers to copy the link so I can open it manually

@error
Scenario: Link opens with an incomplete waypoint list
  Given a generation glitch drops one stop from the link
  When I click "Open in Google Maps"
  Then the system detects the mismatch and shows an error instead of opening an incomplete route

@validation
Scenario: Route has zero valid stops
  Given all pets in today's route were excluded due to invalid addresses
  When I try to open the route
  Then the "Open in Waze" / "Open in Google Maps" actions are disabled

@validation
Scenario: Route data is stale
  Given the pickup list has changed since the route was generated
  When I click "Open in Waze" or "Open in Google Maps"
  Then the system prompts me to regenerate the route before opening it
```

---

## Epic 7 — WhatsApp Notifications
*Covers requirements FR-17 and FR-17a.*

**Epic goal:** As an Admin, I want a one-click way to prepare and open a
WhatsApp reminder for an owner, while keeping the actual send under my
control.

### HU-7.1 — Send an Appointment Reminder via WhatsApp
**As an** Admin
**I want to** click "Send via WhatsApp" to open a pre-filled chat with an owner
**So that** I can quickly remind them of upcoming appointments while still choosing when to actually send it

**Background**
```
Given I am logged in as Admin
And I am viewing a pet or owner with at least one upcoming appointment
And the owner has a phone number on record
```

**Scenarios**
```
@positive
Scenario: Open a pre-filled chat for one full-groom appointment
  Given "Rex" has an appointment next Tuesday at 10:00
  When I click "Send via WhatsApp" on that appointment
  Then a WhatsApp chat opens with the message pre-filled and nothing sent automatically

@positive
Scenario: Open a pre-filled chat for a quick-service appointment
  Given "Milo" has a "Quick service" appointment tomorrow at 15:00
  When I click "Send via WhatsApp" on that appointment
  Then the composed message reflects the quick-service nature of the visit

@positive
Scenario: Open a pre-filled chat for all upcoming appointments
  Given the owner has 5 upcoming appointments across the year
  When I click "Send via WhatsApp" and choose "all upcoming appointments"
  Then a single chat opens with all 5 appointments listed in the message

@positive
Scenario: Message correctly includes pet name, date, and time
  Given "Rex" has an appointment on "2026-09-10" at "10:00"
  When I click "Send via WhatsApp" on that appointment
  Then the composed message includes "Rex", "2026-09-10", and "10:00"

@negative
Scenario: Owner has multiple pets with mixed appointment types
  Given the owner has both a full-groom appointment for "Rex" and a quick-service appointment for "Milo"
  When I click "Send via WhatsApp" for "all upcoming appointments"
  Then the combined message correctly lists both, with each appointment's type noted

@negative
Scenario: Owner has zero upcoming appointments left
  Given all of the owner's appointments are now in the past or cancelled
  When I click "Send via WhatsApp" for "all upcoming appointments"
  Then the system shows a message that there are no upcoming appointments, and no chat opens

@negative
Scenario: Owner has exactly one upcoming appointment when "all" is selected
  Given the owner has only 1 upcoming appointment
  When I click "Send via WhatsApp" and choose "all upcoming appointments"
  Then the message is composed for that single appointment, same as the single-appointment flow

@error
Scenario: WhatsApp link fails to open
  Given the click-to-chat link fails to generate or open
  When I click "Send via WhatsApp"
  Then the system shows an error and offers to copy the message text as a fallback

@error
Scenario: Message composition fails due to a missing appointment field
  Given the appointment's time field was not saved correctly
  When I click "Send via WhatsApp"
  Then the system shows an error naming the missing detail rather than sending an incomplete message

@error
Scenario: Click-to-chat opens with a truncated message
  Given the combined message for "all upcoming appointments" exceeds the platform's character limit
  When I click "Send via WhatsApp"
  Then the system shortens or paginates the message rather than silently truncating it mid-sentence

@validation
Scenario: Owner has no phone number on record
  Given the owner's phone number field is empty
  When I click "Send via WhatsApp"
  Then I see a validation message asking me to add a valid phone number first

@validation
Scenario: Owner's phone number is in an invalid format
  Given the owner's phone number contains letters
  When I click "Send via WhatsApp"
  Then I see a validation message stating the number format is invalid

@validation
Scenario: Phone number missing a country code
  Given the owner's phone number is stored without a country code
  When I click "Send via WhatsApp"
  Then I see a validation message asking me to add the country code
```
