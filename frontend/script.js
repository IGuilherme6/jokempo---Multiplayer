const socket = io();
let jogo = document.getElementById('jogo');
let resultado = document.getElementById('resultado');
let cronometro = document.getElementById('cronometro');
let status = document.getElementById('status');
let meusPontos = document.getElementById('meusPontos');
let pontosOponente = document.getElementById('pontosOponente');
let contagem = 5;
let souJogador = false;
let labelMe = document.querySelectorAll('.jogador h3')[0];
let labelOponente = document.querySelectorAll('.jogador h3')[1];


const opcoes = document.querySelectorAll('.opcao');

socket.on('conectado', () => {
    status.textContent = 'Conectado! Aguardando outro jogador...';
    status.style.background = 'rgba(255, 215, 0, 0.3)';
});

socket.on('Start', () => {
    souJogador = true;
    status.textContent = 'Jogo iniciado! Faça sua jogada.';
    status.style.background = 'rgba(0, 255, 144, 0.3)';
    jogo.dataset.ativo = 'true';
    habilitarBotoes(true);
    habilitarOpcoes(true);
});

socket.on('espera', () => {
    souJogador = false;
    status.textContent = 'Aguardando outro jogador se conectar...';
    status.style.background = 'rgba(255, 215, 0, 0.3)';
    jogo.dataset.ativo = 'false';
    habilitarBotoes(false);
    habilitarOpcoes(false);
});

socket.on('cheio', () => {
    souJogador = false;
    status.textContent = 'Sala cheia! Aguarde uma vaga.';
    status.style.background = 'rgba(255, 76, 76, 0.3)';
    jogo.dataset.ativo = 'false';
    habilitarBotoes(false);
    habilitarOpcoes(false);
});

socket.on('assistindo', () => {
    souJogador = false;
    status.textContent = 'Assistindo ao jogo.';
    labelMe.textContent = 'Jogador 1';
    labelOponente.textContent = 'Jogador 2';
    status.style.background = 'rgba(173, 216, 230, 0.3)';
    jogo.dataset.ativo = 'false';
    habilitarBotoes(false);
    habilitarOpcoes(false);
});

function habilitarBotoes(ativo) {
    // Só habilita os botões se for jogador E estiver ativo
    document.querySelectorAll('#jogo button').forEach(btn => {
        btn.disabled = !ativo || !souJogador;
    });
}

function habilitarOpcoes(ativo) {
    opcoes.forEach(opcao => {
        if (ativo && souJogador) {
            opcao.style.cursor = 'pointer';
            opcao.style.opacity = '1';
        } else {
            opcao.style.cursor = 'not-allowed';
            opcao.style.opacity = '0.6';
        }
    });
}

document.querySelectorAll('#jogo button').forEach(btn => {
    btn.addEventListener('click', () => {
        if (jogo.dataset.ativo === 'true' && souJogador) {
            const move = btn.dataset.move;
            enviarJogada(move);
        }
    });
});

opcoes.forEach(opcao => {
    opcao.addEventListener('click', () => {
        if (jogo.dataset.ativo === 'true' && souJogador) {
            const move = opcao.id;
            enviarJogada(move);
        }
    });
});

function enviarJogada(move) {
    socket.emit('escolhaJogador', move);
    resultado.textContent = `Você escolheu: ${move}. Aguardando oponente...`;
    resultado.className = '';
    status.textContent = 'Aguardando jogada do oponente...';
    status.style.background = 'rgba(255, 215, 0, 0.3)';
    jogo.dataset.ativo = 'false';
    habilitarBotoes(false);
    habilitarOpcoes(false);

    highlightEscolha(move);
}

function highlightEscolha(move) {
    opcoes.forEach(opcao => {
        opcao.style.transform = 'scale(1)';
        opcao.style.boxShadow = '0 4px 6px rgba(0,0,0,0.3)';
    });

    const escolhida = document.getElementById(move);
    if (escolhida) {
        escolhida.style.transform = 'scale(1.2)';
        escolhida.style.boxShadow = '0 6px 20px rgba(255, 215, 0, 0.6)';
    }
}

