/**
 * Verbose Comments Example
 * 
 * This file demonstrates the AI pattern of commenting every obvious line
 * instead of explaining intent or non-obvious decisions.
 */

// Import the React library
import React from 'react';
// Import the useState hook from React
import { useState } from 'react';
// Import the useEffect hook from React
import { useEffect } from 'react';

// Define the UserListProps interface
interface UserListProps {
  // The initial users to display
  initialUsers?: string[];
}

// Define the UserList component
export function UserList({ initialUsers = [] }: UserListProps) {
  // Create a state variable for the users array
  const [users, setUsers] = useState<string[]>(initialUsers);
  // Create a state variable for the loading state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // Create a state variable for the error message
  const [error, setError] = useState<string | null>(null);
  // Create a state variable for the new user input
  const [newUser, setNewUser] = useState<string>('');

  // Use the useEffect hook to fetch users on mount
  useEffect(() => {
    // Define an async function to fetch users
    const fetchUsers = async () => {
      // Set loading to true
      setIsLoading(true);
      // Try to fetch the users
      try {
        // Make a fetch request to the API
        const response = await fetch('/api/users');
        // Check if the response is ok
        if (!response.ok) {
          // Throw an error if not ok
          throw new Error('Failed to fetch users');
        }
        // Parse the response as JSON
        const data = await response.json();
        // Set the users state
        setUsers(data);
      } catch (e) {
        // Set the error state if there's an error
        setError(e instanceof Error ? e.message : 'Unknown error');
      } finally {
        // Set loading to false
        setIsLoading(false);
      }
    };

    // Call the fetchUsers function
    fetchUsers();
  }, []); // Empty dependency array means this runs once on mount

  // Define a function to handle adding a new user
  const handleAddUser = () => {
    // Check if the new user input is not empty
    if (newUser.trim()) {
      // Add the new user to the users array
      setUsers([...users, newUser]);
      // Clear the new user input
      setNewUser('');
    }
  };

  // Define a function to handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Update the new user state with the input value
    setNewUser(e.target.value);
  };

  // If loading, show loading message
  if (isLoading) {
    // Return a loading paragraph
    return <p>Loading...</p>;
  }

  // If error, show error message
  if (error) {
    // Return an error paragraph
    return <p>Error: {error}</p>;
  }

  // Return the component JSX
  return (
    // Create a div container
    <div>
      {/* Create an h1 heading */}
      <h1>Users</h1>
      {/* Create an input field */}
      <input
        // Set the input type to text
        type="text"
        // Bind the value to newUser state
        value={newUser}
        // Handle the onChange event
        onChange={handleInputChange}
        // Set the placeholder text
        placeholder="Enter new user"
      />
      {/* Create a button to add users */}
      <button onClick={handleAddUser}>Add User</button>
      {/* Create an unordered list */}
      <ul>
        {/* Map over the users array */}
        {users.map((user, index) => (
          // Create a list item for each user
          <li key={index}>{user}</li>
        ))}
      </ul>
    </div>
  );
}

// Export the component as default
export default UserList;
