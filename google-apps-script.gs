/**
 * MANDAL MANAGER — GOOGLE APPS SCRIPT BACKEND
 * ============================================================
 * SETUP STEPS (do these in order):
 *
 * 1. Create a new Google Sheet (any name, e.g. "Mandal Manager Data").
 * 2. In that Sheet: Extensions menu -> Apps Script.
 * 3. Delete any starter code in Code.gs, paste this ENTIRE file in its place.
 * 4. Click the Save icon (disk icon).
 * 5. In Google Drive, create a folder named "Mandal Manager Documents"
 *    (or any name) — this is where uploaded files (KYC, bills, certificates) go.
 * 6. Open that folder, copy its ID from the URL:
 *    https://drive.google.com/drive/folders/THIS_PART_IS_THE_ID
 * 7. Back in Apps Script, paste that ID into DRIVE_FOLDER_ID below.
 * 8. Click Deploy -> New deployment.
 *    - Select type: Web app
 *    - Description: Mandal Manager Sync
 *    - Execute as: Me
 *    - Who has access: Anyone
 *    - Click Deploy.
 * 9. Authorize the script when Google asks (click Advanced -> Go to app -> Allow).
 * 10. Copy the "Web app URL" it gives you — looks like:
 *     https://script.google.com/macros/s/XXXXXXXXXXXX/exec
 * 11. Paste that URL into the Mandal Manager app: Sidebar -> Settings/Sync ->
 *     paste into "Google Sheets Web App URL" field -> Save -> Test Connection.
 *
 * That's it. From now on, every save in the app will also write a row into
 * this Sheet (one tab per data type, auto-created), and every uploaded file
 * will be saved into your Drive folder with the link stored in the Sheet.
 * ============================================================
 */

// PASTE YOUR DRIVE FOLDER ID HERE (step 7 above)
const DRIVE_FOLDER_ID = 'PASTE_YOUR_DRIVE_FOLDER_ID_HERE';

// Sheet tab names this script will create automatically
const SHEET_TABS = [
  'mandal','users','committee','sabhashad','areas','events','donations',
  'vouchers','vendors','investments','ledgers','meetings','audit'
];

function doPost(e){
  try{
    const body = JSON.parse(e.postData.contents);
    const action = body.action;

    if(action === 'ping'){
      return jsonOut({ok:true, sheetName: SpreadsheetApp.getActiveSpreadsheet().getName()});
    }
    if(action === 'upsertRow'){
      return jsonOut(upsertRow(body.sheet, body.record));
    }
    if(action === 'uploadFile'){
      return jsonOut(uploadFile(body.folderTag, body.file));
    }
    return jsonOut({ok:false, error:'Unknown action'});
  }catch(err){
    return jsonOut({ok:false, error: err.message});
  }
}

function doGet(e){
  return jsonOut({ok:true, message:'Mandal Manager backend is running. Use POST requests.'});
}

function jsonOut(obj){
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function getOrCreateSheet(name){
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if(!sheet){
    sheet = ss.insertSheet(name);
    sheet.appendRow(['id','json','updatedAt']); // simple schema: id + full JSON blob + timestamp
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/**
 * Upsert: find row by record.id in column A, replace it; else append new row.
 * We store the FULL record as a JSON string in column B for simplicity and
 * robustness (works for any nested structure without needing fixed columns).
 * Column C is a human-readable last-updated timestamp.
 */
function upsertRow(sheetName, record){
  if(!sheetName || !record) return {ok:false, error:'Missing sheet or record'};
  const sheet = getOrCreateSheet(sheetName);
  const id = record.id || 'singleton'; // mandal profile has no id, treat as singleton row
  const data = sheet.getDataRange().getValues();
  let rowIndex = -1;
  for(let i=1; i<data.length; i++){
    if(String(data[i][0]) === String(id)){ rowIndex = i+1; break; }
  }
  const jsonStr = JSON.stringify(record);
  const timestamp = new Date().toISOString();
  if(rowIndex > -1){
    sheet.getRange(rowIndex, 1, 1, 3).setValues([[id, jsonStr, timestamp]]);
  } else {
    sheet.appendRow([id, jsonStr, timestamp]);
  }
  return {ok:true, sheet:sheetName, id};
}

/**
 * Decode base64 dataUrl, save to Drive folder, return shareable link.
 */
function uploadFile(folderTag, file){
  if(!file || !file.dataUrl) return {ok:false, error:'No file data'};
  const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);

  // Optional: organize into subfolders by tag (e.g. mandal_docs_pan, vouchers, investments)
  let targetFolder = folder;
  const subfolders = folder.getFoldersByName(folderTag);
  if(subfolders.hasNext()){
    targetFolder = subfolders.next();
  } else {
    targetFolder = folder.createFolder(folderTag);
  }

  const matches = file.dataUrl.match(/^data:(.+);base64,(.*)$/);
  if(!matches) return {ok:false, error:'Invalid file data format'};
  const mimeType = matches[1];
  const base64Data = matches[2];
  const bytes = Utilities.base64Decode(base64Data);
  const blob = Utilities.newBlob(bytes, mimeType, file.name);
  const driveFile = targetFolder.createFile(blob);
  driveFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  return {ok:true, driveLink: driveFile.getUrl(), fileId: driveFile.getId()};
}
