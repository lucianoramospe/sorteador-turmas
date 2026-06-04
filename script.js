// CONFIGURAÇÃO DA SENHA DE ACESSO
const SENHA_CORRETA = "2678";

// Gerenciador de turmas
let turmas = {};
let turmaAtivaParaGerenciar = ""; 

// Função de Login
function realizarLogin() {
    const senhaDigitada = document.getElementById('senhaInput').value;
    const erroMsg = document.getElementById('erroLogin');

    if (senhaDigitada === SENHA_CORRETA) {
        document.getElementById('telaLogin').style.display = 'none';
        document.getElementById('conteudoPrincipal').style.display = 'block';
        
        sessionStorage.setItem('app_logado', 'true');
        carregarDadosSorteador();
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

// Inicializa verificando sessão
function inicializar() {
    if (sessionStorage.getItem('app_logado') === 'true') {
        document.getElementById('telaLogin').style.display = 'none';
        document.getElementById('conteudoPrincipal').style.display = 'block';
        carregarDadosSorteador();
    } else {
        document.getElementById('telaLogin').style.display = 'flex';
        if(document.getElementById('senhaInput')) document.getElementById('senhaInput').focus();
    }
}

// Carrega as turmas salvando no LocalStorage
function carregarDadosSorteador() {
    try {
        const dadosSalvos = localStorage.getItem('app_sorteio_turmas');
        if (dadosSalvos) {
            turmas = JSON.parse(dadosSalvos);
        } else {
            turmas = {};
        }
    } catch (e) {
        console.error("Erro ao carregar do localStorage", e);
        turmas = {};
    }
    
    const nomesTurmas = Object.keys(turmas);
    if (nomesTurmas.length > 0) {
        turmaAtivaParaGerenciar = nomesTurmas[0];
    } else {
        turmaAtivaParaGerenciar = "";
    }

    atualizarInterfaceTurmas();
}

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

function carregarAlunosDaTurmaAtiva() {
    if (turmaAtivaParaGerenciar && turmas[turmaAtivaParaGerenciar] !== undefined) {
        desenharListaAlunos(turmas[turmaAtivaParaGerenciar]);
    } else {
        desenharListaAlunos([]);
    }
    calcularContadoresRodadaGeral();
}

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

function excluirAlunoIndividual(index) {
    if (!turmaAtivaParaGerenciar) return;
    turmas[turmaAtivaParaGerenciar].splice(index, 1);
    salvarNoLocalStorage();
    carregarAlunosDaTurmaAtiva();
}

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

function limparAlunos() {
    if (!turmaAtivaParaGerenciar || turmas[turmaAtivaParaGerenciar].length === 0) return;

    if (confirm(`Excluir TODOS os alunos da turma ativa "${turmaAtivaParaGerenciar}"?`)) {
        turmas[turmaAtivaParaGerenciar] = [];
        salvarNoLocalStorage();
        carregarAlunosDaTurmaAtiva();
    }
}

function excluirTurma() {
    if (!turmaAtivaParaGerenciar) return;

    if (confirm(`Excluir permanentemente a turma "${turmaAtivaParaGerenciar}"?`)) {
        delete turmas[turmaAtivaParaGerenciar];
        turmaAtivaParaGerenciar = "";
        salvarNoLocalStorage();
        atualizarInterfaceTurmas();
    }
}

function salvarNoLocalStorage() {
    try {
        localStorage.setItem('app_sorteio_turmas', JSON.stringify(turmas));
    } catch(e) {
        console.error("Erro ao salvar no localStorage", e);
    }
}

function sortear() {
    const turmasMarcadas = obterTurmasMarcadasNosCheckboxes();
    let todosDisponiveis = [];

    turmasMarcadas.forEach(nomeTurma => {
        if (turmas[nomeTurma]) {
            turmas[nomeTurma].forEach(aluno => {
                if (!aluno.sorteado) {
                    todosDisponiveis.push({ dadosAluno: aluno, daTurma: nomeTurma });
                }
            });
        }
    });

    if (turmasMarcadas.length === 0) {
        alert("Por favor, selecione pelo menos uma turma na caixa de seleção!");
        return;
    }

    if (todosDisponiveis.length === 0) {
        let totalAlunos = 0;
        turmasMarcadas.forEach(t => totalAlunos += turmas[t].length);

        if (totalAlunos === 0) {
            alert("As turmas selecionadas não possuem alunos cadastrados!");
            return;
        }

        alert("Todos os alunos das turmas selecionadas já foram sorteados! Reiniciando rodada...");
        turmasMarcadas.forEach(nomeTurma => {
            turmas[nomeTurma].forEach(aluno => aluno.sorteado = false);
        });
        salvarNoLocalStorage();
        carregarAlunosDaTurmaAtiva();
        sortear();
        return;
    }

    const indiceAleatorio = Math.floor(Math.random() * todosDisponiveis.length);
    const escolhido = todosDisponiveis[indiceAleatorio];

    escolhido.dadosAluno.sorteado = true;
    salvarNoLocalStorage();

    document.getElementById('nomeSorteado').innerText = escolhido.dadosAluno.nome;
    document.getElementById('turmaDoSorteado').innerText = `Turma: ${escolhido.daTurma}`;
    
    carregarAlunosDaTurmaAtiva();
    document.getElementById('resultadoBox').style.display = 'block';
}

function excluirAlunoDefinitivo() {
    const nomeSorteado = document.getElementById('nomeSorteado').innerText;
    if (nomeSorteado === "-") return;

    let deletado = false;
    Object.keys(turmas).forEach(nomeTurma => {
        const index = turmas[nomeTurma].findIndex(aluno => aluno.nome === nomeSorteado);
        if (index > -1) {
            turmas[nomeTurma].splice(index, 1);
            deletado = true;
        }
    });

    if (deletado) {
        salvarNoLocalStorage();
        alert(`O aluno "${nomeSorteado}" foi deletado permanentemente.`);
    }
    
    carregarAlunosDaTurmaAtiva();
}

function importarCSV(input) {
    if (!turmaAtivaParaGerenciar) {
        alert("Por favor, selecione ou crie uma turma ativa antes de importar o arquivo CSV!");
        input.value = '';
        return;
    }

    const arquivo = input.files[0];
    if (!arquivo) return;

    const leitor = new FileReader();
    leitor.onload = function(e) {
        const conteudo = e.target.result;
        const linhas = conteudo.split(/\r?\n/);
        let contagemNovosAlunos = 0;

        linhas.forEach(linha => {
            if (linha.trim() === "") return;
            const nomes = linha.split(/[,;]/);

            nomes.forEach(nome => {
                const nomeLimpo = nome.trim();
                if (nomeLimpo !== "" && nomeLimpo.toLowerCase() !== "nome" && nomeLimpo.toLowerCase() !== "nomes" && nomeLimpo.toLowerCase() !== "alunos") {
                    turmas[turmaAtivaParaGerenciar].push({ nome: nomeLimpo, sorteado: false });
                    contagemNovosAlunos++;
                }
            });
        });

        if (contagemNovosAlunos > 0) {
            salvarNoLocalStorage();
            carregarAlunosDaTurmaAtiva();
            alert(`Sucesso! ${contagemNovosAlunos} alunos foram importados.`);
        } else {
            alert("Nenhum nome válido encontrado no arquivo CSV.");
        }
        input.value = '';
    };
    leitor.readAsText(arquivo, 'UTF-8');
}

// Dispara o app
window.onload = inicializar;