# Dog Heat Tracker — Android APK project

This repository creates an installable Android app for tracking multiple female dogs and scheduling local reminders for estimated upcoming heat cycles.

## What is included
- Multiple dog profiles with independent records.
- Record the first date heat signs were observed (not necessarily the true start date).
- Cycle status, symptoms, notes, and history.
- Approximate next-cycle estimates.
- Android local notification scheduling at about 14 days, 3 days, and on the estimated date.
- GitHub Actions workflow that builds a debug APK and stores it as an artifact.
- Local data storage on the phone; records are not uploaded to GitHub.
- Export/restore JSON backups when changing phones or reinstalling.

## Important limits
Cycle timing varies. Predictions are planning estimates only, not veterinary advice and not a reliable way to identify fertile days. Keep a female dog in heat away from unneutered males throughout the heat period. Do not assume the end of bleeding means fertility has ended.

Android notifications require the user to allow notification permission. Delivery time can be affected by Android notification settings, battery optimization, device restart, and alarm settings. This app uses local notifications and does not need a server to send each reminder, but notifications cannot be guaranteed on every device configuration.

The current estimate logic uses the dog's recorded cycle history where enough completed cycles exist; otherwise it uses a rough six-month estimate after a completed cycle. This is not a medical prediction. It will not invent a start date if only the first-observed date is known.

## How to create your GitHub repository and get the APK
You do not need to connect ChatGPT to GitHub for these steps.

1. Download this ZIP and extract it on your computer.
2. Open https://github.com/new in your browser and sign in.
3. Repository name: `dog-heat-tracker`. Choose **Private** if you want the source code private, then create it.
4. In the new repository, select **Add file → Upload files**.
5. Upload the *contents* of this extracted folder, including the `.github` folder. Do not upload the outer folder as one nested folder.
6. Commit the upload to the `main` branch.
7. Open the repository's **Actions** tab. Approve GitHub Actions if asked.
8. Open the **Build Android APK** workflow. If it did not start automatically, click **Run workflow**.
9. Wait for the workflow to finish successfully. Open the completed run and scroll to **Artifacts**.
10. Download `dog-heat-tracker-debug-apk`. Extract the downloaded artifact ZIP to get `app-debug.apk`.
11. Transfer `app-debug.apk` to your Android phone and open it to install. Android may ask you to allow installation from that file manager/browser. Only install APKs you built from your own repository.
12. Open the app, tap the bell, and allow notifications. Add your dogs and record completed cycles as they happen.

## If GitHub Actions fails
Open the failed workflow run and inspect the first red step. Common issues include uploading files into an extra nested folder or a transient dependency/build failure. You can download the log or share the error text for help.

## App data
Dog profiles and records are stored in the app's local WebView storage. They do not automatically sync between devices. Avoid uninstalling the app or clearing its storage until a data export/restore feature is added. Export/restore is available from the Backup & restore section. Keep the backup file private because it contains your dog profiles and health notes.

## Technical notes
- UI: HTML/CSS/JavaScript.
- Android wrapper: Capacitor.
- Scheduled reminders: `@capacitor/local-notifications`.
- CI build: GitHub Actions on Ubuntu.
