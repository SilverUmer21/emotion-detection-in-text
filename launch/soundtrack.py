# SUBTEXT launch video soundtrack, synthesised from the render's event log so every hit lands on its frame (numpy only).
#   python3 launch/soundtrack.py out/events.json out/soundtrack.wav
# Music: a deadpan office groove at 105 BPM (finger bass, FM electric piano, tight kit) in Dm9 / G13 / Bbmaj7 A7.
# It stops dead for the punchline. SFX: stamps, paper, a CRT, a factory, a fight-game VS card, an arcade continue screen.
import json
import sys
import wave

import numpy as np

SR = 44100
events_path, out_path = sys.argv[1], sys.argv[2]
log = json.load(open(events_path))
EV = log['events']
DUR = log['duration'] + 1.5
N = int(DUR * SR)
music = np.zeros((N, 2))
sfx = np.zeros((N, 2))
rng = np.random.default_rng(28)

BPM = 105
BEAT = 60 / BPM
BAR = 4 * BEAT
S16 = BEAT / 4
SWING = .014                       # late 16ths for the groove


def times(kind, **match):
    return [e['t'] for e in EV if e['type'] == kind and all(e.get(k) == v for k, v in match.items())]


def first(kind, **match):
    t = times(kind, **match)
    return t[0] if t else None


def hz(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def tt(d):
    return np.arange(int(d * SR)) / SR


def place(buf, sig, t, gain=1.0, pan=0.0):
    i = int(round(t * SR))
    if i >= N or i + len(sig) <= 0:
        return
    if i < 0:
        sig, i = sig[-i:], 0
    sig = sig[:N - i]
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    buf[i:i + len(sig), 0] += sig * gain * l * 1.414
    buf[i:i + len(sig), 1] += sig * gain * r * 1.414


def band(x, lo, hi):
    f = np.fft.rfft(x)
    fr = np.fft.rfftfreq(len(x), 1 / SR)
    f[(fr < lo) | (fr > hi)] = 0
    return np.fft.irfft(f, len(x))


def noise(d):
    return rng.standard_normal(int(d * SR))


def env_ad(t, a, d):
    return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t * d)


# =============================================================================================
# instruments
# =============================================================================================
def ep(notes, d, vel=1.0, bright=1.0):
    """FM electric piano: ratio-1 modulator for the warm body, a fast 14x partial for the tine."""
    t = tt(d)
    out = np.zeros_like(t)
    for n in notes:
        f = hz(n)
        idx = (1.6 * np.exp(-t * 8) + .2) * bright
        out += np.sin(2 * np.pi * f * t + idx * np.sin(2 * np.pi * f * t))
        out += .07 * np.sin(2 * np.pi * f * 14 * t) * np.exp(-t * 45)
    env = np.minimum(1, t * 600) * np.exp(-t * 2.6) * np.clip((d - t) / .04, 0, 1)
    return out * env * (1 + .12 * np.sin(2 * np.pi * 4.8 * t)) / max(1, len(notes)) * vel


def bass(n, d, vel=1.0):
    t = tt(d)
    f = hz(n)
    s = np.sin(2 * np.pi * f * t) + .4 * np.sin(2 * np.pi * 2 * f * t) + .15 * np.sin(2 * np.pi * 3 * f * t)
    env = np.minimum(1, t * 400) * np.exp(-t * 3.5) * np.clip((d - t) / .025, 0, 1)
    pluck = band(noise(d), 200, 1800) * np.exp(-t * 80) * .25
    return np.tanh((s * env) * 1.5) * .55 * vel + pluck * vel


def kick(vel=1.0):
    t = tt(.42)
    f = 46 + 95 * np.exp(-t * 30)
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 8) + band(noise(.42), 1500, 6000) * np.exp(-t * 120) * .2) * vel


def snare(vel=1.0):
    t = tt(.26)
    return (band(noise(.26), 1500, 9000) * np.exp(-t * 20) * .55 + np.sin(2 * np.pi * 190 * t) * np.exp(-t * 28) * .45) * vel


