import type { CaregiverInvitation, InsertCareRelationship } from "@shared/schema";

export function careRelationshipFromAcceptedInvitation(
  invitation: Pick<CaregiverInvitation, "caregiverId" | "relationship">,
  acceptedBy: number,
): InsertCareRelationship {
  return {
    caregiverId: acceptedBy,
    userId: invitation.caregiverId,
    relationship: invitation.relationship,
    isPrimary: false,
    isActive: true,
    establishedVia: "invitation",
  };
}