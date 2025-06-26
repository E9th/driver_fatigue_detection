import { NextResponse } from 'next/server';
import { auth } from 'firebase-admin';
import { customInitApp } from '@/lib/firebase-admin';

// Initialize Firebase Admin SDK
customInitApp();

/**
 * @swagger
 * /api/auth/session:
 * get:
 * summary: Get session status
 * description: Checks if the user has a valid session cookie.
 * responses:
 * 200:
 * description: Session is valid.
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * isLogged:
 * type: boolean
 * example: true
 * 401:
 * description: Unauthorized, session cookie is missing or invalid.
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * isLogged:
 * type: boolean
 * example: false
 * error:
 * type: string
 * post:
 * summary: Create session
 * description: Creates a session cookie for the user after successful login/registration.
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * idToken:
 * type: string
 * description: Firebase ID token of the user.
 * responses:
 * 200:
 * description: Session cookie created successfully.
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * status:
 * type: string
 * example: success
 * 400:
 * description: Bad request, ID token is missing.
 * 401:
 * description: Unauthorized, ID token is invalid.
 */
export async function GET(request: Request) {
  const session = request.headers.get('cookie')?.match(/session=([^;]+)/)?.[1];

  if (!session) {
    return NextResponse.json({ isLogged: false }, { status: 401 });
  }

  try {
    const decodedClaims = await auth().verifySessionCookie(session, true);
    if (!decodedClaims) {
      return NextResponse.json({ isLogged: false }, { status: 401 });
    }
    return NextResponse.json({ isLogged: true }, { status: 200 });
  } catch (error) {
    console.error('Error verifying session cookie:', error);
    return NextResponse.json({ isLogged: false, error: 'Invalid session cookie' }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const idToken = body.idToken;

    if (!idToken) {
      return NextResponse.json({ error: 'ID token is required' }, { status: 400 });
    }

    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    const sessionCookie = await auth().createSessionCookie(idToken, { expiresIn });

    const options = {
      name: 'session',
      value: sessionCookie,
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    };

    const response = NextResponse.json({ status: 'success' }, { status: 200 });
    response.cookies.set(options);

    return response;
  } catch (error) {
    console.error('Error creating session cookie:', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 401 });
  }
}
