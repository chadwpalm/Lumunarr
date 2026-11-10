# Lumunarr Version History

## 1.7.1

### Added

- Sign-in security. The Plex sign-in is now checked by the server, not just the web page:
  1. Only the Plex account that set up Lumunarr (the owner) can sign in. Other Plex accounts are refused. Existing installs recognize the owner from the saved sign-in automatically.
  2. Each browser gets its own session (30 days, renewed while in use). Signing out only signs out that browser, and updates no longer sign everyone out.
  3. Every page and API request needs a signed-in browser, except the Plex webhook.
  4. New **Security** section in Settings with an **Authentication** setting: Required (default), Not required for local addresses, or Off (for reverse proxies that already require a login). Behind a reverse proxy, the client address is taken from X-Forwarded-For when the proxy is on the local network.
  5. New `DISABLE_AUTH=true` environment variable turns sign-in off, and lets a different Plex account take over as owner on its next sign-in (for when the owner can't sign in any more).
- The Plex sign-in window now shows Plex's confirmation page with "Not you?", so you can pick which Plex account to sign in with. Each attempt uses a new sign-in code, and a Cancel button stops waiting for Plex.

### Changes

- The Docker image is now multi-architecture: `latest` and each version tag run on both amd64 and arm64 (64-bit ARM, e.g. a Raspberry Pi with a 64-bit OS). The separate `-arm` tags are no longer published, and 32-bit ARM (arm/v7) is no longer supported.
- The bridge monitor now searches for a moved bridge directly instead of sending an HTTP request to Lumunarr's own API.
- Code that changes only some settings (bridge pairing, the bridge monitor, sign-in) now updates just those fields, so it can no longer undo edits saved in the meantime.

### Fixes

- Security fix: the settings, including the Plex token and Hue key, could be read and changed by anyone who could reach the port, without signing in. The Plex token and session details are no longer sent to the browser at all, and saving from a page can no longer change the Plex token or the signed-in account.
- Fixed any Plex account being able to sign in and replace the owner's Plex token.

## 1.7.0

### Added

- New **Host** section in Settings for running Lumunarr on a different port or behind a reverse proxy with a URL base (e.g. `mydomain.com/lumunarr`).
  1. Shows the port and URL base Lumunarr is currently running on.
  2. The `APP_PORT` and `APP_BASE_URL` environment variables override these settings. The fields are locked with a note when they are set.
  3. Changes require a restart. The Docker health check follows the configured port and URL base.
- New **Logging** section in Settings to choose the log level (Info or Debug), the maximum log file size and how many log files to keep. Changes apply as soon as they are saved, without a restart.
- Logs now explain what happened with each Plex webhook. At Info level every play/pause/resume/stop/scrobble is logged along with which profile acted on it, or a note when no profile matched. At Debug level each profile lists the reason it was skipped (different player, user, media type or library, outside its schedule, or room lights off).
- Lumunarr logs its version, Node version, platform, port, URL base and config folder at startup.
- New `CONFIG_DIR` environment variable to keep settings and logs somewhere other than `/config`.
- Contributing guide (`CONTRIBUTING.md`) and development tooling for contributors: a Vite dev server with hot reload, ESLint for the frontend and backend, a shared Prettier configuration, and `npm run dev` with a separate development config folder. Thanks to @nimbleghost for the suggestions. {[#10](https://github.com/chadwpalm/Lumunarr/issues/10)}

### Changes

- Security updates. Updated Node to version 26 LTS in the Docker image (Node 20 is end-of-life and Node 22 reaches end-of-life in April 2027).
- Security updates. Updated all frontend and backend packages to their latest versions with no known vulnerabilities, including React 19, React Router 7 and Express 5.
- Security updates. The Docker image is now based on Alpine Linux instead of Debian and no longer includes npm at runtime. This removed all 50 high-severity vulnerabilities reported in the previous image's operating system packages and bundled npm, and reduced the image size from 330 MB to 239 MB. Time zone data is included so the `TZ` environment variable keeps working.
- Replaced Create React App, which is no longer maintained, with Vite for building the web interface. This removed every remaining build-tool vulnerability and makes builds much faster.
- Redesigned the Settings, Server and client profile pages with sections in cards, side-by-side fields on larger screens, and better use of space on phones.
- The profile form's actions are now one row per Plex event. Poster options appear directly under the event that uses them, the pause and scrobble delays sit next to their event, and the number of poster colors is chosen with buttons.
- Poster colors are now ordered by how much of the poster they cover, so the dominant light gets the poster's most dominant color. Posters are processed in memory instead of being written to a temporary file.
- Log lines now include a tag for the part of the app they come from, errors are summarized on a single line, routine messages moved to Debug, and Plex tokens and Hue keys are masked.
- Bridge discovery now always uses the bridge's IPv4 address.
- General code cleanup, removing about 1,450 lines of duplicated code from the profile and Server pages.

### Fixes

- Fixed poster mode not changing the lights when the number of poster colors was set to 1 (the default).
- Fixed editing a client profile replacing the Stop action's poster brightness with the Pause action's.
- Fixed the pause and scrobble delays showing "0 ms" instead of "Off" after moving the slider back to zero.
- Fixed pages being slightly off-center with unused space on the right side.
- Fixed the About dialog always showing "/Lumunarr" as the app folder.
- Fixed the Server page failing to load instead of showing an error when the Hue bridge could not be reached.
- Fixed an error in the Server alert blink sequence when a light update failed.
- Fixed unexpected server errors causing a second error instead of being reported.
- The Hue application key is no longer written to the log when pairing with a bridge.
- Fixed the app icons used when adding Lumunarr to a phone's home screen.

## 1.6.1

### Added

- User can now set any trigger (play, stop, pause, etc.) to use the colors of the poster. For movies it is the movie poster, and for TV Shows it is the poster at the show level.
  1. User can select the number of colors used from the poster (1-5).
  2. User can set the light in the room to display the dominant poster color.
  3. User can set the maximum brightness of the lights. Actual brightness is determined by the luminance of the pixels and interpolated as a value between 5% (for near black colors) and the maximum brightness set.

  This is considered an expermintal feature for now as it will need to be tested on a larger scale. Please feel free to make suggestions in the Discussion section of GitHub or submit an issue if something is not working correctly. {[#15](https://github.com/chadwpalm/Lumunarr/issues/15)}

### Fixes

- Improved snapshotting of lights when using the Restore Pre-Play option. Lights will now restore the proper color temperature (mirek) for lights not using xy color, and will also restore the effects that were being used by the lights. {[PR #43](https://github.com/chadwpalm/Lumunarr/pull/43)}

## 1.6.0

### Changes

- Security updates. Updated all node packages to current versions which removed all package vulnerabilities.
- Updated Node version to 20 LTS.
- Updated Plex login code to remove outdated and unmaintained 3rd party package which depended on old and vulnerable packages.
- Updated Docker build process to generate smaller Docker images by removing unnecessary frontend build tools and development dependencies.
- General code cleanup and housekeeping.

### Fixes

- Fixed issue where app would crash if using "Restore Pre-Play" if the app or container was restarted between when play is pressed and pause/stop is pressed resulting in the saved scene data being lost. {[#41](https://github.com/chadwpalm/Lumunarr/issues/41)}

## 1.5.8

### Hotfix

- Various Hue bridge connection fixes to support the new Hue Pro bridge.

## 1.5.7

### Fixes

- Fixed issue where Plex automatically logs out while creating/editing a profile when Plex token is invalid. This issue was supposed to be fixed in version 1.4.2, but somehow did not make it in.

- Miscellaneous minor background changes

## 1.5.6

### Fixes

- Fixed issue where server actions where not happening for "Library New" when the schedule was set to "None". {[#39](https://github.com/chadwpalm/Lumunarr/issues/39)}

### Changes

- Increased scrobble delay maximum to 15 seconds. {[#25](https://github.com/chadwpalm/Lumunarr/issues/25)}

## 1.5.5

### Fixes

- Fixed issue where users connected to remote Plex servers they did not own was causing a failure to retrieve libraries due to not having access to those servers.

## 1.5.4

### Added

- Option to add a delay on pause where if resume or stop is recalled before the delay is up it will not perform the pause action. This was added to fix an issue where
  some Plex clients pause when seeking forward/backward.

- Ability to filter out movies and TV shows by library and server.

## 1.5.3

### Added

- Client profile titles are editable now. This will help with distinguishing between profiles with identical titles, users, and media. {[#34](https://github.com/chadwpalm/Lumunarr/issues/34)}
- Client profiles can now be duplicated for easier creation of similar profiles. {[#34](https://github.com/chadwpalm/Lumunarr/issues/34)}

### Changes

- Increased timeout on Plex API calls to prevent timeout on slower connections/systems.

### Fixes

- Fixed a code issue that would cause the app to crash on API timeouts.

## 1.5.2

### Added

- A selecion box in the client add/edit form to ignore Play, Pause, Resume, Stop triggers if all lights are off. {[#33](https://github.com/chadwpalm/Lumunarr/issues/33)}

### Fixes

- Updated code for "Restore Pre-Play" to fix issues with it not working properly. Lights weren't turning back off if they were off when playback started. Fixed errors for non-lightbulb devices like Hue wall plugs. It will also now work with multiple clients in multiple rooms which it previously could not do. {[#34](https://github.com/chadwpalm/Lumunarr/issues/34)}

- Fix issue where Off trigger was sometimes crashing the app.

## 1.5.1

### Minor Fix

- Mouse cursor was not showing the proper pointer when hovering over the "close" and "toggle" icons on a client card.

## 1.5.0

### Added

- Confirmation now shown for saving/updating in Settings and Server pages.
- Dark mode and Light mode can now be toggled.
- Logging to file. Logs will be found in /config for native installs and the mounted config folder for Docker installs.
- Continuous monitoring of Hue Bridge IP address for when using a dynamic IP. The bridge is pinged every 15 minutes and if the bridge becomes unresponsive it searches for the bridge ID for all discovered bridges on the network.
- All lights in a room or zone can be used for Playback Started and Library New alerts in the Server page. {[#1](https://github.com/chadwpalm/Lumunarr/issues/1)}
- Server alert behavior can now be scheduled to prevent lights from changing/blinking during scheduled hours.
- Added "Restore Pre-Play" to Stop and Resume actions to restore the state of the lights from when playback started. {[#2](https://github.com/chadwpalm/Lumunarr/issues/2)}

### Changes

- Client cards are highlighted when creating/editing.
- Title bar is now sticky to the top of the page
- Improved logging output. Removed logging of frontend to backend web router calls.

### Fix

- Fixed issue where AM/PM for schedule ending times were displaying the same as the starting times on both clients and settings.
- Updated the Sunrise/Sunset schedule code to work more reliably.
- Updated behavior for adding a manual IP for bridge when discovery fails. Also added IPv4 validation.

## 1.4.5

### Hotfix

- Fixed issue where not having default settings was causing Lumunarr to not work if a Client profile used Global settings and the Settings page hadn't been saved yet. {[#32](https://github.com/chadwpalm/Lumunarr/issues/32)}
- Fixed issue where migration fails if no server settings have been created/saved.

## 1.4.4

### Fix

- Added a "Default" option to the scene transtion time (slider far left). This will prevent Lumunarr from overriding the scene transition time saved in the scene. If no transition time is saved in the scene it will use Hue's default time of 0.4 seconds. Newly created scenes will now default to the "Default" setting both locally and globally (Only globally on first startup. Existing times will not change).

## 1.4.3

### Fix

- Improved Hue Bridge discovery to help locate bridges on local network more efficiently when searching using mDNS.

## 1.4.2

### Changes

- Increase Hue Bridge button press authorization time from 10 to 30 seconds. {[#29](https://github.com/chadwpalm/Lumunarr/discussions/29)}

### Added

- Lumunarr will now automatically sign out and require signing back in when Plex credentials are invalid or expired. {[#29](https://github.com/chadwpalm/Lumunarr/discussions/29)}

## 1.4.1

### Hotfix

- Fixed issue where scenes were not properly populating when editing a client profile. {[#27](https://github.com/chadwpalm/Lumunarr/issues/27)}

## 1.4.0

This update now utilizes Hue API v2 for all API calls to the Hue bridge. Since Hue API v2 uses a different schema for scene and light IDs, the settings.js file will be automatically migrated to support the new IDs. Since this is a breaking change for previous versions of Lumunarr, a backup of the old settings file will be made in case you wish to revert back to an older version.

### Added

- Smart scenes are now supported (such as the Natural Light scene) due to the Hue API update. {[#23](https://github.com/chadwpalm/Lumunarr/issues/23)} Note: Hue currently does not support on/off transitions for smart scenes. Please be aware of this before submitting an issue.

### Changes

- Also due to the Hue API update, the way colors are selected have changes from hue/saturation to using the X/Y coordinates of CIE color space. Hopefully this will bring all variations of lights closer to the correct colors when using the Server behavior options. {[#19](https://github.com/chadwpalm/Lumunarr/issues/19)}

## 1.3.1

### Hotfix

- Fixed Managed Users not working properly. Backend now uses client ID instead of username to match webhook {[#24](https://github.com/chadwpalm/Lumunarr/issues/24)}

## 1.3.0

Application has been rebranded as Lumunarr

## 1.2.6

### Fixed

- Increased timeout on retrieval of Plex account information to decrease access errors
- Issue where profiles were using the Plex user's Full Name instead of username causing the backend not to recognize user. This was only happening when a Plex user was adding their full name to their Plex profile

## 1.2.5

### Fixed

- Removed 3rd party Hue API and now using native API calls
- Fixed light colors for Library New server behaviors
- Fixed lights getting stuck after blinking when multiple media is added at same time

## 1.2.4

### Hotfix

- Fixed a certain situation where creation of a client would fail when pulling the accounts of those who have access to Plex Server {[#21](https://github.com/chadwpalm/Lumunarr/issues/21)}

## 1.2.3

### Fixed

- Improved error handling to prevent crashing {[#17](https://github.com/chadwpalm/Lumunarr/issues/17)}
- Shows reasons for being unable to add client instead of hanging
- App detects if connected to internet. Useful if Docker network is set up incorrectly

## 1.2.2

### Fixed

- Typo in Settings screen
- Various log output

## 1.2.1

### Hotfix

- Fixed app crashing when webhook was not triggered from a client

## 1.2.0

### Fixed

- Issue with blink on Library New
- Profile on/off switches disabled during edit/create

### Added

- Changed Intervals and Brightness on Server page to range sliders
- Added a schedule that can be used locally or globally which includes sunrise/sunset times by location {[#2](https://github.com/chadwpalm/Lumunarr/issues/2)}
- Added scene change transition times for each profile {[#11](https://github.com/chadwpalm/Lumunarr/issues/11)}
- Added a settings page to house global settings

## 1.1.1

### Fixed

- Login issue where Plex credentials weren't saving for some users

## 1.1.0

### Added

- Time delay for scrobble trigger added to client profiles {[#6](https://github.com/chadwpalm/Lumunarr/issues/6)}

## 1.0.1

### Fixed

- Rooms selection was not showing zones {[#5](https://github.com/chadwpalm/Lumunarr/issues/5)}

## 1.0.0

App brought out of beta testing

## 0.2.0

### Added

- Alert when a new version is available
- Added a room selection for both client and server pages to separate light/scenes by room
- Added toggles on profiles to set them as active/inactive
- Added additional client information (product, version, device)

### Fixed

- Removed restrictions for duplicate client profiles
- Removed step-through of selections on client creation
- Buildfile fixes

## 0.1.0

Initial release
