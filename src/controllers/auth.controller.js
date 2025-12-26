import * as authService from '../services/auth.service.js';

/**
 * Handles user login requests.
 * Expects user_name, employee_id, and password in the request body.
 */
export async function login(req, res) {
  const { user_name, employee_id, employee, password } = req.body;
  const resolvedUserName = user_name ?? req.body.username;
  const resolvedEmployeeId = employee_id ?? employee ?? req.body.emp_id;

  if (!password || (!resolvedUserName && !resolvedEmployeeId)) {
    return res.status(400).json({ success: false, message: 'Password and either user name or employee ID are required.' });
  }

  const result = await authService.loginUser(resolvedUserName, resolvedEmployeeId, password);

  if (result.success) {
    res.status(200).json({ success: true, token: result.token, user: result.user });
  } else {
    res.status(401).json({ success: false, message: result.message });
  }
}









