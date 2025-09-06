const clientId = '288549571599-k9t31tvp3m3pk24mekc30nbpcep9n7ud.apps.googleusercontent.com';
const apiKey = 'AIzaSyBbb8_6fOmFweuLmla-mQz3MolkQqLPk1w';
const spreadsheetId = '1v5Zf8fxY-cIq8xw0G8hoeHDRUAXzpDmGEj16qf4_LhQ';
const range = 'Folha1!A1:Z1000'; // Ajusta conforme a tua folha
const scopes = 'https://www.googleapis.com/auth/spreadsheets';

let tokenClient;
let gapiInited = false;
let gisInited = false;
let accessToken = null;
let linhaParaEditar = null;

// 🔐 Sessão
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

// 🔄 Inicialização
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
      saveToken(response.access_token);
      await fetchSocios();
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

// 🔓 Logout
document.getElementById('logoutButton').addEventListener('click', () => {
  localStorage.removeItem('google_token');
  accessToken = null;
  location.reload();
});

// 📝 Submissão do formulário
document.getElementById('socioForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const values = [[
    document.getElementById('nome').value,
    document.getElementById('email').value,
    document.getElementById('telefone').value,
    document.getElementById('data').value,
    document.getElementById('estado').value,
    document.getElementById('cobrador').value,
    document.getElementById('valorCota').value,
    document.getElementById('estadoCota').value,
    document.getElementById('dataPagamento').value,
    document.getElementById('observacoes').value
  ]];

  try {
    if (linhaParaEditar) {
      const rangeToUpdate = `Sócios!A${linhaParaEditar}:J${linhaParaEditar}`;
      await gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: spreadsheetId,
        range: rangeToUpdate,
        valueInputOption: 'USER_ENTERED',
        resource: { values }
      });
      alert('✅ Sócio atualizado com sucesso!');
    } else {
      await gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId: spreadsheetId,
        range: 'Sócios',
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        resource: { values }
      });
      alert('✅ Sócio registado com sucesso!');
    }

    document.getElementById('socioForm').reset();
    document.querySelector('#socioForm button').textContent = 'Registar Sócio';
    linhaParaEditar = null;
    fetchSocios();
  } catch (error) {
    console.error('💥 Erro ao gravar sócio:', error);
  }
});

// ✏️ Edição
function editarSocio(linhaIndex) {
  linhaParaEditar = linhaIndex;
  const row = document.querySelector(`#socioTable tbody`).rows[linhaIndex - 2];
  const cells = row.querySelectorAll('td');

  document.getElementById('nome').value = cells[0].textContent;
  document.getElementById('email').value = cells[1].textContent;
  document.getElementById('telefone').value = cells[2].textContent;
  document.getElementById('data').value = cells[3].textContent;
  document.getElementById('estado').value = cells[4].textContent;
  document.getElementById('cobrador').value = cells[5].textContent;
  document.getElementById('valorCota').value = cells[6].textContent;
  document.getElementById('estadoCota').value = cells[7].textContent;
  document.getElementById('dataPagamento').value = cells[8].textContent;
  document.getElementById('observacoes').value = cells[9].textContent;

  document.querySelector('#socioForm button').textContent = 'Atualizar Sócio';
}

// 🗑️ Remoção
async function removerSocio(linhaIndex) {
  const request = {
    spreadsheetId: spreadsheetId,
    requests: [{
      deleteDimension: {
        range: {
          sheetId: 0,
          dimension: 'ROWS',
          startIndex: linhaIndex - 1,
          endIndex: linhaIndex
        }
      }
    }]
  };

  try {
    await gapi.client.sheets.batchUpdate(request);
    alert('🗑️ Sócio removido com sucesso!');
    fetchSocios();
  } catch (error) {
    console.error('💥 Erro ao remover sócio:', error);
  }
}

// 🔎 Filtros
function aplicarFiltros(rows) {
  const cobrador = document.getElementById('filtroCobrador').value;
  const estadoCota = document.getElementById('filtroEstadoCota').value;

  return rows.filter((row) => {
    const matchCobrador = cobrador ? row[5] === cobrador : true;
    const matchEstadoCota = estadoCota ? row[7] === estadoCota : true;
    return matchCobrador && matchEstadoCota;
  });
}

// 📋 Carregar sócios
async function fetchSocios() {
  const tableBody = document.querySelector('#socioTable tbody');
  tableBody.innerHTML = '';

  try {
    const response = await gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: range,
    });

    const rows = response.result.values;
    if (!rows || rows.length < 2) return;

    const dadosFiltrados = aplicarFiltros(rows.slice(1));
    dadosFiltrados.forEach((row, index) => {
      const tr = document.createElement('tr');
      row.forEach((cell) => {
        const td = document.createElement('td');
        td.textContent = cell || '';
        tr.appendChild(td);
      });

      const actionsTd = document.createElement('td');
      actionsTd.innerHTML = `<button onclick="editarSocio(${index + 2})">✏️</button> <button onclick="removerSocio(${index + 2})">🗑️</button>`;
      tr.appendChild(actionsTd);

      tableBody.appendChild(tr);
    });

    gerarGraficos(dadosFiltrados);
  } catch (error) {
    console.error('💥 Erro ao carregar sócios:', error);
  }
}

// 📊 Gráficos
function gerarGraficos(rows) {
  const cobradores = {};
  const estados = { Pago: 0, Pendente: 0, Isento: 0 };

  rows.forEach((row) => {
    const cobrador = row[5];
    const estadoCota = row[7];

    cobradores[cobrador] = (cobradores[cobrador] || 0) + 1;
    if (estados[estadoCota] !== undefined) estados[estadoCota]++;
  });

  const ctx1 = document.getElementById('graficoCobrador').getContext('2d');
  new Chart(ctx1, {
    type: 'bar',
    data: {
      labels: Object.keys(cobradores),
      datasets: [{
        label: 'Cotas por cobrador',
        data: Object.values(cobradores),
        backgroundColor: '#4285f4'
      }]
    }
  });

  const ctx2 = document.getElementById('graficoEstadoCota').getContext('2d');
  new Chart(ctx2, {
    type: 'pie',
    data: {
      labels: Object.keys(estados),
      datasets: [{
        label: 'Estado das cotas',
        data: Object.values(estados),
        backgroundColor: ['#34a853', '#fbbc05', '#ea4335']
      }]
    }
  });
}

// 🎛️ Eventos
document.getElementById('filtroCobrador').addEvent
