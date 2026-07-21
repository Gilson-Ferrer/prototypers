// CONEXÃO COM A API DO GOOGLE APPS SCRIPT
const API_URL = "https://script.google.com/macros/s/AKfycbzrKw_R0lOqrEXu0zZNO59aJAK-8SEC-ElKZLhldLZFGCiENKf7SAX2YEyssFDG25Hj/exec";

let projetosGlobais = []; // Guarda os dados na memória para busca e filtro rápido sem sobrecarregar o Google

// 1. BUSCAR DADOS DA API
async function carregarProjetos() {
    const grid = document.getElementById("projetos-grid");
    
    // Mostra um indicador visual de carregamento (Spinner)
    grid.innerHTML = `
        <div class="col-span-full text-center py-10">
            <i class="fa-solid fa-circle-notch fa-spin text-4xl text-blue-600"></i>
            <p class="text-gray-500 mt-2 font-medium">Buscando desafios no LTD...</p>
        </div>
    `;

    try {
        const response = await fetch(API_URL);
        projetosGlobais = await response.json();
        
        // Renderiza os projetos na tela
        renderizarCards(projetosGlobais);
    } catch (error) {
        console.error("Erro ao carregar dados:", error);
        grid.innerHTML = `
            <div class="col-span-full text-center py-10 text-red-500">
                <i class="fa-solid fa-triangle-exclamation text-3xl"></i>
                <p class="mt-2 font-bold">Erro ao conectar com o banco de dados do Sheets.</p>
            </div>
        `;
    }
}

// 2. RENDERIZAR OS CARDS DINAMICAMENTE
function renderizarCards(projetos) {
    const grid = document.getElementById("projetos-grid");
    grid.innerHTML = ""; // Limpa o grid

    if (projetos.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full text-center py-12">
                <i class="fa-regular fa-folder-open text-gray-400 text-4xl mb-2"></i>
                <p class="text-gray-500 font-medium">Nenhum resultado encontrado para a pesquisa.</p>
            </div>
        `;
        return;
    }

    projetos.forEach((projeto, index) => {
        // Define as cores das badges de status usando Tailwind
        let badgeColor = "bg-blue-100 text-blue-700"; // Aberto
        if (projeto.Status === "Em Dev") badgeColor = "bg-amber-100 text-amber-700";
        if (projeto.Status === "Concluído") badgeColor = "bg-green-100 text-green-700";

        // Verifica se o projeto tem PDF e constrói o botão dinamicamente
        let botaoPDF = "";
        if (projeto.Link_PDF && projeto.Link_PDF.trim() !== "") {
            // Aplica o truque do download direto se for link do drive
            let linkDownload = projeto.Link_PDF;
            if (linkDownload.includes("drive.google.com")) {
                const fileId = linkDownload.split("/d/")[1]?.split("/")[0];
                if (fileId) linkDownload = `https://drive.google.com/uc?export=download&id=${fileId}`;
            }
            botaoPDF = `
                <a href="${linkDownload}" target="_blank" class="flex-1 bg-gray-900 hover:bg-black text-white text-center py-2 rounded-lg font-medium transition-colors text-sm flex items-center justify-center gap-2">
                    <i class="fa-solid fa-file-pdf text-red-400"></i>Baixar PDF
                </a>
            `;
        } else {
            botaoPDF = `
                <button disabled class="flex-1 bg-gray-200 text-gray-400 cursor-not-allowed py-2 rounded-lg font-medium text-sm">
                    Sem PDF Disponível
                </button>
            `;
        }

        // Template HTML do card
        const cardHTML = `
            <div class="bg-white rounded-2xl shadow-md border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300 flex flex-col">
                <div class="flex justify-between items-start mb-4">
                    <span class="${badgeColor} text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">${projeto.Status}</span>
                    <span class="text-gray-400 text-sm"><i class="fa-solid fa-tags mr-1"></i>${projeto.Categoria || 'TI'}</span>
                </div>
                <h3 class="text-xl font-bold text-gray-900 mb-2 truncate" title="${projeto.Titulo}">${projeto.Titulo}</h3>
                <div class="mb-4 flex-grow">
                    <p class="text-gray-600 text-sm line-clamp-3">
                        ${projeto.Descricao}
                    </p>
                    ${projeto.Descricao.length > 120 ? `<button onclick="abrirModalDetalhes(${index})" class="text-blue-600 text-xs font-semibold mt-1 hover:underline cursor-pointer">Ler mais...</button>` : ''}
                </div>
                <div class="bg-gray-50 rounded-lg p-3 mb-4 text-sm border border-gray-100">
                    <p class="font-semibold text-gray-800"><i class="fa-solid fa-users mr-2 text-blue-600"></i>${projeto.Squad || 'Aguardando Squad'}</p>
                    <p class="text-gray-500 mt-1 truncate">${projeto.Integrantes || 'Sem integrantes alocados'}</p>
                </div>

                <div class="flex gap-2 mt-auto">
                    ${botaoPDF}
                    <button onclick="abrirModalDetalhes(${index})" class="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors">
                        <i class="fa-solid fa-arrow-up-right-from-square"></i>
                    </button>
                </div>
            </div>
        `;
        grid.innerHTML += cardHTML;
    });
}

