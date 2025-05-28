const socket = io();
let jogo = document.getElementById('jogo');
let resultado = document.getElementById('resultado');
let cronometro = document.getElementById('cronometro');
let status = document.getElementById('status');
let meusPontos = document.getElementById('meusPontos');
let pontosOponente = document.getElementById('pontosOponente');
let contagem = 5;
let meuPlacar = 0;
let placarOponente = 0;


const opcoes = document.querySelectorAll('.opcao');

socket.on('conectado', () => {
    status.textContent = 'Conectado! Aguardando outro jogador...';
    status.style.background = 'rgba(255, 215, 0, 0.3)';
});

socket.on('Start', () => {
    status.textContent = 'Jogo iniciado! Faça sua jogada.';
    status.style.background = 'rgba(0, 255, 144, 0.3)';
    jogo.dataset.ativo = 'true';
    habilitarBotoes(true);
    habilitarOpcoes(true);
});

socket.on('espera', () => {
    status.textContent = 'Aguardando outro jogador se conectar...';
    status.style.background = 'rgba(255, 215, 0, 0.3)';
    jogo.dataset.ativo = 'false';
    habilitarBotoes(false);
    habilitarOpcoes(false);
});

socket.on('cheio', () => {
    status.textContent = 'Sala cheia! Aguarde uma vaga.';
    status.style.background = 'rgba(255, 76, 76, 0.3)';
    jogo.dataset.ativo = 'false';
    habilitarBotoes(false);
    habilitarOpcoes(false);
});

function habilitarBotoes(ativo) {
    document.querySelectorAll('#jogo button').forEach(btn => {
        btn.disabled = !ativo;
    });
}

function habilitarOpcoes(ativo) {
    opcoes.forEach(opcao => {
        if (ativo) {
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
        if (jogo.dataset.ativo === 'true') {
            const move = btn.dataset.move;
            enviarJogada(move);
        }
    });
});

opcoes.forEach(opcao => {
    opcao.addEventListener('click', () => {
        if (jogo.dataset.ativo === 'true') {
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
        meuPlacar = placar.jogador1;
        placarOponente = placar.jogador2;
    } else {
        minhaJogada = p2;
        jogadaOponente = p1;
        meuPlacar = placar.jogador2;
        placarOponente = placar.jogador1;
    }

    animarPlacar(meusPontos, meuPlacar);
    animarPlacar(pontosOponente, placarOponente);

    let cor = '';
    let textoResultado = '';
    
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

    resultado.innerHTML = textoResultado;
    resultado.className = cor;

    opcoes.forEach(opcao => {
        opcao.style.transform = 'scale(1)';
        opcao.style.boxShadow = '0 4px 6px rgba(0,0,0,0.3)';
    });

    iniciarContagem();
});


function animarPlacar(elemento, novoPlacar) {
    const placarAtual = parseInt(elemento.textContent);
    if (novoPlacar > placarAtual) {
        elemento.style.transform = 'scale(1.3)';
        elemento.style.color = '#00ff90';
        setTimeout(() => {
            elemento.style.transform = 'scale(1)';
            elemento.style.color = '#ffd700';
        }, 500);
    }
    elemento.textContent = novoPlacar;
}

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
    
    const intervalo = setInterval(() => {
        contagem--;
        if (contagem <= 0) {
            clearInterval(intervalo);;
            cronometro.textContent = '';
            resultado.textContent = '';
            resultado.className = '';
            jogo.dataset.ativo = 'true';
            habilitarBotoes(true);
            habilitarOpcoes(true);
            status.textContent = 'Faça sua jogada!';
            status.style.background = 'rgba(0, 255, 144, 0.3)';
            return
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