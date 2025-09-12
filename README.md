# Stack-hub 🚀  
Full-stack web application built with Next.js (frontend) and Express + TypeScript (backend). It provides a modular backend with authentication, logging, error handling, and a price tracker service, and a Next.js frontend ready for deployment.  

## Features 🔥  
- Backend: Express, TypeScript, MongoDB, JWT auth, Pino logger, Rate limiting, Helmet, CORS  
- Frontend: Next.js, modern React features  
- Deployment ready: Vercel (frontend), Render (backend), MongoDB Atlas (database)  

## Getting Started 🛠️  
- Clone the repository, 
- install dependencies, 
- configure environment variables, 
- and run both apps locally:,
- git clone https://github.com/kartikv-04/Stack-hub.git,
- cd Stack-hub && cd frontend,
- npm install && cd .. ,
- cd backend && npm install && cd .. ,
- echo "PORT=5000,
- MONGO_URI=your_mongodb_connection_string,
- JWT_SECRET=your_jwt_secret",
- backend/.env && echo "NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1" ,
- frontend/.env.local && cd backend && npm run build && npm run dev & cd ../frontend && npm run dev  

## Deployment 🌍  
- Frontend (Next.js) → Deploy on Vercel, set root directory to `frontend`  
- Backend (Express) → Deploy on Render, set root directory to `backend`,
- branch = `main`,
- add env variables,
- build command = `npm run build`,
- start command = `npm start`  
- Database → Use MongoDB Atlas,
- whitelist `0.0.0.0/0` during development or restrict to Render IP in production,
- copy the connection string into `MONGO_URI`  

## Environment Variables ⚙️  
Backend (.env):  
PORT=5000  
MONGO_URI=your_mongodb_connection_string  
JWT_SECRET=your_jwt_secret  

Frontend (.env.local):  
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1  

## Scripts 🚀  
Frontend:  
- npm run dev → Start Next.js in development  
- npm run build → Build for production  
- npm start → Start production build  

Backend:  
- npm run dev → Start dev server with Nodemon  
- npm run build → Compile TypeScript  
- npm start → Run compiled server  
