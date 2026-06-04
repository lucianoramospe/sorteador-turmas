// CONFIGURAÇÃO DA SENHA DE ACESSO
const SENHA_CORRETA = "2678";

// Gerenciador de turmas (Carrega IMEDIATAMENTE do localStorage para blindar os dados contra sumiços)
let turmas = {};
try {
    const dadosSalvos = localStorage.getItem('app_sorteio_turmas');
    if (dadosSalvos) {
        turmas = JSON.parse(dadosSalvos);
    }
} catch (e) {
    console.error("Erro ao carregar dados iniciais:", e);
    turmas = {};
}

// Define qual turma começa selecionada de forma segura
let turmaAtivaParaGerenciar = Object.keys(turmas).length > 0 ? Object.keys(turmas)[0] : ""; 

// Função de Login
function realizarLogin() {
    const senhaDigitada = document.getElementById('senhaInput').value;
    const erroMsg = document.getElementById('erroLogin');

    if (senhaDigitada === SENHA_CORRETA) {
        // Oculta tela de login e mostra o sorteador
        document.getElementById('telaLogin').style.display = 'none';
        document.getElementById('conteudoPrincipal').style.display = 'block';
        
        // Guarda a sessão para não pedir senha a cada F5
        sessionStorage.setItem('app_logado', 'true');
        
        // Renderiza as turmas que já estão seguras na memória
        atualizarInterfaceTurmas();
    } else {
        erroMsg.style.display = 'block';
        document.getElementById('senhaInput').value = '';
        document.getElementById('senhaInput').focus();
    }
}

function verificarTeclaLogin(event) {
    if (event.key === "Enter") realizarLogin();
}

function fazerLogoff() {
    sessionStorage.removeItem('app_logado');
    window.location.reload();
}

// Inicializa verificando se o usuário já fez login antes
function inicializar() {
    if (sessionStorage.getItem('app_logado') === 'true') {
        document.getElementById('telaLogin').style.display = 'none';
        document.getElementById('conteudoPrincipal').style.display = 'block';
        atualizarInterfaceTurmas();
    } else {
        document.getElementById('telaLogin').style.display = 'flex';
        const senhaInput = document.getElementById('senhaInput');
        if (senhaInput) senhaInput.focus();
    }
}

// Cria os checkboxes das turmas na tela
function atualizarInterfaceTurmas() {
    const container = document.getElementById('listaTurmasCheckboxes');
    if (!container) return;

    container.innerHTML = '';
    const nomesDasTurmas = Object.keys(turmas);

    if (nomesDasTurmas.length === 0) {
        container.innerHTML = '<p style="color: #888; margin: 5px 0;">Nenhuma turma criada.</p>';
        turmaAtivaParaGerenciar = "";
        carregarAlunosDaTurmaAtiva();
        return;
    }

    if (!turmaAtivaParaGerenciar || turmas[turmaAtivaParaGerenciar] === undefined) {
        turmaAtivaParaGerenciar = nomesDasTurmas[0];
    }

    nomesDasTurmas.forEach(nome => {
        const itemDiv = document.createElement('div');
        itemDiv.className = `item-turma-checkbox ${nome === turmaAtivaParaGerenciar ? 'ativa' : ''}`;
        
        itemDiv.onclick = (e) => {
            if (e.target.type !== 'checkbox') {
                turmaAtivaParaGerenciar = nome;
                atualizarInterfaceTurmas();
            }
        };

        itemDiv.innerHTML = `
            <div>
                <input type="checkbox" id="chk-${nome}" value="${nome}" onchange="calcularContadoresRodadaGeral()">
                <span style="font-weight: 500;">${nome}</span>
            </div>
            ${nome === turmaAtivaParaGerenciar ? '<span class="lbl-gerenciar">Gerenciando</span>' : ''}
        `;
        container.appendChild(itemDiv);
    });

    carregarAlunosDaTurmaAtiva();
}

// Carrega os alunos da turma ativa na lista lateral
function carregarAlunosDaTurmaAtiva() {
    if (turmaAtivaParaGerenciar && turmas[turmaAtivaParaGerenciar] !== undefined) {
        desenharListaAlunos(turmas[turmaAtivaParaGerenciar]);
    } else {
        desenharListaAlunos([]);
    }
    calcularContadoresRodadaGeral();
}

// Calcula quantos restam considerando todas as turmas marcadas
function calcularContadoresRodadaGeral() {
    let total = 0;
    let restantes = 0;

    const turmasSelecionadas = obterTurmasMarcadasNosCheckboxes();
    
    turmasSelecionadas.forEach(nomeTurma => {
        if (turmas[nomeTurma]) {
            total += turmas[nomeTurma].length;
            restantes += turmas[nomeTurma].filter(a => !a.sorteado).length;
        }
    });

    const contador = document.getElementById('contadorRodada');
    if (contador) {
        contador.innerText = `Restam na Rodada: ${restantes} / ${total}`;
    }
}

