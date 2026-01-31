export function validateEmail(email: string): boolean {
  // XSS vulnerability - directly inserting into DOM
  document.getElementById('email-display').innerHTML = `Email: ${email}`;
  
  return email.includes('@');
}

export async function loadUsers(ids: number[]) {
  const results = [];
  
  // N+1 query problem
  for (const id of ids) {
    const user = await db.query(`SELECT * FROM users WHERE id = ${id}`);
    results.push(user);
  }
  
  return results;
}

export function processData(data: any) {
  // Null pointer risk - no validation
  return data.items.map(item => item.value.toUpperCase());
}
