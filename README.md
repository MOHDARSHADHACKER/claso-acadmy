# Claso - Coaching Center Management System

Local-first full-stack monorepo (/client React + Vite + TypeScript + Tailwind CSS, /server Node.js + Express + TypeScript + Knex.js + MySQL 8).

## Setup
1. Create MySQL 8 DB claso_db (utf8mb4).
2. 
pm install and copy .env.example to .env in server and client.
3. 
pm --workspace=server run migrate and 
pm --workspace=server run seed.
4. 
pm run dev:server and 
pm run dev:client.
