# ChangeLogs

## v1.0.15

Features:

- When request monitor is not enabled, the badge displays the current policy/proxy-server name.
- Added copy functionality for policy/proxy-server.
- Added the ability to batch update local rules for proxy-server in auto-policy mode.

Optimizations:

- Modified some UI elements.
- Optimized backup restoration.

## v1.0.14

Features:

- Add support for external rule sets that are not base64 encoded.

## v1.0.13

BugFix:

- Fixed the page display issue caused by adding an IPv6 address in the IP tags configuration.

## v1.0.12

BugFix:

- Fixed the issue where the proxy needs to be manually reselected when quickly adding a rule.

## v1.0.11

Features:

- Published on the Microsoft Edge Add-ons store and updated the description file.

## v1.0.10

Feature:

- The sorting of the iptag has been corrected.

## v1.0.9

BugFix:

- Fixed an issue where the configuration reload did not take effect when synchronizing remote configurations to the local environment.
- Fixed an issue where the automatic policy configuration was not effective under certain conditions.

## v1.0.8

Features:

- Added the ability to differentiate the currently active proxy policy by the BadgeText background color on the extension icon. The color can be configured by clicking the bookmark icon to the left of the name in the “Proxy Node or Policy Mode -> Configuration Page -> Name”

BugFix:

- Fixed UI issues on the popup page.
- Fixed an issue where the proxy could not switch due to incorrect proxy node configuration under certain conditions.

## v1.0.7

Optimization:

- Optimized the internal rule parsing order for the auto-policy.

BugFix:

- Fixed the validation status for auto-proxy

## v1.0.6

BugFix:

- Fixed the issue where remote rules-set might be cleared during automatic updates

## v1.0.5

Optimizations:

- Display the configuration file save time in data synchronization, to help users select versions more easily.
- Move the rejection rules from internal rules to the advanced configuration tab and add separate toggles for rule sets (rules lists loaded via URL).

## v1.0.4.1

BugFix:

- Fixed a silly bug

## v1.0.4

Features:

- Support export the PAC file in Auto-Policy.

Optimization:

- Improved the method of adding internal rules and segment divider in Auto-Policy.
- Rewrote the rule parsing for wildcards and regular expressions.
- Optimized the position of the Toast notification.
- Added unit tests.

BugFix:

- Fixed some UI bugs.
- Fixed the issue with the plugin's background auto-updating external rules.
- Fixed the issue with the plugin's background determining the status of link monitoring.
- Fixed the issue with the cancel button not working on the strategy and proxy configuration pages.

## v1.0.3

Features:

- Added an IP tagging feature. Users can use custom IP tags to replace the display of IP addresses on the PopUp link monitoring and Requests Debugger Monitor pages.

BugFix:

- Fixed the automatic set-auth for auto-policy

## v1.0.2

Features:

- Add Requests Debugger Monitor(General Settings > Advanced Config > Req Monitor > BugIcon)

## v1.0.1

Optimization:

- Optimizing the capture and display of request monitor

## v1.0.0

Optimization:

- Support the parsing BypassList of proxy node.
- Introduce ipaddr.js to replace the original IP parsing rules.
- Optimize the caching location of monitoring data to solve the problem of request display data loss caused by Chrome killing the workservice process.

Bug Fix:

- Fix the icon issue on the PopUp page.

## v0.9.2

Features:

- Added automatic synchronization of configuration.
- Added section separators in the automatic policy configuration page.

Optimization:

- Implemented state management using Pinia.
- Reload proxy rules after external rules are updated automatically every day.

BugFix:

- Fixed the issue of updating data every 1440 minutes.
- Fixed the issue of not being able to retrieve domain information in the PopUP page's quick add function.
- Fixed page display issues after manually overriding remote/local configurations.

## v0.9.1

Features:

- Support for incognito mode usage.
- Added the ability to temporarily disable internal rules in automatic rules.
- Added English language support.

BugFix:

- Partial interface style optimizations.
- Automatically update proxy configuration when modifying Proxy Server, if the currently used proxy strategy references the modified Proxy Server.

## v0.9.0

Features:

- Support for Proxy Server proxies for HTTP/HTTPS/SOCKS protocols.
- Support for PAC script proxies.
- Support for automatic policy proxies referencing Proxy Server.
