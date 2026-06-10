# Cellular Device Intake and Recycle — CDIR v9

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
