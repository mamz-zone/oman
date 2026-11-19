# Sound design for the Easy Comp reel. usage: python3 sfx3.py <voice48k.wav> <outdir>
import sys, os, wave
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sfxlib import *  # noqa

def snap():
    th = sub_boom(.3, 140, 60); c = click(2500, .03); th[:len(c)] += c * .7; return reverb(th, .6, .2)
def slide(d=.6):
    n = int(d * SR); x = sweep_filter(rng.standard_normal(n), 900, 2600, q=2.5) * np.sin(np.pi * np.arange(n) / n) ** 1.5
    return x / (np.abs(x).max() + 1e-9)
def ding(): return chime((1760, 2637, 3520), 1.2)
def uiclick(): return reverb(click(3800, .025) + 0, .3, .1)
def menu_open():
    m = whoosh(.18, 1500, 9000, .4, False) * .5; c = click(3000, .03); m[:len(c)] += c; return m

cues = []; add = lambda t, s, g=1, p=0: cues.append((t, s, g, p))
# hook
add(0.0, whoosh(.45, 600, 9000, .5, True), .3); add(.1, impact(.5, 1.6), .4); add(.2, shimmer(1.2, 2600), .15)
add(.52, pop(1200), .25)
add(1.6, whoosh(.5, 400, 6000, .5, True), .35); add(1.75, sub_boom(.8, 110, 45), .35)
add(3.26, impact(.6, 2.0), .55); add(3.28, shimmer(.9, 3000), .2)
# full -> circle
add(3.45, whoosh(.6, 250, 7000, .7), .55); add(4.05, sub_boom(.8, 110, 40), .4)
add(4.15, whoosh(.35, 800, 8000, .5, False), .3); add(4.2, uiclick(), .3)
add(5.1, whoosh(.5, 2000, 9000, .4, False), .2); add(5.14, blip(1500, .07), .25)
add(6.0, rev_swell(.2), .3); add(6.2, ding(), .3)
# Easy Comp reveal
add(6.25, rev_swell(.35), .5); add(6.6, impact(1.0, 2.8), .85); add(6.6, braam(2.2, 52), .4); add(6.62, crack(.3), .3)
add(7.0, pop(1600), .4); add(7.3, click(5000, .03), .2)
add(7.9, slide(.6), .3, -.4); add(8.5, whoosh(.55, 600, 12000, .35, True), .45, .4); add(9.02, zap(), .3)
# circle -> full + social
add(9.5, whoosh(.6, 250, 7000, .7), .55)
for t0 in (9.88, 10.32, 10.62): add(t0, click(4200, .03), .45); add(t0 + .03, pop(1000), .35)
add(11.58, ding(), .3)
# full -> circle, element + tracking
add(11.8, whoosh(.6, 250, 7000, .7), .55); add(12.4, sub_boom(.8, 110, 40), .4)
add(12.38, whoosh(.5, 500, 8000, .5, True), .4); add(12.6, snap(), .4)
add(13.02, pop(1100), .35, -.5)
for k in range(10): add(15.14 + k * .04, blip(1600 + k * 90, .05), .16, -.6 + k * .12)
add(15.4, blip(2200, .08), .3); add(15.5, blip(3300, .1), .25)
# new adjustment layer
add(15.95, whoosh(.45, 400, 7000, .6), .45); add(16.2, uiclick(), .4); add(16.22, menu_open(), .4)
add(16.3, whoosh(.5, 300, 5000, .5, True), .25); add(16.5, menu_open(), .3)
for k in range(5): add(16.55 + k * .09, click(6000, .015), .12)
add(17.18, uiclick(), .45); add(17.2, snap(), .45); add(17.22, whoosh(.4, 300, 5000, .5, True), .25)
# quick apply
add(17.8, whoosh(.45, 400, 7000, .6), .45)
for k in range(4): add(18.25 + k * .09 + rng.random() * .01, click(2500 + rng.random() * 2500, .035), .3)
add(18.55, whoosh(.25, 1500, 9000, .3, False), .2)
add(19.32, uiclick(), .45); add(19.34, pop(900), .4); add(19.36, shimmer(.8, 2800), .18)
# background layer
add(19.8, whoosh(.45, 400, 7000, .6), .45); add(20.08, uiclick(), .4); add(20.1, menu_open(), .35)
add(20.5, click(6000, .015), .15); add(21.12, uiclick(), .45); add(21.15, ding(), .25)
# hide video
add(22.0, whoosh(.45, 400, 7000, .6), .45); add(22.6, uiclick(), .5); add(22.62, sub_boom(.4, 130, 60), .35)
# strength 0 -> 100
add(24.0, whoosh(.45, 400, 7000, .6), .45); add(26.45, whoosh(.5, 600, 5000, .5, True), .3)
add(26.9, tone_rise(.35, 600, 300), .14)
add(27.4, tone_rise(.65, 300, 1200), .22)
for i in range(14): add(27.4 + i * .046, click(5500, .02), .2)
add(28.04, impact(.6, 2.0), .5); add(28.06, shimmer(1.0, 3000), .25)
# examples
add(28.15, whoosh(.6, 300, 9000, .6, True), .55); add(28.6, pop(900), .3)
add(30.5, whoosh(.4, 500, 9000, .4, False), .45); add(30.6, crack(.2), .25); add(30.72, pop(800), .3)
add(34.5, rev_swell(.15), .4); add(34.65, impact(.8, 2.4), .7); add(34.7, shimmer(1.4, 2800), .3); add(34.78, pop(1300), .35)
add(36.3, slide(.6), .35, -.5)
for t0 in (37.05, 37.75): add(t0, whoosh(.3, 800, 5000, .5, False), .15)
# PIP -> full, local AI
add(38.15, whoosh(.6, 250, 7000, .7), .55); add(38.75, sub_boom(.8, 110, 40), .4)
add(39.4, whoosh(.4, 500, 6000, .5, False), .3); add(40.44, zap(), .3); add(40.46, shimmer(1.2, 2400), .3)
for t0 in (42.94, 43.92, 45.48): add(t0 - .1, pop(900), .4); add(t0 + .2, razor() if False else crack(.15), .3); add(t0 + .22, blip(600, .12), .3)
# CTA
add(45.45, whoosh(.6, 250, 7000, .7), .55); add(46.05, click(3000), .25)
for k in range(11): add(46.6 + k * .06 + rng.random() * .01, click(2500 + rng.random() * 2500, .035), .22, (rng.random() - .5) * .3)
add(47.35, pop(800), .45); add(47.4, whoosh(.25, 1500, 9000, .3, False), .25); add(47.7, pop(1700, .1), .3, .3)
add(48.0, whoosh(.5, 800, 10000, .5, True), .45, -.6); add(48.36, ding(), .28, .2)
add(49.04, zap(), .3); add(49.06, shimmer(1.6, 2400), .22)

