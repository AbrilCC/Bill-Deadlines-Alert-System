# Payment Deadlines Alert System
A web-based application for tracking bills and card payments automatically, with an organizational calendar included and a Telegram bot to receive weekly summaries of the upcoming payments.
It uses Google Extension ??? to access mails received through Gmail containing specific keywords, and ORM to scan PDF files and extract information such as the payment's Due Date and Amount.
(Next in development: Users will receive messages from the Telegram bot to create a downloadable excel spreadsheet to store expenses and small purchases).
The Notion log file for documenting the process and decisions taken can be found on: [here](https://www.notion.so/cfbf91b18420835e934a81a6b15b7cc7?v=e89f91b1842083d39ef908590a9a2816&source=copy_link)


Users can:
* Login to the site ? URL to connect their e-mail accounts and receive notifications on payment deadlines
* Organize the payment deadlines with a web calendar
* Add other scheduled payments, non card-related
* Annotate discounts and price changes between different payment methods (ej cuanto desc% tiene si usa efectivo vs debito vs credito, es mas para hardcodear que darle mucha vuelta)
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
- React
- HTML
- Tailwind CSS


## Setup and Execution

1. Setup your database: Create an .env file following the .env_example. You'll need to create a new Supabase project to get a new database, at https://supabase.com/dashboard/org; click Copy → Direct connection string to add the link needed for the .env.

2. Run the application
```
cd scripts
chmod -x setup.sh
./setup.sh
chmod -x run.sh
./run.sh
```

3. 