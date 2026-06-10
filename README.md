# Cellular Device Intake and Recycle — CDIR v16

## Purpose
Static app for scanning or typing cellular device data, saving it to a project JSON file, printing labels, and exporting a final Excel workbook.

## v6 reset
This version rebuilds the label preview/print section cleanly.

## Important
This version intentionally does not use a service worker. Earlier versions used one and may have cached old JavaScript.

After uploading to GitHub Pages:
- Use Ctrl+F5
- Or clear site data
- Confirm the header says CDIR v6

## No APIs
This version does not use:
- SharePoint API
- Microsoft Graph API
- database
- browser local storage as the source of truth
- DYMO API
- service worker cache

## Label behavior
Preview and print use the same DOM element:
- TYPE / MODEL
- USER / DEPT
- IMEI
- ICCID
- MTN / ASSET
- DATE

## DYMO LabelWriter 450 Turbo
Use browser print dialog and select:
- DYMO LabelWriter 450 Turbo
- 2-1/8" x 4" Large Address, or
- 1-1/8" x 3-1/2" Standard Address


## v7 label update
- Rebuilt label layout for maximum font size and space usage.
- Reduced padding.
- Removed divider rule.
- Replaced large title block with compact two-sided header.
- Uses:
  - RECYCLE / TYPE
  - MODEL
  - USER/DEPT
  - IMEI
  - ICCID
  - MTN / ASSET
  - DATE


## v8 label engine
- Uses dynamic auto-fit font sizing.
- Starts large and shrinks only enough to fit the label.
- Uses much smaller margins.
- Uses a dense 3-zone label:
  - Header: RECYCLE + device type
  - Body: MODEL, USER/DEPT, IMEI, ICCID
  - Footer: MTN/ASSET, DATE, QTY
- Preview and print use the same label element.
- Label Density option added:
  - Max readable size
  - Tight / more data


## v9 label layout
- Rebuilt to match the user's physical label sample.
- Fixed six-row layout:
  1. RECYCLE / DEVICE TYPE
  2. MODEL
  3. USER/DEPT
  4. IMEI
  5. ICCID
  6. MTN / ASSET / DATE
- Arial Black / bold-first layout.
- Individual row autofit, not whole-label shrinking.
- IMEI and ICCID stay prominent.


## v10 label layout
- Built from the uploaded v9 ZIP.
- DYMO target: 3.5" wide × 1.25" high.
- Layout:
  1. RECYCLE / device type
  2. MODEL
  3. USER
  4. IMEI
  5. ICCID
  6. MTN asset-tag date, without prefixes
- Removed QTY from the label.
- Removed Department from the label.
- Safe print margins retained to avoid clipped words.
- Row-specific font fitting protects IMEI, ICCID, and bottom line.


## v14 real QR
- Rebuilt from v10 to preserve working text labels.
- Added local `qrcode.min.js` library file.
- QR labels are separate from text labels.
- Buttons:
  - Preview Selected QR Labels
  - Print Selected QR Labels
  - Print All QR Labels
- QR payload is compact for better scan reliability on a 0.98" QR.
- No API or internet dependency after files are uploaded.


## v15 global QR ID
- Rebuilt from v14.
- QR payload is now only the global CDIR ID, example: `CDIR-000001`.
- QR should scan much more reliably because the payload is short.
- Full device record remains in the project JSON.
- Existing records without a CDIR ID are assigned one automatically when loaded or previewed.
- New records are assigned the next global ID when added.
- Text labels remain unchanged from v10.


## v16 QR label fix
- Rebuilt from v15.
- Text labels remain unchanged.
- QR labels are now QR-only plus large CDIR ID.
- Removed model/user/IMEI text from the QR label to prevent overlap.
- QR payload still contains only the global CDIR ID, example: `CDIR-000122`.
- Layout target: 3.5" wide × 1.25" high.
