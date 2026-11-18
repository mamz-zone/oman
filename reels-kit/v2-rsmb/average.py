# Average sub-frame samples into final motion-blurred frames (runs until render finishes).
import os, sys, time, glob, cv2, numpy as np
out = sys.argv[1]; MOD = int(sys.argv[2]) if len(sys.argv) > 2 else 1; REM = int(sys.argv[3]) if len(sys.argv) > 3 else 0; sub = os.path.join(out, 'sub'); stop = os.path.join(out, 'RENDER_DONE')
params = [cv2.IMWRITE_JPEG_QUALITY, 99, cv2.IMWRITE_JPEG_SAMPLING_FACTOR, cv2.IMWRITE_JPEG_SAMPLING_FACTOR_444]
while True:
    dones = [d for d in sorted(glob.glob(os.path.join(sub, '*.done'))) if int(os.path.basename(d)[:5]) % MOD == REM]
    for d in dones:
        name = os.path.basename(d)[:-5]; n = int(open(d).read())
        if n == 1:
            im = cv2.imread(os.path.join(sub, f'{name}_00.png'))
            cv2.imwrite(os.path.join(out, name + '.jpg'), im, params); os.remove(os.path.join(sub, f'{name}_00.png')); os.remove(d); continue
        acc = None
        for k in range(n):
            im = cv2.imread(os.path.join(sub, f'{name}_{k:02d}.png')).astype(np.float32)
            im = im * im  # average in (approx.) linear light
            acc = im if acc is None else acc + im
        res = np.sqrt(acc / n)
        cv2.imwrite(os.path.join(out, name + '.jpg'), np.clip(res + .5, 0, 255).astype(np.uint8), params)
        for k in range(n): os.remove(os.path.join(sub, f'{name}_{k:02d}.png'))
        os.remove(d)
    if not dones:
        if os.path.exists(stop): break
        time.sleep(1)
