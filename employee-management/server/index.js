const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// GET /api/employees - Fetch all employees ordered by created_at DESC
app.get('/api/employees', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM employees ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ error: 'Server error while fetching employees' });
  }
});

// POST /api/employees - Insert a new employee
app.post('/api/employees', async (req, res) => {
  const { emp_id, name, email, phone, position, department, salary, date_of_joining } = req.body;

  // Server-side validation
  if (!emp_id || !name || !email || !phone || !position || !department || !salary || !date_of_joining) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    // Check if emp_id or email already exists
    const existing = await db.query('SELECT emp_id, email FROM employees WHERE emp_id = $1 OR email = $2', [emp_id, email]);
    if (existing.rows.length > 0) {
      const conflict = existing.rows[0];
      if (conflict.emp_id === emp_id) {
        return res.status(400).json({ error: `Employee ID '${emp_id}' is already registered.` });
      }
      if (conflict.email === email) {
        return res.status(400).json({ error: `Email '${email}' is already in use.` });
      }
    }

    const queryText = `
      INSERT INTO employees (emp_id, name, email, phone, position, department, salary, date_of_joining)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    const values = [emp_id, name, email, phone, position, department, parseFloat(salary), date_of_joining];
    const result = await db.query(queryText, values);
    res.status(201).json({ message: 'Employee added successfully', employee: result.rows[0] });
  } catch (error) {
    console.error('Error adding employee:', error);
    res.status(500).json({ error: 'Server error while adding employee' });
  }
});

// PUT /api/employees/:emp_id - Update an employee's details
app.put('/api/employees/:emp_id', async (req, res) => {
  const { emp_id } = req.params;
  const { name, email, phone, position, department, salary, date_of_joining } = req.body;

  if (!name || !email || !phone || !position || !department || !salary || !date_of_joining) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    // Check if the employee exists
    const checkUser = await db.query('SELECT * FROM employees WHERE emp_id = $1', [emp_id]);
    if (checkUser.rows.length === 0) {
      return res.status(404).json({ error: `Employee with ID '${emp_id}' not found.` });
    }

    // Check if email is taken by someone else
    const checkEmail = await db.query('SELECT * FROM employees WHERE email = $1 AND emp_id != $2', [email, emp_id]);
    if (checkEmail.rows.length > 0) {
      return res.status(400).json({ error: `Email '${email}' is already in use by another employee.` });
    }

    const queryText = `
      UPDATE employees
      SET name = $1, email = $2, phone = $3, position = $4, department = $5, salary = $6, date_of_joining = $7
      WHERE emp_id = $8
      RETURNING *
    `;
    const values = [name, email, phone, position, department, parseFloat(salary), date_of_joining, emp_id];
    const result = await db.query(queryText, values);
    res.json({ message: 'Employee updated successfully', employee: result.rows[0] });
  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(500).json({ error: 'Server error while updating employee' });
  }
});

// DELETE /api/employees/:emp_id - Delete an employee by emp_id
app.delete('/api/employees/:emp_id', async (req, res) => {
  const { emp_id } = req.params;

  try {
    const checkUser = await db.query('SELECT * FROM employees WHERE emp_id = $1', [emp_id]);
    if (checkUser.rows.length === 0) {
      return res.status(404).json({ error: `Employee with ID '${emp_id}' not found.` });
    }

    await db.query('DELETE FROM employees WHERE emp_id = $1', [emp_id]);
    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({ error: 'Server error while deleting employee' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