// 3. LOGICA DA BARRA DE PESQUISA (Realtime)
function filtrarPesquisa(termo) {
    const termoLower = termo.toLowerCase();
    const filtrados = projetosGlobais.filter(p => 
        p.Titulo.toLowerCase().includes(termoLower) || 
        p.Descricao.toLowerCase().includes(termoLower) ||
        p.Squad.toLowerCase().includes(termoLower)
    );
    renderizarCards(filtrados);
}

// 4. LOGICA DOS FILTROS POR ABA (Status)
function filtrarPorStatus(status, elementoBotao) {
    // Muda a estilização visual do botão ativo
    const botoes = elementoBotao.parentElement.querySelectorAll("button");
    botoes.forEach(b => {
        b.className = "px-6 py-2 text-gray-600 hover:text-gray-900 font-medium transition-all";
    });
    elementoBotao.className = "px-6 py-2 bg-white rounded-lg shadow text-blue-600 font-semibold transition-all";

    if (status === "Todos") {
        renderizarCards(projetosGlobais);
    } else {
        const filtrados = projetosGlobais.filter(p => p.Status === status);
        renderizarCards(filtrados);
    }
}

// 5. MODAL DE DETALHES DO PROJETO
function abrirModalDetalhes(index) {
    const projeto = projetosGlobais[index];
    
    // Injeta o conteúdo dinâmico no corpo do modal
    const modalHTML = `
        <div class="flex justify-between items-center p-6 border-b border-gray-100">
            <h2 class="text-2xl font-bold text-gray-900">${projeto.Titulo}</h2>
            <button onclick="fecharModal('modal-dinamico')" class="text-gray-400 hover:text-red-500 text-xl"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            <div>
                <h4 class="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Descrição Completa</h4>
                <p class="text-gray-700 leading-relaxed">${projeto.Descricao}</p>
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div class="bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <h4 class="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Squad Operador</h4>
                    <p class="font-semibold text-gray-900">${projeto.Squad || 'Nenhum'}</p>
                </div>
                <div class="bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <h4 class="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Status no LTD</h4>
                    <p class="font-semibold text-gray-900">${projeto.Status}</p>
                </div>
            </div>
            <div>
                <h4 class="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Membros do Squad (Prototypers)</h4>
                <p class="text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">${projeto.Integrantes || 'Apenas o Squad alocado.'}</p>
            </div>
        </div>
        <div class="p-6 bg-gray-50 text-right border-t border-gray-100">
            <button onclick="fecharModal('modal-dinamico')" class="bg-gray-900 text-white px-6 py-2 rounded-lg hover:bg-black font-semibold">Fechar</button>
        </div>
    `;

    document.getElementById("modal-conteudo").innerHTML = modalHTML;
    document.getElementById("modal-dinamico").classList.remove("hidden");
}

function fecharModal(id) {
    document.getElementById(id).classList.add("hidden");
}


// INICIALIZAÇÃO AO CARREGAR A PÁGINA
window.onload = () => {
    carregarProjetos();
};