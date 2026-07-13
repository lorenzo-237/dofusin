use tauri::{
  menu::{Menu, MenuItem},
  tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
  AppHandle, Manager,
};

/// Always created on startup (regardless of the user's minimize-behavior
/// preference, see src/lib/settings-store.ts) so "Afficher"/"Quitter" stay
/// reachable — the preference only changes what the minimize button itself
/// does (see title-bar.tsx), not whether the tray icon exists.
pub fn setup_tray(app: &AppHandle) -> tauri::Result<()> {
  let show_i = MenuItem::with_id(app, "show", "Afficher DofusIn", true, None::<&str>)?;
  let quit_i = MenuItem::with_id(app, "quit", "Quitter", true, None::<&str>)?;
  let menu = Menu::with_items(app, &[&show_i, &quit_i])?;

  TrayIconBuilder::new()
    .icon(app.default_window_icon().unwrap().clone())
    .menu(&menu)
    .tooltip("DofusIn")
    .on_menu_event(|app, event| match event.id.as_ref() {
      "show" => show_main_window(app),
      "quit" => app.exit(0),
      _ => {}
    })
    .on_tray_icon_event(|tray, event| {
      if let TrayIconEvent::Click {
        button: MouseButton::Left,
        button_state: MouseButtonState::Up,
        ..
      } = event
      {
        show_main_window(tray.app_handle());
      }
    })
    .build(app)?;

  Ok(())
}

fn show_main_window(app: &AppHandle) {
  if let Some(window) = app.get_webview_window("main") {
    let _ = window.show();
    let _ = window.unminimize();
    let _ = window.set_focus();
  }
}