def clap(vel=1.0):
    t = tt(.3)
    n = band(noise(.3), 900, 6000)
    e = sum(np.exp(-np.maximum(0, t - o) * 90) * (t >= o) for o in (0, .011, .022)) + np.exp(-np.maximum(0, t - .03) * 14) * (t >= .03)
    return n * e * .4 * vel


def hat(open_=False, vel=1.0):
    d = .32 if open_ else .05
    t = tt(d)
    return band(noise(d), 7000, 16000) * np.exp(-t * (9 if open_ else 70)) * .32 * vel


def crash(vel=1.0):
    t = tt(2.2)
    return band(noise(2.2), 3500, 16000) * np.exp(-t * 1.8) * .35 * vel


def brass(notes, d, vel=1.0):
    t = tt(d)
    out = np.zeros_like(t)
    for n in notes:
        for det in (-.08, .08):
            f = hz(n + det)
            for h in range(1, 10):
                out += np.sin(2 * np.pi * f * h * t + h) / h * np.exp(-h * .25)
    env = np.minimum(1, t * 60) * np.exp(-t * 3) * np.clip((d - t) / .05, 0, 1)
    return np.tanh(out * env * .6) / max(1, len(notes)) * vel


def riser(d):
    t = tt(d)
    x = t / d
    return band(noise(d), 400, 9000) * x ** 2.5 * .4 + np.sin(2 * np.pi * np.cumsum(180 + 1500 * x ** 2) / SR) * x ** 2 * .12


def reverse_cymbal(d):
    return crash(1)[:int(d * SR)][::-1] * .8


# =============================================================================================
# SFX
# =============================================================================================
def stamp_thunk():
    t = tt(.5)
    body = np.sin(2 * np.pi * np.cumsum(85 + 70 * np.exp(-t * 40)) / SR) * np.exp(-t * 14)
    slap = band(noise(.5), 900, 5000) * np.exp(-t * 55)
    wood = np.sin(2 * np.pi * 420 * t) * np.exp(-t * 60) * .4
    return (body * 1.1 + slap * .7 + wood) * .9


def paper_slide(d=.28, up=True):
    t = tt(d)
    x = t / d
    n = band(noise(d), 1200, 7000)
    return n * np.sin(np.pi * x) ** 1.5 * .35 + band(noise(d), 120, 600) * np.exp(-((x - .9) * 9) ** 2) * (.5 if up else .1)


def whoosh(d=.3, rise=True):
    t = tt(d)
    x = t / d
    k = x if rise else 1 - x
    return (band(noise(d), 300, 1500) * (1 - k) + band(noise(d), 1500, 8000) * k) * np.sin(np.pi * x) ** 2 * .45


def blip(ch, i):
    """SUBTEXT's voice: one soft square-ish blip per letter, pitched on a pentatonic scale."""
    scale = [0, 2, 4, 7, 9, 12, 14]
    n = 74 + scale[(ord(ch.lower()) * 7 + i) % len(scale)]
    t = tt(.05)
    f = hz(n)
    s = np.sin(2 * np.pi * f * t) + np.sin(2 * np.pi * 3 * f * t) / 3 + np.sin(2 * np.pi * 5 * f * t) / 5
    return s * np.minimum(1, t * 900) * np.exp(-t * 55) * .32


def beep(n, d=.09, kind='square', vel=1.0):
    t = tt(d)
    f = hz(n)
    if kind == 'square':
        s = np.sign(np.sin(2 * np.pi * f * t)) * .5
    else:
        s = np.sin(2 * np.pi * f * t)
    return s * np.minimum(1, t * 800) * np.clip((d - t) / .015, 0, 1) * .35 * vel


def chirp(f0, f1, d=.12, vel=1.0):
    t = tt(d)
    return np.sin(2 * np.pi * np.cumsum(np.geomspace(f0, f1, len(t))) / SR) * np.exp(-t * 18) * .4 * vel


def click(f=2200, d=.03, vel=1.0):
    t = tt(d)
    return (band(noise(d), 1500, 9000) * .6 + np.sin(2 * np.pi * f * t) * .5) * np.exp(-t * 160) * vel


def lamp_clunk():
    t = tt(.35)
    return (band(noise(.35), 100, 2000) * np.exp(-t * 50) + np.sin(2 * np.pi * 100 * t) * np.exp(-t * 7) * .25 * (np.sin(2 * np.pi * 50 * t) > 0)) * .6


