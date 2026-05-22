#!/bin/bash
# ==============================================================
# NetNext Telegram Bot - Automated VPS Deploy Script
# ==============================================================
# Usage:
#   1. Set your VPS details below
#   2. Run: chmod +x deploy.sh && ./deploy.sh
#
# Prerequisites on VPS:
#   - Docker installed (script will install if missing)
#   - SSH access configured
# ==============================================================

set -e

# --- Configuration ---
VPS_HOST="${VPS_HOST:-your-vps-ip}"
VPS_USER="${VPS_USER:-root}"
VPS_PORT="${VPS_PORT:-22}"
BOT_DIR="/opt/netnext-bot"
CONTAINER_NAME="netnext-tg-bot"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}=== NetNext Telegram Bot Deploy ===${NC}"

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Warning: .env file not found.${NC}"
    echo -e "Creating from .env.example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo -e "${RED}Please edit .env with your actual values, then run again.${NC}"
        exit 1
    else
        echo -e "${RED}No .env.example found either. Create .env manually.${NC}"
        exit 1
    fi
fi

# Validate config
if [ "$VPS_HOST" = "your-vps-ip" ]; then
    echo -e "${RED}Error: Set VPS_HOST in the script or as env var.${NC}"
    echo -e "Example: VPS_HOST=1.2.3.4 ./deploy.sh"
    exit 1
fi

echo -e "${GREEN}Deploying to ${VPS_USER}@${VPS_HOST}:${VPS_PORT}...${NC}"

# --- Step 1: Ensure Docker is installed on VPS ---
echo -e "${YELLOW}[1/5] Checking Docker on VPS...${NC}"
ssh -p "$VPS_PORT" "${VPS_USER}@${VPS_HOST}" 'command -v docker' > /dev/null 2>&1 || {
    echo -e "${YELLOW}Docker not found. Installing...${NC}"
    ssh -p "$VPS_PORT" "${VPS_USER}@${VPS_HOST}" << 'INSTALL_DOCKER'
        curl -fsSL https://get.docker.com -o get-docker.sh
        sh get-docker.sh
        systemctl enable docker
        systemctl start docker
        rm get-docker.sh
INSTALL_DOCKER
    echo -e "${GREEN}Docker installed.${NC}"
}

# --- Step 2: Create directory on VPS ---
echo -e "${YELLOW}[2/5] Setting up directory...${NC}"
ssh -p "$VPS_PORT" "${VPS_USER}@${VPS_HOST}" "mkdir -p ${BOT_DIR}"

# --- Step 3: Upload files ---
echo -e "${YELLOW}[3/5] Uploading files...${NC}"
scp -P "$VPS_PORT" \
    bot.py \
    requirements.txt \
    Dockerfile \
    .env \
    "${VPS_USER}@${VPS_HOST}:${BOT_DIR}/"

# --- Step 4: Build and run container ---
echo -e "${YELLOW}[4/5] Building and starting container...${NC}"
ssh -p "$VPS_PORT" "${VPS_USER}@${VPS_HOST}" << DEPLOY
    cd ${BOT_DIR}

    # Stop existing container if running
    docker stop ${CONTAINER_NAME} 2>/dev/null || true
    docker rm ${CONTAINER_NAME} 2>/dev/null || true

    # Build
    docker build -t ${CONTAINER_NAME} .

    # Run with auto-restart
    docker run -d \
        --name ${CONTAINER_NAME} \
        --restart unless-stopped \
        --env-file .env \
        ${CONTAINER_NAME}

    echo "Container status:"
    docker ps --filter "name=${CONTAINER_NAME}" --format "table {{.Names}}\t{{.Status}}\t{{.CreatedAt}}"
DEPLOY

# --- Step 5: Verify ---
echo -e "${YELLOW}[5/5] Verifying...${NC}"
sleep 2
ssh -p "$VPS_PORT" "${VPS_USER}@${VPS_HOST}" "docker logs --tail 5 ${CONTAINER_NAME}"

echo ""
echo -e "${GREEN}=== Deploy complete! ===${NC}"
echo -e "Container: ${CONTAINER_NAME}"
echo -e "Logs: ssh ${VPS_USER}@${VPS_HOST} 'docker logs -f ${CONTAINER_NAME}'"
echo -e "Stop: ssh ${VPS_USER}@${VPS_HOST} 'docker stop ${CONTAINER_NAME}'"
echo -e "Restart: ssh ${VPS_USER}@${VPS_HOST} 'docker restart ${CONTAINER_NAME}'"
