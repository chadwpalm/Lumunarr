# HuePlex Version History

## 1.2.3

### Fixed

- Improved error handling to prevent crashing
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
- Added a schedule that can be used locally or globally which includes sunrise/sunset times by location {[#2](https://github.com/chadwpalm/HuePlex/issues/2)}
- Added scene change transition times for each profile {[#11](https://github.com/chadwpalm/HuePlex/issues/11)}
- Added a settings page to house global settings

## 1.1.1

### Fixed

- Login issue where Plex credentials weren't saving for some users

## 1.1.0

### Added

- Time delay for scrobble trigger added to client profiles {[#6](https://github.com/chadwpalm/HuePlex/issues/6)}

## 1.0.1

### Fixed

- Rooms selection was not showing zones {[#5](https://github.com/chadwpalm/HuePlex/issues/5)}

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
