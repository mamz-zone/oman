# Sound design for the RSMB Pro reel. usage: python3 sfx2.py <voice48k.wav> <outdir>
import sys, os, wave
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sfxlib import *  # noqa

CUT, INS = 12.35, 7.5
mT = lambda m: m if m < CUT else m + INS

def shutter_snd():
    a = click(3500, .025); b = click(2200, .04)
    out = np.zeros(int(.16 * SR)); out[:len(a)] += a; i = int(.07 * SR); out[i:i + len(b)] += b * .9
    body = lp(rng.standard_normal(len(out)), 1800) * np.exp(-tt(.16) * 30) * .3
    return reverb(out + body, .5, .15)
def razor():
    c = click(6000, .02); s = blip(3200, .05) * .4; m = np.zeros(int(.12 * SR)); m[:len(c)] += c; m[:len(s)] += s
    th = sub_boom(.12, 160, 90) * .5; m[:len(th)] += th[:len(m)]
    return reverb(m, .4, .15)
def snap():
    th = sub_boom(.3, 140, 60); c = click(2500, .03); th[:len(c)] += c * .7; return reverb(th, .6, .2)
def slide(d=.6):
    n = int(d * SR); x = sweep_filter(rng.standard_normal(n), 900, 2600, q=2.5) * np.sin(np.pi * np.arange(n) / n) ** 1.5
    return x / (np.abs(x).max() + 1e-9)
def ding():
    return chime((1760, 2637, 3520), 1.2)

cues = []
add = lambda t, s, g=1, p=0: cues.append((t, s, g, p))
# intro / hook
add(0.0, whoosh(.45, 600, 9000, .5, True), .35)
add(0.12, impact(.6, 1.8), .45); add(.15, whoosh(.8, 2000, 12000, .3, True), .25)
add(.32, shimmer(1.4, 2600), .22)
add(.74, pop(1400), .3); add(.78, shimmer(1.0, 3200), .2)
# full -> circle
add(2.2, whoosh(.6, 250, 7000, .7), .55); add(2.75, sub_boom(.8, 110, 40), .45)
add(2.74, pop(900), .45, -.5); add(2.8, shimmer(.8, 3000), .18, -.5)
add(3.82, pop(1100), .45, .5); add(3.9, ding(), .18, .5)
add(4.2, whoosh(.35, 800, 8000, .5, False), .3); add(4.25, click(3000), .3)
add(4.98, blip(2200, .06), .3); add(5.08, blip(2200, .06), .3)
add(5.38, shutter_snd(), .7)
for i in range(4): add(6.0 + i * .22, whoosh(.5, 300, 4000, .5, False), .3, -.8 + i * .5)
# RSMB reveal
add(7.6, pop(1300), .4); add(7.62, shimmer(.8, 2200), .15)
add(8.3, rev_swell(.4), .5)
add(8.7, impact(1.1, 3.0), .9); add(8.7, braam(2.4, 49), .45); add(8.72, crack(.3), .3)
add(8.95, pop(1600), .4)
for i in range(3): add(9.25 + i * .08, click(5000, .03), .25, -.4 + i * .4)
# circle -> full + social
add(9.75, whoosh(.6, 250, 7000, .7), .55)
for t0 in (10.12, 10.5, 10.86): add(t0, click(4200, .03), .45); add(t0 + .03, pop(1000), .35)
add(11.3, ding(), .3)
# into the example insert
add(11.75, riser(.6, 200, 7000), .45)
add(CUT - .1, rev_swell(.12), .4)
add(CUT, impact(1.0, 2.6), .85); add(CUT, whoosh(.5, 300, 9000, .3, True), .5); add(CUT + .02, crack(.25), .35)
for t0, pan in ((13.2, -.6), (14.6, .6), (15.8, -.4), (17.0, .5), (18.3, -.5)): add(t0, whoosh(.9, 200, 3000, .5, True), .32, pan)
for t0 in (CUT + .45, CUT + 2.1, CUT + 4.05, CUT + 5.6): add(t0, pop(900), .25)
add(CUT + 2.45, blip(1900, .08), .25); add(CUT + 2.55, blip(2850, .1), .25)
add(CUT + 6.4, rev_swell(.2), .45)
add(CUT + 6.55, impact(.9, 3.0), .75); add(CUT + 6.6, shimmer(1.8, 2600), .3)
# example -> circle
add(CUT + INS - .2, whoosh(.5, 300, 8000, .6), .55); add(CUT + INS + .05, sub_boom(.9, 120, 40), .5); add(CUT + INS + .1, shimmer(1.0, 2400), .15)
# clip cards
add(mT(12.98), whoosh(.4, 600, 6000, .5, False), .35); add(mT(13.02), pop(800), .4, -.5); add(mT(13.12), pop(950), .4, .5)
add(mT(13.5), pop(1300), .3); add(mT(14.5), pop(1500), .3)
add(mT(15.54), ding(), .2, -.4); add(mT(16.86), whoosh(.5, 400, 6000, .5, False), .3, .5); add(mT(16.9), blip(2400), .2, .5)
for s0 in (18.95, 19.65, 20.05): add(mT(s0), pop(1200), .3, .3)
# timeline scene
add(mT(20.4), whoosh(.5, 300, 7000, .6), .45); add(mT(20.55), click(3000), .25)
add(mT(20.95), slide(.85), .35, -.3); add(mT(21.85), snap(), .6)
add(mT(23.4), slide(1.0), .35, .3); add(mT(24.45), snap(), .6)
for j in range(8): add(mT(25.0) + (j + 1) * .32, razor(), .5, -.6 + j * .17)
for j in range(9): add(mT(27.7) + j * .1 + .45, blip(1200 + j * 120, .05), .2, -.6 + j * .15)
add(mT(29.8), rev_swell(.12), .35); add(mT(29.9), whoosh(.5, 400, 8000, .5), .45); add(mT(29.96), impact(.5, 1.8), .45)
add(mT(30.5), whoosh(.8, 2000, 9000, .5, True), .2)
# full + creativity
add(mT(31.55), whoosh(.6, 250, 7000, .7), .55)
add(mT(33.28), zap(), .35); add(mT(33.3), shimmer(1.4, 2000), .3)
add(mT(34.15), pop(800), .45); add(mT(36.0), rev_swell(.4)[:, ::-1] if False else rev_swell(.4), .35); add(mT(36.06), pop(1000), .4)
add(mT(36.7), whoosh(.3, 2000, 12000, .3, False), .3); add(mT(36.75), pop(1300), .4)
# settings
add(mT(37.15), whoosh(.6, 250, 7000, .7), .55)
add(mT(37.6), whoosh(.5, 500, 7000, .5, False), .35); add(mT(37.8), click(3000), .3)
add(mT(38.54), ding(), .25)
add(mT(39.75), whoosh(.6, 400, 4000, .6, True), .35)
add(mT(41.15), tone_rise(.95, 330, 990), .22)
for i in range(12): add(mT(41.15) + i * .08, click(5500, .02), .2)
add(mT(41.7), impact(.5, 1.6), .45); add(mT(41.72), shimmer(1.0, 3000), .25)
add(mT(43.4), whoosh(.5, 600, 5000, .5, False), .3)
# full + chat
add(mT(44.05), whoosh(.6, 250, 7000, .7), .55)
add(mT(44.6), pop(900), .4); add(mT(45.84), shimmer(1.0, 2600), .2)
# CTA
add(mT(47.35), whoosh(.6, 250, 7000, .7), .55); add(mT(47.7), click(3000), .25)
for k in range(10): add(mT(47.95) + k * .055 + rng.random() * .01, click(2500 + rng.random() * 2500, .035), .22, (rng.random() - .5) * .3)
add(mT(48.55), pop(800), .45); add(mT(48.6), whoosh(.25, 1500, 9000, .3, False), .25)
add(mT(48.9), pop(1700, .1), .3, .3)
add(mT(49.2), whoosh(.5, 800, 10000, .5, True), .45, -.6)
add(mT(49.55), ding(), .28, .2)
add(mT(50.2), zap(), .3); add(mT(50.25), shimmer(1.6, 2400), .25)

