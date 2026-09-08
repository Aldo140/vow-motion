"use client";

import { useState } from "react";
import { Field } from "./ui";

const popular = [
  ["America/Edmonton", "Calgary, Banff & Edmonton — Mountain time"],
  ["America/Vancouver", "Vancouver & western Canada — Pacific time"],
  ["America/Toronto", "Toronto & Montreal — Eastern time"],
  ["America/New_York", "New York & Miami — Eastern time"],
  ["America/Los_Angeles", "Los Angeles — Pacific time"],
  ["America/Chicago", "Chicago & Dallas — Central time"],
  ["America/Mexico_City", "Mexico City"],
  ["Europe/Rome", "Italy — Rome, Florence & Lake Como"],
  ["Europe/Paris", "France — Paris & Provence"],
  ["Europe/London", "United Kingdom — London"],
  ["Europe/Madrid", "Spain — Madrid & Barcelona"],
  ["Europe/Athens", "Greece — Athens & Santorini"],
  ["Asia/Kolkata", "India"],
  ["Asia/Dubai", "Dubai"],
  ["Australia/Sydney", "Sydney"],
];

export function TimezoneField({
  defaultValue = "Europe/Rome",
  label = "Timezone",
}: {
  defaultValue?: string;
  label?: string;
}) {
  const [value, setValue] = useState(defaultValue);
  const [search, setSearch] = useState("");
  const zones = [
    ...new Set([
      value,
      ...popular.map(([zone]) => zone),
      ...Intl.supportedValuesOf("timeZone"),
    ]),
  ];
  const options = zones.map((zone) => ({
    zone,
    label:
      popular.find(([key]) => key === zone)?.[1] ||
      zone.replaceAll("_", " ").replaceAll("/", " · "),
  }));
  return (
    <Field
      label={label}
      hint="Choose the venue’s local timezone. Daylight-saving changes are handled automatically."
    >
      <div>
        <input
          type="search"
          aria-label={`Search ${label.toLowerCase()} by city`}
          placeholder="Search city, country or timezone"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <select
        name="timezone"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        required
      >
        {options
          .filter(
            (option) =>
              option.zone === value ||
              `${option.label} ${option.zone}`
                .toLowerCase()
                .includes(search.toLowerCase()),
          )
          .map((option) => (
            <option value={option.zone} key={option.zone}>
              {option.label}
            </option>
          ))}
      </select>
      <button
        className="text-link"
        type="button"
        onClick={() => {
          setValue(Intl.DateTimeFormat().resolvedOptions().timeZone);
          setSearch("");
        }}
      >
        Use my device’s timezone
      </button>
    </Field>
  );
}
