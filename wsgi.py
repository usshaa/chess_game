import os
from app import create_app

app = create_app()
app.secret_key = os.environ.get('SECRET_KEY', 'chess_game_secret_key')

if __name__ == '__main__':
    app.run(host='0.0.0.0')
