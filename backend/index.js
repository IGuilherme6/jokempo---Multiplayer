const express = require('express');
const path = require('path');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static(path.join(__dirname, '../frontend')));

let EstadoDoJogo = {
    jogadores: [],
    espectadores: [],
    p1Move: null,
    p2Move: null,
    placar: {
        jogador1: 0,
        jogador2: 0
    }
};

io.on('connection', (socket) => {
    if (EstadoDoJogo.jogadores.length < 2) {
        EstadoDoJogo.jogadores.push(socket.id);
        console.log(`Jogador ${EstadoDoJogo.jogadores.length} conectado:`, socket.id);
        
        if (EstadoDoJogo.jogadores.length === 2) {
            EstadoDoJogo.espectadores.forEach(espectadorId => {
                io.to(espectadorId).emit('assistindo');
            });
            EstadoDoJogo.jogadores.forEach(id => io.to(id).emit('Start'));
        } else {
            socket.emit('espera');
        }
    } else {
        EstadoDoJogo.espectadores.push(socket.id);
        socket.emit('assistindo');
        console.log(`Espectador conectado: ${socket.id}`);
    }

    socket.on('escolhaJogador', (move) => {
        const jogadorIndex = EstadoDoJogo.jogadores.indexOf(socket.id);
        if (jogadorIndex === -1) {
            // Não processa jogada de espectadores
            return;
        }

        if (jogadorIndex === 0) {
            EstadoDoJogo.p1Move = move;
        } else if (jogadorIndex === 1) {
            EstadoDoJogo.p2Move = move;
        }

        if (EstadoDoJogo.p1Move && EstadoDoJogo.p2Move) {
            const resultado = determinaVencedor(EstadoDoJogo.p1Move, EstadoDoJogo.p2Move);
            if (resultado === 'jogador1') EstadoDoJogo.placar.jogador1++;
            else if (resultado === 'jogador2') EstadoDoJogo.placar.jogador2++;

            const resultadojogo = {
                p1: EstadoDoJogo.p1Move,
                p2: EstadoDoJogo.p2Move,
                resultado,
                jogador1: EstadoDoJogo.jogadores[0],
                jogador2: EstadoDoJogo.jogadores[1],
                placar: EstadoDoJogo.placar
            };

            EstadoDoJogo.jogadores.forEach(id => io.to(id).emit('resultadojogo', resultadojogo));
            EstadoDoJogo.espectadores.forEach(id => io.to(id).emit('resultadojogo', resultadojogo));

            EstadoDoJogo.p1Move = null;
            EstadoDoJogo.p2Move = null;
        }
    });

    socket.on('disconnect', () => {
        console.log('Usuário desconectado:', socket.id);
        let index = EstadoDoJogo.jogadores.indexOf(socket.id);
        if (index !== -1) {
            EstadoDoJogo.placar.jogador1 = 0;
            EstadoDoJogo.placar.jogador2 = 0;
            EstadoDoJogo.jogadores.splice(index, 1);
            if (EstadoDoJogo.jogadores.length === 1) {
                io.to(EstadoDoJogo.jogadores[0]).emit('jogadorDisconnectado');
                io.to(EstadoDoJogo.jogadores[0]).emit('espera');
            }
            EstadoDoJogo.p1Move = null;
            EstadoDoJogo.p2Move = null;
        } else {
            index = EstadoDoJogo.espectadores.indexOf(socket.id);
            if (index !== -1) {
                EstadoDoJogo.espectadores.splice(index, 1);
            }
        }

        if (EstadoDoJogo.jogadores.length === 0) {
            EstadoDoJogo.placar = { jogador1: 0, jogador2: 0 };
        }
    });
});

function determinaVencedor(p1, p2) {
    if (p1 === p2) {
        return 'empate';
    }

    if (p1 === 'pedra') {
        if (p2 === 'tesoura') {
            return 'jogador1';
        } else {
            return 'jogador2';
        }
    } else if (p1 === 'papel') {
        if (p2 === 'pedra') {
            return 'jogador1';
        } else {
            return 'jogador2';
        }
    } else if (p1 === 'tesoura') {
        if (p2 === 'papel') {
            return 'jogador1';
        } else {
            return 'jogador2';
        }
    }
}

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
