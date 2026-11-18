# Cinematic sound design synthesized from scratch, timed to the motion timeline.
import numpy as np, scipy.signal as ss, wave, sys, os
SR = 48000; DUR = 58.75
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