def crt_on():
    t = tt(.6)
    whine = np.sin(2 * np.pi * np.cumsum(np.linspace(9000, 6500, len(t))) / SR) * np.exp(-t * 4) * .08
    static = band(noise(.6), 2000, 12000) * np.exp(-t * 9) * .35
    thump = np.sin(2 * np.pi * 60 * t) * np.exp(-t * 18) * .6
    return whine + static + thump


def room_tone(d):
    """Night office: fluorescent hum and a little air, swelling in after the lamp."""
    t = tt(d)
    hum = (np.sin(2 * np.pi * 120 * t) * .5 + np.sin(2 * np.pi * 240 * t) * .2) * .05
    air = band(noise(d), 200, 3000) * .025
    return (hum + air) * np.minimum(1, t * 3) * np.clip((d - t) / .05, 0, 1)


def clock_tick(j):
    t = tt(.05)
    return np.sin(2 * np.pi * (2400 if j % 2 else 2000) * t) * np.exp(-t * 140) * .3


def chop():
    t = tt(.2)
    return band(noise(.2), 2000, 10000) * np.exp(-t * 60) * .6 + np.sin(2 * np.pi * 2600 * t) * np.exp(-t * 35) * .2


def crate_knock():
    t = tt(.15)
    return (np.sin(2 * np.pi * 310 * t) + .5 * np.sin(2 * np.pi * 640 * t)) * np.exp(-t * 45) * .5


def motor(d):
    t = tt(d)
    s = np.sin(2 * np.pi * 55 * t) * .5 + np.sin(2 * np.pi * 110 * t) * .25 + band(noise(d), 80, 400) * .2
    return s * np.minimum(1, t * 4) * np.clip((d - t) / .2, 0, 1) * (1 + .3 * np.sin(2 * np.pi * 9 * t)) * .25


def relay(i):
    t = tt(.14)
    tone = np.sin(2 * np.pi * hz(60 + i) * t) * np.exp(-t * 20) * .22
    c = np.zeros_like(t)
    k = click(2400, .03)
    c[:len(k)] += k * .6
    return tone + c


def gurgle(d):
    t = tt(d)
    lfo = (np.sin(2 * np.pi * 7 * t) > .3).astype(float)
    return band(noise(d), 300, 1600) * (.5 + .5 * lfo) * np.sin(np.pi * t / d) * .3


def plink(v):
    return beep(84 + int(v * 12), .07, 'sine', .35 + v)


def buzzer():
    t = tt(.35)
    return np.sign(np.sin(2 * np.pi * 220 * t)) * ((t * 8).astype(int) % 2 == 0) * np.exp(-t * 3) * .14


def cork_pop():
    t = tt(.2)
    pop = np.sin(2 * np.pi * np.cumsum(np.linspace(900, 300, len(t))) / SR) * np.exp(-t * 40) * .6
    out = np.zeros(int(.8 * SR))
    out[:len(pop)] += pop
    for k, n in enumerate([88, 91, 95, 100]):
        b = beep(n, .25, 'sine', .7)
        j = int((.06 + k * .05) * SR)
        out[j:j + len(b)] += b[:len(out) - j]
    return out


def boom(vel=1.0):
    t = tt(1.4)
    return (np.sin(2 * np.pi * np.cumsum(30 + 90 * np.exp(-t * 10)) / SR) * np.exp(-t * 2.8) * 1.2
            + band(noise(1.4), 60, 3000) * np.exp(-t * 7) * .5) * vel


def bell():
    t = tt(1.6)
    f = 1180
    s = sum(a * np.sin(2 * np.pi * f * m * t) * np.exp(-t * k) for m, a, k in [(1, 1, 2.2), (2.4, .5, 3.5), (3.9, .3, 5), (5.6, .2, 7)])
    return s * np.minimum(1, t * 900) * .35


def coin():
    out = np.zeros(int(.4 * SR))
    for k, n in enumerate([88, 95]):
        b = beep(n, .16 if k else .06, 'square', .8)
        j = int(k * .06 * SR)
        out[j:j + len(b)] += b[:len(out) - j]
    return out


