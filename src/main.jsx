import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import Login from './Login'
import Portal from './Portal'
import { getSession, onAuthChange } from './supabase'

function Root() {
  const [session, setSession] = React.useState(undefined);
  const isPortal = window.location.pathname === '/portal';

  React.useEffect(() => {
    getSession().then(setSession);
    const sub = onAuthChange(setSession);
    return () => sub.unsubscribe();
  }, []);

  // Client portal - no auth needed
  if (isPortal) return <Portal />;

  // Still checking auth
  if (session === undefined) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:"#0d1117",color:"#c8a456",fontFamily:"'Bebas Neue',sans-serif",fontSize:24,letterSpacing:3}}>
      CHANCE BUILDERS
    </div>
  );

  // Not logged in - show login
  if (!session) return <Login />;

  // Logged in - show app
  return <App session={session} />;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
)
