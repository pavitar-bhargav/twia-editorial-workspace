export function buildBookmarklet(origin: string): string {
  const endpoint = `${origin}/api/inbox`;
  const code = `(function(){var d={url:location.href,title:document.title||"",selectedText:String(window.getSelection?window.getSelection():""),origin:"bookmarklet"};fetch(${JSON.stringify(endpoint)},{method:"POST",mode:"cors",headers:{"Content-Type":"application/json"},body:JSON.stringify(d)}).then(function(r){if(!r.ok)throw new Error("clip failed");window.open(${JSON.stringify(origin)},"_blank");}).catch(function(){var q="?clipUrl="+encodeURIComponent(d.url)+"&clipTitle="+encodeURIComponent(d.title)+"&clipText="+encodeURIComponent(d.selectedText);window.open(${JSON.stringify(origin)}+q,"_blank");});})();`;
  return `javascript:${encodeURIComponent(code)}`;
}
