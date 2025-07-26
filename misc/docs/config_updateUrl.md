system: manual, 24h, 12h, 6h, 3h, 1h, 15m, disabled
proxy: default, 24h, 12h, 6h, 3h, 1h, 15m, disabled

| system        | proxy            | action        |
| ------------- | ---------------- | ------------- |
| disabled      | ANY              | disabled      |
| manual        | default/disabled | disabled      |
| xh/15m        | default          | xh/15m        |
| manual/xh/15m | xh/15m(proxy)    | xh/15m(proxy) |
| xh/15m        | disabled         | disabled      |
