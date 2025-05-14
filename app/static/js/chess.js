document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const chessboard = document.getElementById('chessboard');
    const statusElement = document.getElementById('status');
    const newGameBtn = document.getElementById('new-game-btn');
    const movesList = document.getElementById('moves-list');
    const promotionModal = document.getElementById('promotion-modal');
    const promotionPieces = document.querySelectorAll('.promotion-piece');
    const difficultySelect = document.getElementById('difficulty');
    const playerColorSelect = document.getElementById('player-color');
    const playerTopElement = document.getElementById('player-top');
    const playerBottomElement = document.getElementById('player-bottom');

    // Game state
    let board = null;
    let selectedSquare = null;
    let validMoves = {};
    let pendingPromotion = null;
    let moveHistory = [];
    let playerColor = 'white'; // Default player color

    // Chess piece Unicode characters
    const pieces = {
        'P': '♙', 'N': '♘', 'B': '♗', 'R': '♖', 'Q': '♕', 'K': '♔',
        'p': '♟', 'n': '♞', 'b': '♝', 'r': '♜', 'q': '♛', 'k': '♚'
    };

    // Initialize the chessboard
    function initializeBoard() {
        chessboard.innerHTML = '';

        // Create the squares
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = document.createElement('div');
                square.className = `square ${(row + col) % 2 === 0 ? 'white' : 'black'}`;

                // Set data attributes for position
                const file = String.fromCharCode(97 + col); // a-h
                const rank = 8 - row; // 1-8
                square.dataset.square = `${file}${rank}`;

                // Add event listeners
                square.addEventListener('click', handleSquareClick);

                chessboard.appendChild(square);
            }
        }
    }

    // Update the board based on FEN string
    function updateBoard(fen) {
        const fenParts = fen.split(' ');
        const position = fenParts[0];
        const rows = position.split('/');

        // Clear all pieces
        document.querySelectorAll('.piece').forEach(piece => piece.remove());

        // Remove any highlighting
        document.querySelectorAll('.square').forEach(square => {
            square.classList.remove('selected', 'valid-move', 'check');
        });

        // Place pieces according to FEN
        let rank = 8;
        for (const row of rows) {
            let file = 0;
            for (const char of row) {
                if (/\d/.test(char)) {
                    // Skip empty squares
                    file += parseInt(char);
                } else {
                    // Place a piece
                    const squareElement = document.querySelector(`.square[data-square="${String.fromCharCode(97 + file)}${rank}"]`);
                    if (squareElement) {
                        const pieceElement = document.createElement('div');
                        pieceElement.className = 'piece';
                        pieceElement.textContent = pieces[char];
                        pieceElement.dataset.piece = char;

                        // Add drag functionality
                        pieceElement.draggable = true;
                        pieceElement.addEventListener('dragstart', handleDragStart);

                        squareElement.appendChild(pieceElement);
                    }
                    file++;
                }
            }
            rank--;
        }

        // Highlight king in check
        if (fenParts[1] === 'w' && isKingInCheck(fen)) {
            highlightCheck('K');
        } else if (fenParts[1] === 'b' && isKingInCheck(fen)) {
            highlightCheck('k');
        }
    }

    // Check if king is in check
    function isKingInCheck(fen) {
        return fen.includes(' w ') && board.status.includes('Check') ||
               fen.includes(' b ') && board.status.includes('Check');
    }

    // Highlight the king in check
    function highlightCheck(kingSymbol) {
        document.querySelectorAll('.piece').forEach(piece => {
            if (piece.dataset.piece === kingSymbol) {
                piece.parentElement.classList.add('check');
            }
        });
    }

    // Handle square click
    function handleSquareClick(event) {
        const square = event.target.closest('.square');
        if (!square) return;

        const squareName = square.dataset.square;

        // If a piece is already selected
        if (selectedSquare) {
            // If clicking on a valid move destination
            if (validMoves[selectedSquare] && validMoves[selectedSquare].includes(squareName)) {
                makeMove(selectedSquare, squareName);
            } else {
                // Deselect if clicking elsewhere
                clearSelection();

                // If clicking on another piece, select it
                const piece = square.querySelector('.piece');
                if (piece && isPiecePlayable(piece)) {
                    selectSquare(square);
                }
            }
        } else {
            // Select the square if it has a playable piece
            const piece = square.querySelector('.piece');
            if (piece && isPiecePlayable(piece)) {
                selectSquare(square);
            }
        }
    }

    // Check if a piece is playable based on player's color
    function isPiecePlayable(piece) {
        const pieceType = piece.dataset.piece;
        if (playerColor === 'white') {
            return pieceType === pieceType.toUpperCase(); // White pieces are uppercase
        } else {
            return pieceType === pieceType.toLowerCase(); // Black pieces are lowercase
        }
    }

    // Select a square
    function selectSquare(square) {
        clearSelection();

        selectedSquare = square.dataset.square;
        square.classList.add('selected');

        // Highlight valid moves
        if (validMoves[selectedSquare]) {
            validMoves[selectedSquare].forEach(move => {
                const moveSquare = document.querySelector(`.square[data-square="${move}"]`);
                if (moveSquare) {
                    moveSquare.classList.add('valid-move');
                }
            });
        }
    }

    // Clear selection
    function clearSelection() {
        selectedSquare = null;
        document.querySelectorAll('.square').forEach(square => {
            square.classList.remove('selected', 'valid-move');
        });
    }

    // Handle drag start
    function handleDragStart(event) {
        const piece = event.target;
        const square = piece.parentElement;

        if (isPiecePlayable(piece)) {
            event.dataTransfer.setData('text/plain', square.dataset.square);
            selectSquare(square);
        } else {
            event.preventDefault();
        }
    }

    // Add drag and drop event listeners to the board
    function setupDragAndDrop() {
        chessboard.addEventListener('dragover', function(event) {
            event.preventDefault();
        });

        chessboard.addEventListener('drop', function(event) {
            event.preventDefault();

            const fromSquare = event.dataTransfer.getData('text/plain');
            const toSquare = event.target.closest('.square').dataset.square;

            if (fromSquare && toSquare && validMoves[fromSquare] && validMoves[fromSquare].includes(toSquare)) {
                makeMove(fromSquare, toSquare);
            }

            clearSelection();
        });
    }

    // Make a move
    function makeMove(from, to) {
        // Check if this is a pawn promotion move
        const fromPiece = document.querySelector(`.square[data-square="${from}"] .piece`);
        const isPawn = fromPiece && fromPiece.dataset.piece === 'P';
        const isLastRank = to[1] === '8';

        if (isPawn && isLastRank) {
            // Show promotion modal
            pendingPromotion = { from, to };
            promotionModal.style.display = 'block';
            return;
        }

        // Send move to server
        fetch('/make_move', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ from, to }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                statusElement.textContent = data.error;
            } else {
                board = data;
                updateBoard(data.board);
                statusElement.textContent = data.status;
                validMoves = data.valid_moves;

                // Add move to history
                addMoveToHistory(from, to);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            statusElement.textContent = 'Error making move';
        });

        clearSelection();
    }

    // Handle promotion selection
    function handlePromotion(promotionPiece) {
        if (!pendingPromotion) return;

        const { from, to } = pendingPromotion;

        // Send move with promotion to server
        fetch('/make_move', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from,
                to,
                promotion: promotionPiece
            }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                statusElement.textContent = data.error;
            } else {
                board = data;
                updateBoard(data.board);
                statusElement.textContent = data.status;
                validMoves = data.valid_moves;

                // Add move to history with promotion
                addMoveToHistory(from, to, promotionPiece);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            statusElement.textContent = 'Error making move';
        });

        // Reset promotion state
        pendingPromotion = null;
        promotionModal.style.display = 'none';
    }

    // Add move to history
    function addMoveToHistory(from, to, promotion = null) {
        const moveNumber = Math.floor(moveHistory.length / 2) + 1;
        const isWhiteMove = moveHistory.length % 2 === 0;

        let moveText = `${from}-${to}`;
        if (promotion) {
            moveText += `=${promotion.toUpperCase()}`;
        }

        if (isWhiteMove) {
            moveHistory.push({ number: moveNumber, white: moveText, black: '' });
        } else {
            moveHistory[moveHistory.length - 1].black = moveText;
        }

        updateMoveHistory();
    }

    // Update move history display
    function updateMoveHistory() {
        movesList.innerHTML = '';

        moveHistory.forEach(move => {
            const moveEntry = document.createElement('div');
            moveEntry.className = 'move-entry';

            const moveNumber = document.createElement('div');
            moveNumber.className = 'move-number';
            moveNumber.textContent = `${move.number}.`;

            const moveText = document.createElement('div');
            moveText.className = 'move-text';
            moveText.textContent = `${move.white} ${move.black}`;

            moveEntry.appendChild(moveNumber);
            moveEntry.appendChild(moveText);
            movesList.appendChild(moveEntry);
        });

        // Scroll to bottom
        movesList.scrollTop = movesList.scrollHeight;
    }

    // Start a new game
    function startNewGame() {
        // Get selected difficulty and color
        const difficulty = difficultySelect.value;
        playerColor = playerColorSelect.value;

        // Update player info display
        updatePlayerInfo();

        fetch('/new_game', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                difficulty: difficulty,
                player_color: playerColor
            }),
        })
        .then(response => response.json())
        .then(data => {
            board = data;
            updateBoard(data.board);
            statusElement.textContent = data.status;
            validMoves = data.valid_moves;
            moveHistory = [];
            updateMoveHistory();
        })
        .catch(error => {
            console.error('Error:', error);
            statusElement.textContent = 'Error starting new game';
        });
    }

    // Update player info based on selected color
    function updatePlayerInfo() {
        if (playerColor === 'white') {
            playerTopElement.querySelector('h3').textContent = 'Computer (Black)';
            playerBottomElement.querySelector('h3').textContent = 'You (White)';
        } else {
            playerTopElement.querySelector('h3').textContent = 'You (Black)';
            playerBottomElement.querySelector('h3').textContent = 'Computer (White)';
        }
    }

    // Event listeners
    newGameBtn.addEventListener('click', startNewGame);

    // Update player info when color is changed
    playerColorSelect.addEventListener('change', function() {
        playerColor = this.value;
        updatePlayerInfo();
    });

    promotionPieces.forEach(piece => {
        piece.addEventListener('click', function() {
            const promotionPiece = this.dataset.piece;
            handlePromotion(promotionPiece);
        });
    });

    // Initialize the game
    initializeBoard();
    setupDragAndDrop();
    updatePlayerInfo();
    startNewGame();
});
