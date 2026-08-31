# duv • duv — Seedance / Veo / Kling prompt

Reference rasmlarni SHU TARTIBDA biriktiring:
1. `1-ikonkalar/1-yolovchi.png`
2. `1-ikonkalar/2-yuk.png`
3. `1-ikonkalar/3-haydovchi.png`
4. `2-tugmalar/tugma-yolovchiman.png`
5. `2-tugmalar/tugma-yuk-yuboraman.png`
6. `2-tugmalar/tugma-haydovchiman.png`
7. `5-namuna/ilova-bosh-ekrani.png`  ← oxirgi kadr shunga o'xshashi kerak

---

## ASOSIY PROMPT — 8 soniya

```
[STYLE]
Pixar-quality 3D animation. Soft global illumination, warm golden-hour key light,
shallow depth of field, gentle film grain. Miniature tilt-shift diorama — a
handcrafted tabletop model of Uzbekistan. Palette: terracotta, turquoise, saffron,
cotton white. Everything looks tactile, stitched and touchable.

[WORLD — the unusual idea]
The land of Uzbekistan IS a giant SUZANI: a traditional hand-embroidered textile.
Hills are folds of dyed silk. Cotton fields are tufts of real cotton thread.
Turquoise-tiled domes of Samarkand and Bukhara rise as embroidered beadwork. Rows
of poplar trees are stitched in green silk. There are no roads yet — the land is
beautiful but unconnected.

[CHARACTERS — use the attached reference images EXACTLY]
Three hero props, taken from the reference images. They must keep their exact
shape, proportions, materials and colors in EVERY frame:
1. BACKPACKER — 3D character, straw hat, blue shirt, orange backpack
2. PARACHUTE PARCEL — cardboard box with a blue ribbon under a red-and-white parachute
3. YELLOW CAR — small rounded yellow hatchback
Do not redesign, restyle, reinterpret or re-render them. Treat them as fixed assets
composited into the scene.

[SHOT — 8 seconds, vertical 9:16]
0.0-1.5s  Top-down over the embroidered land at dawn. Still and quiet. A single
          GOLDEN SILK THREAD enters from the bottom edge and begins to STITCH
          ITSELF across the country — a needle punching in and out of the fabric,
          leaving a warm glowing road behind it.
1.5-3.0s  Camera descends to a low three-quarter angle, travelling with the
          stitching thread as it races past a tiled dome, a cotton field, a line
          of poplars.
3.0-4.5s  The thread pauses. The BACKPACKER drops from above and lands on the
          golden road with a soft bounce — dust puff, hat wobbling. A beat later
          the PARACHUTE PARCEL descends gently and touches down beside him, its
          parachute settling softly over the thread.
4.5-6.0s  Headlights on the horizon. The YELLOW CAR arrives along the thread,
          bouncing on its suspension, and stops beside them. Both characters
          brighten.
6.0-7.0s  Fast, controlled pull-back. The finished golden thread is revealed to
          have stitched a complete route across the whole embroidered map of
          Uzbekistan. Warm light blooms along its length.
7.0-8.0s  The three characters lift off the fabric and settle into three glossy
          deep-blue rounded buttons stacked vertically, each seated inside a white
          circular frame on the left of its button. The suzani world blurs softly
          away behind them. The final frame is a clean mobile app screen.

[CAMERA]
Smooth cinematic motion only: top-down, ease into low three-quarter, finish on a
fast but controlled pull-back. No handheld shake, no whip pans, no dutch angles.

[AUDIO]
Warm Uzbek acoustic texture. A soft dutar melody opens; a gentle doira frame-drum
pulse enters at 3.0s; one bright rubab flourish marks the meeting at 6.0s. Foley:
needle through fabric, a soft landing thud, parachute silk, a small car engine.
No dialogue, no lyrics, no vocals. Music resolves cleanly on 8.0s.

[NEGATIVE]
No text, no captions, no subtitles, no logos, no watermarks. No additional people.
No photorealism. Do not deform, restyle or replace the three reference characters.
No white outlines, halos or glow rings around the characters. No extra vehicles,
no crowds, no traffic. No camera shake, no lens flares, no rapid cuts.

[OUTPUT]
Vertical 9:16, 720x1280 or higher, 30 fps, 8 seconds.
```

---

## QISQA VARIANT — 3 soniya (ilova ichida ochilishda)

```
[STYLE]
Pixar-quality 3D animation, miniature tilt-shift diorama, warm golden-hour light,
soft global illumination, shallow depth of field. Tactile handcrafted look.

[WORLD]
The land of Uzbekistan as a giant hand-embroidered SUZANI textile: silk hills,
cotton-thread fields, turquoise beadwork domes, poplar trees stitched in green.

[CHARACTERS — use the attached references EXACTLY, never redesign]
BACKPACKER (straw hat, blue shirt, orange backpack); PARACHUTE PARCEL (box with
blue ribbon under a red-and-white parachute); YELLOW CAR (small rounded hatchback).

[SHOT — 3 seconds, vertical 9:16]
0.0-1.0s  A golden silk thread stitches itself across the embroidered land,
          leaving a glowing road. Low three-quarter travelling camera.
1.0-2.0s  The BACKPACKER lands on the thread with a soft bounce; the PARACHUTE
          PARCEL touches down beside him.
2.0-2.6s  The YELLOW CAR arrives along the thread and stops beside them. A warm
          light pulse spreads outward from the meeting point.
2.6-3.0s  Quick pull-back; the three characters settle into three glossy deep-blue
          rounded buttons stacked vertically, each in a white circular frame on the
          left. Final frame is a clean app screen.

[AUDIO]
Soft dutar phrase, one doira drum accent on the meeting at 2.0s, gentle fabric and
landing foley. No dialogue, no lyrics.

[NEGATIVE]
No text, no logos, no watermarks, no extra people or vehicles, no photorealism,
no white outlines or glow rings, no camera shake. Do not restyle the references.

[OUTPUT]
Vertical 9:16, 720x1280, 30 fps, 3 seconds.
```

---

## Tekshirish ro'yxati (har generatsiyadan keyin)

- [ ] Parashyut qizil-oq chiziqli qolganmi? Shakli o'zgarmaganmi?
- [ ] Mashina o'sha sariq mashinami, yoki boshqa mashinaga aylanganmi?
- [ ] Yo'lovchining shlyapasi va ko'k ko'ylagi joyidami?
- [ ] Ikonkalar atrofida oq halqa/kontur paydo bo'lmaganmi?
- [ ] Kadrga matn yoki suv belgisi tushmaganmi?
- [ ] Oxirgi kadr `ilova-bosh-ekrani.png` ga o'xshaydimi?

## Agar suzani g'oyasi yoqmasa — bir qatorda almashtiring

`[WORLD]` blokini shulardan biriga almashtiring, qolgani o'zgarmaydi:

- **Koshin (majolika):** *The land is built from Samarkand blue-and-white majolica
  tiles; the road is a ribbon of glazed tilework that lays itself down tile by tile.*
- **Ochiluvchi kitob:** *Uzbekistan unfolds as a paper pop-up book — mountains,
  domes and poplars springing up as the pages open; the road is a folded paper strip.*
- **Ipak yo'li:** *A living silk ribbon flows over desert dunes, past a caravanserai,
  transforming from an ancient caravan trail into a modern glowing road.*
