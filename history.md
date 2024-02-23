# Lumunarr Version History

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
