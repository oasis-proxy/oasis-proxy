# ChangeLogs

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
