from app import create_app

app = create_app()

if __name__ == '__main__':
    app.secret_key = 'chess_game_secret_key'
    app.run(debug=True)
