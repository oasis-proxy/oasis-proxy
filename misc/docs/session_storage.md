# Session Storage

## Request Monitor

```json
{

"tabId_111111": {
  "xxx.example.com": {
    "ip": "1.1.1.1",
    "status": "OK"
  },
  "xxx1.example.com": {
    "ip": "net::ERR_BLOCKED_BY_ORB",
    "status": "Error"
  },
  ...
}
}
```

## Temp Rules

```json
{
  "tempRule_*.example.com_.google.com": {
    "data": "*.example.com",
    "mode": "domain",
    "proxy": "auto_policy_name1",
    "valid": true,
    "source": "https://google.com/search",
    "siteRule": ".google.com",
    "error": "net::ERR_TIMED_OUT"
  },
  "tempRule_www.example.com_.google.com": {
    "data": "www.example.com",
    "mode": "domain",
    "proxy": "auto_policy_name1",
    "valid": true,
    "source": "https://google.com/search",
    "siteRule": ".google.com",
    "error": "net::ERR_CONNECTION_TIMED_OUT"
  }
}
```
