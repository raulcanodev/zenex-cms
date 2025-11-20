#!/usr/bin/env bash

# =================================================================================
# Usage
# =================================================================================

# 1. Add the permission to execute the script
# chmod +x start-database.sh

# 2. Run the script
# ./start-database.sh

# =================================================================================
# Script
# =================================================================================

# Check if DB_CONTAINER_NAME is provided, if not prompt user
if [ -z "$DB_CONTAINER_NAME" ]; then
  echo "Enter a name for your database container and database:"
  read -p "Container/Database Name: " -r DB_CONTAINER_NAME
  
  # Validate input
  if [[ -z "$DB_CONTAINER_NAME" ]]; then
    echo "Name cannot be empty. Using default: post-auto"
    DB_CONTAINER_NAME="post-auto"
  fi
fi

# Use the same name for both container and database
DB_NAME="$DB_CONTAINER_NAME"

if ! [ -x "$(command -v docker)" ]; then
  echo -e "Docker is not installed. Please install docker and try again.\nDocker install guide: https://docs.docker.com/engine/install/"
  exit 1
fi

if ! docker info > /dev/null 2>&1; then
  echo "Docker daemon is not running. Please start Docker and try again."
  exit 1
fi

if [ "$(docker ps -q -f name=$DB_CONTAINER_NAME)" ]; then
  echo "Database container '$DB_CONTAINER_NAME' already running"
  exit 0
fi

# import env variables from .env
set -a
source .env

# Use default postgres password if not specified in DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
  echo "DATABASE_URL is not set in .env file"
  echo "Using default connection: postgresql://postgres:postgres@localhost:5432/$DB_NAME"
  export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/$DB_NAME"
  echo "DATABASE_URL=postgresql://postgres:postgres@localhost:5432/$DB_NAME" >> .env
fi

DB_PASSWORD=$(echo "$DATABASE_URL" | awk -F':' '{print $3}' | awk -F'@' '{print $1}')
DB_PORT=$(echo "$DATABASE_URL" | awk -F':' '{print $4}' | awk -F'\/' '{print $1}')

# If DB_PASSWORD is empty or "password", set it to "postgres"
if [ -z "$DB_PASSWORD" ] || [ "$DB_PASSWORD" = "password" ]; then
  echo "Using default database password: postgres"
  DB_PASSWORD="postgres"
  # Update .env file with new password
  NEW_URL=$(echo "$DATABASE_URL" | sed -E "s/:password@|:[^@]*@/:postgres@/")
  sed -i -e "s#$DATABASE_URL#$NEW_URL#" .env
  export DATABASE_URL="$NEW_URL"
fi

# Check if the port is already in use
PORT_IN_USE=$(lsof -i:"$DB_PORT" -P -n -t)
if [ -n "$PORT_IN_USE" ]; then
  echo "Port $DB_PORT is already in use by process ID(s): $PORT_IN_USE"
  
  # Check if it's another Docker container
  CONTAINER_USING_PORT=$(docker ps -q --filter publish="$DB_PORT")
  if [ -n "$CONTAINER_USING_PORT" ]; then
    CONTAINER_NAME=$(docker ps --format '{{.Names}}' --filter "id=$CONTAINER_USING_PORT")
    echo "Port $DB_PORT is used by Docker container: $CONTAINER_NAME"
  fi
  
  echo "Options:"
  echo "1) Use a different port"
  echo "2) Stop the process using port $DB_PORT"
  echo "3) Exit"
  
  read -p "Choose an option [1/2/3]: " -r PORT_OPTION
  
  case $PORT_OPTION in
    1)
      read -p "Enter a new port (e.g. 5433): " -r NEW_PORT
      if [[ ! "$NEW_PORT" =~ ^[0-9]+$ ]]; then
        echo "Invalid port number"
        exit 1
      fi
      
      # Check if new port is also in use
      if [ -n "$(lsof -i:"$NEW_PORT" -P -n -t)" ]; then
        echo "Port $NEW_PORT is also in use. Please try a different port."
        exit 1
      fi
      
      # Update .env file with new port
      OLD_URL="$DATABASE_URL"
      NEW_URL=$(echo "$OLD_URL" | sed -E "s/:$DB_PORT\//:$NEW_PORT\//")
      sed -i -e "s#$OLD_URL#$NEW_URL#" .env
      echo "Updated DATABASE_URL with new port: $NEW_PORT"
      DB_PORT=$NEW_PORT
      ;;
    2)
      # Try to stop the process - this requires sudo on Linux/Mac
      echo "Attempting to stop processes using port $DB_PORT"
      if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
        # Windows
        echo "On Windows, please manually stop the process using Task Manager or 'taskkill'"
        exit 1
      else
        # Linux/Mac
        if [ -n "$CONTAINER_USING_PORT" ]; then
          read -p "Stop Docker container $CONTAINER_NAME? [y/N]: " -r STOP_CONTAINER
          if [[ $STOP_CONTAINER =~ ^[Yy]$ ]]; then
            docker stop "$CONTAINER_USING_PORT"
            echo "Container stopped"
          else
            echo "Container not stopped. Exiting."
            exit 1
          fi
        else
          # Not a Docker container, try to kill the process
          echo "This will require sudo/admin privileges to kill the process"
          read -p "Continue? [y/N]: " -r KILL_PROCESS
          if [[ $KILL_PROCESS =~ ^[Yy]$ ]]; then
            sudo kill "$PORT_IN_USE"
            echo "Process killed. Waiting a moment for port to be released..."
            sleep 3
          else
            echo "Process not killed. Exiting."
            exit 1
          fi
        fi
      fi
      
      # Verify port is now free
      if [ -n "$(lsof -i:"$DB_PORT" -P -n -t)" ]; then
        echo "Port $DB_PORT is still in use. Please try a different port."
        exit 1
      fi
      ;;
    3)
      echo "Exiting without starting database."
      exit 0
      ;;
    *)
      echo "Invalid option. Exiting."
      exit 1
      ;;
  esac
fi

# Check if the container exists but is not running
if [ "$(docker ps -q -a -f name=$DB_CONTAINER_NAME)" ]; then
  docker start "$DB_CONTAINER_NAME"
  echo "Existing database container '$DB_CONTAINER_NAME' started"
  exit 0
fi

# Create and start the container
docker run -d \
  --name $DB_CONTAINER_NAME \
  -e POSTGRES_USER="postgres" \
  -e POSTGRES_PASSWORD="$DB_PASSWORD" \
  -e POSTGRES_DB="$DB_NAME" \
  -p "$DB_PORT":5432 \
  docker.io/postgres

if [ $? -eq 0 ]; then
  echo ""
  echo "🚀 Database container '$DB_CONTAINER_NAME' was successfully created on port $DB_PORT"
  echo ""
  echo "🔑 Connection string: postgresql://postgres:$DB_PASSWORD@localhost:$DB_PORT/$DB_NAME"
  echo ""
  echo "👉 Copy the connection string and paste it into your .env file"
  echo ""
else
  echo "Failed to create database container"
  exit 1
fi