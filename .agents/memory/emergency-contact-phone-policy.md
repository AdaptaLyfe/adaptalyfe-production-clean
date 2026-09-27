---
name: Emergency contact phone policy
description: Why trusted-contact phones use US format-only validation instead of number validity lookup.
---

Emergency contacts intentionally accept US-formatted numbers based on syntax alone, without checking whether the number is actually assigned. International numbers outside optional `+1` are not accepted for new or edited contacts.

**Why:** The requested US-format rule is meant to accept ten-digit input even when a telephone-number library considers that number unassigned. The earlier validity lookup rejected a format-matching value in Health Records.

**How to apply:** Keep contact entry and server acceptance consistent with this product policy. Do not reintroduce number-assignment checks or international formats without confirming that the validation requirements have changed.