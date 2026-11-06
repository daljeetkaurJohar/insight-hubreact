// All calls from the React app to the backend API.
// Every call sends the sign-in header so the backend knows who you are.

async function request(authHeaders, method, url, body) {
  const headers = await authHeaders();
  const opts = { method, headers: { ...headers } };
  if (body instanceof FormData) {
    opts.body = body; // the browser sets the multipart Content-Type itself
  } else if (body !== undefined) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  let res;
  try {
    res = await fetch(url, opts);
  } catch {
    throw new Error('Cannot reach the server. Is the backend running (npm start in the backend folder)?');
  }
  if (res.status === 204) return null;
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { /* not JSON */ }
  if (!res.ok) {
    if (res.status === 502 || res.status === 504 || (res.status === 500 && !data)) {
      throw new Error('Cannot reach the server. Is the backend running (npm start in the backend folder)?');
    }
    throw new Error((data && data.error) || `Request failed (${res.status})`);
  }
  return data;
}

function entryForm(fields, files, removeImageIds) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.append(k, v ?? '');
  for (const f of files || []) fd.append('images', f);
  if (removeImageIds && removeImageIds.length) fd.append('removeImageIds', removeImageIds.join(','));
  return fd;
}

export function makeApi(authHeaders) {
  return {
    me: () => request(authHeaders, 'GET', '/api/me'),
    listEntries: () => request(authHeaders, 'GET', '/api/entries'),
    createEntry: (fields, files) => request(authHeaders, 'POST', '/api/entries', entryForm(fields, files)),
    updateEntry: (id, fields, files, removeImageIds) =>
      request(authHeaders, 'PUT', `/api/entries/${id}`, entryForm(fields, files, removeImageIds)),
    deleteEntry: (id) => request(authHeaders, 'DELETE', `/api/entries/${id}`),
    addComment: (id, text) => request(authHeaders, 'POST', `/api/entries/${id}/comments`, { text }),
    rate: (id, stars) => request(authHeaders, 'PUT', `/api/entries/${id}/rating`, { stars }),
  };
}