socket.on('resultadojogo', ({ p1, p2, resultado: resultadoRodada, jogador1, jogador2, placar }) => {
    jogo.dataset.ativo = 'false';
    habilitarBotoes(false);
    habilitarOpcoes(false);

    let minhaJogada, jogadaOponente;

    if (socket.id === jogador1) {
        minhaJogada = p1;
        jogadaOponente = p2;
        souJogador = true;
    } else if (socket.id === jogador2) {
        minhaJogada = p2;
        jogadaOponente = p1;
        souJogador = true;
    } else {
        minhaJogada = p1;
        jogadaOponente = p2;
        souJogador = false; // espectador
    }

    // Atualiza o placar sempre, para jogadores e espectadores
    let meuPlacar, placarOponente;
    if (souJogador) {
        labelMe.textContent = 'Você';
        labelOponente.textContent = 'Oponente';
        if (socket.id === jogador1) {
            meuPlacar = placar.jogador1;
            placarOponente = placar.jogador2;
        } else {
            meuPlacar = placar.jogador2;
            placarOponente = placar.jogador1;
        }
    } else {
        labelMe.textContent = 'Jogador 1';
        labelOponente.textContent = 'Jogador 2';
        meuPlacar = placar.jogador1;
        placarOponente = placar.jogador2;
    }
    meusPontos.textContent = meuPlacar;
    pontosOponente.textContent = placarOponente;

    let cor = '';
    let textoResultado = '';

    if (souJogador) {
        if (minhaJogada === jogadaOponente) {
            cor = 'orange';
            textoResultado = `Empate!<br>Você: ${minhaJogada} | Oponente: ${jogadaOponente}`;
            status.textContent = 'Empate!';
            status.style.background = 'rgba(255, 215, 0, 0.3)';
        } else if (
            (minhaJogada === 'pedra' && jogadaOponente === 'tesoura') ||
            (minhaJogada === 'papel' && jogadaOponente === 'pedra') ||
            (minhaJogada === 'tesoura' && jogadaOponente === 'papel')
        ) {
            cor = 'green';
            textoResultado = `Você ganhou!<br>Você: ${minhaJogada} | Oponente: ${jogadaOponente}`;
            status.textContent = 'Você ganhou';
            status.style.background = 'rgba(0, 255, 144, 0.3)';
        } else {
            cor = 'red';
            textoResultado = `Você perdeu!<br>Você: ${minhaJogada} | Oponente: ${jogadaOponente}`;
            status.textContent = 'Você perdeu!';
            status.style.background = 'rgba(255, 76, 76, 0.3)';
        }
    } else {
        textoResultado = `Rodada finalizada:<br>Jogador 1: ${p1} | Jogador 2: ${p2}`;
        status.textContent = 'Assistindo ao jogo';
        status.style.background = 'rgba(173, 216, 230, 0.3)';
    }

    resultado.innerHTML = textoResultado;
    resultado.className = cor;

    opcoes.forEach(opcao => {
        opcao.style.transform = 'scale(1)';
        opcao.style.boxShadow = '0 4px 6px rgba(0,0,0,0.3)';
    });

    iniciarContagem();
});

socket.on('jogadorDisconnectado', () => {
    status.textContent = 'Oponente desconectou. Aguardando novo jogador...';
    status.style.background = 'rgba(255, 76, 76, 0.3)';
    jogo.dataset.ativo = 'false';
    habilitarBotoes(false);
    habilitarOpcoes(false);

    resultado.textContent = '';
    resultado.className = '';
    cronometro.textContent = '';

    opcoes.forEach(opcao => {
        opcao.style.transform = 'scale(1)';
        opcao.style.boxShadow = '0 4px 6px rgba(0,0,0,0.3)';
    });
});

function iniciarContagem() {
    contagem = 5;
    cronometro.textContent = `Próxima rodada em: ${contagem}s`;
    if (souJogador) {
        jogo.dataset.ativo = 'true';
        habilitarBotoes(true);
        habilitarOpcoes(true);
        status.textContent = 'Faça sua jogada!';
        status.style.background = 'rgba(0, 255, 144, 0.3)';
    }
    const intervalo = setInterval(() => {
        contagem--;
        if (contagem <= 0) {
            clearInterval(intervalo);
            cronometro.textContent = '';
            resultado.textContent = '';
            resultado.className = '';
            if (souJogador) {
                jogo.dataset.ativo = 'true';
                habilitarBotoes(true);
                habilitarOpcoes(true);
                status.textContent = 'Faça sua jogada!';
                status.style.background = 'rgba(0, 255, 144, 0.3)';
            }
            return;
        } else {
            cronometro.textContent = `Próxima rodada em: ${contagem}s`;
        }
    }, 1000);
}

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        document.getElementById('placar').style.transform = 'scale(1.05)';
        setTimeout(() => {
            document.getElementById('placar').style.transform = 'scale(1)';
        }, 200);
    }, 500);
});
