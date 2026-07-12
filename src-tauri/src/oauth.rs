use std::sync::atomic::{AtomicBool, Ordering};

use tauri::{AppHandle, Emitter};
use tiny_http::{Response, Server};

// Discord OAuth2 rejects custom URI schemes as redirect_uri (must be
// http(s)://) — this loopback server is the RFC 8252 pattern for native
// apps instead. Fixed port because Discord requires an exact, pre-registered
// redirect_uri (no wildcard ports), so an ephemeral port isn't an option.
const OAUTH_CALLBACK_PORT: u16 = 48991;

static SERVER_STARTED: AtomicBool = AtomicBool::new(false);

// Branded landing page shown in the browser right after Discord redirects
// back here — the icon is inlined (same mark as public/assets/icon.svg) so
// this stays a single self-contained response, no asset requests. Palette
// matches src/index.css (--background/--primary/--accent/--foreground).
const CALLBACK_PAGE_HTML: &str = r##"<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<title>DofusIn</title>
<style>
  html, body {
    height: 100%;
    margin: 0;
    background: #FBF6EC;
    color: #2E2A22;
    font-family: 'Baloo 2', 'Comic Sans MS', 'Segoe UI', sans-serif;
  }
  body {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    padding: 40px 36px;
    background: #ffffff;
    border-radius: 24px;
    box-shadow: 0 10px 30px rgba(46, 42, 34, 0.08);
    text-align: center;
    max-width: 320px;
  }
  .wordmark {
    font-size: 22px;
    font-weight: 800;
  }
  .wordmark .in {
    color: #3F7A54;
  }
  .message {
    font-size: 14px;
    font-weight: 600;
    color: #6b6355;
    margin: 0;
  }
</style>
</head>
<body>
  <div class="card">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="56" height="56">
      <rect width="200" height="200" rx="48" fill="#3F7A54"></rect>
      <circle cx="164" cy="36" r="16" fill="#E0A63A" stroke="#FBF6EC" stroke-width="4"></circle>
      <text x="100" y="140" font-family="'Baloo 2', 'Arial Rounded MT Bold', sans-serif" font-weight="800" font-size="110" fill="#FBF6EC" text-anchor="middle">D</text>
    </svg>
    <div class="wordmark">Dofus<span class="in">In</span></div>
    <p class="message">Connexion réussie ! Tu peux fermer cet onglet et revenir sur DofusIn.</p>
  </div>
</body>
</html>
"##;

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

      let html = CALLBACK_PAGE_HTML;
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
