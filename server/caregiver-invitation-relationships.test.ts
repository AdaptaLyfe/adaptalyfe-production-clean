import assert from "node:assert/strict";
import test from "node:test";

import { careRelationshipFromAcceptedInvitation } from "./caregiver-invitation-relationships";

test("accepted invitation maps the inviter to the care recipient and accepter to caregiver", () => {
  assert.deepEqual(
    careRelationshipFromAcceptedInvitation(
      { caregiverId: 17, relationship: "therapist" },
      42,
    ),
    {
      caregiverId: 42,
      userId: 17,
      relationship: "therapist",
      isPrimary: false,
      isActive: true,
      establishedVia: "invitation",
    },
  );
});