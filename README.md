# OasisProxy

OasisProxy is a browser proxy configuration extension. A substitute of SwitchOmega for Manifest v3

## Highlights

~~Currently only supports Chrome browser, Firefox is in the plan.~~

Only supports Chrome browser, Firefox is not being considered for now.

- Support user-configured browser proxies (HTTP/HTTPS/SOCKS4/SOCKS5).
- Support proxy policies(& reject policy) in autoProxy format or internal-rule format.
- Support switching of proxy policies in one-click, viewing request IP for debugging, quickly adding proxy rules.
- Support automatic synchronization of proxy configuration.

## Store Release

Oasis is now published in the Microsoft Edge Add-ons Store and the Chrome Web Store.

[![Chrome Web Store](https://img.shields.io/chrome-web-store/v/canfhmdhlkplkkpglgleikdjipcokjof)](https://chromewebstore.google.com/detail/oasis-proxy/canfhmdhlkplkkpglgleikdjipcokjof)

[![Microsoft Edge Add-ons Store](https://img.shields.io/badge/edge%20addons%20store-v1.0.x%20latest-blue)](https://microsoftedge.microsoft.com/addons/detail/nijeodiignggdicdeompofjlaikjobjf)

## ChangeLogs

[ChangeLogs](https://github.com/oasis-proxy/oasis-proxy/blob/main/changelogs.md)

## How to build/debug:

```
npm install

# for debug
npm run debug

# for build
npm run build
```

To install in Google Chrome follow these instructions:

https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world?hl=zh-cn#load-unpacked

## WIKI & FAQ

FAQ WIKI: [FAQ](https://github.com/oasis-proxy/oasis-proxy/wiki/FAQ)

## Privacy Policy

Oasis-Proxy WIKI: [Privacy Policy](https://github.com/oasis-proxy/oasis-proxy/wiki/Privacy)

## Project Reference

- JS: [VUE 3](https://vuejs.org/)
- UI Component: [Bootstrap 5](https://getbootstrap.com/)
- ICON: [Bootstrap Icon](https://icons.getbootstrap.com/)
- UI Theme: [Flatly](https://bootswatch.com/flatly/)
- ipaddr.js: [ipaddr.js](https://github.com/whitequark/ipaddr.js)
- Chrome API
