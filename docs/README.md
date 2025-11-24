# Face Enrollment & Liveness Diagrams

This folder contains SVG workflow diagrams and UI mockups used for the Face Enrollment and Liveness-based Voting Verification feature.

Files:

- `face-enrollment-liveness-workflow.svg` — main workflow diagram (enrollment + voting + violation paths)
- `face-enrollment-mockup-1.svg` — enrollment stepper mockup
- `face-enrollment-mockup-2.svg` — voting live-monitor mockup

Export to PNG (local developer instructions)

1. From project root, install `sharp` (Dev environment must be able to build native modules):

```powershell
# from project root
npm install --save-dev sharp
```

2. Run the conversion script:

```powershell
node scripts/convert_svgs_to_png.js
```

This writes `.png` files next to the `.svg` files in the `docs/` folder (e.g. `face-enrollment-mockup-1.png`). If you are unable to install `sharp` (native build issues on Windows), consider using an online converter or tools like `rsvg-convert`, `inkscape` or a headless browser script.

Usage

- Add the exported PNGs to documentation, README, or embed them in the web app as needed.
- If you prefer PNG generation at CI time, add `npm ci` step and run `node scripts/convert_svgs_to_png.js` in your pipeline.
