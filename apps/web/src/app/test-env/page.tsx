'use client';

export default function TestEnvPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Environment Variables Test</h1>
      
      <div className="space-y-4">
        <div>
          <strong>NEXT_PUBLIC_FIREBASE_API_KEY:</strong>
          <span className="ml-2 text-sm">
            {process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 
              `✅ Set (${process.env.NEXT_PUBLIC_FIREBASE_API_KEY.substring(0, 10)}...)` : 
              '❌ Missing'
            }
          </span>
        </div>
        
        <div>
          <strong>NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:</strong>
          <span className="ml-2 text-sm">
            {process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? 
              `✅ Set (${process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN})` : 
              '❌ Missing'
            }
          </span>
        </div>
        
        <div>
          <strong>NEXT_PUBLIC_FIREBASE_PROJECT_ID:</strong>
          <span className="ml-2 text-sm">
            {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? 
              `✅ Set (${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID})` : 
              '❌ Missing'
            }
          </span>
        </div>
        
        <div>
          <strong>NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:</strong>
          <span className="ml-2 text-sm">
            {process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ? 
              `✅ Set (${process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET})` : 
              '❌ Missing'
            }
          </span>
        </div>
        
        <div>
          <strong>NEXT_PUBLIC_FIREBASE_SENDER_ID:</strong>
          <span className="ml-2 text-sm">
            {process.env.NEXT_PUBLIC_FIREBASE_SENDER_ID ? 
              `✅ Set (${process.env.NEXT_PUBLIC_FIREBASE_SENDER_ID})` : 
              '❌ Missing'
            }
          </span>
        </div>
        
        <div>
          <strong>NEXT_PUBLIC_FIREBASE_APP_ID:</strong>
          <span className="ml-2 text-sm">
            {process.env.NEXT_PUBLIC_FIREBASE_APP_ID ? 
              `✅ Set (${process.env.NEXT_PUBLIC_FIREBASE_APP_ID})` : 
              '❌ Missing'
            }
          </span>
        </div>
      </div>
      
      <div className="mt-8 p-4 bg-gray-100 rounded">
        <h2 className="font-bold mb-2">Debug Info:</h2>
        <p>Node Environment: {process.env.NODE_ENV}</p>
        <p>All env vars: {JSON.stringify(process.env, null, 2)}</p>
      </div>
    </div>
  );
}