for (t0, s, g, p) in cues: place(s, t0, g, p)
sfx = np.tanh(np.stack([L, R]) * 1.1) / 1.1
bed = pad_bed()
def readwav(p):
    w = wave.open(p); n = w.getnframes(); ch = w.getnchannels(); d = np.frombuffer(w.readframes(n), np.int16).astype(np.float32) / 32768
    return d.reshape(-1, ch).T
v = readwav(sys.argv[1]); vo = np.zeros((2, N)); n = min(N, v.shape[1]); vo[:, :n] = v[:, :n]
venv = lp(np.abs(vo).mean(0), 8, 1); venv /= venv.max() + 1e-9
duck = lp(1 - .55 * np.clip(venv * 4, 0, 1), 5, 1); sduck = lp(1 - .3 * np.clip(venv * 4, 0, 1), 8, 1)
mix = sfx * .55 * sduck + bed * .16 * duck
fd = np.ones(N); k = int(.3 * SR); fd[:k] = np.linspace(0, 1, k); k = int(.5 * SR); fd[-k:] = np.linspace(1, 0, k); mix *= fd
def writewav(p, x):
    x = np.clip(x, -1, 1); w = wave.open(p, 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((x.T * 32767).astype(np.int16).tobytes()); w.close()
writewav(os.path.join(sys.argv[2], 'sfx_music.wav'), mix / max(1, np.abs(mix).max() / .95))
print('cues', len(cues), 'peak', np.abs(mix).max())
