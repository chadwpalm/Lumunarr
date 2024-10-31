# Lumunarr Version History

## 1.5.0

### Added

- Confirmation now shown for saving/updating in Settings and Server pages.
- Dark mode and Light mode can now be toggled.
- Logging to file. Logs will be found in /config for native installs and the mounted config folder for Docker installs.
- Continuous monitoring of Hue Bridge IP address for when using a dynamic IP. The bridge is pinged every 15 minutes and if the bridge becomes unresponsive it searches for the bridge ID for all discovered bridges on the network.
- All lights in a room or zone can be used for Playback Started and Library New alerts in the Server page. {[#1](https://github.com/chadwpalm/Lumunarr/issues/1)}
- Server alert behavior can now be scheduled to prevent lights from changing/blinking during scheduled hours.
- Added "Restore Pre-Play" to Stop and Resume actions to restore the state of the lights from when playback started.

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
