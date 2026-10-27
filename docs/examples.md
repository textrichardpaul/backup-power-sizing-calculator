# Worked examples

Three households, sized with the calculator. Every number below is hand-checkable and is also covered by the test suite in `test/`.

The math the calculator uses:

- Energy per device = watts x run share x hours.
- Nameplate size you need = total energy x 1.25 safety buffer / 0.85 usable capacity.
- Peak power = running watts of everything on at once, plus the biggest start-up surge.

## 1. Fridge and lights overnight (12 hours)

- Fridge: 150 W at 50 percent run share for 12 h = 900 Wh.
- Five LED lights: 10 W each for 6 h = 300 Wh.
- **Total energy: 1,200 Wh.** Peak power 850 W (200 W running plus the fridge's 650 W start-up surge).
- Nameplate need: 1,200 x 1.25 / 0.85 = 1,764.71 Wh, so the **2,000 Wh class**, with a 1,000 W inverter.

## 2. CPAP through the night (12 hours)

- CPAP: 60 W for 8 h = 480 Wh, plus a heated humidifier, lights, and phones bringing the night to 750 Wh total.
- Average draw 38.75 W, peak 95 W, no surge items.
- Nameplate need: 750 x 1.25 / 0.85 = 1,102.94 Wh, so the **1,500 Wh class**, with a 300 W inverter.
- Cross-check the other way: a 1,000 Wh station runs the 60 W CPAP alone for about 14 hours of sleep ((1,000 x 0.85) / 60 = 14.2 h).

## 3. Well pump and fridge for a full day (24 hours)

- Well pump: 1,000 W at 10 percent run share for 24 h = 2,400 Wh, with a 1,000 W start-up surge.
- Fridge: 150 W at 50 percent run share for 24 h = 1,800 Wh.
- **Total energy: 4,200 Wh.** Peak power 2,150 W (1,150 W running plus the pump's surge).
- Nameplate need: 4,200 x 1.25 / 0.85 = 6,176.47 Wh, so the **7,200 Wh class**, with a 2,400 W inverter.

## A note on runtimes

A station's nameplate size is not what you get out of it. This calculator treats 85 percent as usable, which is why a fridge drawing an average of 75 W runs about 11.6 hours on a 1,024 Wh station ((1,024 x 0.85) / 75), not the 13.7 hours the nameplate alone would suggest.
