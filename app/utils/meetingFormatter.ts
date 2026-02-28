export function formatMeetingList(meetings: Array<{ start: string; title: string; meetLink?: string }>): string {
  if (!meetings.length) {
    return "You have no meetings scheduled for today.";
  }

  const lines = meetings.map((meeting, index) => {
    const when = meeting.start ? new Date(meeting.start).toLocaleString() : "Unknown time";
    const link = meeting.meetLink ? ` | Meet: ${meeting.meetLink}` : "";
    return `${index + 1}. ${meeting.title} at ${when}${link}`;
  });

  return `Today's meetings:\n${lines.join("\n")}`;
}
