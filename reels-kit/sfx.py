# Cinematic sound design synthesized from scratch, timed to the motion timeline.
import numpy as np, scipy.signal as ss, wave, sys, os
SR = 48000; DUR = 21.4
rng = np.random.default_rng(7)
N = int(SR * DUR)
L = np.zeros(N); R = np.zeros(N)

def tt(d): return np.arange(int(SR * d)) / SR
def env_adsr(n, a, r, curve=4):
    t = np.arange(n) / SR; e = np.minimum(1, t / max(a, 1e-4))
    return e * np.exp(-curve * np.maximum(0, t - a) / max(r, 1e-4))
def bp(x, lo, hi, order=2):
    sos = ss.butter(order, [lo, hi], 'bandpass', fs=SR, output='sos'); return ss.sosfilt(sos, x)
def lp(x, f, order=2):
    sos = ss.butter(order, f, 'lowpass', fs=SR, output='sos'); return ss.sosfilt(sos, x)
def hp(x, f, order=2):
    sos = ss.butter(order, f, 'highpass', fs=SR, output='sos'); return ss.sosfilt(sos, x)
def sweep_filter(x, f0, f1, q=2.0, steps=64):
    # time-varying bandpass via overlapping blocks
    n = len(x); out = np.zeros(n); bs = n // steps + 1; win = np.hanning(2 * bs)
    for k in range(steps + 1):
        c = k * bs; a = max(0, c - bs); b = min(n, c + bs)
        if b <= a: continue
        f = f0 * (f1 / f0) ** (k / steps); lo = max(30, f / q); hi = min(SR / 2 - 100, f * q)
        y = bp(x[a:b], lo, hi); w = win[(a - (c - bs)):(a - (c - bs)) + (b - a)]
        out[a:b] += y * w
    return out
def place(sig, t0, gain=1.0, pan=0.0):
    if sig.ndim == 1: sig = np.stack([sig, sig])
    i = int(t0 * SR); n = sig.shape[1]
    if i < 0: sig = sig[:, -i:]; i = 0
    n = min(sig.shape[1], N - i)
    if n <= 0: return
    gl = gain * np.cos((pan + 1) * np.pi / 4) * 1.414; gr = gain * np.sin((pan + 1) * np.pi / 4) * 1.414
    L[i:i + n] += sig[0, :n] * gl; R[i:i + n] += sig[1, :n] * gr

# --- simple stereo reverb (decaying noise IR) ---
def reverb(x, decay=1.8, mix=.35, bright=6000):
    n = int(SR * decay); t = np.arange(n) / SR
    irL = rng.standard_normal(n) * np.exp(-6.9 * t / decay); irR = rng.standard_normal(n) * np.exp(-6.9 * t / decay)
    irL = lp(irL, bright); irR = lp(irR, bright); irL[:int(.012 * SR)] = 0; irR[:int(.017 * SR)] = 0
    irL /= np.sqrt((irL ** 2).sum()); irR /= np.sqrt((irR ** 2).sum())
    wl = np.pad(ss.fftconvolve(x, irL),(0,1)); wr = np.pad(ss.fftconvolve(x, irR),(0,1))
    dry = np.concatenate([x, np.zeros(n)])
    return np.stack([dry * (1 - mix) + wl * mix, dry * (1 - mix) + wr * mix])

# ---------------- elements ----------------
def whoosh(d=.6, f0=300, f1=5000, peak=.6, rev=True):
    n = int(SR * d); x = rng.standard_normal(n)
    y = sweep_filter(x, f0, f1, q=1.8)
    t = np.arange(n) / n; e = np.sin(np.pi * np.clip(t / peak, 0, 1) * .5) ** 2 * np.where(t < peak, 1, np.exp(-(t - peak) * 9))
    y = y * e; y /= np.abs(y).max() + 1e-9
    return reverb(y, 1.2, .25) if rev else y
def sub_boom(d=1.6, f0=95, f1=32, g=1.0):
    t = tt(d); f = f1 + (f0 - f1) * np.exp(-t * 7); ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-t * 2.6) * np.minimum(1, t / .004) * g
