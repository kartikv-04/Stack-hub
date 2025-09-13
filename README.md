# Stack-hub 🚀

A full-stack web application with a **Next.js** frontend and an **Express + TypeScript** backend. This project serves as a modern template with built-in authentication, logging, and error handling.

## Screenshots

<img width="1920" height="1080" alt="Screenshot 2025-09-12 230145" src="https://github.com/user-attachments/assets/a63a6217-3409-4ce7-958e-57cecba9433c" />
<img width="1920" height="1080" alt="Screenshot 2025-09-12 231548" src="https://github.com/user-attachments/assets/d326dd20-3787-4457-836c-262870152acc" />
<img width="1920" height="1080" alt="Screenshot 2025-09-12 231450" src="https://github.com/user-attachments/assets/6a227c30-bf39-4339-a2ed-ba8aae1f3f2e" />
<img width="1920" height="1080" alt="Screenshot 2025-09-12 231507" src="https://github.com/user-attachments/assets/ecd5cdc4-065c-42f2-93a2-e1d07afaf360" />

---

## Getting Started

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/kartikv-04/Stack-hub.git](https://github.com/kartikv-04/Stack-hub.git)
    cd Stack-hub
    ```

2.  **Install dependencies:**
    ```bash
    cd frontend && npm install
    cd ../backend && npm install
    ```

3.  **Configure environment variables:**
    -   Create a `.env` file in the **backend** folder.
        ```
        PORT=5000
        MONGO_URI=your_mongodb_connection_string
        JWT_SECRET=your_jwt_secret
        ```
    -   Create a `.env.local` file in the **frontend** folder.
        ```
        NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
        ```

4.  **Run the apps:**
    -   In the **backend** directory, run: `npm run dev`
    -   In the **frontend** directory, run: `npm run dev`

---
