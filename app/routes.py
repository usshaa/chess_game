from flask import Blueprint, render_template, request, jsonify, session
import chess
import random

main = Blueprint('main', __name__)

# Constants for difficulty levels
DIFFICULTY_EASY = 'easy'
DIFFICULTY_MEDIUM = 'medium'
DIFFICULTY_HARD = 'hard'

# Default game settings
DEFAULT_SETTINGS = {
    'difficulty': DIFFICULTY_MEDIUM,
    'player_color': 'white'
}

@main.route('/')
def index():
    """Render the main chess game page."""
    return render_template('index.html')

@main.route('/new_game', methods=['POST'])
def new_game():
    """Start a new chess game."""
    data = request.get_json() or {}

    # Get game settings
    difficulty = data.get('difficulty', DEFAULT_SETTINGS['difficulty'])
    player_color = data.get('player_color', DEFAULT_SETTINGS['player_color'])

    # Create a new board
    board = chess.Board()

    # Store settings in session
    session['difficulty'] = difficulty
    session['player_color'] = player_color
    session['board_fen'] = board.fen()

    # If player is black, make a computer move first
    if player_color == 'black' and not board.is_game_over():
        computer_move = make_computer_move(board, difficulty)
        if computer_move:
            board.push(computer_move)
            session['board_fen'] = board.fen()

    return jsonify({
        'board': board.fen(),
        'status': 'Game started',
        'valid_moves': get_valid_moves(board),
        'player_color': player_color,
        'difficulty': difficulty
    })

@main.route('/make_move', methods=['POST'])
def make_move():
    """Make a move on the chess board."""
    data = request.get_json()
    from_square = data.get('from')
    to_square = data.get('to')

    # Load the current board state from session
    board = chess.Board(session.get('board_fen', chess.STARTING_FEN))

    # Convert algebraic notation to chess.Square
    from_sq = chess.parse_square(from_square)
    to_sq = chess.parse_square(to_square)

    # Create the move
    move = chess.Move(from_sq, to_sq)

    # Check if promotion
    if data.get('promotion'):
        promotion_piece = {
            'q': chess.QUEEN,
            'r': chess.ROOK,
            'b': chess.BISHOP,
            'n': chess.KNIGHT
        }.get(data.get('promotion'))

        if promotion_piece:
            move = chess.Move(from_sq, to_sq, promotion=promotion_piece)

    # Validate and make the move
    if move in board.legal_moves:
        board.push(move)

        # If the game is not over, make a computer move
        if not board.is_game_over():
            difficulty = session.get('difficulty', DEFAULT_SETTINGS['difficulty'])
            computer_move = make_computer_move(board, difficulty)
            if computer_move:
                board.push(computer_move)

        # Save the updated board state
        session['board_fen'] = board.fen()

        # Check game status
        status = get_game_status(board)

        return jsonify({
            'board': board.fen(),
            'status': status,
            'valid_moves': get_valid_moves(board)
        })
    else:
        return jsonify({
            'error': 'Invalid move',
            'board': board.fen(),
            'valid_moves': get_valid_moves(board)
        }), 400

def make_computer_move(board, difficulty=DIFFICULTY_MEDIUM):
    """Make a move for the computer player based on difficulty level."""
    legal_moves = list(board.legal_moves)
    if not legal_moves:
        return None

    # Easy: Random moves
    if difficulty == DIFFICULTY_EASY:
        return random.choice(legal_moves)

    # Medium: Prioritize captures, checks, and avoiding captures
    elif difficulty == DIFFICULTY_MEDIUM:
        # First, look for checks
        check_moves = [move for move in legal_moves if board.gives_check(move)]
        if check_moves:
            return random.choice(check_moves)

        # Then, look for captures
        capture_moves = [move for move in legal_moves if board.is_capture(move)]
        if capture_moves:
            return random.choice(capture_moves)

        # Otherwise, make a random move
        return random.choice(legal_moves)

    # Hard: Evaluate positions and choose the best move
    elif difficulty == DIFFICULTY_HARD:
        best_move = None
        best_score = float('-inf')

        for move in legal_moves:
            # Make the move on a copy of the board
            board_copy = board.copy()
            board_copy.push(move)

            # Evaluate the position
            score = evaluate_position(board_copy)

            # If this is a better move, remember it
            if score > best_score:
                best_score = score
                best_move = move

        return best_move or random.choice(legal_moves)

    # Default to medium if unknown difficulty
    return random.choice(legal_moves)

def evaluate_position(board):
    """
    Evaluate the current position on the board.
    Positive score is good for the side to move.
    """
    if board.is_checkmate():
        # If checkmate, this is the worst possible position
        return -10000

    if board.is_stalemate() or board.is_insufficient_material():
        # Stalemate or insufficient material is a draw (neutral)
        return 0

    # Piece values
    piece_values = {
        chess.PAWN: 100,
        chess.KNIGHT: 320,
        chess.BISHOP: 330,
        chess.ROOK: 500,
        chess.QUEEN: 900,
        chess.KING: 20000
    }

    # Count material for both sides
    white_material = 0
    black_material = 0

    for square in chess.SQUARES:
        piece = board.piece_at(square)
        if piece:
            value = piece_values[piece.piece_type]
            if piece.color == chess.WHITE:
                white_material += value
            else:
                black_material += value

    # Calculate material advantage
    if board.turn == chess.WHITE:
        material_score = white_material - black_material
    else:
        material_score = black_material - white_material

    # Mobility (number of legal moves)
    mobility = len(list(board.legal_moves))

    # Center control (bonus for controlling the center)
    center_squares = [chess.E4, chess.D4, chess.E5, chess.D5]
    center_control = 0

    for square in center_squares:
        # Check if we control this square
        attackers = board.attackers(board.turn, square)
        if attackers:
            center_control += 10

    # Combine factors
    score = material_score + mobility + center_control

    return score

def get_valid_moves(board):
    """Get all valid moves for the current board position."""
    valid_moves = {}
    for move in board.legal_moves:
        from_square = chess.square_name(move.from_square)
        if from_square not in valid_moves:
            valid_moves[from_square] = []
        valid_moves[from_square].append(chess.square_name(move.to_square))
    return valid_moves

def get_game_status(board):
    """Get the current status of the game."""
    if board.is_checkmate():
        return 'Checkmate'
    elif board.is_stalemate():
        return 'Stalemate'
    elif board.is_insufficient_material():
        return 'Draw due to insufficient material'
    elif board.is_check():
        return 'Check'
    else:
        return 'Ongoing'
