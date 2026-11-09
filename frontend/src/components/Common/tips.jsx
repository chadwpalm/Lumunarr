// Tooltip texts shared by more than one page.

export const SCHEDULE_TIP = (
  <>
    Add a schedule for when the triggers will be active.
    <br />
    <br />
    None: There will be no schedule. Profiles will be active based on the switch located on the profile tile.
    <br />
    <br />
    Global: Use the global setting for schedules.
    <br />
    <br />
    Range: The schedule will be based on a time range daily.
    <br />
    <br />
    Sunset/Sunrise: The active schedule will be between sunset and sunrise. In order for this to work a Latitude and
    Longitude must be set in the Settings tab. If using Docker the timezone environment variable must also be set.
  </>
);

export const TRANSITION_TIP = (
  <>
    This is the time in seconds for the scene to transition.
    <br />
    <br />
    If set to "Default", Lumunarr will use the transition time that is saved in the scene (through a third-party app).
    If there is no saved transition time, the Hue default of 0.4 seconds will be used.
    <br />
    <br />
    Setting a specific time will override the transition time saved in the scene and use the selected time instead.
  </>
);
