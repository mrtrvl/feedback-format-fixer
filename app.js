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
  let language = localStorage.getItem('csv-fixer-language') || 'et';
  let lastError = '';
  let lastCopied = false;
  let pasteSource = '';
  let uploadSource = '';
  let uploadName = '';

  const messages = {
    en: {
      privacy:'Private by design',browser:'runs in your browser',eyebrow:'A cleaner CSV, in seconds',headline1:'Keep your comments',headline2:'in one piece.',lede:'Remove unwanted line breaks inside CSV comments without changing the rest of your file. Simple, safe, and all in your browser.',step1:'Add your CSV',step1desc:'Paste CSV text or choose a file from your device.',inputMethod:'Input method',pasteTab:'Paste CSV',uploadTab:'Upload a file',formatHint:'CSV · TSV supported',pasteAria:'Paste your CSV here',pastePlaceholder:'Paste your CSV here…\n\nFor example:\nname,comment,rating\nAlex,"Loved the product!\nShipping was quick, too.",5\nSam,"Great quality",4',nothingPasted:'Nothing pasted yet',tryExample:'Try an example',dropFile:'Drop your CSV file here',or:'or',browse:'browse files',onDevice:'on your device',fileLimit:'CSV and TSV files · up to 50 MB',filePrivate:'Your file stays on this device',step2:'Choose what to fix',step2desc:'We’ll join line breaks in this column only. All other data stays as it is.',commentColumn:'Comment column',separatorLabel:'Values separated by',autoDetect:'Auto-detect',comma:'Comma',semicolon:'Semicolon',tab:'Tab',pipe:'Pipe',replaceSpace:'Replace breaks with a space',preserveWords:'Keeps words from running together',step3:'Your cleaned CSV',step3desc:'Review the result, then copy or download it.',emptyTitle:'Your fixed CSV will appear here',emptyDesc:'Add some CSV above to get started',previewAria:'Cleaned CSV preview',ready:'Ready when you are',copy:'Copy',copied:'Copied',download:'Download CSV',footnote:'Your data never leaves your browser. Nothing is uploaded or stored.',footerMade:'Made for smoother imports.',footerFree:'Free to use · No account needed',noCsv:'Paste or upload a CSV first',badCsv:'Check your CSV format',nothingYet:'Nothing pasted yet',row:'row',rows:'rows',column:'column',columns:'columns',cleanedOne:'comment cleaned',cleanedMany:'comments cleaned',noBreaks:'No line breaks found in this column',previewShort:'… Preview shortened. Download to get the complete file.',missingQuote:'An opening quote is missing its closing quote. Check that fields containing quotes use two double quotes inside a quoted field.',emptyFile:'This file looks empty. Paste or upload a CSV with a header row to get started.',badRow:'Row {row} has {actual} values, but the header has {expected}. This usually means a quote is missing or a row is malformed.',tooLarge:'This file is larger than 50 MB. Please choose a smaller CSV file.',readFail:'We could not read this file. Please try a plain text CSV or TSV file.',clipboardFail:'Clipboard access was blocked by your browser. You can still download the cleaned file.'
    },
    et: {
      privacy:'Privaatsus on oluline',browser:'töötab sinu brauseris',eyebrow:'Puhas CSV-fail mõne sekundiga',headline1:'Hoia kommentaarid',headline2:'ühe tervikuna.',lede:'Eemalda CSV-kommentaaride seest reavahetused, muutmata faili ülejäänud sisu. Lihtne, turvaline ja töötab sinu brauseris.',step1:'Lisa CSV-fail',step1desc:'Kleebi CSV-tekst või vali fail oma seadmest.',inputMethod:'Sisestusviis',pasteTab:'Kleebi CSV',uploadTab:'Laadi fail üles',formatHint:'Toetatud: CSV · TSV',pasteAria:'Kleebi siia CSV-tekst',pastePlaceholder:'Kleebi siia CSV-tekst…\n\nNäiteks:\nnimi,kommentaar,hinnang\nMari,"Toode meeldis väga!\nKohale jõudis ka kiiresti.",5\nJüri,"Väga hea kvaliteet",4',nothingPasted:'Teksti pole veel kleebitud',tryExample:'Proovi näidet',dropFile:'Lohista CSV-fail siia',or:'või',browse:'vali fail',onDevice:'oma seadmest',fileLimit:'CSV- ja TSV-failid · kuni 50 MB',filePrivate:'Fail jääb sinu seadmesse',step2:'Vali parandatav veerg',step2desc:'Reavahetused eemaldatakse ainult sellest veerust. Ülejäänud andmed jäävad samaks.',commentColumn:'Kommentaari veerg',separatorLabel:'Väärtuste eraldaja',autoDetect:'Tuvasta automaatselt',comma:'Koma',semicolon:'Semikoolon',tab:'Tabulaator',pipe:'Püstkriips',replaceSpace:'Asenda reavahetused tühikuga',preserveWords:'Nii ei liitu sõnad kokku',step3:'Parandatud CSV-fail',step3desc:'Vaata tulemus üle ja kopeeri või laadi fail alla.',emptyTitle:'Parandatud CSV kuvatakse siin',emptyDesc:'Alustamiseks lisa ülal CSV-fail',previewAria:'Parandatud CSV eelvaade',ready:'Valmis, kui sina oled',copy:'Kopeeri',copied:'Kopeeritud',download:'Laadi CSV alla',footnote:'Sinu andmed ei lahku brauserist. Midagi ei laadita üles ega salvestata.',footerMade:'Lihtsamaks andmete importimiseks.',footerFree:'Tasuta · kontot pole vaja',noCsv:'Lisa esmalt CSV-tekst või fail',badCsv:'Kontrolli CSV-vormingut',nothingYet:'Teksti pole veel kleebitud',row:'rida',rows:'rida',column:'veerg',columns:'veergu',cleanedOne:'kommentaar parandatud',cleanedMany:'kommentaari parandatud',noBreaks:'Valitud veerus reavahetusi ei leitud',previewShort:'… Eelvaade on lühendatud. Kogu faili saad alla laadida.',missingQuote:'Avav jutumärk on sulgemata. Jutumärke sisaldavas väljas kirjuta jutumärk CSV-vormingus kahe jutumärgiga.',emptyFile:'Fail paistab tühi. Alustamiseks kleebi või laadi üles päiserida sisaldav CSV.',badRow:'Reas {row} on {actual} väärtust, kuid päises on {expected}. Tõenäoliselt on mõni jutumärk puudu või rida vigane.',tooLarge:'Fail on suurem kui 50 MB. Palun vali väiksem CSV-fail.',readFail:'Faili ei õnnestunud lugeda. Proovi lihttekstina salvestatud CSV- või TSV-faili.',clipboardFail:'Brauser ei lubanud lõikelauale kopeerida. Saad puhastatud faili siiski alla laadida.'
    }
  };
  const t = (key) => messages[language][key] || messages.en[key] || key;

  function applyLanguage(nextLanguage) {
    language = nextLanguage === 'et' ? 'et' : 'en';
    localStorage.setItem('csv-fixer-language', language);
    document.documentElement.lang = language;
    document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
    document.querySelectorAll('[data-i18n-aria]').forEach(el => { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => { el.placeholder = t(el.dataset.i18nPlaceholder); });
    document.querySelectorAll('.language-button').forEach(button => {
      const active = button.dataset.language === language;
      button.classList.toggle('active', active); button.setAttribute('aria-pressed', String(active));
    });
    document.title = language === 'et' ? 'CSV reavahetuste parandaja' : 'CSV Line Break Fixer';
    if (lastError) { errorBox.textContent = lastError; errorBox.hidden = false; }
    if (source) refresh(); else setPlaceholderState();
  }

  document.querySelectorAll('.language-button').forEach(button => button.addEventListener('click', () => applyLanguage(button.dataset.language)));

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
    if (quoted) throw new Error(t('missingQuote'));
    if (field.length || row.length || (text.length && !/[\r\n]$/.test(text))) { row.push(field); rows.push(row); }
    while (rows.length && rows[rows.length - 1].every(cell => cell === '')) rows.pop();
    if (!rows.length) throw new Error(t('emptyFile'));
    const width = rows[0].length;
    const bad = rows.findIndex((r, i) => i > 0 && r.length !== width);
    if (bad !== -1) throw new Error(t('badRow').replace('{row}', bad + 1).replace('{actual}', rows[bad].length).replace('{expected}', width));
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
  function removeLineBreaks(value, useSpaces) {
    return value.replace(/\r\n|\n\r|\r|\n/g, useSpaces ? ' ' : '');
  }

  function displayError(message) { lastError = message; errorBox.textContent = message; errorBox.hidden = false; }
  function clearError() { lastError = ''; errorBox.hidden = true; errorBox.textContent = ''; }
  function setPlaceholderState() {
    $('empty-state').classList.remove('hidden'); $('preview-wrap').classList.add('hidden');
    $('result-count').hidden = true; $('output-meta').textContent = t('ready');
    $('copy-button').disabled = true; $('download-button').disabled = true; fixedCsv = '';
  }

  function refresh() {
    clearError();
    source = inputKind === 'paste' ? input.value : source;
    if (!source.trim()) {
      headers = []; records = []; columnSelect.innerHTML = `<option>${t('noCsv')}</option>`; columnSelect.disabled = true;
      setPlaceholderState();
      if (inputKind === 'paste') $('input-meta').textContent = t('nothingYet');
      return;
    }
    delimiter = separatorSelect.value === 'auto' ? detectDelimiter(source) : separatorSelect.value;
    let rows;
    try { rows = parseCsv(source, delimiter); }
    catch (e) { headers = []; records = []; columnSelect.innerHTML = `<option>${t('badCsv')}</option>`; columnSelect.disabled = true; setPlaceholderState(); displayError(e.message); return; }
    headers = rows[0].map((h, i) => h.trim() || `Column ${i + 1}`);
    records = rows.slice(1);
    const old = Number(columnSelect.value);
    columnSelect.innerHTML = '';
    headers.forEach((header, i) => { const opt = document.createElement('option'); opt.value = String(i); opt.textContent = header; columnSelect.appendChild(opt); });
    columnSelect.disabled = headers.length === 0;
    if (Number.isInteger(old) && old >= 0 && old < headers.length) columnSelect.value = String(old);
    else {
      const guess = headers.findIndex(h => /comment|feedback|review|message|note|description|kommenteeri/i.test(h));
      columnSelect.value = String(guess >= 0 ? guess : Math.max(headers.length - 1, 0));
    }
    $('input-meta').textContent = `${records.length.toLocaleString()} ${t(records.length === 1 ? 'row' : 'rows')} · ${headers.length} ${t(headers.length === 1 ? 'column' : 'columns')}`;
    if (inputKind === 'upload') $('file-meta').textContent = `${sourceName} · ${formatBytes(new Blob([source]).size)}`;
    renderResult();
  }

  function renderResult() {
    if (!headers.length) return;
    const idx = Number(columnSelect.value);
    const clean = records.map(row => row.map((value, i) => i === idx ? removeLineBreaks(value, $('trim-spaces').checked) : value));
    const rows = [headers, ...clean];
    fixedCsv = serialize(rows, delimiter);
    output.textContent = fixedCsv.length > 24000 ? fixedCsv.slice(0, 24000) + '\n\n' + t('previewShort') : fixedCsv;
    $('empty-state').classList.add('hidden'); $('preview-wrap').classList.remove('hidden');
    $('result-count').textContent = `${records.length.toLocaleString()} ${t('rows')}`; $('result-count').hidden = false;
    const changed = records.reduce((n, row) => n + (/[\r\n]/.test(row[idx] || '') ? 1 : 0), 0);
    $('output-meta').textContent = changed ? `${changed} ${t(changed === 1 ? 'cleanedOne' : 'cleanedMany')}` : t('noBreaks');
    $('copy-button').disabled = false; $('download-button').disabled = false;
  }

  function formatBytes(bytes) { return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`; }
  function showTab(which) {
    const paste = which === 'paste'; inputKind = which;
    $('paste-tab').classList.toggle('active', paste); $('paste-tab').setAttribute('aria-selected', String(paste));
    $('upload-tab').classList.toggle('active', !paste); $('upload-tab').setAttribute('aria-selected', String(!paste));
    $('paste-panel').classList.toggle('hidden', !paste); $('upload-panel').classList.toggle('hidden', paste);
    if (paste) {
      source = pasteSource;
      input.value = pasteSource;
    } else {
      source = uploadSource;
    }
    refresh();
  }

  input.addEventListener('input', () => { inputKind = 'paste'; pasteSource = input.value; source = pasteSource; refresh(); });
  $('paste-tab').addEventListener('click', () => showTab('paste'));
  $('upload-tab').addEventListener('click', () => showTab('upload'));
  separatorSelect.addEventListener('change', refresh);
  columnSelect.addEventListener('change', renderResult);
  $('trim-spaces').addEventListener('change', renderResult);
  $('load-example').addEventListener('click', () => {
    input.value = 'name,comment,rating\nAlex,"Loved the product!\nShipping was quick, too.",5\nSam,"Great quality\nand friendly support.",4\nJordan,"Works exactly as expected.",5';
    pasteSource = input.value; inputKind = 'paste'; sourceName = 'cleaned.csv'; showTab('paste'); input.focus();
  });
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files && fileInput.files[0]; if (!file) return;
    if (file.size > 50 * 1024 * 1024) { displayError(t('tooLarge')); return; }
    inputKind = 'upload'; uploadSource = ''; source = ''; setPlaceholderState(); clearError();
    $('file-meta').textContent = `${file.name} · ${formatBytes(file.size)} · ${language === 'et' ? 'loen faili…' : 'reading file…'}`;
    try {
      uploadSource = await file.text(); uploadName = file.name.replace(/\.(csv|tsv)$/i, '') + '-cleaned.csv';
      sourceName = uploadName; inputKind = 'upload'; source = uploadSource; showTab('upload');
    }
    catch { $('file-meta').textContent = language === 'et' ? 'Faili ei saanud avada' : 'Could not open this file'; displayError(t('readFail')); }
  });
  const dropzone = $('dropzone');
  for (const eventName of ['dragenter', 'dragover']) dropzone.addEventListener(eventName, e => { e.preventDefault(); dropzone.classList.add('dragover'); });
  for (const eventName of ['dragleave', 'drop']) dropzone.addEventListener(eventName, e => { e.preventDefault(); dropzone.classList.remove('dragover'); });
  dropzone.addEventListener('drop', e => { const file = e.dataTransfer.files[0]; if (file) { const transfer = new DataTransfer(); transfer.items.add(file); fileInput.files = transfer.files; fileInput.dispatchEvent(new Event('change')); } });
  $('copy-button').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(fixedCsv); lastCopied = true; $('copy-button').querySelector('[data-i18n="copy"]').textContent = t('copied'); setTimeout(() => { lastCopied = false; $('copy-button').querySelector('[data-i18n="copy"]').textContent = t('copy'); }, 1600); }
    catch { displayError(t('clipboardFail')); }
  });
  $('download-button').addEventListener('click', () => {
    const blob = new Blob(['\ufeff', fixedCsv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob), link = document.createElement('a'); link.href = url; link.download = sourceName; link.click(); URL.revokeObjectURL(url);
  });
  applyLanguage(language);
})();
