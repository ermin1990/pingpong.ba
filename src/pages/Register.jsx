import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithRedirect } from 'firebase/auth';
import { auth, googleProvider } from '../firebase/config';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const { user, userData } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Automatski prebaci na dashboard ako je korisnik registrovan/ulogovan
  useEffect(() => {
    if (user && userData) {
      navigate(userData.role === 'super_admin' ? '/super-admin' : '/dashboard');
    }
  }, [user, userData]);

  const handleGoogleRegister = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithRedirect(auth, googleProvider);
    } catch (err) {
      setError(`Greška pri Google registraciji: ${err.message}`);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10">
      <div className="bg-gray-800/50 backdrop-blur-xl p-8 rounded-2xl border border-gray-700 shadow-2xl">
        <h2 className="text-3xl font-bold mb-6 text-center">Registracija</h2>
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <button 
          onClick={handleGoogleRegister}
          disabled={loading}
          className="w-full bg-white text-gray-900 font-bold py-3 rounded-lg flex items-center justify-center gap-3 hover:bg-gray-200 transition disabled:opacity-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Registruj se preko Google-a
        </button>

        <p className="mt-6 text-center text-gray-400 text-sm">
          Već imate nalog? <a href="/login" className="text-blue-500 hover:underline">Prijavite se</a>
        </p>
      </div>
    </div>
  );
};

export default Register;
