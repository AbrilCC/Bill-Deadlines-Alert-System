#!/bin/bash

echo "Installing backend..."
cd ..
cd backend
npm install

echo "Installing frontend..."
cd ../frontend
npm install

echo "Setup complete"