def crack(d=.25, g=1.0):
    t = tt(d); x = rng.standard_normal(len(t)); x = hp(x, 1200) * np.exp(-t * 28)
    return x / np.abs(x).max() * g
def impact(size=1.0, rv=2.4):
    b = sub_boom(1.8, 110, 30); c = crack(.3) * .55
    body = lp(rng.standard_normal(int(SR * .5)), 900) * np.exp(-tt(.5) * 12); body /= np.abs(body).max()
    m = np.zeros(len(b)); m[:len(c)] += c; m[:len(body)] += body * .6; m += b * 1.1
    out = reverb(m, rv, .3, 5000)
    return out * size
def riser(d=1.2, f0=200, f1=3000):
    n = int(SR * d); t = np.arange(n) / n
    y = sweep_filter(rng.standard_normal(n), f0, f1, q=2.2) * (t ** 2.2)
    tone = np.sin(2 * np.pi * np.cumsum(110 * 2 ** (t * 2.5)) / SR) * t ** 3 * .25
    y = y / (np.abs(y).max() + 1e-9) + tone
    return reverb(y, 1.0, .2)
def rev_swell(d=.7):
    s = crack(.9, 1) + lp(rng.standard_normal(int(.9 * SR)), 6000) * np.exp(-tt(.9) * 5) * .4
    r = reverb(s, 1.5, .7)[:, :int(d * SR)]
    r = r[:, ::-1]; return r / np.abs(r).max()
def pop(f=900, d=.12):
    t = tt(d); fr = f * (1 + 1.5 * np.exp(-t * 60)); y = np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t * 38)
    return reverb(y, .6, .18)
def click(f=4000, d=.03):
    t = tt(d); y = bp(rng.standard_normal(len(t)), f * .6, min(f * 1.6, 20000)) * np.exp(-t * 220)
    return y / (np.abs(y).max() + 1e-9)
def blip(f=1800, d=.07):
    t = tt(d); y = (np.sin(2 * np.pi * f * t) + .3 * np.sin(2 * np.pi * 2 * f * t)) * np.exp(-t * 60) * np.minimum(1, t / .002)
    return y
def chime(fs=(1318.5, 1975.5, 2637), d=1.4):
    t = tt(d); y = sum(np.sin(2 * np.pi * f * t) * np.exp(-t * (3 + k * 1.5)) * (1 / (k + 1)) for k, f in enumerate(fs))
    y *= np.minimum(1, t / .003); return reverb(y, 2.0, .35, 9000)
def shimmer(d=1.6, base=2200):
    t = tt(d); y = np.zeros(len(t))
    for k in range(18):
        f = base * (1 + rng.random() * 1.6); st = rng.random() * d * .5; e = np.where(t > st, np.exp(-(t - st) * (6 + 6 * rng.random())), 0)
        y += np.sin(2 * np.pi * f * t + rng.random() * 6) * e * (.3 + .7 * rng.random())
    y = y / np.abs(y).max(); return reverb(y, 2.4, .5, 12000)
def braam(d=2.2, f=55):
    t = tt(d); y = np.zeros(len(t))
    for det in (-.4, 0, .37, 7.0 / 12):
        ff = f * (2 ** det if det > 1 else 1) * (1 + det * .004)
        ph = 2 * np.pi * ff * t; y += ss.sawtooth(ph) * (.5 if det > 1 else 1)
    e = np.minimum(1, t / .03) * np.exp(-t * 1.3)
    y = lp(y, 900) * e; y /= np.abs(y).max()
    return reverb(y, 2.8, .35, 3000)
def zap(d=.25):
    t = tt(d); f = 3000 * np.exp(-t * 18) + 200; y = ss.square(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 14)
    return reverb(lp(y, 6000) * .5, .8, .25)
def typing(n=12, t0=0, t1=.44):
    out = []
    for k in range(n):
        tk = t0 + (t1 - t0) * k / max(1, n - 1) + rng.random() * .012
        out.append((tk, click(2500 + rng.random() * 2500, .035) * (.6 + .4 * rng.random()), (rng.random() - .5) * .3))
    return out
