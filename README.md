# Cellular Device Intake and Recycle — CDIR v1

## Purpose
Static PWA for scanning or typing cellular device data, saving it to a project JSON file, and exporting a final Excel workbook.

## No APIs
This version does not use:
- SharePoint API
- Microsoft Graph API
- database
- login integration
- browser local storage as the source of truth

## Recommended SharePoint use
Upload the app folder to the Team SharePoint site under the Cellular Device section, then link to `index.html`.

Recommended document library folders:

Cellular Device Intake and Recycle/
- App/
- Project Files/
- Exports/
- Templates/

## Recommended daily workflow
1. Open `index.html`.
2. Click `Create New Project` or `Open Project File`.
3. Save the JSON project file to a local, network, USB, or synced SharePoint/OneDrive folder.
4. Scan/type devices.
5. Export Excel workbook when the recycle or inventory project is complete.

## Browser note
The direct file save workflow uses the File System Access API. It works best in Chrome or Edge.
If unavailable, use the JSON download/upload fallback.
