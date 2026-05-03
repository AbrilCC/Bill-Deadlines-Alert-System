#!/bin/bash

# Ojo, tenemos que chusmear que esto sea todo necesario

echo "Starting backend..."
cd ..
cd backend
npm run dev &

echo "Starting frontend..."
cd ../frontend
npm run dev &

wait