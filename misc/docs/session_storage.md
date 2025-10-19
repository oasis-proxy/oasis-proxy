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

## contextMenus params

```json
{
  "contextMenus_rules": {
    "hosts": [],
    "rulesType": "site" // site | link
  }
}
```

## contextMenus link info

```json
{
  "temp_infoview": "[{\"name\":\"https://www.baidu.com/\",\"value\":\"\"},{\"name\":\"地址对象\",\"value\":\"链 接\"},{\"name\":\"策略（优先级组）\",\"value\":\"direct (default)\"},{\"name\":\"命中规则\",\"value\":\"-\"}]"
}
```
