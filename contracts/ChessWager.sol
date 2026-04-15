function resolveGame(uint256 gameId, address winner, string calldata result) external onlyOwner {
    Game storage game = games[gameId];
    require(game.status == GameStatus.ACTIVE, "Game not active");
    
    game.status = GameStatus.COMPLETED;
    game.winner = winner;
    game.gameResult = result;
    
    // 🤝 ЛОГИКА ВОЗВРАТА ПРИ НИЧЬЕЙ
    if (keccak256(bytes(result)) == keccak256(bytes("draw"))) {
        game.status = GameStatus.DRAW;
        require(gameToken.transfer(game.player1, game.stake1), "Refund P1 failed");
        require(gameToken.transfer(game.player2, game.stake2), "Refund P2 failed");
        emit DrawResolved(gameId, game.stake1, game.stake2);
    } else {
        // 🏆 Победитель забирает пул минус комиссия
        uint256 totalPot = game.stake1 + game.stake2;
        uint256 fee = (totalPot * PLATFORM_FEE) / 100;
        uint256 payout = totalPot - fee;
        
        require(gameToken.transfer(winner, payout), "Winner payout failed");
        if (fee > 0) {
            require(gameToken.transfer(owner(), fee), "Fee transfer failed");
        }
    }
    
    emit GameResolved(gameId, winner, game.status == GameStatus.DRAW ? 0 : (game.stake1 + game.stake2), result);
}