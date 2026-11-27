# Δημιουργεί assets/pulse_soundtrack.wav (32s, 120 BPM, mono) με καθαρή Python.
import math, random, wave, struct
SR = 44100
DUR = 32
N = SR * DUR
buf = [0.0] * N
random.seed(7)

def add(t0, samples, gain=1.0):
    i0 = int(t0 * SR)
    for i, v in enumerate(samples):
        j = i0 + i
        if j >= N: break
        buf[j] += v * gain

def kick():
    out, ph = [], 0.0
    for i in range(int(0.30 * SR)):
        t = i / SR
        f = 45 + 110 * math.exp(-t * 28)
        ph += 2 * math.pi * f / SR
        out.append(math.sin(ph) * math.exp(-t * 9))
    return out

def hat():
    return [(random.random() * 2 - 1) * math.exp(-(i / SR) * 70) for i in range(int(0.05 * SR))]

def clap():
    return [(random.random() * 2 - 1) * math.exp(-(i / SR) * 22) for i in range(int(0.18 * SR))]

def impact(length=1.4):
    out = []
    for i in range(int(length * SR)):
        t = i / SR
        out.append(((random.random() * 2 - 1) * 0.6 + math.sin(2 * math.pi * 40 * t)) * math.exp(-t * 3))
    return out

def riser(t0, length):
    out, ph = [], 0.0
    n = int(length * SR)
    for i in range(n):
        p = i / n
        ph += 2 * math.pi * (200 + 2400 * p * p) / SR
        out.append(math.sin(ph) * p * 0.5 + (random.random() * 2 - 1) * p * p * 0.4)
    add(t0, out, 0.5)

def note(freq, length, kind="saw", decay=6.0):
    out = []
    for i in range(int(length * SR)):
        t = i / SR
        x = freq * t
        if kind == "saw":
            v = 2 * (x - math.floor(x + 0.5)) * 0.5 + math.sin(2 * math.pi * x) * 0.7
        else:
            v = 1.0 if (x % 1) < 0.5 else -1.0
            v *= 0.35
        out.append(v * math.exp(-t * decay))
    return out

def hz(m): return 440.0 * 2 ** ((m - 69) / 12.0)

BEAT = 0.5
chords = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]   # Am F C G
roots = [33, 29, 36, 31]

add(0, impact(), 0.9)
riser(2, 2)
for beat in range(int(4 / BEAT), int(30 / BEAT)):
    t = beat * BEAT
    add(t, kick(), 0.9)
    add(t + BEAT / 2, hat(), 0.18)
    if t >= 12 and beat % 2 == 1:
        add(t, clap(), 0.3)
for step in range(int(4 / (BEAT / 2)), int(30 / (BEAT / 2))):
    t = step * BEAT / 2
    bar = int(t // 2) % 4
    add(t, note(hz(roots[bar]), 0.24, "saw", 7.0), 0.28)
for step in range(int(4 / (BEAT / 4)), int(30 / (BEAT / 4))):
    t = step * BEAT / 4
    bar = int(t // 2) % 4
    ch = chords[bar]
    add(t, note(hz(ch[step % 3] + 12), 0.14, "sq", 14.0), 0.10 if t < 12 else 0.14)
for t in (4, 12, 22, 28):
    add(t, impact(1.0), 0.7)

peak = max(abs(v) for v in buf) or 1
w = wave.open("assets/pulse_soundtrack.wav", "wb")
w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
data = bytearray()
for i, v in enumerate(buf):
    t = i / SR
    g = 1.0 if t < 30.2 else max(0.0, (32 - t) / 1.8)
    x = math.tanh(v / peak * 1.6) * 0.85 * g
    data += struct.pack("<h", int(x * 32767))
w.writeframes(bytes(data)); w.close()
print("OK")
