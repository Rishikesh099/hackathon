# Hackathon Project: AI-Powered Adaptive Learning System

## Overview

This project is an intelligent adaptive learning platform designed to personalize education. It uses AI to analyze student performance and generate customized learning paths, ensuring every student learns at their optimal pace.

## Features

- **User Authentication**: Secure login for both Professors and Students.
- **Lecture Management**: Professors can create and manage lecture content.
- **Question Bank**: Create and link questions to specific concepts within lectures.
- **Adaptive Quizzing**: Students take quizzes, and the system tracks mastery.
- **AI-Powered Recommendations**: The system analyzes weak areas and suggests relevant lectures or concepts for review.
- **Analytics Dashboard**: Visualizes student progress and concept mastery.

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript (Vanilla)
- **Backend**: Node.js, Express.js
- **Database**: MySQL
- **AI Integration**: Gemini API (for generating recommendations)

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- MySQL Server
- Gemini API Key

### 1. Backend Setup

1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Configure Environment Variables:
    Create a `.env` file in the `backend` directory with the following details:
    ```env
    PORT=3000
    DB_HOST=localhost
    DB_USER=your_mysql_user
    DB_PASSWORD=your_mysql_password
    DB_NAME=your_database_name
    GEMINI_API_KEY=your_gemini_api_key
    ```

4.  Initialize Database:
    Run the setup script to create the necessary tables:
    ```bash
    node database/setup.js
    ```

5.  Start the Server:
    ```bash
    node server.js
    ```

### 2. Frontend Setup

The frontend is served statically by the backend. No separate server is required.

## Usage

- **Access the App**: Open `http://localhost:3000` in your browser.
- **Professor Portal**: Navigate to `/professor`.
- **Student Portal**: Navigate to `/student`.

## Project Structure

```
backend/
├── controllers/    # Business logic
├── database/       # Database connection and setup
├── middleware/     # Authentication middleware
├── routes/         # API route definitions
├── server.js       # Main server entry point
└── .env            # Environment variables (not in git)

frontend/
├── public/         # Main entry point
├── professor/      # Professor interface
└── student/        # Student interface
```