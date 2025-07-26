# 配置key

## config_app_version

`Number`：2.1。扩展的配置信息版本号。

## config_ui

`String`：dark、light、system。UI主题样式。（默认配置-界面样式）

## config_updateUrl

`String`, 外部规则更新间隔周期："24h"、"12h"、"6h"、"3h"、"1h"、"15m"、"disabled"、"manual"

## config_autoRefresh

`Boolean`，切换代理时是否自动刷新标签页。（默认配置-自动刷新标签页）

## config_monitor

`Boolean`，链接监控功能标志。（高级配置-链接监控）

## config_autoSync

`Boolean`，自动同步功能标志。（高级配置-自动同步）

## config_version

`Number`： 21。配置文件远程同步的版本号，用于比较本地和云端版本序号。

## config_syncTime

`Number`，保存配置的时间戳，记录config_version的保存时间。

## config_iptags

`Object`，IP标签记录值。（其他配置-IP标签）

```json
// schema
{
  "IP String": "IP tag name"
}

// e.g.
{
  "127.0.0.1": "LocalProxy",
  "127.0.0.2": "AnotherProxy"
  ...
}
```

## config_contextMenus

`Boolean`。右键菜单，默认关闭，需"contextMenus"权限。（实验配置-右键菜单）

## config_siteRules

`Boolean`，站点规则功能标志，默认关闭。（实验配置-站点规则）

## config_siteRules_autoRefresh

`Boolean`, 在命中siteRules添加临时规则后，是否自动刷新标签页

## direct

`Object`，直连代理默认配置。（固定值）

```json
{
  "mode": "direct",
  "name": "direct",
  "config": {
    "mode": "direct"
  },
  "tagColor": "#fff"
}
```

## system

`Object`，系统代理默认配置。（固定值）

```json
{
  "mode": "system",
  "name": "system",
  "config": {
    "mode": "system"
  },
  "tagColor": "#000"
}
```

## reject

`Object`，拒绝策略配置。（高级配置-拒绝地址）

```
{
  mode: "reject",
  name: "reject",
  config: {
    "mode": "reject",
    "rules": "HTTPS 127.0.0.1:65432"
  },
}
```

## proxy_xxxx

`Object`，代理节点、策略模式配置。

### 代理节点样例

```JSON
{
  "config": {
    "mode": "fixed_servers",
    "rules": {
      "bypassList": [
        "127.0.0.1",
        "::1",
        "localhost"
      ],
      "singleProxy": {
        "host": "example.com",
        "password": "",
        "port": 443,
        "scheme": "https", // https/http/socks4/socks5/direct
        "username": ""
      }
    }
  },
  "mode": "fixed_servers",
  "name": "server name",
  "tagColor": "#3498db"
}
```

### 策略模式（PAC）样例

```JSON
{
  "config": {
    "mode": "pac_script",
    "rules": {
      "data": "",
      "url": "",
      "updateInterval": "",
      "urlUpdatedAt": ""
    }
  },
  "mode": "pac_script",
  "name": "pac script policy name",
  "tagColor": "#3498db"
}
```

### 策略模式（自动）样例

```JSON
{
  "config": {
    "mode": "auto",
    "rules": {
      "defaultProxy": "",
      "local": {
        "ruleList": [{
          "data": "",
          "mode": "",
          "proxy": "",
          "valid": true
        }],
        "rulesSet": {
            "data": "",
            "format": "",
            "mode": "autoProxy",
            "proxy": "",
            "url": "",
            "updateInterval": "",
            "urlUpdatedAt": "",
            "valid": true
        }
      },
      "reject": {
        "ruleList": [{
          "data": "",
          "mode": "",
          "proxy": "",
          "valid": true
        }],
        "rulesSet": {
          "data": "",
          "format": "base64",
          "mode": "autoProxy",
          "proxy": "+reject",
          "url": "",
          "updateInterval": "",
          "urlUpdatedAt": "",
          "valid": true
        }
      },
      "site": {
        "ruleList": [{
          "data": "",
          "mode": "",
          "proxy": "",
          "valid": true
        }],
        "rulesSet": {
          "data": "",
          "format": "base64",
          "mode": "autoProxy",
          "proxy": "",
          "url": "",
          "updateInterval": "",
          "urlUpdatedAt": "",
          "valid": true
        }
      }
    }
  },
  "mode": "auto",
  "name": "auto",
  "tagColor": "#3498db"
}
```

## status_proxyKey

`String`，当前使用的代理策略的键名称。

# 本地/云端同步

| key                          | local | sync |
| ---------------------------- | ----- | ---- |
| config_app_version           | [x]   | [x]  |
| config_ui                    | [x]   | []   |
| config_updateUrl             | [x]   | [x]  |
| config_autoRefresh           | [x]   | [x]  |
| config_monitor               | [x]   | []   |
| config_autoSync              | [x]   | []   |
| config_version               | [x]   | [x]  |
| config_syncTime              | [x]   | [x]  |
| config_iptags                | [x]   | [x]  |
| config_contextMenus          | [x]   | [x]  |
| config_siteRules             | [x]   | [x]  |
| config_siteRules_autoRefresh | [x]   | [x]  |
| direct                       | [x]   | []   |
| system                       | [x]   | []   |
| reject                       | [x]   | []   |
| proxy_xxxx                   | [x]   | [x]  |
| status_proxyKey              | [x]   | []   |
