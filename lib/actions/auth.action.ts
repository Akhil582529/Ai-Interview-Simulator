// lib/auth-actions.ts
'use server';

import { adminDb, adminAuth } from "@/firebase/admin";
import { cookies } from "next/headers";

const OneWeek = 60 * 60 * 24 * 7;

interface SignUpParams {
  uid: string;
  email: string;
  name: string;
}

interface SignInParams {
  email: string;
  idToken: string;
}

interface AuthResult {
  success: boolean;
  message: string;
}

interface User {
  id: string;
  uid: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export async function signUp(params: SignUpParams): Promise<AuthResult> {
  const { uid, email, name } = params;
  
  try {
    // Check if user already exists in Firestore
    const userRecord = await adminDb.collection('users').doc(uid).get();
    if (userRecord.exists) {
      return {
        success: false,
        message: 'User already exists. Please sign in instead.'
      };
    }

    // Verify the user exists in Firebase Auth
    try {
      await adminAuth.getUser(uid);
    } catch (authError) {
      return {
        success: false,
        message: 'Invalid user authentication. Please try again.'
      };
    }

    // Create user document in Firestore
    await adminDb.collection('users').doc(uid).set({
      name,
      email,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    return {
      success: true,
      message: 'User created successfully'
    };
  } catch (e: any) {
    console.error("Error creating user:", e);
    return {
      success: false,
      message: e.message || 'Internal server error'
    };
  }
}

export async function signIn(params: SignInParams): Promise<AuthResult> {
  const { email, idToken } = params;
  
  try {
    // Verify the ID token first
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    
    // Check if the email matches the token
    if (decodedToken.email !== email) {
      return {
        success: false,
        message: 'Authentication failed. Email mismatch.'
      };
    }

    // Set session cookie
    await setSessionCookie(idToken);
    
    return {
      success: true,
      message: 'Signed in successfully'
    };
  } catch (e: any) {
    console.error("Error signing in:", e);
    
    if (e.code === 'auth/id-token-expired') {
      return {
        success: false,
        message: 'Session expired. Please sign in again.'
      };
    }
    
    if (e.code === 'auth/invalid-id-token') {
      return {
        success: false,
        message: 'Invalid authentication. Please try again.'
      };
    }
    
    return {
      success: false,
      message: e.message || 'Internal server error'
    };
  }
}

async function setSessionCookie(idToken: string): Promise<void> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: OneWeek * 1000
    });
    
    cookieStore.set('session', sessionCookie, {
      maxAge: OneWeek,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
    });
  } catch (error) {
    console.error("Error setting session cookie:", error);
    throw new Error('Failed to create session');
  }
}

export async function signOut(): Promise<AuthResult> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('session');
    
    return {
      success: true,
      message: 'Signed out successfully'
    };
  } catch (error) {
    console.error("Error signing out:", error);
    return {
      success: false,
      message: 'Error signing out'
    };
  }
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;
    
    if (!sessionCookie) {
      return null;
    }
    
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);

    // Fixed: Use adminDb instead of undefined 'db'
    const userRecord = await adminDb.collection('users').doc(decodedClaims.uid).get();
    if (!userRecord.exists) {
      return null;
    }

    const userData = userRecord.data();
    
    return {
      id: userRecord.id,
      uid: decodedClaims.uid,
      email: userData?.email || '',
      name: userData?.name || '',
      createdAt: userData?.createdAt || '',
      updatedAt: userData?.updatedAt || ''
    } as User;

  } catch (error) {
    console.error("Error verifying session:", error);
    return null;
  }
}

export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return !!user;
}