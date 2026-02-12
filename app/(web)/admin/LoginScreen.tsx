import React, { useState } from "react";
import { signInWithEmailAndPassword, User } from "firebase/auth";
import { Loader2 } from "lucide-react";
import { auth } from "../../lib/firebase";

export const LoginScreen = ({ onLoginSuccess }: { onLoginSuccess: (u: User) => void }) => {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      onLoginSuccess(cred.user);
    } catch (err: any) {
      setError("Inloggen mislukt: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="bg-slate-900 p-10 rounded-3xl border border-slate-800 w-full max-w-md">
        <h2 className="text-3xl font-black mb-8 text-center text-white">Admin Toegang</h2>
        {error && <div className="text-red-400 text-center mb-4 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-950 border border-slate-700 p-4 rounded-xl outline-none text-white" />
          <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} className="w-full bg-slate-950 border border-slate-700 p-4 rounded-xl outline-none text-white" />
          <button type="submit" disabled={loading} className="w-full bg-red-600 hover:bg-red-500 text-white py-4 rounded-xl font-bold">
            {loading ? <Loader2 className="animate-spin mx-auto" /> : "Aanmelden"}
          </button>
        </form>
      </div>
    </div>
  );
};
