system: manual, 24h, 12h, 6h, 3h, 1h, 15m, disableAll
proxy: default, 24h, 12h, 6h, 3h, 1h, 15m, manual

| system        | proxy                | action               |
| ------------- | -------------------- | -------------------- |
| disableAll    | ANY                  | disabled             |
| manual/xh/15m | default              | manual/xh/15m        |
| manual/xh/15m | xh/15m/manual(proxy) | xh/15m/manual(proxy) |