def sparkle():
    out = np.zeros(int(.6 * SR))
    for k, n in enumerate([96, 100, 103, 108]):
        b = beep(n, .2, 'sine', .5)
        j = int(k * .045 * SR)
        out[j:j + len(b)] += b[:len(out) - j]
    return out


# =============================================================================================
# the score
# =============================================================================================
part_at = {e['part']: e['t'] for e in EV if e['type'] == 'music' and e['part'] != 'groove'}
grooves = times('music', part='groove')
T0 = part_at['intro']
T_COMBO, T_SHEET = grooves[0], grooves[1]
T_BUILD, T_DROP, T_STOP, T_OUTRO, T_END = part_at['build'], part_at['drop'], part_at['stop'], part_at['outro'], part_at['end']

# Chords per bar: (bass root, EP voicing). Bar 4 of the loop splits Bbmaj7 / A7.
DM9 = (38, [65, 69, 72, 76])
G13 = (43, [65, 71, 76])
BB7 = (46, [62, 65, 69])
A7 = (45, [61, 64, 67])
F7 = (41, [64, 69, 72, 76])
LOOP = [DM9, G13, DM9, (BB7, A7)]


def chords_for(bar_index):
    c = LOOP[bar_index % 4]
    return (c, c) if not isinstance(c[0], tuple) else c   # (first half, second half)


def pos(bar_start, p):
    return bar_start + p * S16 + (SWING if p % 2 else 0)


BASS_LINE = [(0, 0, .3), (3, 0, .1), (6, 12, .1), (7, 0, .14), (10, 10, .12), (11, 12, .1), (14, 7, .12)]


def groove_bar(b0, bi, *, drums='full', keys='stabs', bass_on=True, level=1.0):
    first_half, second_half = chords_for(bi)
    if bass_on:
        for p, semi, d in BASS_LINE:
            root = (first_half if p < 8 else second_half)[0]
            place(music, bass(root + semi, d + .05, .95 if p == 0 else .75), pos(b0, p), .9 * level, -.05)
        if bi % 4 == 3:
            place(music, bass(37, .1, .7), pos(b0, 15), .8 * level)          # leading tone back to D
    if drums in ('full', 'light', 'kick'):
        for p in (0, 7, 10):
            place(music, kick(1 if p == 0 else .8), pos(b0, p), .95 * level)
    if drums in ('full', 'light'):
        for p in (4, 12):
            place(music, snare(1), pos(b0, p), .55 * level, .1)
        for p in (9, 15):
            place(music, snare(.22), pos(b0, p), .5 * level, .1)
        for p in range(16):
            if drums == 'full' and p == 14:
                place(music, hat(True, .7), pos(b0, p), .5 * level, .35)
            else:
                place(music, hat(False, [1, .4, .7, .4][p % 4]), pos(b0, p), .55 * level, .35)
    if keys == 'stabs':
        place(music, ep(first_half[1], .22, .9), pos(b0, 2), .55 * level, -.25)
        place(music, ep(first_half[1], .18, .7), pos(b0, 6), .5 * level, -.25)
        place(music, ep(second_half[1], .6, .85), pos(b0, 10), .5 * level, -.25)
    elif keys == 'arp':
        for p in range(16):
            ch = (first_half if p < 8 else second_half)[1]
            tones = ch + [n + 12 for n in ch]
            place(music, ep([tones[p % len(tones)]], .16, .6, .7), pos(b0, p), .45 * level, .3 if p % 2 else -.3)


def bars(t_from, t_to):
    out, b = [], t_from
    while b < t_to - .01:
        out.append(b)
        b += BAR
    return out


# Intro (title): one big chord, the bass drops, sparse hats.
place(music, ep(DM9[1], 2.2, 1.1, 1.3), T0, .7)
place(music, bass(26, 1.2, 1), T0, .9)
place(music, kick(1.2), T0, 1.0)
place(music, crash(1), T0, .6)
for p in range(4, 16, 2):
    place(music, hat(False, .5), pos(T0, p), .5, .35)
place(music, ep(DM9[1], .3, .6), pos(T0, 12), .4, -.25)

# Groove (combo).
for i, b0 in enumerate(bars(T_COMBO, T_BUILD)):
    groove_bar(b0, i)

