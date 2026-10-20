# Backup Power Sizing Calculator

A single-file web tool that works out what size portable power station a home
needs for a power outage. You list the devices you want to run, set how long
the backup should last, and the calculator returns the energy required, the
peak power the station must handle, and the station size class to look for.

By Richard Paul. Released under the MIT License (see LICENSE).

## What it does

- A built-in catalogue of 21 common household devices, each with a typical
  running wattage, a start-up (surge) wattage, a duty cycle (the share of the
  time it actually draws power), and typical hours of use per day. Every value
  can be edited.
- Scenario and room presets that load a typical bundle in one tap, plus a
  backup length control (8, 12, 24, 48, or 72 hours, or a custom length up to
  240 hours).
- Results that update as you type: total energy needed in watt-hours, peak
  power, the minimum inverter size, a recommended capacity class, plain
  language notes about the biggest loads in your list, and a runtime table
  showing how long your bundle runs on standard station sizes.

## The sizing method

For each device, the energy used over the backup window is:

    watt-hours = watts x (duty % / 100) x effective hours x quantity

Effective hours is the device's daily hours of use, capped at the backup
length when the backup is 24 hours or shorter, and scaled proportionally for
longer backups (a 48 hour backup doubles the daily pattern).

Peak power is the sum of every device's running watts, plus the single
largest start-up surge in the list (the difference between a device's start-up
watts and its running watts). Motors surge one at a time in practice, so only
the biggest surge is added, not all of them. The minimum inverter size is the
smallest standard step (300 W to 6,000 W) that clears that peak.

The recommended station size applies two adjustments to the raw energy need:

    rated size needed = total watt-hours x 1.25 / 0.85

- The 0.85 factor: a power station delivers roughly 85 percent of its rated
  capacity to your devices. Inverter losses and conversion overhead use the
  rest, so a 1,000 Wh station gives you about 850 usable watt-hours.
- The 1.25 factor: a 25 percent safety buffer on top, so the battery is not
  run completely flat and small loads you forgot still fit.

The recommendation is then the smallest standard capacity class that covers
that figure: 300, 500, 1,000, 1,500, 2,000, 3,600, 5,000, 7,200, or 10,000 Wh.
Results are expressed as a size class only; choosing a specific product is up
to you.

The runtime table uses your list's average draw (total daily watt-hours
divided by 24) and the same 85 percent factor:

    runtime hours = (station size x 0.85) / average draw

## Worked example

A refrigerator and five LED bulbs, for a 12 hour overnight outage:

- Refrigerator: 150 W, runs about 50 percent of the time, capped at 12 hours
  for this window: 150 x 0.50 x 12 = 900 Wh.
- LED lights: 10 W each, on for 6 hours: 10 x 1.00 x 6 x 5 = 300 Wh.
- Total energy: 1,200 Wh.
- Rated size needed: 1,200 x 1.25 / 0.85 = about 1,765 Wh, so the recommended
  class is a station in the 2,000 Wh class.
- Peak power: running draw is 150 + (5 x 10) = 200 W, plus the refrigerator's
  start-up surge of 800 - 150 = 650 W, gives a peak of 850 W, so look for an
  inverter of at least 1,000 W.

## Run it

The whole tool is one file, index.html, with no build step, no dependencies,
and no network requests. Either:

- Open index.html directly in a browser, or
- Serve the folder with any static file server, for example
  `python3 -m http.server` and visit the local address it prints.

## Tests

The sizing maths is covered by a small Node test that loads the calculator
script out of index.html and checks four hand-computed cases (an overnight
fridge and lights load, a CPAP night, a high-surge well pump load, and a
fridge-only cross-check):

    node test/calculator.test.js

It prints expected and actual values for each case and exits nonzero if any
case fails.

## Licence

MIT. See the LICENSE file. Copyright (c) 2026 Richard Paul.
