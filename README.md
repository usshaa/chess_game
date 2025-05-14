# Chess Game

A web-based chess game built with Flask, featuring different difficulty levels and the ability to play as either black or white.

## Features

- Interactive chess board with drag-and-drop functionality
- Three difficulty levels: Easy, Medium, and Hard
- Option to play as either black or white
- Move validation and highlighting
- Game status tracking
- Move history display

## Local Development

### Option 1: Using Python directly

1. Clone the repository
2. Create a virtual environment: `python -m venv venv`
3. Activate the virtual environment:
   - Windows: `venv\Scripts\activate`
   - Linux/Mac: `source venv/bin/activate`
4. Install dependencies: `pip install -r requirements.txt`
5. Run the application: `python run.py`
6. Open your browser and navigate to `http://localhost:5000`

### Option 2: Using Docker

1. Clone the repository
2. Build and run with Docker Compose:
   ```
   docker-compose up -d
   ```
3. Open your browser and navigate to `http://localhost`

## Deploying to AWS

### Option 1: Manual Deployment with Docker

1. Launch an EC2 instance with Ubuntu
2. SSH into your instance:
   ```
   ssh -i your-key.pem ubuntu@your-ec2-ip
   ```
3. Install Docker:
   ```
   sudo apt update
   sudo apt install -y docker.io
   sudo systemctl enable docker
   sudo systemctl start docker
   sudo usermod -aG docker ubuntu
   ```
4. Log out and log back in for the group changes to take effect
5. Clone this repository:
   ```
   git clone https://github.com/yourusername/chess-game.git
   cd chess-game
   ```
6. Build and run the Docker container:
   ```
   docker build -t chess-game .
   docker run -d -p 80:8000 --name chess-game --restart always chess-game
   ```
7. Access your chess game at `http://your-ec2-ip`

### Option 2: Using GitHub Actions (CI/CD)

This repository includes a GitHub Actions workflow that automatically:
1. Builds a Docker image
2. Copies it to your EC2 instance
3. Deploys it as a Docker container

To set up CI/CD:
1. Fork this repository
2. Set up the following GitHub secrets:
   - `EC2_HOST` (your EC2 instance's public IP)
   - `EC2_SSH_KEY` (your private SSH key in OpenSSH format)
   - `SECRET_KEY` (a secure random string for Flask)
3. Make sure Docker is installed on your EC2 instance (see Option 1)
4. Push changes to the main branch to trigger deployment

## Docker Commands

- Build the image: `docker build -t chess-game .`
- Run the container: `docker run -p 80:8000 chess-game`
- Build and run with Docker Compose: `docker-compose up -d`
- Stop containers: `docker-compose down`

## Project Structure

```
chess-game/
├── app/                    # Application code
│   ├── static/             # Static files (CSS, JS)
│   ├── templates/          # HTML templates
│   ├── __init__.py         # Flask app initialization
│   └── routes.py           # API routes
├── .github/workflows/      # GitHub Actions workflows
├── Dockerfile              # Docker configuration
├── docker-compose.yml      # Docker Compose configuration
├── requirements.txt        # Python dependencies
├── wsgi.py                 # WSGI entry point
└── README.md               # Project documentation
```
