export type DeliveryStatusExplanation = {
  label: string;
  detail: string;
  /** True when this status can never be retried by sending again. */
  blocking: boolean;
};

/**
 * Plain-language meaning of a dispatch status, so a couple or planner does
 * not have to guess what "suppressed" or "complained" means before deciding
 * whether to retry. Provider acceptance ("sent") is deliberately distinct
 * from confirmed delivery, since a provider can accept a message it later
 * fails to deliver.
 */
export function explainDeliveryStatus(status: string): DeliveryStatusExplanation {
  switch (status) {
    case "bounced":
      return {
        label: "Bounced",
        detail:
          "The receiving server rejected this address. Correct the email on this household before trying again.",
        blocking: true,
      };
    case "complained":
      return {
        label: "Marked as spam",
        detail:
          "This recipient reported the message as spam. Do not resend to this address; reach them another way if needed.",
        blocking: true,
      };
    case "suppressed":
      return {
        label: "Suppressed by provider",
        detail:
          "The email provider is refusing this address, usually from an unrelated bounce or complaint elsewhere. Contact this household by another channel.",
        blocking: true,
      };
    case "failed":
      return {
        label: "Send failed",
        detail:
          "The invitation was not accepted by the provider. This is usually temporary and safe to retry.",
        blocking: false,
      };
    default:
      return {
        label: status || "Unknown",
        detail: "This delivery needs a closer look before retrying.",
        blocking: true,
      };
  }
}
