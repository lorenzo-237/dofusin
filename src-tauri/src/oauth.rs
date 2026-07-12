use std::sync::atomic::{AtomicBool, Ordering};

use tauri::{AppHandle, Emitter};
use tiny_http::{Response, Server};

// Discord OAuth2 rejects custom URI schemes as redirect_uri (must be
// http(s)://) — this loopback server is the RFC 8252 pattern for native
// apps instead. Fixed port because Discord requires an exact, pre-registered
// redirect_uri (no wildcard ports), so an ephemeral port isn't an option.
const OAUTH_CALLBACK_PORT: u16 = 48991;

static SERVER_STARTED: AtomicBool = AtomicBool::new(false);

/// Starts (once per app run — later calls are a no-op) a tiny local HTTP
/// server that Discord's redirect lands on. Each incoming request's query
/// string (containing `code`/`state`) is emitted as the `oauth://callback`
/// event; the frontend matches it against the `state` it generated before
/// opening the browser. Loops for the app's whole lifetime instead of
/// shutting down after one request, so a cancelled/abandoned login attempt
/// never leaves the port stuck — the next attempt just reuses it.
#[tauri::command]
pub fn start_oauth_callback_server(app: AppHandle) -> Result<(), String> {
  if SERVER_STARTED.swap(true, Ordering::SeqCst) {
    return Ok(());
  }

  let server = Server::http(format!("127.0.0.1:{OAUTH_CALLBACK_PORT}"))
    .map_err(|err| err.to_string())?;

  std::thread::spawn(move || {
    for request in server.incoming_requests() {
      let query = request
        .url()
        .splitn(2, '?')
        .nth(1)
        .unwrap_or("")
        .to_string();

      let html = "<html><body><p>Tu peux fermer cet onglet et revenir sur DofusIn.</p></body></html>";
      let header = tiny_http::Header::from_bytes(
        &b"Content-Type"[..],
        &b"text/html; charset=utf-8"[..],
      )
      .expect("static header is valid");
      let response = Response::from_string(html).with_header(header);
      let _ = request.respond(response);

      let _ = app.emit("oauth://callback", query);
    }
  });

  Ok(())
}
