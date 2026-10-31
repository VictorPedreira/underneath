"""Gera o som das bolinhas da home: chirp de leitura de dados, rajada irregular de bipes senoidais
curtos (20 a 60 ms), 6 kHz e 7,5 kHz alternados, mono, sem eco nem graves.

  python3 tools/chirp.py /tmp/chirp.wav
  afconvert -f m4af -d aac -b 96000 /tmp/chirp.wav assets/audio/chirp.m4a
"""
import math, random, struct, sys, wave

RATE = 44100
PEAK = 0.14          # ~ -17 dBFS: discreto
random.seed(7)       # mesmo arquivo a cada geração

samples = [0.0] * int(RATE * 0.62)
t = 0.004
freqs = (6000.0, 7500.0)
k = 0
while True:
    dur = random.uniform(0.020, 0.060)
    if t + dur > 0.6:
        break
    f = freqs[k % 2]
    amp = PEAK * random.uniform(0.6, 1.0)
    n0, n = int(t * RATE), int(dur * RATE)
    ramp = int(0.003 * RATE)  # 3 ms de entrada e saída: sem estalo
    for i in range(n):
        e = 1.0
        if i < ramp:
            e = 0.5 - 0.5 * math.cos(math.pi * i / ramp)
        elif i > n - ramp:
            e = 0.5 - 0.5 * math.cos(math.pi * (n - i) / ramp)
        samples[n0 + i] += amp * e * math.sin(2 * math.pi * f * i / RATE)
    k += 1
    # Pausas irregulares; às vezes dois bipes colados, como dados em pacote.
    t += dur + (random.uniform(0.003, 0.008) if random.random() < 0.3 else random.uniform(0.012, 0.045))

with wave.open(sys.argv[1], "wb") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(RATE)
    w.writeframes(b"".join(struct.pack("<h", int(max(-1, min(1, s)) * 32767)) for s in samples))
print("bipes:", k)
