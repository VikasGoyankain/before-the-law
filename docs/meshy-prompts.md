# Meshy prompts: *An Imperial Message*

**How to use.** Create each one with Meshy **Text to 3D**, download it as **GLB**, and
save it in `assets/models/im/` under the filename shown. **You do not need Mixamo.**
As with *Before the Law*, the game fits its own skeleton to each sculpt when it
starts up, and it colours the figures itself. That means the **shape and silhouette
matter; the texture does not.**

**Settings, where Meshy offers them**
- Pose: **A-pose** for every character marked "A-pose" below
- Symmetry: **on** (characters) / auto (props)
- Topology: triangle; polycount: anything (I reduce it with `tools/prep-models.mjs`)
- Generate 2–4 variants and keep the one with the **cleanest silhouette**: legs
  clearly separate, arms clear of the body, nothing fused together.

**Licence.** Generate these on the same Meshy plan as the *Before the Law* models, and
tell me which plan that is. As far as I know, free-plan output is CC BY, which breaks
the project's "CC0 / MIT / original only" rule.

**Style note for everything.** The empire is Kafka's *imaginary* East: dreamlike and
dignified, never a caricature. The prompts ask for simple, stylised shapes on purpose.

---

## Must have (the game is built around these)

### 1. `emperor.glb`: the dying Emperor (A-pose; I lay him in the bed)
**Prompt**
> Full-body very old frail emperor of an imaginary ancient eastern empire, thin and slightly stooped, gaunt kind face with tired half-closed eyes, long thin white beard, white hair in a small topknot, long layered imperial robe of plain silk with wide sleeves reaching the wrists, robe ends above the ankles, soft cloth slippers, a simple round sun emblem embroidered on the chest, standing in A-pose, arms held slightly away from the body, legs apart, stylized realistic, single character

**Negative prompt**
> jewelled crown, weapon, armor, throne, base, pedestal, cape, multiple characters, extra limbs, text, logo

### 2. `messenger.glb`: the messenger (A-pose)
**Prompt**
> Full-body powerful tireless royal courier, strong athletic man in his prime, broad shoulders, muscular bare forearms, short belted knee-length tunic over close-fitting trousers wrapped at the calves, soft running shoes, hair tied back tightly, determined focused face, a large round flat golden sun disc emblem worn on the centre of the chest, no weapons, standing in A-pose, arms slightly away from the body, feet apart, stylized realistic, single character

**Negative prompt**
> sword, spear, armor, helmet, cape, backpack, base, pedestal, multiple characters, extra limbs, text

### 3. `prince.glb`: a great prince of the Empire (the ring on the staircases)
**Prompt**
> Full-body solemn great prince of an imaginary ancient eastern imperial court, tall and dignified, middle-aged, tall stiff formal hat, heavy layered ceremonial robe reaching the feet with very wide hanging sleeves, broad sash, both hands hidden inside the sleeves held together in front of the waist, calm grave expression, standing upright, feet together, stylized realistic, simple bold shapes, single character

**Negative prompt**
> weapon, armor, throne, base, pedestal, multiple characters, extra limbs, text

### 4. `official.glb`: palace official (crowd)
**Prompt**
> Full-body palace official of an imaginary ancient eastern empire, plain dark long robe with a belt, square black scholar cap, holding a rolled scroll against the chest with both hands, slightly hunched busy posture, ordinary face, standing, feet slightly apart, stylized realistic, simple shapes, single character

**Negative prompt**
> weapon, armor, base, pedestal, multiple characters, extra limbs, text

### 5. `servant.glb`: a commoner who lives in the palace (crowd)
**Prompt**
> Full-body ordinary working man of an imaginary ancient eastern city, short padded jacket, loose trousers, cloth headband, straw sandals, carrying a cloth bundle over one shoulder, tired ordinary face, standing, feet apart, stylized realistic, simple shapes, single character

**Negative prompt**
> weapon, armor, hat with wide brim, base, pedestal, multiple characters, extra limbs, text

### 6. `townswoman.glb`: a woman of the multitude (crowd)
**Prompt**
> Full-body ordinary woman of an imaginary ancient eastern city, plain long layered dress with an apron, shawl draped over her head and shoulders, carrying a round woven basket on one arm, calm tired face, standing, feet slightly apart, stylized realistic, simple shapes, single character

**Negative prompt**
> jewellery, fan, umbrella, base, pedestal, multiple characters, extra limbs, text

### 7. `villager.glb`: you, at the window (A-pose)
**Prompt**
> Full-body humble villager of a remote country province, an ordinary young adult, plain worn hemp clothes, simple long shirt with rolled sleeves, loose trousers, straw sandals, weathered hands, gentle thoughtful face, short simple hair, standing in A-pose, arms slightly away from the body, legs apart, stylized realistic, single character

**Negative prompt**
> weapon, hat, backpack, armor, base, pedestal, multiple characters, extra limbs, text

---

## Nice to have (I build procedural versions if these are missing)

### 8. `child.glb`: the child who asks what the message says
**Prompt**
> Full-body small child about eight years old from an imaginary ancient eastern city, plain simple tunic and trousers, bare feet, curious open face, standing, feet apart, arms at the sides, stylized realistic, single character

**Negative prompt**
> toy, weapon, base, pedestal, multiple characters, extra limbs, text

### 9. `deathbed.glb`: the Emperor's bed (prop)
**Prompt**
> Ancient imperial canopy bed, carved dark lacquered wooden frame with four posts and a low roof, silk curtains tied back at the posts, layered silk quilts and a long round pillow, empty bed with no person, low step platform in front, stylized realistic, single game prop

**Negative prompt**
> person, animal, room, walls, floor, multiple objects, text

### 10. `bell.glb`: the bronze bell that tolls at the Emperor's death (prop)
**Prompt**
> Large ancient bronze temple bell hanging from a sturdy wooden frame, simple raised bands and studs on the bell, wooden striking beam hanging beside it on ropes, stylized realistic, single game prop

**Negative prompt**
> person, building, roof, multiple objects, text

### 11. `window.glb`: your window (prop)
**Prompt**
> Section of a humble rural house wall with one wooden lattice window, two shutters opened outward, a wide worn wooden sill, rough plaster and timber posts, small clay-tile eave above, stylized realistic, single game prop

**Negative prompt**
> person, glass, curtains, whole house, multiple objects, text

---

## When you're done

Put the files in `assets/models/im/` with exactly these names. You don't need all of
them: the game uses each sculpt it finds and falls back to the hand-built figures for
the rest. Then tell me and I'll run the prep and swap them in.
