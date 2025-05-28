const express = require('express');
const path = require('path');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);


app.use(express.static(path.join(__dirname, '../frontend')));

let EstadoDoJogo = {
    jogadores: [],
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
        
        if (EstadoDoJogo.jogadores.length === 2) {//faz com que o jogo só funcione se tiver 2 jogadores on
            io.to(EstadoDoJogo.jogadores[0]).emit('Start');
            io.to(EstadoDoJogo.jogadores[1]).emit('Start');
            console.log('Jogo iniciado');
        } else {
            socket.emit('espera');//se só tem 1 jogador fica esperando
        }
    } else {
        socket.emit('cheio');//manda que a sala ta cheia
        return;
    }

    socket.on('escolhaJogador', (move) => {
        const jogadorIndex = EstadoDoJogo.jogadores.indexOf(socket.id);
        
        if (jogadorIndex === 0) {
            EstadoDoJogo.p1Move = move;
        } else if (jogadorIndex === 1) {
            EstadoDoJogo.p2Move = move;
        }

      
        if (EstadoDoJogo.p1Move && EstadoDoJogo.p2Move) {//verifica se ambos jogaram
            const resultado = determinaVencedor(EstadoDoJogo.p1Move, EstadoDoJogo.p2Move);
            
      
            if (resultado === 'jogador1') {//adiciona pontos ao vencedor
                EstadoDoJogo.placar.jogador1++;
            } else if (resultado === 'jogador2') {
                EstadoDoJogo.placar.jogador2++;
            }
            

            console.log('resultado:', resultado);
            console.log('Placar:', EstadoDoJogo.placar);

           
            const resultadojogo = {//manda o resultadoado para os 2 jogadores
                p1: EstadoDoJogo.p1Move,
                p2: EstadoDoJogo.p2Move,
                resultado,
                jogador1: EstadoDoJogo.jogadores[0],
                jogador2: EstadoDoJogo.jogadores[1],
                placar: EstadoDoJogo.placar
            };

            io.to(EstadoDoJogo.jogadores[0]).emit('resultadojogo', resultadojogo);
            io.to(EstadoDoJogo.jogadores[1]).emit('resultadojogo', resultadojogo);

           //reseta os movimentos para o proximo jogo
            EstadoDoJogo.p1Move = null;
            EstadoDoJogo.p2Move = null;
            }
    });

    socket.on('disconnect', () => {
        console.log('Usuário desconectado:', socket.id);
        const jogadorIndex = EstadoDoJogo.jogadores.indexOf(socket.id);
        
        if (jogadorIndex !== -1) {
            EstadoDoJogo.jogadores.splice(jogadorIndex, 1);
            
            if (EstadoDoJogo.jogadores.length === 1) {
                io.to(EstadoDoJogo.jogadores[0]).emit('jogadorDisconnectado');
                io.to(EstadoDoJogo.jogadores[0]).emit('espera');
            }
            
            
            EstadoDoJogo.p1Move = null;
            EstadoDoJogo.p2Move = null;
            
            
            if (EstadoDoJogo.jogadores.length === 0) {
                EstadoDoJogo.placar = {
                    jogador1: 0,
                    jogador2: 0
                };
            }
            
            console.log('Jogadores restantes:', EstadoDoJogo.jogadores.length);
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

app.get('/status', (req, res) => {
    res.json({
        jogadoresConnected: EstadoDoJogo.jogadores.length,
        placar: EstadoDoJogo.placar,
        gameActive: EstadoDoJogo.jogadores.length === 2
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});