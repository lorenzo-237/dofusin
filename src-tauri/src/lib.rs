#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    // Must be the first plugin registered (Tauri single-instance requirement).
    // On Windows/Linux, activating the `dofusin://` scheme relaunches a new
    // process with the URL as a CLI arg instead of emitting an event in the
    // already-running instance; tauri-plugin-deep-link forwards it to the JS
    // `onOpenUrl` listener on its own once single-instance is registered —
    // no manual event bridging needed here.
    .plugin(tauri_plugin_single_instance::init(|_app, _argv, _cwd| {}))
    .plugin(tauri_plugin_deep_link::init())
    .plugin(tauri_plugin_opener::init())
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }

      // Schemes are only active once the app is installed on Windows/Linux —
      // register_all() lets `dofusin://` work during `tauri dev` too.
      #[cfg(any(windows, target_os = "linux"))]
      {
        use tauri_plugin_deep_link::DeepLinkExt;
        app.deep_link().register_all()?;
      }

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
