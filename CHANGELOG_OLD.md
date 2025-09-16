# Older changes
## 0.3.4 (2024-10-28) - Door Indicator Fixes #115
* (DutchmanNL) Added doorOpen indicator, Fixes [#115](https://github.com/DrozmotiX/ioBroker.bambulab/issues/115)

## 0.3.3 (2024-10-27) - Bugfixes
* (DutchmanNL) update state definitions, (solves [#77](https://github.com/DrozmotiX/ioBroker.bambulab/issues/77) [#58](https://github.com/DrozmotiX/ioBroker.bambulab/issues/58))
* (DutchmanNL) update connection handling, show connection error only once (Solves #99 #78 #74)

## 0.3.2 (2023-11-20)
* (DutchmanNL) Show finish time as ISO string

## 0.3.1 (2023-11-20)
* (DutchmanNL) Bugfix control P & A Series
* (DutchmanNL) Show end time as a separate state, resolves [#53](https://github.com/DrozmotiX/ioBroker.bambulab/issues/53)
* (DutchmanNL) Bugfix resolves missing fan speed value, resolves [#36](https://github.com/DrozmotiX/ioBroker.bambulab/issues/36)

## 0.3.0 (2023-11-19) - Release candidate
* (DutchmanNL) Update dependencies for state handling, resolves #50
* (DutchmanNL) Adjust log level for Unknown Message from error to debug, resolves #39
* (DutchmanNL) Add missing definitions to ensure correct creation of states, resolves #39
* (DutchmanNL) Reduce selection dropdown in admin config to printer series instead of a specific printer type
* (DutchmanNL) Update adapter code to support new firmware versions released by bambulab, please ensure your printer is up-to-date! resolves #46, resolves #38, resolves #26,

## 0.2.0 (2023-10-18) - Small fixes for new firmware version
* (DutchmanNL) Button for homing added, fixes #28
* (DutchmanNL) Bugfix: Translation of HMS-Error codes
* (DutchmanNL) Several bugfixes for situations no AMS is used
* (DutchmanNL) Remove control for LED calibration head (could damage hardware)

## 0.1.5 (2023-07-29) - HMS error codes Human readable, new functionalities added
#### Several state locations have been changed, advise to completely remove adapter & reinstall to upgrade
* (DutchmanNL) State for human-readable start time added
* (DutchmanNL) Speed level control implemented solves #10
* (DutchmanNL) Capability to control all fans implemented
* (DutchmanNL) Control bed & Nozzle temperature implemented
* (DutchmanNL) HMS error status indicator states implemented
* (DutchmanNL) Translations of HMS error codes implemented solves #9
* (DutchmanNL) Correct definitions for all temperature-related states
* (DutchmanNL) Control LED for tooling head Logo and calibration unit

## 0.1.4 (2023-07-28) - Support P1-series
* (DutchmanNL) Configuration page in admin updated
* (DutchmanNL) Information messages regarding incorrect type of bed-temperatures solved
* (DutchmanNL) Implemented P1-X printer series, polling interval required for this model (only X1 handles data push)

## 0.1.3 (2023-07-27) - Add new control options
* (DutchmanNL) add control for chamber fan, tooling head light and allow custom g-code

## 0.1.1 - Minor improvements
* (DutchmanNL) Translations added
* (DutchmanNL) Debug logging improved
* (DutchmanNL) Minor code improvements
* (DutchmanNL) Control states implemented
* (DutchmanNL) Test & release workflows updated
* (DutchmanNL) Encryption of token and device serial improved

## 0.1.0 initial release
* (DutchmanNL) initial release
* During startup adapter throws warnings, these can be ignored and will be solved in =< 0.5.0
* Control start/stop/resume and light available in >= 0.1.1