for (t0, s, g, p) in cues: place(s, t0, g, p)
sfx = np.tanh(np.stack([L, R]) * 1.1) / 1.1
bed = pad_bed()

def readwav(p):
    w = wave.open(p); n = w.getnframes(); ch = w.getnchannels(); d = np.frombuffer(w.readframes(n), np.int16).astype(np.float32) / 32768
    return d.reshape(-1, ch).T
v = readwav(sys.argv[1])
ci = int(CUT * SR); fade = int(.008 * SR)
a = v[:, :ci].copy(); b = v[:, ci:].copy()
a[:, -fade:] *= np.linspace(1, 0, fade); b[:, :fade] *= np.linspace(0, 1, fade)
voice = np.concatenate([a, np.zeros((2, int(INS * SR))), b], axis=1)
vo = np.zeros((2, N)); n = min(N, voice.shape[1]); vo[:, :n] = voice[:, :n]
venv = lp(np.abs(vo).mean(0), 8, 1); venv /= venv.max() + 1e-9
duck = lp(1 - .55 * np.clip(venv * 4, 0, 1), 5, 1)
sduck = lp(1 - .3 * np.clip(venv * 4, 0, 1), 8, 1)
mix = sfx * .55 * sduck + bed * .16 * duck
# lift the bed during the insert (no voice)
ins = np.zeros(N); i0, i1 = int(CUT * SR), int((CUT + INS) * SR); ins[i0:i1] = 1; ins = lp(ins, 2, 1)
mix += bed * .14 * ins
fd = np.ones(N); k = int(.3 * SR); fd[:k] = np.linspace(0, 1, k); k = int(.5 * SR); fd[-k:] = np.linspace(1, 0, k)
mix *= fd
def writewav(p, x):
    x = np.clip(x, -1, 1); w = wave.open(p, 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((x.T * 32767).astype(np.int16).tobytes()); w.close()
writewav(os.path.join(sys.argv[2], 'sfx_music.wav'), mix / max(1, np.abs(mix).max() / .95))
writewav(os.path.join(sys.argv[2], 'voice_timeline.wav'), vo)
print('cues', len(cues), 'peak', np.abs(mix).max())
