#!/bin/sh
# supervisor: averagers + renderer, rerun until every frame exists
N=3046
cd /tmp/claude-0/-home-user-oman/88d42a63-b91c-5e86-a8e3-b78c6431e985/scratchpad/p3/render
python3 -I /tmp/claude-0/-home-user-oman/88d42a63-b91c-5e86-a8e3-b78c6431e985/scratchpad/p3/average.py /tmp/claude-0/-home-user-oman/88d42a63-b91c-5e86-a8e3-b78c6431e985/scratchpad/p3/out 2 0 > /tmp/claude-0/-home-user-oman/88d42a63-b91c-5e86-a8e3-b78c6431e985/scratchpad/p3/work/avg0.log 2>&1 &
python3 -I /tmp/claude-0/-home-user-oman/88d42a63-b91c-5e86-a8e3-b78c6431e985/scratchpad/p3/average.py /tmp/claude-0/-home-user-oman/88d42a63-b91c-5e86-a8e3-b78c6431e985/scratchpad/p3/out 2 1 > /tmp/claude-0/-home-user-oman/88d42a63-b91c-5e86-a8e3-b78c6431e985/scratchpad/p3/work/avg1.log 2>&1 &
while true; do
  missing=$(python3 -I -c "import os;print(sum(1 for i in range($N) if not os.path.exists('/tmp/claude-0/-home-user-oman/88d42a63-b91c-5e86-a8e3-b78c6431e985/scratchpad/p3/out/%05d.jpg'%i) and not os.path.exists('/tmp/claude-0/-home-user-oman/88d42a63-b91c-5e86-a8e3-b78c6431e985/scratchpad/p3/out/sub/%05d.done'%i)))")
  [ "$missing" = "0" ] && break
  echo "missing $missing, starting renderer $(date)"
  NODE_PATH=/opt/node22/lib/node_modules node render_mb.js /tmp/claude-0/-home-user-oman/88d42a63-b91c-5e86-a8e3-b78c6431e985/scratchpad/p3/out 0-$((N-1)) 4 0.75
  pkill -f chrome-headless 2>/dev/null; sleep 3
done
touch /tmp/claude-0/-home-user-oman/88d42a63-b91c-5e86-a8e3-b78c6431e985/scratchpad/p3/out/RENDER_DONE; wait
echo ALL_DONE
