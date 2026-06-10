# Cellular Device Intake and Recycle — CDIR v4

## Purpose
Static PWA for scanning or typing cellular device data, saving it to a project JSON file, printing device labels, and exporting a final Excel workbook.

## No APIs
This version does not use:
- SharePoint API
- Microsoft Graph API
- database
- login integration
- browser local storage as the source of truth
- DYMO API

## v3 fixes
- Label printing no longer uses a popup window.
- Print labels from the same page.
- Added Select All Labels.
- Added Select None.
- Added label preview section.
- Added per-record Preview and Print buttons.
- Larger checkbox controls.

## DYMO LabelWriter 450 Turbo use
1. Add or load records.
2. Select the rows to print.
3. Click `Preview Selected Labels` to check layout.
4. Click `Print Selected Labels`.
5. Select `DYMO LabelWriter 450 Turbo`.
6. In printer preferences, select matching label size:
   - 2-1/8" x 4" Large Address
   - 1-1/8" x 3-1/2" Standard Address

## Browser note
The direct file save workflow uses the File System Access API. It works best in Chrome or Edge.
If unavailable, use the JSON download/upload fallback.


## v4 label layout change
- Combines `TYPE / MODEL` onto one line.
- Combines `USER / DEPT` onto one line.
- Keeps `IMEI` and `ICCID` on separate lines.
- Combines `MTN / ASSET` onto one line.
- Increases label print size for better readability.