# Build (factory): thin first bar, arps in bars 2-3, a snare roll and riser into the drop.
for i, b0 in enumerate(bars(T_BUILD, T_DROP)):
    if i == 0:
        groove_bar(b0, i, drums='kick', keys=None)
    elif i < 3:
        groove_bar(b0, i, drums='light', keys='arp')
    else:
        groove_bar(b0, i, drums='kick', keys='arp', level=.9)
        for p in range(8, 16):
            place(music, snare(.3 + .07 * (p - 8)), pos(b0, p), .6, .1)
        place(music, riser(BAR - S16 * 2), b0, .6)
        place(music, reverse_cymbal(BEAT * 1.5), T_DROP - BEAT * 1.5, .5)

# Drop (VS): harder kit, brass on the changes, a victory chord on the win.
DROP_CHORDS = [DM9, G13, F7]
for i, b0 in enumerate(bars(T_DROP, T_SHEET)):
    root, voicing = DROP_CHORDS[min(i, 2)]
    for p, semi, d in BASS_LINE:
        place(music, bass(root + semi, d + .05, 1), pos(b0, p), .95)
    for p in (0, 3, 7, 10):
        place(music, kick(1.1), pos(b0, p), 1.0)
    for p in (4, 12):
        place(music, snare(1), pos(b0, p), .55, .1)
        place(music, clap(1), pos(b0, p), .6, -.1)
    for p in range(0, 16, 2):
        place(music, hat(p % 4 == 2, .8), pos(b0, p), .5, .35)
    place(music, brass(voicing, .45 if i < 2 else 1.4, 1), b0, .5)
    place(music, brass(voicing, .2, .8), pos(b0, 10), .4)
    if i == 2:
        place(music, crash(1), b0, .6)

# Groove again (stat sheet), then the dead stop on the punchline.
for i, b0 in enumerate(bars(T_SHEET, T_OUTRO)):
    groove_bar(b0, i, drums='light')

# Outro (continue): sparse first bar under the countdown, the groove back, one last chord.
for i, b0 in enumerate(bars(T_OUTRO, T_END)):
    if i == 0:
        groove_bar(b0, i, drums=None, keys=None)
        place(music, ep(DM9[1], 1.2, .8), b0, .45)
    else:
        groove_bar(b0, i)
place(music, ep(DM9[1] + [81], 2.4, 1.2, 1.3), T_END, .75)
place(music, bass(26, 1.6, 1), T_END, .9)
place(music, kick(1.2), T_END, 1)
place(music, crash(1), T_END, .55)

# Hard stop: silence from the punchline until the outro.
i0, i1 = int(T_STOP * SR), int(T_OUTRO * SR)
fade = np.linspace(1, 0, int(.012 * SR))
music[i0:i0 + len(fade)] *= fade[:, None]
music[i0 + len(fade):i1] = 0

