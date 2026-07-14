mod oauth;
mod tray;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_opener::init())
    // Persists/restores main window position+size across launches (state
    // file lives in the app's local data dir). The notification popup is
    // excluded — its position is always freshly computed bottom-right of
    // the primary monitor (see notification-window.ts), so letting this
    // plugin "restore" a stale position for it would fight that logic.
    .plugin(
      tauri_plugin_window_state::Builder::default()
        .with_denylist(&["notification-popup"])
        .build(),
    )
    .invoke_handler(tauri::generate_handler![oauth::start_oauth_callback_server])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }

      tray::setup_tray(app.handle())?;

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
