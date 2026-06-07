# Payment Deadlines Alert System
A web-based application for tracking bills and card payments automatically, with an organizational calendar included and a Telegram bot to receive weekly summaries of the upcoming payments.
It uses Google's Gmail API to access mails received through Gmail containing specific keywords, and ORM to scan PDF files and extract information such as the payment's Due Date and Amount. It additionally uses Google Calendar API to create events automatically.
(Next in development: Users will receive messages from the Telegram bot to create a downloadable excel spreadsheet to store expenses and small purchases).


Users can:
* Login to https://alertavencimientos.vercel.app/ to connect their e-mail accounts and receive notifications on payment deadlines
* Organize the payment deadlines with a web calendar
* Impact their deadlines on Google Calendar
* Add personalized scheduled and one-time payments
* Create reminder boxes to improve organization
* Personalize their Home Page dashboard, write a tasks checklist
* (Next in development: Create a personalized expenses spreadsheet using cellphone notifications and bot interaction)


## Requirements
* Node.js >=22
* npm >= 10	
* PostgreSQL (Supabase)
* Tailwind CSS IntelliSense extension (if you're using VS Code)
* Git Bash

## Tech Stack
### Backend
- Node.js
- Express

### Frontend
- React (Vite)
- HTML
- Tailwind CSS

### Deployment
- Railway
- Vercel

## Setup and Execution

1. Create an .env file following the .env_example. Create a PostgreSQL database (local PostgreSQL or Supabase PostgreSQL).

2. Get Google API keys: Login your Google account and go to https://console.cloud.google.com/ → create a new project → in the APIs and Services section (at the sidebar) go to Gmail API → Enable → configure your API key. Likewise, enable Google Calendar API, no need to configue any api keys again.

3. Run the application
```
cd scripts
./setup.sh
./run.sh
```
