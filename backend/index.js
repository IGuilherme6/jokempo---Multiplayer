const express = require('express');
const path = require('path');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);


app.use(express.static(path.join(__dirname, '../frontend')));

let gameState = {
    players: [],
    p1Move: null,
    p2Move: null,
    scores: {
        player1: 0,
        player2: 0
    }
};

io.on('connection', (socket) => {
    console.log('Usuário conectado:', socket.id);

    if (gameState.players.length < 2) {
        gameState.players.push(socket.id);
        console.log(`Jogador ${gameState.players.length} conectado:`, socket.id);
        
        if (gameState.players.length === 2) {//faz com que o jogo só funcione se tiver 2 jogadors on
            io.to(gameState.players[0]).emit('gameStart');
            io.to(gameState.players[1]).emit('gameStart');
            console.log('Jogo iniciado com 2 jogadores');
        } else {
            socket.emit('espera');//se só tem 1 jogador fica esperando
        }
    } else {
        socket.emit('cheio');//manda que a sala ta cheia
        return;
    }

    socket.on('playerMove', (move) => {
        const playerIndex = gameState.players.indexOf(socket.id);
        
        if (playerIndex === 0) {
            gameState.p1Move = move;
            console.log('Player 1 jogou:', move);
        } else if (playerIndex === 1) {
            gameState.p2Move = move;
            console.log('Player 2 jogou:', move);
        }

      
        if (gameState.p1Move && gameState.p2Move) {//verifica se ambos jogaram
            const result = determineWinner(gameState.p1Move, gameState.p2Move);
            
      
            if (result === 'player1') {//adiciona pontos ao vencedor
                gameState.scores.player1++;
            } else if (result === 'player2') {
                gameState.scores.player2++;
            }
            

            console.log('Resultado:', result);
            console.log('Placar:', gameState.scores);

           
            const gameResult = {//manda o resultado para os 2 jogadores
                p1: gameState.p1Move,
                p2: gameState.p2Move,
                result,
                player1: gameState.players[0],
                player2: gameState.players[1],
                scores: gameState.scores
            };

            io.to(gameState.players[0]).emit('gameResult', gameResult);
            io.to(gameState.players[1]).emit('gameResult', gameResult);

           //reseta os movimentos para o proximo jogo
            gameState.p1Move = null;
            gameState.p2Move = null;
            }
    });

    socket.on('disconnect', () => {
        console.log('Usuário desconectado:', socket.id);
        const playerIndex = gameState.players.indexOf(socket.id);
        
        if (playerIndex !== -1) {
            gameState.players.splice(playerIndex, 1);
            
            if (gameState.players.length === 1) {
                io.to(gameState.players[0]).emit('playerDisconnected');
                io.to(gameState.players[0]).emit('espera');
            }
            
            
            gameState.p1Move = null;
            gameState.p2Move = null;
            
            
            if (gameState.players.length === 0) {
                gameState.scores = {
                    player1: 0,
                    player2: 0
                };
            }
            
            console.log('Jogadores restantes:', gameState.players.length);
       }
    });
});

function determineWinner(p1, p2) {
    if (p1 === p2) return 'empate';
    
    const winConditions = {
        'pedra': 'tesoura',
        'papel': 'pedra',
        'tesoura': 'papel'
    };
    
    if (winConditions[p1] === p2) {
        return 'player1';
    }
    return 'player2';
}

app.get('/status', (req, res) => {
    res.json({
        playersConnected: gameState.players.length,
        scores: gameState.scores,
        gameActive: gameState.players.length === 2
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});