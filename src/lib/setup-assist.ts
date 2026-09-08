export function suggestedDeadline(date: string, weeks = 6) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return "";
  const value = new Date(date + "T12:00:00Z");
  if (Number.isNaN(value.getTime())) return "";
  value.setUTCDate(value.getUTCDate() - weeks * 7);
  return value.toISOString().slice(0, 10);
}

export const setupEncouragement = [
  {
    title: "Set the feeling",
    hint: "Choose the world that feels closest. You can fine-tune fonts, colours and wording later.",
    reward: "Your wedding has its own point of view.",
  },
  {
    title: "Make it official",
    hint: "Names, date and place are enough to begin. Use the timezone search and RSVP date shortcuts below.",
    reward: "The essentials are in place. A real day to look forward to.",
  },
  {
    title: "Build the day",
    hint: "Start with one gathering. Add the rest whenever you’re ready. Private events stay limited to the households you choose.",
    reward: "Your guests have a plan to look forward to.",
  },
  {
    title: "Bring your people",
    hint: "Add one household or import your spreadsheet. Review the preview before importing; you can come back for the rest.",
    reward: "Your celebration now has its people.",
  },
  {
    title: "See the magic",
    hint: "Open one household’s invitation and walk through it as a guest. Nothing in the preview changes their replies.",
    reward: "Every chapter reviewed. Your invitation is ready for its moment.",
  },
];