// Retorna uma lista com as turmas marcadas com visto
function obterTurmasMarcadasNosCheckboxes() {
    const nomesDasTurmas = Object.keys(turmas);
    const marcadas = [];
    
    nomesDasTurmas.forEach(nome => {
        const chk = document.getElementById(`chk-${nome}`);
        if (chk && chk.checked) {
            marcadas.push(nome);
        }
    });
    return marcadas;
}

// Desenha a lista de alunos da turma ativa
function desenharListaAlunos(listaAlunos) {
    const ul = document.getElementById('listaAlunosVisual');
    if (!ul) return;
    ul.innerHTML = '';

    if (listaAlunos.length === 0) {
        ul.innerHTML = '<li style="color: #888; justify-content: center;">Sem alunos para exibir nesta turma ativa.</li>';
        return;
    }

    listaAlunos.forEach((aluno, index) => {
        const li = document.createElement('li');
        if (aluno.sorteado) li.classList.add('ja-sorteado');

        li.innerHTML = `
            <span>${aluno.sorteado ? '✅ ' : ''}${aluno.nome}</span>
            <button class="btn-deletar-individual" onclick="excluirAlunoIndividual(${index})" title="Excluir Aluno">🗑️</button>
        `;
        ul.appendChild(li);
    });
}

// Cria uma nova turma
function criarTurma() {
    const inputNome = document.getElementById('novoNomeTurma');
    const nomeTurma = inputNome.value.trim();

    if (nomeTurma === "" || turmas[nomeTurma] !== undefined) {
        alert("Nome inválido ou turma já existente!");
        return;
    }

    turmas[nomeTurma] = [];
    turmaAtivaParaGerenciar = nomeTurma;
    salvarNoLocalStorage();
    atualizarInterfaceTurmas();
    
    inputNome.value = "";
}

// Adiciona aluno na turma ativa
function adicionarAluno() {
    if (!turmaAtivaParaGerenciar) {
        alert("Crie uma turma antes de adicionar alunos!");
        return;
    }

    const inputAluno = document.getElementById('novoAluno');
    const nomeAluno = inputAluno.value.trim();

    if (nomeAluno === "") return;

    turmas[turmaAtivaParaGerenciar].push({ nome: nomeAluno, sorteado: false });
    salvarNoLocalStorage();
    carregarAlunosDaTurmaAtiva();

    inputAluno.value = "";
    inputAluno.focus();
}

function verificarTeclaAluno(event) {
    if (event.key === "Enter") adicionarAluno();
}

// Exclui aluno da lista lateral
function excluirAlunoIndividual(index) {
    if (!turmaAtivaParaGerenciar) return;
    turmas[turmaAtivaParaGerenciar].splice(index, 1);
    salvarNoLocalStorage();
    carregarAlunosDaTurmaAtiva();
}

// Reinicia a rodada das turmas selecionadas (CORRIGIDO)
function reiniciarRodada() {
    const turmasMarcadas = obterTurmasMarcadasNosCheckboxes();

    if (turmasMarcadas.length === 0) {
        alert("Marque pelo menos uma turma nos checkboxes para reiniciar.");
        return;
    }

    turmasMarcadas.forEach(nomeTurma => {
        if (turmas[nomeTurma]) {
            turmas[nomeTurma].forEach(aluno => aluno.sorteado = false);
        }
    });

    salvarNoLocalStorage();
    carregarAlunosDaTurmaAtiva();
    document.getElementById('resultadoBox').style.display = 'none';
    alert("Rodada reiniciada para as turmas marcadas!");
}

// Limpa todos os alunos da turma ativa
function limparAlunos() {
    if (!turmaAtivaParaGerenciar || turmas[turmaAtivaParaGerenciar].length === 0) return;

    if (confirm(`Excluir TODOS os alunos da turma ativa "${turmaAtivaParaGerenciar}"?`)) {
        turmas[turmaAtivaParaGerenciar] = [];
        salvarNoLocalStorage();
        carregarAlunosDaTurmaAtiva();
    }
}

// Exclui a turma ativa por completo
function excluirTurma() {
    if (!turmaAtivaParaGerenciar) return;

    if (confirm(`Excluir permanentemente a turma "${turmaAtivaParaGerenciar}"?`)) {
        delete turmas[turmaAtivaParaGerenciar];
        turmaAtivaParaGerenciar = Object.keys(turmas).length > 0 ? Object.keys(turmas)[0] : "";
        salvarNoLocalStorage();
        atualizarInterfaceTurmas();
    }
}

function salvarNoLocalStorage() {
    try {
        localStorage.setItem('app_sorteio_turmas', JSON.stringify(turmas));
    } catch (e) {
        console.error("Erro ao salvar dados no localStorage:", e);
    }
}

// Sorteia misturando as turmas selecionadas
function sortear() {
    const turmasMarcadas = obterTurmasMarcadasNosCheckboxes();
    let todosDisponiveis = [];

    turmasMarcadas.forEach(nomeTurma => {
        if (turmas[nomeTurma]) {
            turmas[nomeTurma].forEach(aluno => {
                if (!aluno.sorteado) {
                    todosDisponiveis.push({ dadosAluno: aluno, daTurma