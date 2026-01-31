/**
 * Defensive Error Handling Example
 * 
 * This demonstrates the AI pattern of wrapping everything in try-catch
 * blocks, even when errors can't actually occur or when TypeScript
 * already provides protection.
 */

import React, { useState, useEffect } from 'react';

interface UserData {
  id: number;
  name: string;
  email: string;
}

interface Props {
  userId: number;
}

export function UserProfile({ userId }: Props) {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        setLoading(true);
        try {
          const response = await fetch(`/api/users/${userId}`);
          try {
            const data = await response.json();
            try {
              setUser(data);
            } catch (setStateError) {
              console.error('Error setting user state:', setStateError);
              setError('Failed to update state');
            }
          } catch (parseError) {
            console.error('Error parsing JSON:', parseError);
            setError('Failed to parse response');
          }
        } catch (fetchError) {
          console.error('Error fetching user:', fetchError);
          setError('Failed to fetch user');
        }
      } catch (outerError) {
        console.error('An unexpected error occurred:', outerError);
        setError('An unexpected error occurred');
      } finally {
        try {
          setLoading(false);
        } catch (finallyError) {
          console.error('Error in finally block:', finallyError);
        }
      }
    };

    try {
      loadUser();
    } catch (callError) {
      console.error('Error calling loadUser:', callError);
    }
  }, [userId]);

  const formatName = (name: string): string => {
    try {
      if (name === null || name === undefined) {
        return '';
      }
      try {
        const trimmed = name.trim();
        try {
          return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
        } catch (sliceError) {
          console.error('Error slicing name:', sliceError);
          return trimmed;
        }
      } catch (trimError) {
        console.error('Error trimming name:', trimError);
        return name;
      }
    } catch (formatError) {
      console.error('Error formatting name:', formatError);
      return '';
    }
  };

  const validateEmail = (email: string): boolean => {
    try {
      if (email === null || email === undefined) {
        return false;
      }
      try {
        if (typeof email !== 'string') {
          return false;
        }
        try {
          const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          try {
            return pattern.test(email);
          } catch (testError) {
            console.error('Error testing pattern:', testError);
            return false;
          }
        } catch (patternError) {
          console.error('Error creating pattern:', patternError);
          return false;
        }
      } catch (typeError) {
        console.error('Error checking type:', typeError);
        return false;
      }
    } catch (validateError) {
      console.error('Error validating email:', validateError);
      return false;
    }
  };

  if (loading) {
    try {
      return <div>Loading...</div>;
    } catch (renderError) {
      console.error('Error rendering loading state:', renderError);
      return null;
    }
  }

  if (error) {
    try {
      return <div className="error">{error}</div>;
    } catch (renderError) {
      console.error('Error rendering error state:', renderError);
      return null;
    }
  }

  if (!user) {
    try {
      return <div>No user found</div>;
    } catch (renderError) {
      console.error('Error rendering no user state:', renderError);
      return null;
    }
  }

  try {
    return (
      <div className="user-profile">
        <h1>{formatName(user.name)}</h1>
        <p>Email: {user.email}</p>
        <p>Valid: {validateEmail(user.email) ? 'Yes' : 'No'}</p>
      </div>
    );
  } catch (renderError) {
    console.error('Error rendering user profile:', renderError);
    return <div>Error rendering profile</div>;
  }
}

// What a human would write:
// 
// export function UserProfile({ userId }: Props) {
//   const { data: user, loading, error } = useQuery(['user', userId], 
//     () => fetch(`/api/users/${userId}`).then(r => r.json())
//   );
//   
//   if (loading) return <div>Loading...</div>;
//   if (error) return <div>Error: {error.message}</div>;
//   if (!user) return <div>No user found</div>;
//   
//   return (
//     <div className="user-profile">
//       <h1>{user.name}</h1>
//       <p>Email: {user.email}</p>
//     </div>
//   );
// }
