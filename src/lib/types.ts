export type Opening = "envelope" | "seal";
export type World =
  "riviera" | "maison" | "notte" | "heritage" | "modernist" | "garden";
export type Wedding = {
  id: string;
  owner_id: string;
  slug: string;
  names: string;
  date: string;
  location: string;
  timezone: string;
  world: World;
  opening: Opening;
  privacy: string;
  story: string;
  locale: string;
  status: string;
  rsvp_deadline: string;
  settings: Record<string, unknown>;
};
export type Guest = {
  id: string;
  wedding_id: string;
  household_id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  language: string;
  tags: string;
  status: "pending" | "attending" | "declined";
  meal: string;
  dietary: string;
  notes: string;
  is_plus_one: boolean;
  consent: boolean;
  table_name?: string;
  table_id?: string;
};
export type Event = {
  id: string;
  wedding_id: string;
  title: string;
  title_es: string;
  starts_at: string;
  ends_at: string;
  timezone: string;
  venue: string;
  address: string;
  description: string;
  dress_code: string;
  visibility: string;
  capacity: number;
  rsvp_required: boolean;
  household_ids?: string[];
};
export type Travel = {
  id: string;
  title: string;
  type: string;
  description: string;
  address: string;
  url: string;
  price: string;
};
export type Question = {
  id: string;
  label: string;
  label_es: string;
  type: string;
  scope: string;
  condition: string;
  options: string[];
  required: boolean;
};
export type Message = {
  id: string;
  subject: string;
  body: string;
  audience: string;
  channel: string;
  status: string;
  scheduled_at: string | null;
  created_at: string;
};
export type Table = { id: string; name: string; capacity: number };
export type Photo = {
  id: string;
  caption: string;
  approved: boolean;
  filename: string;
};
export type StudioData = {
  capabilities: {
    email: boolean;
    sms: boolean;
    billing: boolean;
    invitation: boolean;
  };
  wedding: Wedding;
  weddings: Wedding[];
  guests: Guest[];
  households: { id: string; name: string }[];
  events: Event[];
  questions: Question[];
  travel: Travel[];
  registry: { id: string; title: string; url: string }[];
  messages: Message[];
  tables: Table[];
  photos: Photo[];
  collaborators: { id: string; email: string; role: string }[];
  domains: { id: string; hostname: string; status: string }[];
  deliveries: { id: string; status: string }[];
  activity: { id: string; action: string; created_at: string }[];
  role: string;
  user: {
    name: string;
    email: string;
    is_demo: boolean;
    email_verified: boolean;
  };
};
export type GuestData = {
  updates: Pick<
    Message,
    "id" | "subject" | "body" | "created_at" | "scheduled_at"
  >[];
  wedding: Omit<Wedding, "owner_id">;
  guests: Guest[];
  events: Event[];
  questions: Question[];
  travel: Travel[];
  registry: { id: string; title: string; url: string }[];
  photos: Photo[];
  responses: {
    guest_id: string;
    event_id: string;
    attending: boolean;
    meal: string;
    dietary: string;
    answers: Record<string, string>;
  }[];
  household: string;
  token: string;
};
