Auctionary — Full Stack Auction Web Application
Auctionary is a full-stack auction platform developed as part of a university software engineering coursework project. The application allows users to browse auction listings and place bids through a web interface connected to a Node.js backend API.
The project demonstrates full-stack development including REST API design, authentication, database persistence, and automated backend testing.
Final coursework grade: 83%
All backend automated tests passed successfully.

Features:
• User authentication (register, login, logout)
• Browse auction listings
• View auction item details
• Place bids on active auctions
• Server-side validation and error handling
• Persistent data storage using SQLite
• Automated backend testing
• Responsive web interface

Tech Stack:
Backend -
Node.js
Express
SQLite

Frontend -
JavaScript web application (Vue / React depending on your project)

Development Tools -
Git
npm
GitHub

Project Structure:
auctionary-fullstack
│
├── backend
│   ├── controllers
│   ├── routes
│   ├── database
│   └── server.js
│
├── frontend
│   ├── src
│   ├── components
│   └── views
│________

How to Run the Project (Step-by-Step)
Download the Project
Open a Terminal (or Command Prompt / PowerShell).
Run the following command:
git clone https://github.com/MJ002PNL/auctionary-fullstack.git
This downloads the project to your computer.
Move into the project folder:
cd auctionary-fullstack
Running the Application

The application requires two terminals:
One terminal for the backend server
One terminal for the frontend website

Step 1 – Start the Backend
1. Open Terminal #1
Open a terminal window.
Navigate to the backend folder:
cd backend
Install backend dependencies:
npm install
Start the backend server:
npm start
The backend server will start running.
Leave this terminal open and running.
The backend usually runs at:
http://localhost:3000

Step 2 – Start the Frontend
3. Open Terminal #2
Open a second terminal window while the backend terminal is still running.
Navigate to the frontend folder:
cd frontend
Install frontend dependencies:
npm install
Start the frontend development server:
npm run dev
The website will start running.
If it does not open automatically, open your browser and go to:
http://localhost:5173

Using the Application
Once both the backend and frontend are running:
Open the website in your browser.
Register a new user account.
Log in to your account.
Browse available auction listings.
Select an item to view its details.
Enter a bid amount and submit your bid.
The backend server will process the request and update the auction.

Running Backend Tests
To run the backend tests:
Open a terminal and run:
cd backend
npm test
All tests should pass successfully.

Stopping the Application
To stop the servers, go to each terminal window and press:
CTRL + C
This will stop the backend and frontend servers.

Author
Marlene Kossonou
Software Engineering Student
