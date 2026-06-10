# Cellular Device Intake and Recycle — CDIR v2

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

## Recommended daily workflow
1. Open `index.html`.
2. Click `Create New Project` or `Open Project File`.
3. Save the JSON project file to a local, network, USB, or synced SharePoint/OneDrive folder.
4. Scan/type devices.
5. Print labels as needed.
6. Export Excel workbook when the recycle or inventory project is complete.

## Label printing
Added:
- Per-record `Label` button
- Print selected labels
- Print all labels
- Label title setting
- Label size setting:
  - 2-1/8" x 4" Large Address
  - 1-1/8" x 3-1/2" Standard Address

## DYMO LabelWriter 450 Turbo use
1. Click `Label`, `Print Selected Labels`, or `Print All Labels`.
2. Browser opens a print label page.
3. Click `Print Labels`.
4. Select `DYMO LabelWriter 450 Turbo`.
5. Set the matching label size in printer preferences.

## Browser note
The direct file save workflow uses the File System Access API. It works best in Chrome or Edge.
If unavailable, use the JSON download/upload fallback.