def tone_rise(d, f0, f1):
    t = tt(d); f = f0 * (f1 / f0) ** (t / d); y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.minimum(1, t / .05) * np.minimum(1, (d - t) / .05)
    return reverb(y * .5 + .2 * np.sin(4 * np.pi * np.cumsum(f) / SR), 1.2, .3)

# ---------------- music bed: cinematic pad + pulse ----------------
def pad_bed():
    t = np.arange(N) / SR; bed = np.zeros((2, N))
    # chord progression (Am - F - C - G) roots in Hz, 4 bars of ~2.67s, loop
    chords = [(110, 130.81, 164.81), (87.31, 110, 130.81), (130.81, 164.81, 196), (98, 123.47, 146.83)]
    seg = 2.667
    for ch in range(2):
        y = np.zeros(N)
        for i in range(int(DUR / seg) + 1):
            a = int(i * seg * SR); b = min(N, int((i + 1) * seg * SR) + int(.6 * SR))
            if a >= N: break
            tt_ = np.arange(b - a) / SR; e = np.minimum(1, tt_ / .5) * np.minimum(1, np.maximum(0, (b - a) / SR - tt_) / .6)
            for f in chords[i % 4]:
                for det in (-.006, .006):
                    y[a:b] += ss.sawtooth(2 * np.pi * f * 2 * (1 + det + (ch - .5) * .003) * tt_ + ch) * e * .12
        cutoff_lfo = 900
        y = lp(y, cutoff_lfo, 3)
        bed[ch] = y
    # sub pulse (heartbeat) on quarter notes at 90 bpm
    pulse = np.zeros(N); beat = 60 / 90
    for k in range(int(DUR / beat) + 1):
        i = int(k * beat * SR); s = sub_boom(.45, 70, 40) * (.55 if k % 2 else .8)
        n = min(len(s), N - i)
        if n > 0: pulse[i:i + n] += s[:n]
    bed += pulse * .45
    # soft hi-tick on 8ths
    for k in range(int(DUR / (beat / 2)) + 1):
        i = int(k * beat / 2 * SR); c = click(9000, .02) * (.07 if k % 2 else .04)
        n = min(len(c), N - i)
        if n > 0: bed[0, i:i + n] += c[:n] * .8; bed[1, i:i + n] += c[:n]
    return bed

# ---------------- cue sheet ----------------
EX0, EX1 = 5.2052, 11.0944
cues = []
add = lambda t, s, g=1, p=0: cues.append((t, s, g, p))
# intro
add(-.05, whoosh(.5, 400, 7000, .8), .5)
add(.02, impact(.8, 2.0), .55)
for i in range(8): add(.08 + i * .05, click(5000, .03), .18, -.6 + i * .17)
add(.86, rev_swell(.12), .35)
add(.93, impact(1.0, 3.0), .9); add(.93, braam(2.0, 55), .35); add(.95, shimmer(1.6, 2600), .25)
add(.97, pop(1100), .35); add(1.24, pop(1500), .35)
# to UI
add(1.62, whoosh(.55, 250, 6000, .6), .55)
add(2.1, pop(700), .4); add(2.12, click(3000), .3)
add(3.1, whoosh(.25, 1500, 9000, .4, False), .25, .5); add(3.14, pop(1300), .5, .5); add(3.16, blip(2600), .25, .5)
# tracking sequence
add(3.76, riser(1.1, 300, 5000), .4)
for k in range(24):
    tk = 3.78 + 1.05 * (1 - (1 - k / 24) ** 1.6)
    add(tk, blip(1400 + k * 60, .05), .14, (k % 5 - 2) * .25)
