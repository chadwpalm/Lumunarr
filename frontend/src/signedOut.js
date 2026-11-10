// Tells App when the backend stops accepting this browser (the session ended, Authentication was changed,
// or Plex rejected the saved sign-in), so it can show the sign-in page.
//
// The pages talk to the backend with XMLHttpRequest (and axios, which uses it), so instead of changing
// every request, this watches all of them: a 401 from our own backend fires SIGNED_OUT_EVENT on window.
// Requests to other sites (plex.tv, GitHub) are ignored.

export const SIGNED_OUT_EVENT = "lumunarr:signed-out";

let installed = false;

export function watchForSignOut() {
  if (installed) return;
  installed = true;

  const open = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    if (!/^https?:/i.test(String(url))) {
      this.addEventListener("loadend", () => {
        if (this.status === 401) window.dispatchEvent(new Event(SIGNED_OUT_EVENT));
      });
    }
    return open.call(this, method, url, ...rest);
  };
}
