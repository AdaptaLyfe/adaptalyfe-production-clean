# Calendar parity review

## React source reviewed

The React Calendar page uses:

- `GET /api/daily-tasks`
- `GET /api/bills`
- `GET /api/appointments`
- `GET /api/mood-entries`
- `GET /api/calendar-events`
- `POST /api/calendar-events` for Add Event

The React mobile layout presents one Calendar surface with:

- Calendar title
- Today and Add Event actions
- Previous/next date navigation
- Month, Week, and Day controls
- Color-coded tasks, bills, appointments, events, and mood check-ins
- Pull/automatic data loading and empty states

## Flutter changes

Flutter now loads the same five collections through the Calendar API and BLoC.
The Calendar grid includes all five React data types and keeps the existing
appointment/event mutations and refresh behavior.

The page no longer exposes a separate appointments tab. Its primary layout now
matches the React page: title/actions, date controls, view switcher, calendar
grid/list, legend, and empty state.

The existing GoRouter route and shared navigation shell were already correct and
were not changed.

## Files changed

- `mobile_flutter/lib/features/calendar/bloc/calendar_bloc.dart`
- `mobile_flutter/lib/features/calendar/bloc/calendar_state.dart`
- `mobile_flutter/lib/features/calendar/data/calendar_api.dart`
- `mobile_flutter/lib/features/calendar/data/calendar_repository.dart`
- `mobile_flutter/lib/features/calendar/presentation/calendar_screen.dart`

## Verification

- `git diff --check` passed.
- `npm run build` passed.
- Flutter analyzer and device/emulator execution were unavailable in this
  workspace, so native runtime verification remains outstanding.