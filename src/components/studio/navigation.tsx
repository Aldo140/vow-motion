"use client";
import {
  EventsManager,
  GuestManager,
  RsvpManager,
} from "@/components/studio-guests";
import {
  FeedbackManager,
  RequestsManager,
  SetupManager,
} from "@/components/studio-pilot";
import {
  CollaboratorsManager,
  ExperienceManager,
  GuestQuestions,
  MessagesManager,
  PhotosManager,
  SeatingManager,
  SettingsManager,
  TravelManager,
} from "@/components/studio-tools";
import { Insights } from "@/components/studio/insights";
import { Invitations } from "@/components/studio/invitations";
import { Overview } from "@/components/studio/overview";
import type { PanelProps } from "@/components/studio/shared";
import {
  ArmchairIcon,
  CalendarBlankIcon,
  ChartBarIcon,
  ChatCircleTextIcon,
  CheckSquareIcon,
  EnvelopeSimpleIcon,
  GearSixIcon,
  HouseIcon,
  ImagesIcon,
  MapTrifoldIcon,
  SwatchesIcon,
  UserPlusIcon,
  UsersIcon,
} from "@phosphor-icons/react";
// The design and the answers guests look for belong to the same page: the
// invitation is what guests hold, and the answers live inside it.
function ExperiencePage(props: PanelProps) {
  return (
    <>
      <ExperienceManager {...props} />
      <GuestQuestions {...props} />
    </>
  );
}
export const navigation = [
  ["Overview", "", HouseIcon, Overview],
  ["Wedding setup", "setup", CheckSquareIcon, SetupManager],
  ["Guest list", "guests", UsersIcon, GuestManager],
  ["Events", "events", CalendarBlankIcon, EventsManager],
  ["Your experience", "experience", SwatchesIcon, ExperiencePage],
  ["Invitations", "invitations", EnvelopeSimpleIcon, Invitations],
  ["RSVPs", "rsvps", CheckSquareIcon, RsvpManager],
  ["Messages", "messages", ChatCircleTextIcon, MessagesManager],
  ["Seating", "seating", ArmchairIcon, SeatingManager],
  ["Travel & stay", "travel", MapTrifoldIcon, TravelManager],
  ["Photos & memories", "photos", ImagesIcon, PhotosManager],
  ["Insights", "analytics", ChartBarIcon, Insights],
  ["Collaborators", "collaborators", UserPlusIcon, CollaboratorsManager],
  ["Settings", "settings", GearSixIcon, SettingsManager],
  ["Guest questions", "requests", ChatCircleTextIcon, RequestsManager],
  ["Pilot feedback", "feedback", ChatCircleTextIcon, FeedbackManager],
] as const;
