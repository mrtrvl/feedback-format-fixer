(() => {
  const $ = (id) => document.getElementById(id);
  const input = $('csv-input');
  const fileInput = $('file-input');
  const columnSelect = $('column-select');
  const separatorSelect = $('separator-select');
  const output = $('csv-output');
  const errorBox = $('error-message');
  let source = '';
  let sourceName = 'cleaned.csv';
  let delimiter = ',';
  let headers = [];
  let records = [];
  let fixedCsv = '';
  let inputKind = 'paste';

  function parseCsv(text, sep) {
    const rows = [];
    let row = [], field = '', quoted = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (quoted) {
        if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
        else if (ch === '"') quoted = false;
        else field += ch;
      } else if (ch === '"' && field.length === 0) quoted = true;
      else if (ch === sep) { row.push(field); field = ''; }
      else if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && text[i + 1] === '\n') i++;
        row.push(field); rows.push(row); row = []; field = '';
      } else field += ch;
    }
    if (quoted) throw new Error('An opening quote is missing its closing quote. Check that fields containing quotes are escaped as two quotes () inside a quoted field.');
    if (field.length || row.length || (text.length && !/[\r\n]$/.test(text))) { row.push(field); rows.push(row); }
    while (rows.length && rows[rows.length - 1].every(cell => cell === '')) rows.pop();
    if (!rows.length) throw new Error('This file looks empty. Paste or upload a CSV with a header row to get started.');
    const width = rows[0].length;
    const bad = rows.findIndex((r, i) => i > 0 && r.length !== width);
    if (bad !== -1) throw new Error(`Row ${bad + 1} has ${rows[bad].length} values, but the header has ${width}. This usually means a quote is missing or a row is malformed.`);
    return rows;
  }

  function detectDelimiter(text) {
    const first = text.split(/[\r\n]/, 1)[0] || '';
    const options = [',', ';', '\t', '|'];
    return options.map(sep => {
      let quoted = false, count = 0;
      for (let i = 0; i < first.length; i++) {
        if (first[i] === '"') { if (quoted && first[i + 1] === '"') i++; else quoted = !quoted; }
        else if (!quoted && first[i] === sep) count++;
      }
      return { sep, count };
    }).sort((a,b) => b.count - a.count)[0].sep;
  }

  function quoteField(value, sep) {
    const s = String(value);
    return (s.includes(sep) || /["\r\n]/.test(s)) ? `"${s.replace(/"/g, '""')}"` : s;
  }
  function serialize(rows, sep) { return rows.map(row => row.map(v => quoteField(v, sep)).join(sep)).join('\r\n'); }

  function displayError(message) { errorBox.textContent = message; errorBox.hidden = false; }
  function clearError() { errorBox.hidden = true; errorBox.textContent = ''; }
  function setPlaceholderState() {
    $('empty-state').classList.remove('hidden'); $('preview-wrap').classList.add('hidden');
    $('result-count').hidden = true; $('output-meta').textContent = 'Ready when you are';
    $('copy-button').disabled = true; $('download-button').disabled = true; fixedCsv = '';
  }

  function refresh() {
    clearError();
    source = inputKind === 'paste' ? input.value : source;
    if (!source.trim()) {
      headers = []; records = []; columnSelect.innerHTML = '<option>Paste or upload a CSV first</option>'; columnSelect.disabled = true;
      setPlaceholderState();
      if (inputKind === 'paste') $('input-meta').textContent = 'Nothing pasted yet';
      return;
    }
    delimiter = separatorSelect.value === 'auto' ? detectDelimiter(source) : separatorSelect.value;
    let rows;
    try { rows = parseCsv(source, delimiter); }
    catch (e) { headers = []; records = []; columnSelect.innerHTML = '<option>Check your CSV format</option>'; columnSelect.disabled = true; setPlaceholderState(); displayError(e.message); return; }
    headers = rows[0].map((h, i) => h.trim() || `Column ${i + 1}`);
    records = rows.slice(1);
    const old = Number(columnSelect.value);
    columnSelect.innerHTML = '';
    headers.forEach((header, i) => { const opt = document.createElement('option'); opt.value = String(i); opt.textContent = header; columnSelect.appendChild(opt); });
    columnSelect.disabled = headers.length === 0;
    if (Number.isInteger(old) && old >= 0 && old < headers.length) columnSelect.value = String(old);
    else {
      const guess = headers.findIndex(h => /comment|feedback|review|message|note|description/i.test(h));
      columnSelect.value = String(guess >= 0 ? guess : Math.max(headers.length - 1, 0));
    }
    $('input-meta').textContent = `${records.length.toLocaleString()} data row${records.length === 1 ? '' : 's'} · ${headers.length} column${headers.length === 1 ? '' : 's'}`;
    if (inputKind === 'upload') $('file-meta').textContent = `${sourceName} · ${formatBytes(new Blob([source]).size)}`;
    renderResult();
  }

  function renderResult() {
    if (!headers.length) return;
    const idx = Number(columnSelect.value);
    const clean = records.map(row => row.map((value, i) => i === idx ? value.replace(/[\r\n]+/g, $('trim-spaces').checked ? ' ' : '') : value));
    const rows = [headers, ...clean];
    fixedCsv = serialize(rows, delimiter);
    output.textContent = fixedCsv.length > 24000 ? fixedCsv.slice(0, 24000) + '\n\n… Preview shortened. Download to get the complete file.' : fixedCsv;
    $('empty-state').classList.add('hidden'); $('preview-wrap').classList.remove('hidden');
    $('result-count').textContent = `${records.length.toLocaleString()} rows`; $('result-count').hidden = false;
    const changed = records.reduce((n, row) => n + (/[\r\n]/.test(row[idx] || '') ? 1 : 0), 0);
    $('output-meta').textContent = changed ? `${changed} comment${changed === 1 ? '' : 's'} cleaned` : 'No line breaks found in this column';
    $('copy-button').disabled = false; $('download-button').disabled = false;
  }

  function formatBytes(bytes) { return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`; }
  function showTab(which) {
    const paste = which === 'paste'; inputKind = which;
    $('paste-tab').classList.toggle('active', paste); $('paste-tab').setAttribute('aria-selected', String(paste));
    $('upload-tab').classList.toggle('active', !paste); $('upload-tab').setAttribute('aria-selected', String(!paste));
    $('paste-panel').classList.toggle('hidden', !paste); $('upload-panel').classList.toggle('hidden', paste);
    if (paste && sourceName !== 'cleaned.csv') { input.value = source; }
    if (!paste) { source = input.value; }
    refresh();
  }

  input.addEventListener('input', () => { inputKind = 'paste'; source = input.value; refresh(); });
  $('paste-tab').addEventListener('click', () => showTab('paste'));
  $('upload-tab').addEventListener('click', () => showTab('upload'));
  separatorSelect.addEventListener('change', refresh);
  columnSelect.addEventListener('change', renderResult);
  $('trim-spaces').addEventListener('change', renderResult);
  $('load-example').addEventListener('click', () => {
    input.value = 'name,comment,rating\nAlex,"Loved the product!\nShipping was quick, too.",5\nSam,"Great quality\nand friendly support.",4\nJordan,"Works exactly as expected.",5';
    inputKind = 'paste'; sourceName = 'cleaned.csv'; showTab('paste'); input.focus();
  });
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files && fileInput.files[0]; if (!file) return;
    if (file.size > 50 * 1024 * 1024) { displayError('This file is larger than 50 MB. Please choose a smaller CSV file.'); return; }
    sourceName = file.name.replace(/\.(csv|tsv)$/i, '') + '-cleaned.csv';
    try { source = await file.text(); inputKind = 'upload'; showTab('upload'); }
    catch { displayError('We could not read this file. Please try a plain text CSV or TSV file.'); }
  });
  const dropzone = $('dropzone');
  for (const eventName of ['dragenter', 'dragover']) dropzone.addEventListener(eventName, e => { e.preventDefault(); dropzone.classList.add('dragover'); });
  for (const eventName of ['dragleave', 'drop']) dropzone.addEventListener(eventName, e => { e.preventDefault(); dropzone.classList.remove('dragover'); });
  dropzone.addEventListener('drop', e => { const file = e.dataTransfer.files[0]; if (file) { const transfer = new DataTransfer(); transfer.items.add(file); fileInput.files = transfer.files; fileInput.dispatchEvent(new Event('change')); } });
  $('copy-button').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(fixedCsv); $('copy-button').innerHTML = '✓ Copied'; setTimeout(() => { $('copy-button').innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="11" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h2"/></svg>Copy'; }, 1600); }
    catch { displayError('Clipboard access was blocked by your browser. You can still download the cleaned file.'); }
  });
  $('download-button').addEventListener('click', () => {
    const blob = new Blob(['\ufeff', fixedCsv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob), link = document.createElement('a'); link.href = url; link.download = sourceName; link.click(); URL.revokeObjectURL(url);
  });
})();
