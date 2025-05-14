#!/bin/bash

# This script installs Docker on an Ubuntu EC2 instance
# and sets up the environment for the chess game

# Update system packages
sudo apt update
sudo apt upgrade -y

# Install Docker
sudo apt install -y docker.io
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker ubuntu

echo "Docker has been installed successfully!"
echo "Please log out and log back in for the group changes to take effect."
echo "After logging back in, you can run the following commands to deploy the chess game:"
echo ""
echo "git clone https://github.com/yourusername/chess-game.git"
echo "cd chess-game"
echo "docker build -t chess-game ."
echo "docker run -d -p 80:8000 --name chess-game --restart always chess-game"
echo ""
echo "Your chess game will be available at http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)"
