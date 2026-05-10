import { useParams } from "react-router-dom";
import { useState } from "react";

const BACKEND_API_URL = import.meta.env.VITE_BACKEND_URL;

export default function ResetPassword() {
  const { token } = useParams();

  const [password, setPassword] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();

    const res = await fetch(
      `${BACKEND_API_URL}/auth/reset-password`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          token,
          password
        })
      }
    );

    const data = await res.json();

    alert(data.message || data.error);
  }

  return (
    <form onSubmit={handleSubmit} className="card">
      <h2>Nueva contraseña</h2>

      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button type="submit">
        Cambiar contraseña
      </button>
    </form>
  );
}