# ChangeLogs

## v0.9.2

Features:

- Added automatic synchronization of configuration.
- Added section separators in the automatic policy configuration page.

Improvements:

- Implemented state management using Pinia.
- Reload proxy rules after external rules are updated automatically every day.
  Bugs:

- Fixed the issue of updating data every 1440 minutes.
- Fixed the issue of not being able to retrieve domain information in the PopUP page's quick add function.
- Fixed page display issues after manually overriding remote/local configurations.

## v0.9.1

Features:

- Support for incognito mode usage.
- Added the ability to temporarily disable internal rules in automatic rules.
- Added English language support.

Bugs:

- Partial interface style optimizations.
- Automatically update proxy configuration when modifying Proxy Server, if the currently used proxy strategy references the modified Proxy Server.

## v0.9.0

Features:

- Support for Proxy Server proxies for HTTP/HTTPS/SOCKS protocols.
- Support for PAC script proxies.
- Support for automatic policy proxies referencing Proxy Server.
