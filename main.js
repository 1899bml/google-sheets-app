const clientId = '288549571599-k9t31tvp3m3pk24mekc30nbpcep9n7ud.apps.googleusercontent.com';
const apiKey = 'AIzaSyBbb8_6fOmFweuLmla-mQz3MolkQqLPk1w';
const spreadsheetId = '1v5Zf8fxY-cIq8xw0G8hoeHDRUAXzpDmGEj16qf4_LhQ';
const range = 'Folha1!A1:Z1000'; // Ajusta conforme a tua folha
const scopes = 'https://www.googleapis.com/auth/spreadsheets';

let tokenClient;
let gapiInited = false;
let gisInited = false;
let accessToken = null;

function saveToken(token) {
  accessToken = token;
  localStorage.setItem('google_token', token);
  document.getElementById('logoutButton').style.display = 'inline-block';
}

function loadToken() {
  const stored = localStorage.getItem('google_token');
  if (stored) {
    accessToken = stored;
    document.getElementById('logoutButton').style.display = 'inline-block';
    return true;
  }
  return false;
}

function gapiLoaded() {
  gapi.load('client', async () => {
    await gapi.client.init({
      apiKey: apiKey,
      discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
    });
    gapiInited = true;
    maybeEnableLogin();
  });
}

function gisLoaded() {
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: clientId,
    scope: scopes,
    callback: async (response) => {
      console.log('🔐 Token recebido:', response);
      saveToken(response.access_token);
      await fetchSheetData();
    },
    error_callback: (error) => {
      console.error('❌ Erro no login:', error);
    },
    ux_mode: 'popup',
    prompt: 'consent'
  });

  gisInited = true;
  maybeEnableLogin();
}

function maybeEnableLogin() {
  if (gapiInited && gisInited) {
    document.getElementById('loginButton').disabled = false;
  }
}

document.getElementById('loginButton').addEventListener('click', () => {
  tokenClient.requestAccessToken();
});

document.getElementById('logoutButton').addEventListener('click', () => {
  localStorage.removeItem('google_token');
  accessToken = null;
  location.reload();
});

document.getElementById('sheetForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const nome = document.getElementById('input1').value;
  const email = document.getElementById('input2').value;

  try {
    await gapi.client.sheets.spreadsheets.values.append({
      spreadsheetId: spreadsheetId,
      range: 'Página1!A1',
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      resource: {
        values: [[nome, email]]
      }
    });
    alert('✅ Dados adicionados com sucesso!');
    fetchSheetData();
  } catch (error) {
    console.error('💥 Erro ao escrever na folha:', error);
  }
});

async function fetchSheetData() {
  document.getElementById('loading').style.display = 'block';
  document.getElementById('output').innerHTML = '';

  try {
    const response = await gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: range,
    });

    const rows = response.result.values;
    if (!rows || rows.length === 0) {
      document.getElementById('output').innerHTML = '<p>Sem dados encontrados.</p>';
      return;
    }

    const table = document.createElement('table');
    rows.forEach((row) => {
      const tr = document.createElement('tr');
      row.forEach((cell) => {
        const td = document.createElement('td');
        td.textContent = cell;
        tr.appendChild(td);
      });
      table.appendChild(tr);
    });

    document.getElementById('output').appendChild(table);
  } catch (error) {
    console.error('💥 Erro ao buscar dados da Sheet:', error);
  } finally {
    document.getElementById('loading').style.display = 'none';
  }
}

window.onload = () => {
  gapiLoaded();
  gisLoaded();
  if (loadToken()) {
    fetchSheetData();
  }

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js')
      .then(() => console.log('✅ Service Worker registado'))
      .catch((err) => console.error('💥 SW erro:', err));
  }
};
