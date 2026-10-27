# Changelog

## 1.0.0, 2026-10-22

- First public release of the standalone sizing calculator.
- Device catalogue with situation and room presets, per-device watts, hours, and run share, plus start-up surge handling.
- Recommendations given by capacity class, with a minimum inverter size.
- Sizing math: 85 percent of nameplate capacity treated as usable, with a 1.25 safety buffer on the energy you need.
- Test suite in `test/` verifies the math against hand-calculated cases; run it with `npm test`.
