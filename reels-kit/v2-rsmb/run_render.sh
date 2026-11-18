#!/bin/sh
# supervisor: rerun renderer until every frame exists
cd $(cd "$(dirname "$0")" && pwd)/render
while true; do
  missing=$(python3 -I -c "import os;print(sum(1 for i in range(3522) if not os.path.exists('$(cd "$(dirname "$0")" && pwd)/out/%05d.jpg'%i) and not os.path.exists('$(cd "$(dirname "$0")" && pwd)/out/sub/%05d.done'%i)))")
  [ "$missing" = "0" ] && break
  echo "missing $missing, starting renderer $(date)"
  NODE_PATH=/opt/node22/lib/node_modules node render_mb.js $(cd "$(dirname "$0")" && pwd)/out 0-3521 4 0.75
  pkill -f chrome-headless 2>/dev/null; sleep 3
done
touch $(cd "$(dirname "$0")" && pwd)/out/RENDER_DONE
echo ALL_DONE