# =============================================================================================
# SFX from the events
# =============================================================================================
blip_i = 0
for e in EV:
    t, k = e['t'], e['type']
    if k == 'blip':
        place(sfx, blip(e['ch'], blip_i), t, .65, .05)
        blip_i += 1
    elif k == 'lamp':
        place(sfx, lamp_clunk(), t, .8)
    elif k == 'room':
        place(sfx, room_tone(e['until'] - t), t, .8)
        for j in range(int(e['until'] - t) + 1):
            place(sfx, clock_tick(j), t + .4 + j, .5, .6)
    elif k == 'read':
        for j in range(int(e['dur'] / .11)):
            place(sfx, beep(91 + (j * 5) % 7, .025, 'sine', .4), t + j * .11, .35, .1)
    elif k == 'crt':
        place(sfx, crt_on(), t, .9)
    elif k == 'memo':
        place(sfx, paper_slide(.26), t, .9, -.1)
    elif k == 'slide':
        place(sfx, paper_slide(.24, False), t, .7, -.4)
    elif k == 'lift':
        place(sfx, whoosh(.3, True), t + .05, .5, .3)
    elif k == 'stamp':
        place(sfx, stamp_thunk(), t, 1.0)
    elif k == 'hop':
        place(sfx, chirp(500, 1100, .12), t, .6)
    elif k == 'box':
        place(sfx, chirp(700, 1400, .07), t, .5)
    elif k == 'combo':
        n = e['n']
        place(sfx, beep(79 + n * 2, .06, 'square', .7), t, .5, .4)
        place(sfx, beep(86 + n * 2, .1, 'square', .7), t + .055, .5, .4)
    elif k == 'bubble':
        place(sfx, chirp(400, 900, .06), t, .6, .3)
    elif k == 'key':
        place(sfx, click(1600, .04, 1.2), t, .8)
    elif k == 'logo':
        place(sfx, boom(1), t, .8)
    elif k == 'type':
        for j in range(e['n']):
            place(sfx, click(2600, .02, .4), t + j * .018, .4, .2)
    elif k == 'zoom':
        place(sfx, whoosh(.12, True), t, .7)
    elif k == 'flash':
        place(sfx, band(noise(.3), 3000, 12000) * np.exp(-tt(.3) * 12) * .6, t, .8)
    elif k == 'chop':
        place(sfx, chop(), t, .8, -.2 + e['i'] * .07)
    elif k == 'crate':
        place(sfx, crate_knock(), t, .6)
    elif k == 'belt':
        last = max(times('intake'))
        place(sfx, motor(last - t + .3), t, .9)
    elif k == 'intake':
        place(sfx, crate_knock()[:int(.08 * SR)] * .6, t, .5, .6)
    elif k == 'layer':
        place(sfx, relay(e['i']), t, .6)
    elif k == 'tick':
        place(sfx, click(3200, .015, .3), t, .4, .5)
    elif k == 'pour':
        place(sfx, gurgle(1.8), t, .8)
    elif k == 'jar':
        if e['v'] > .05:
            place(sfx, plink(e['v']), t + .3, .5)
    elif k == 'alarm':
        place(sfx, buzzer(), t, .7)
    elif k == 'cork':
        place(sfx, cork_pop(), t, .9)
    elif k == 'vs':
        place(sfx, boom(1.2), t, 1.0)
        place(sfx, stamp_thunk(), t, .6)
    elif k == 'whoosh':
        place(sfx, whoosh(.35, True), t, .8, -.5)
        place(sfx, whoosh(.35, True), t, .8, .5)
    elif k == 'round':
        place(sfx, bell(), t, .7)
    elif k == 'fill':
        for j in range(e['n']):
            place(sfx, beep(72 + j // 2, .03, 'square', .5), t + j * e['dur'] / e['n'], .45)
    elif k == 'win':
        place(sfx, boom(.8), t, .7)
    elif k == 'menu':
        place(sfx, beep(81, .05, 'square'), t, .6)
        place(sfx, beep(88, .08, 'square'), t + .05, .6)
    elif k == 'row':
        place(sfx, beep(84, .04, 'square', .7), t, .5)
    elif k == 'sweat':
        place(sfx, chirp(900, 350, .18), t, .6)
    elif k == 'count':
        place(sfx, beep(81 if e['n'] > 7 else 84, .14, 'square'), t, .7)
    elif k == 'insert':
        place(sfx, coin(), t, .8)
    elif k == 'wink':
        place(sfx, sparkle(), t, .8, .3)

# =============================================================================================
# mix: duck the music under the big hits, soft-clip, normalise
# =============================================================================================
hits = times('stamp') + times('vs') + times('logo') + times('win')
duck = np.ones(N)
tn = np.arange(N) / SR
for h in hits:
    i = int(h * SR)
    j = min(N, i + int(.35 * SR))
    duck[i:j] = np.minimum(duck[i:j], 1 - .45 * np.exp(-(tn[i:j] - h) * 9))
mix = music * .62 * duck[:, None] + sfx * .8
mix = np.tanh(mix * 1.1) / np.tanh(1.1)
mix /= np.max(np.abs(mix)) + 1e-9
mix *= .95
mix = mix[:int(log['duration'] * SR)]
fade_out = np.linspace(1, 0, int(.3 * SR))
mix[-len(fade_out):] *= fade_out[:, None]

with wave.open(out_path, 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((mix * 32767).astype('<i2').tobytes())
print('wrote', out_path, f'{len(mix) / SR:.2f}s')
