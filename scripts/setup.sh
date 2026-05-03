#!/bin/bash

# Ojo, tenemos que chusmear que esto sea todo necesario

echo "Installing backend..."
cd ..
cd backend
npm install

echo "Installing frontend..."
cd ../frontend
npm install

echo "Setup complete"