add(4.86, chime((1318.5, 1760, 2637.0)), .32)
# transition into example
add(4.85, rev_swell(.36), .5)
add(4.88, whoosh(.5, 200, 8000, .75), .6)
add(EX0, impact(.9, 2.4), .75); add(EX0, crack(.2), .35)
add(5.45, whoosh(.9, 600, 9000, .5, True), .2, -.3)
add(6.66, blip(1900, .08), .35); add(6.76, blip(2850, .1), .35)
add(7.56, pop(1200), .35, -.3)
for r in range(9): add(8.98 + r * .08, blip(2000 + r * 150, .05), .18, -.8 + r * .2)
add(8.98, whoosh(.8, 2000, 10000, .5, True), .18)
add(9.4, pop(1500), .35, .3)
# back to face
add(10.75, rev_swell(.34), .45)
add(10.8, whoosh(.45, 250, 7000, .7), .55)
add(EX1, impact(.7, 2.0), .6)
# CTA
add(11.12, whoosh(.4, 400, 6000, .6, False), .3)
for (tk, s, p) in typing(12, 11.22, 11.66): add(tk, s, .22, p)
add(11.74, pop(800), .45); add(11.76, whoosh(.25, 1500, 9000, .3, False), .25)
add(12.0, pop(1700, .1), .3, .3)
add(12.2, whoosh(.5, 800, 10000, .5, True), .45, -.6)
add(12.64, chime((1568, 2093), 1.0), .3, .2)
add(13.12, zap(), .3)
add(13.5, rev_swell(.12), .3)
add(13.6, impact(.8, 2.2), .65); add(13.62, shimmer(2.0, 3000), .4)
# OS
add(14.42, whoosh(.45, 300, 6000, .6), .45)
add(15.18, pop(600), .45, -.5); add(15.18, sub_boom(.5, 120, 50), .35)
add(15.92, pop(750), .45, .5); add(15.92, sub_boom(.5, 120, 50), .35)
# power
add(16.15, whoosh(.4, 300, 5000, .6), .45)
add(16.3, riser(.66, 150, 6000), .5)
add(16.6, rev_swell(.34), .55)
add(16.94, impact(1.3, 3.4), 1.0); add(16.94, braam(2.6, 41.2), .55); add(16.96, crack(.35), .4)
add(17.4, tone_rise(.62, 220, 880), .18)
add(18.0, chime((1046.5, 1568, 2093)), .25)
# end
add(18.18, whoosh(.5, 300, 7000, .6), .5)
for i in range(8): add(18.4 + i * .05, click(5000, .03), .16, -.6 + i * .17)
add(18.85, impact(.7, 2.6), .6); add(18.87, shimmer(1.8, 2400), .3)
add(19.86, whoosh(1.0, 300, 4000, .7, True), .2)
add(20.2, pop(1000), .3); add(20.2, chime((880, 1318.5, 1760), 1.6), .22)

for (t0, s, g, p) in cues: place(s, t0, g, p)
sfx = np.stack([L, R])
# soft-limit SFX bus
sfx = np.tanh(sfx * 1.1) / 1.1

bed = pad_bed()
# ---------------- voice + sidechain ducking ----------------
def readwav(p):
    w = wave.open(p); n = w.getnframes(); ch = w.getnchannels(); d = np.frombuffer(w.readframes(n), np.int16).astype(np.float32) / 32768
    return d.reshape(-1, ch).T
voice = readwav(sys.argv[1])  # 48k stereo
vn = min(voice.shape[1], N); vo = np.zeros((2, N)); vo[:, :vn] = voice[:, :vn]
venv = np.abs(vo).mean(0); venv = lp(venv, 8, 1); venv = venv / (venv.max() + 1e-9)
duck = 1 - .55 * np.clip(venv * 4, 0, 1)  # music ducks under speech
duck = lp(duck, 5, 1)
bed_gain = .16
sduck = lp(1 - .3 * np.clip(venv * 4, 0, 1), 8, 1)
mix_fx = sfx * .55 * sduck + bed * bed_gain * duck
# fade bed in/out
fade = np.ones(N); fi = int(.3 * SR); fade[:fi] = np.linspace(0, 1, fi); fo = int(.6 * SR); fade[-fo:] = np.linspace(1, 0, fo)
mix_fx *= fade
out_dir = sys.argv[2]
def writewav(p, x):
    x = np.clip(x, -1, 1); w = wave.open(p, 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((x.T * 32767).astype(np.int16).tobytes()); w.close()
writewav(os.path.join(out_dir, 'sfx_music.wav'), mix_fx / max(1, np.abs(mix_fx).max() / .95))
print('peak sfx', np.abs(mix_fx).max(), 'cues', len(cues))
