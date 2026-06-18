# Mandal Manager — Full Setup Guide

This guide covers three things: (1) creating your Google Sheet + Drive backend, (2) connecting the app to it, (3) deploying the app on GitHub Pages.

---

## Part 1 — Google Sheet & Drive Backend (do this first)

**Step 1.** Go to Google Drive → click New → Google Sheets. Name it anything, e.g. "Mandal Manager Data".

**Step 2.** In that Sheet, click Extensions → Apps Script. A code editor opens in a new tab.

**Step 3.** Delete everything in the `Code.gs` box. Open the file `google-apps-script.gs` (provided alongside this app) and paste its entire contents into that box.

**Step 4.** In Google Drive, create a folder for document storage — name it e.g. "Mandal Manager Documents". Open the folder and copy its ID from the browser URL:
`https://drive.google.com/drive/folders/`**`THIS_LONG_ID_PART`**

**Step 5.** Back in the Apps Script editor, find this line near the top:
```
const DRIVE_FOLDER_ID = 'PASTE_YOUR_DRIVE_FOLDER_ID_HERE';
```
Replace `PASTE_YOUR_DRIVE_FOLDER_ID_HERE` with the ID you copied. Click the disk/Save icon.

**Step 6.** Click **Deploy → New deployment**.
- Click the gear icon next to "Select type" → choose **Web app**.
- Description: anything, e.g. "Mandal Sync"
- Execute as: **Me**
- Who has access: **Anyone**
- Click **Deploy**.

**Step 7.** Google will ask you to authorize. Click **Authorize access** → choose your Google account → you'll see an "unverified app" warning since this is your own script → click **Advanced** → **Go to (your project name)** → **Allow**.

**Step 8.** Copy the **Web app URL** shown — it looks like:
`https://script.google.com/macros/s/AKfycb.../exec`

Keep this URL safe — you'll paste it into the app in Part 2.

---

## Part 2 — Connect the App to Google Sheets

**Step 1.** Open `mandal-app.html` in a browser (or after deploying on GitHub Pages, open the live URL).

**Step 2.** Log in with the default account: username `admin`, password `admin123`. Change this password later from User Management.

**Step 3.** In the left sidebar, click **☁️ Google Sync**.

**Step 4.** Paste the Web App URL from Part 1, Step 8 into the box. Click **Save Connection**, then **Test Connection** — you should see a success message naming your Sheet.

**Step 5.** Click **Force Full Sync Now** once, to push any data you already entered into the Sheet.

From now on:
- Every save in the app (profile, members, donations, vouchers, etc.) is saved locally first (works even offline), then pushed to your Google Sheet automatically in the background within a few seconds.
- Every uploaded file (KYC documents, bills, certificates, FD receipts) is uploaded to your Google Drive folder, organized into subfolders automatically, and the file link is stored next to the record in the Sheet.
- The Sheet gets one tab per data type (mandal, committee, sabhashad, donations, vouchers, vendors, investments, etc.) — each row stores one record as JSON plus a timestamp, so nothing is lost even if the app's screens change later.
- If the internet drops, entries queue up (you'll see a small number badge next to "Google Sync" in the sidebar) and sync automatically once connection returns.

---

## Part 3 — Deploy on GitHub Pages

**Step 1.** Create a GitHub account if you don't have one (https://github.com).

**Step 2.** Click **New repository**. Name it anything, e.g. `mandal-manager`. Keep it Public. Click **Create repository**.

**Step 3.** Click **uploading an existing file** (or drag-and-drop) and upload `mandal-app.html`. Important: rename it to `index.html` when uploading (or rename after upload via the pencil/edit icon), so GitHub Pages serves it as the homepage.

**Step 4.** Commit the file (click **Commit changes**).

**Step 5.** Go to repository **Settings → Pages** (left sidebar).
- Under "Source", choose **Deploy from a branch**.
- Branch: **main**, folder: **/ (root)**.
- Click **Save**.

**Step 6.** Wait about a minute, then refresh the Settings → Pages screen. You'll see a green box with your live URL:
`https://yourusername.github.io/mandal-manager/`

That's your permanent app link — open it on any phone, tablet, or computer.

**Step 7.** Share this URL with committee members. Each person logs in with their own account (create accounts for them under User Management → + Add User, assign role: Collector / Admin / Viewer).

**Step 8 (optional — install as an app icon on phone).** Open the URL on a phone in Chrome (Android) or Safari (iPhone) → tap the browser menu → "Add to Home Screen" / "Install app". It then opens full-screen like a native app.

---

## How the Accounting Works (Tally-style)

| Voucher Type | When it's created | What it does |
|---|---|---|
| **Receipt** | Automatically, when you mark a Donation or Membership Fee as Paid | Debits Cash/Bank, Credits Donation Income or Membership Fee Income |
| **Purchase** | Manually, in Vouchers → Purchase, when a vendor bill comes in | Debits the Expense ledger, Credits the Vendor (Sundry Creditor) — no cash moves yet |
| **Payment** | Manually, in Vouchers → Payment, when you actually pay a vendor (or any cash/bank outflow) | Debits the Vendor (settles their balance), Credits Cash/Bank |
| **Contra** | Manually — cash deposited to bank, bank withdrawn to cash, or money moved into an Investment/FD | Moves money between Cash, Bank, or Investment ledgers |
| **Journal** | Manually, for adjustments with no cash movement (e.g. FD interest accrual, write-offs, fee reversal) | Debit one ledger, Credit another, no cash/bank involved |

Vendors are created once (Account Master → Vendors tab) and live as ledgers under the group **Sundry Creditors** — their outstanding-payable balance is always visible there and on the Dashboard.

Investments/FDs are created once (Account Master → Investments tab) and live under the group **Investments** — booking one automatically creates a Contra voucher moving money out of Cash/Bank into that FD ledger.

The **Financial Reports** page (Trial Balance, P&L, Balance Sheet) and the **Ledger View** tab inside Account Master are both built directly from these vouchers — so they're always accurate and in sync, with no manual double entry needed beyond creating the voucher itself.

---

## Notes

- The app works fully offline using the browser's local storage — Google Sync is optional but recommended so your data is safe in your own Sheet/Drive, not just on one device.
- Use **FY Management** to start a new financial year — it automatically carries the previous year's closing Cash/Bank balance forward as the new year's opening balance, and resets all membership fee statuses to Unpaid.
- Use **Backup & Restore** any time to download a full JSON snapshot as an extra safety copy.
