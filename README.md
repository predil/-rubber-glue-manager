# Rubber Glue Production & Sales Manager

A simple web application for managing rubber latex glue production and sales operations.

## Features

### Production Management (CRUD)
- Auto-incrementing batch numbers
- Track latex quantity and glue separated
- Record production costs and selling prices
- Calculate profit margins
- Add production notes

### Customer Management
- Maintain customer database
- Store contact information
- Track customer purchase history

### Sales Management
- Record sales by batch and customer
- Automatic quantity validation
- Price calculation
- Sales history tracking

### Analytics & Reports
- Production vs sales overview
- Profit analysis by batch
- Customer sales summary
- Monthly production trends
- Interactive charts and graphs

## Tech Stack

- **Frontend**: React.js with responsive CSS
- **Backend**: Node.js with Express
- **Database**: SQLite3 (local storage)
- **Charts**: Chart.js with react-chartjs-2

## Setup Instructions

### Prerequisites
- Node.js (version 14 or higher)
- npm (comes with Node.js)

### Installation

1. **Install main dependencies**:
   ```bash
   npm run setup
   ```

2. **Seed the database with sample data** (optional):
   ```bash
   npm run seed
   ```

3. **Start the application**:
   ```bash
   npm run dev
   ```

This will start both the server (port 5000) and client (port 3000) simultaneously.

### Manual Setup (Alternative)

If the automated setup doesn't work:

1. **Install root dependencies**:
   ```bash
   npm install
   ```

2. **Install server dependencies**:
   ```bash
   cd server
   npm install
   cd ..
   ```

3. **Install client dependencies**:
   ```bash
   cd client
   npm install
   cd ..
   ```

4. **Start server** (in one terminal):
   ```bash
   cd server
   node index.js
   ```

5. **Start client** (in another terminal):
   ```bash
   cd client
   npm start
   ```

## Usage

1. **Production**: Add new batches with latex quantities, costs, and notes
2. **Customers**: Register new customers with contact information
3. **Sales**: Record sales by selecting batch, customer, and quantity
4. **Reports**: View analytics, charts, and performance metrics

## Database Structure

### Tables
- **batches**: Production data with auto-incrementing batch numbers
- **customers**: Customer information and contacts
- **sales**: Sales transactions linking batches to customers

### Key Features
- Automatic batch numbering starting from 1
- Foreign key relationships between tables
- Profit calculations based on allocated costs
- Data validation and constraints

## File Structure

```
rubber-glue-manager/
├── server/
│   ├── index.js          # Express server and API routes
│   ├── database.js       # SQLite database setup
│   ├── seed.js          # Sample data for testing
│   └── package.json     # Server dependencies
├── client/
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── App.js       # Main application
│   │   └── App.css      # Styling
│   └── package.json     # Client dependencies
├── package.json         # Root package with scripts
└── README.md           # This file
```

## API Endpoints

### Batches
- `GET /api/batches` - Get all batches
- `POST /api/batches` - Create new batch
- `PUT /api/batches/:id` - Update batch
- `DELETE /api/batches/:id` - Delete batch

### Customers
- `GET /api/customers` - Get all customers
- `POST /api/customers` - Create new customer

### Sales
- `GET /api/sales` - Get all sales with batch and customer info
- `POST /api/sales` - Record new sale

### Analytics
- `GET /api/analytics/summary` - Business summary statistics
- `GET /api/analytics/monthly` - Monthly production data

## Customization

The application is designed to be easily extensible:

1. **Add new fields**: Modify database schema in `database.js`
2. **New components**: Create in `client/src/components/`
3. **API endpoints**: Add to `server/index.js`
4. **Styling**: Modify `client/src/App.css`

## Currency & Language

- Currency: Sri Lankan Rupees (LKR)
- Language: English
- Mobile-friendly responsive design

## Data Migration

The SQLite database file (`rubber_glue.db`) can be easily backed up or migrated. For future database migrations, the modular structure allows easy switching to PostgreSQL, MySQL, or other databases.

## Troubleshooting

1. **Port conflicts**: Change ports in server/index.js (server) or client package.json (client)
2. **Database issues**: Delete `rubber_glue.db` and restart to recreate
3. **Dependencies**: Run `npm install` in both server and client directories
4. **CORS errors**: Ensure server is running on port 5000

## License

This project is open source and available under the MIT License.